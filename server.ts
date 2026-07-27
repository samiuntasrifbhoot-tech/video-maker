/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/apiRouter";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON payloads
app.use(express.json());

// Mount Backend API Router (/api/*)
app.use("/api", apiRouter);

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
