# AI Assistant Integration Guide

This guide provides step-by-step instructions for connecting the **AI Reels & Video Storyboard API** to major AI platforms: **ChatGPT**, **Claude**, **Gemini**, and **Kimi**.

---

## Service Endpoints Summary

| Integration Type | Target URL | Description |
| :--- | :--- | :--- |
| **OpenAPI Specification** | `https://<YOUR_HOST>/api/openapi.json` | Full OpenAPI 3.0 JSON schema for ChatGPT GPT Actions & Kimi |
| **Swagger UI Docs** | `https://<YOUR_HOST>/api/docs` | Interactive Swagger documentation page |
| **MCP JSON-RPC Endpoint** | `https://<YOUR_HOST>/mcp` or `https://<YOUR_HOST>/api/mcp` | Standard Model Context Protocol (MCP) JSON-RPC 2.0 endpoint for Claude |
| **MCP Tools Catalog** | `https://<YOUR_HOST>/api/mcp/tools` | HTTP REST tools declaration endpoint |
| **MCP Tool Execution** | `https://<YOUR_HOST>/api/mcp/call` | Direct REST tool call execution endpoint |

---

## 1. ChatGPT (Custom GPT Actions)

You can connect this API directly to OpenAI's Custom GPTs using GPT Actions.

### Steps:
1. Go to **ChatGPT > Explore GPTs > Create**.
2. Go to the **Configure** tab and click **Add Actions**.
3. Under **Schema**, choose **Import from URL** and paste:
   ```text
   https://<YOUR_HOST>/api/openapi.json
   ```
4. If your server requires an API key (`API_KEY` set in server environment):
   - Under **Authentication**, select **API Key**.
   - Auth Type: **Custom**.
   - Header Name: `X-API-Key`
   - API Key: `<YOUR_API_KEY>`
5. In the GPT **Instructions**, paste:
   ```text
   You are an AI Video Reel Creator assistant. When the user asks to generate a video reel, Islamic story, or video storyboard:
   1. Use the `generateVideo` action (POST /api/generate-video) with the requested title, story script, and scenes.
   2. Retrieve the returned `jobId`.
   3. Periodically call `getJobStatus` (GET /api/job/{id}) until status is "completed".
   4. Present the user with the final video download link (`videoUrl`) and thumbnail (`thumbnailUrl`).
   ```

---

## 2. Claude (Model Context Protocol / Custom Tools)

This service natively implements the **Model Context Protocol (MCP) Specification (2024-11-05)**.

### A. Claude Desktop Integration (`claude_desktop_config.json`)

To connect Claude Desktop via SSE/HTTP or JSON-RPC proxy:
```json
{
  "mcpServers": {
    "ai-video-generator": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "https://<YOUR_HOST>/mcp"
      ],
      "env": {
        "X_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

### B. Claude API / Anthropic SDK Tool Integration

When making direct requests to the Anthropic Messages API:

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// 1. Fetch tool catalog from API
const toolsResponse = await fetch('https://<YOUR_HOST>/api/mcp/tools');
const { tools } = await toolsResponse.json();

// 2. Pass tools to Anthropic Messages API
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  tools: tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  })),
  messages: [{ role: 'user', content: 'Create a video reel about the biography of Abu Bakr (RA).' }],
});

// 3. Handle Tool Call
if (response.stop_reason === 'tool_use') {
  const toolUse = response.content.find(c => c.type === 'tool_use');
  const toolResult = await fetch('https://<YOUR_HOST>/api/mcp/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': '<YOUR_API_KEY>'
    },
    body: JSON.stringify({
      name: toolUse.name,
      arguments: toolUse.input
    })
  }).then(r => r.json());
}
```

---

## 3. Google Gemini (Function Calling)

Google Gemini models consume function declarations natively using `@google/genai`.

### Implementation Example:

```typescript
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Declarations matching /api/mcp/tools
const videoTools = {
  functionDeclarations: [
    {
      name: 'generate_video_storyboard',
      description: 'Creates a new AI video storyboard render job with scenes, subtitles, and voiceovers.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Video title' },
          script: { type: Type.STRING, description: 'Full story narrative' },
          duration: { type: Type.NUMBER, description: 'Duration target in seconds' },
        },
        required: ['title'],
      },
    },
    {
      name: 'get_video_job_status',
      description: 'Checks status and video URL of a job ID.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          jobId: { type: Type.STRING },
        },
        required: ['jobId'],
      },
    },
  ],
};

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Generate a short 15 second reel script and video for a Quranic story.',
  config: {
    tools: [videoTools],
  },
});
```

---

## 4. Kimi (Moonshot AI / Custom Agent Tools)

Moonshot AI's Kimi Assistant connects via OpenAI-compatible tool calling or web plugin specifications.

### API Request Schema:

```bash
curl -X POST https://api.moonshot.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MOONSHOT_API_KEY" \
  -d '{
    "model": "moonshot-v1-8k",
    "messages": [
      {"role": "user", "content": "Generate an Islamic storyboard reel."}
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "generate_video_storyboard",
          "description": "Creates an AI video storyboard render job",
          "parameters": {
            "type": "object",
            "properties": {
              "title": {"type": "string"},
              "script": {"type": "string"}
            },
            "required": ["title"]
          }
        }
      }
    ]
  }'
```

When Kimi outputs a function call response, execute the call against `POST https://<YOUR_HOST>/api/mcp/call` with header `X-API-Key: <YOUR_API_KEY>`.
