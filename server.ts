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
  header.write("data", 38);
  // data chunk length
  header.writeUInt32LE(dataSize, 42);

  return Buffer.concat([header, pcmBuffer]);
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

    // Call Gemini TTS Model
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text }] }],
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
    let base64Audio = inlineData?.data;
    let mimeType = inlineData?.mimeType || "audio/mp3";

    if (!base64Audio) {
      return res.status(500).json({ error: "মডেল থেকে কোনো ভয়েস ডেটা পাওয়া যায়নি।" });
    }

    // Convert raw PCM to standard WAV if applicable
    if (mimeType.includes("linear16") || mimeType.includes("pcm") || mimeType.includes("audio/raw") || mimeType === "audio/wav") {
      const pcmBuffer = Buffer.from(base64Audio, "base64");
      let sampleRate = 24000; // default for gemini-3.1-flash-tts-preview
      const rateMatch = mimeType.match(/rate=(\d+)/);
      if (rateMatch) {
        sampleRate = parseInt(rateMatch[1], 10);
      }
      const wavBuffer = addWavHeader(pcmBuffer, sampleRate);
      base64Audio = wavBuffer.toString("base64");
      mimeType = "audio/wav";
    }

    res.json({ base64Audio, mimeType });
  } catch (err: any) {
    console.error("TTS generation error:", err);
    res.status(500).json({ error: err.message || "ভয়েস ওভার জেনারেট করতে সমস্যা হয়েছে।" });
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
