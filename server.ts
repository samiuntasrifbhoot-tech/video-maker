import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON payloads
app.use(express.json());

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Helper function to prepend a 44-byte WAV header to raw PCM data
function addWavHeader(pcmBuffer: Buffer, sampleRate: number = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  // file length
  header.writeUInt32LE(chunkSize, 4);
  // RIFF type
  header.write("WAVE", 8);
  // format chunk identifier
  header.write("fmt ", 12);
  // format chunk length
  header.writeUInt32LE(16, 16);
  // sample format (raw)
  header.writeUInt16LE(1, 20); // 1 = PCM
  // channel count
  header.writeUInt16LE(numChannels, 22);
  // sample rate
  header.writeUInt32LE(sampleRate, 24);
  // byte rate (sample rate * block align)
  header.writeUInt32LE(byteRate, 28);
  // block align (channel count * bytes per sample)
  header.writeUInt16LE(blockAlign, 32);
  // bits per sample
  header.writeUInt16LE(bitsPerSample, 34);
  // data chunk identifier
  header.write("data", 36);
  // data chunk length
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Helper function for TTS with retries and proper error handling
async function generateTTSAudio(aiClient: any, text: string, voice: string) {
  const models = ["gemini-3.1-flash-tts-preview"];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });

        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          return inlineData;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isQuota =
          err?.status === 429 ||
          err?.code === 429 ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("Quota exceeded");

        const isTransient =
          err?.status === 503 ||
          err?.code === 503 ||
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE");

        if (isQuota) {
          // Immediately exit loop on quota error without noisy retries
          throw err;
        }

        console.log(`[TTS] Request retry note (${model}):`, errMsg);

        if (attempt < 2 && isTransient) {
          await new Promise((res) => setTimeout(res, 1000));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("ভয়েস জেনারেট করা যায়নি। সার্ভার ব্যাকএন্ড অতিরিক্ত ব্যস্ত রয়েছে।");
}

// API Route for Text-to-Speech using Gemini 3.1 TTS
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;

    if (!text) {
      return res.status(400).json({ error: "ভয়েস জেনারেট করার জন্য কোনো টেক্সট দেওয়া হয়নি।" });
    }

    if (!ai) {
      return res.status(500).json({ 
        error: "Gemini API কী পাওয়া যায়নি। অনুগ্রহ করে Settings > Secrets প্যানেল থেকে GEMINI_API_KEY সেট করুন।" 
      });
    }

    // Call Gemini TTS with retry and model fallback
    const inlineData = await generateTTSAudio(ai, text, voice);
    let base64Audio = inlineData?.data;
    const rawMimeType = inlineData?.mimeType || "audio/wav";

    if (!base64Audio) {
      return res.status(500).json({ error: "মডেল থেকে কোনো ভয়েস ডেটা পাওয়া যায়নি।" });
    }

    const pcmBuffer = Buffer.from(base64Audio, "base64");

    // Extract sample rate if present in mimeType (e.g. rate=24000)
    let sampleRate = 24000;
    const rateMatch = rawMimeType.match(/rate=(\d+)/i);
    if (rateMatch) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    // Check if buffer already starts with a RIFF header
    const isWavHeader = pcmBuffer.length >= 12 && pcmBuffer.subarray(0, 4).toString("ascii") === "RIFF";

    let finalBuffer = pcmBuffer;
    if (!isWavHeader) {
      finalBuffer = addWavHeader(pcmBuffer, sampleRate);
    }

    base64Audio = finalBuffer.toString("base64");
    const mimeType = "audio/wav";

    res.json({ base64Audio, mimeType });
  } catch (err: any) {
    const errMsg = `${err?.message || err}`;
    const isQuotaExceeded = err?.status === 429 || err?.code === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Quota exceeded");
    const isBusy = err?.status === 503 || err?.code === 503 || errMsg.includes("503") || errMsg.includes("high demand");

    if (isQuotaExceeded) {
      console.log("[TTS] Free tier quota reached for Gemini TTS. Client will fallback to Web Speech API.");
    } else {
      console.warn("[TTS] Generation notice:", errMsg);
    }

    const userMessage = isQuotaExceeded
      ? "Gemini AI ভয়েস কোটা অতিক্রান্ত হয়েছে (Free Tier Limit)। ব্রাউজারের নিজস্ব ভয়েস সিন্থেসাইজার ব্যবহার করা হচ্ছে।"
      : isBusy
      ? "Gemini AI সার্ভিসটি বর্তমানে অতিরিক্ত চাপের মধ্যে রয়েছে। সিস্টেমটি স্বয়ংক্রিয়ভাবে ব্রাউজার ভয়েসে রূপান্তরিত হচ্ছে।"
      : err?.message || "ভয়েস ওভার জেনারেট করতে সমস্যা হয়েছে।";

    res.status(500).json({ error: userMessage, isBusy: isBusy || isQuotaExceeded });
  }
});

// Vite middleware integration
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server with Vite integration:", err);
});
