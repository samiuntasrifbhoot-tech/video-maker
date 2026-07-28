# Production Deployment Guide

This guide describes how to deploy the **AI Reels & Video Storyboard Generator Service** to production environments (Google Cloud Run, AWS App Runner, Docker containers, or self-hosted Linux VPS servers).

---

## 1. System Requirements

- **Runtime**: Node.js v20.x or higher
- **Container Memory**: Minimum 1 GB RAM (2 GB recommended for high-definition canvas frame rendering and FFmpeg compilation)
- **Container vCPU**: Minimum 1 vCPU (2 vCPUs recommended)
- **FFmpeg**: Bundled automatically via `ffmpeg-static` npm package or installed natively in host OS

---

## 2. Environment Variables

Define the following environment variables in your Cloud Run service or `.env` environment file:

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | - | Google Gemini AI API key for text generation and Gemini TTS speech voiceovers |
| `API_KEY` | Optional | - | Secret key required for protected endpoints (`/api/generate-video`, `/api/tts`, `/api/mcp/call`). If omitted, open development access is active. |
| `RATE_LIMIT_MAX` | Optional | `60` | Maximum allowed API requests per minute per IP or API key |
| `PORT` | Optional | `3000` | Port on which the Node server listens (`3000` default) |
| `NODE_ENV` | Optional | `production` | Environment mode (`production` or `development`) |

---

## 3. Deployment via Docker / Cloud Run

### A. Dockerfile

```dockerfile
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/media ./media
COPY --from=builder /app/data ./data
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

### B. Deploying to Google Cloud Run

```bash
# Build and submit image to Artifact Registry / Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ai-video-generator

# Deploy container to Cloud Run
gcloud run deploy ai-video-generator \
  --image gcr.io/YOUR_PROJECT_ID/ai-video-generator \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars GEMINI_API_KEY="YOUR_KEY_HERE",API_KEY="YOUR_SECURE_API_KEY"
```

---

## 4. Verification & Health Monitoring

After deployment, test the following endpoints:

1. **Health Check**:
   ```bash
   curl -s https://<your-deployed-domain>/api/health
   ```
2. **OpenAPI Specs**:
   ```bash
   curl -s https://<your-deployed-domain>/api/openapi.json
   ```
3. **MCP Tools Catalog**:
   ```bash
   curl -s https://<your-deployed-domain>/api/mcp/tools
   ```
