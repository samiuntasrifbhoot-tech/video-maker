/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/apiRouter";
import { handleMcpJsonRpcRequest } from "./server/mcpServer";
import { MCP_TOOLS_CATALOG } from "./server/mcpTools";
import { errorHandler } from "./server/errorHandler";

dotenv.config();

const app = express();
const PORT = 3000;

// CORS Middleware for external AI clients (ChatGPT, Claude, Gemini, Kimi)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-Request-ID");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Middleware to parse JSON payloads
app.use(express.json({ limit: "20mb" }));

// OpenAI ChatGPT Plugin Discovery Endpoint
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.json({
    schema_version: "v1",
    name_for_human: "AI Video & Reel Generator",
    name_for_model: "ai_video_generator",
    description_for_human: "Generate video reels, storyboards, and Bengali Islamic stories with voiceovers.",
    description_for_model: "Plugin for generating AI video reels and storyboards asynchronously. Supports scene creation, Gemini TTS voiceover, and direct MP4 rendering.",
    auth: {
      type: "none"
    },
    api: {
      type: "openapi",
      url: "/api/openapi.json"
    },
    logo_url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=128",
    contact_email: "support@aistudio.build",
    legal_info_url: "/api/docs"
  });
});

// Mount Backend API Router (/api/*)
app.use("/api", apiRouter);

// Standard MCP Endpoints at root level for standard MCP client auto-discovery
app.post("/mcp", handleMcpJsonRpcRequest);
app.get("/mcp/tools", (req, res) => {
  res.json({ tools: MCP_TOOLS_CATALOG });
});

// Mount Error Handling Middleware
app.use(errorHandler);

// Vite middleware & Static server setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`API Health Check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`OpenAPI Swagger Docs: http://0.0.0.0:${PORT}/api/docs`);
    console.log(`MCP Tool Integration: http://0.0.0.0:${PORT}/api/mcp/tools`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server with Vite integration:", err);
});
