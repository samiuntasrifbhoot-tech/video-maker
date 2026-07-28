/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { MCP_TOOLS_CATALOG, executeMcpTool } from './mcpTools';
import { logger } from './logger';

export const MCP_PROTOCOL_VERSION = '2024-11-05';

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export async function handleMcpJsonRpcRequest(req: Request, res: Response) {
  const body = req.body as JSONRPCRequest;

  if (!body || body.jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: body?.id || null,
      error: {
        code: -32600,
        message: 'Invalid Request: Expected JSON-RPC 2.0 request payload.',
      },
    });
  }

  const { id = null, method, params } = body;

  try {
    switch (method) {
      case 'initialize': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {
              tools: {
                listChanged: false,
              },
            },
            serverInfo: {
              name: 'AI Reels & Video Storyboard MCP Server',
              version: '1.0.0',
            },
          },
        });
      }

      case 'notifications/initialized': {
        return res.json({ jsonrpc: '2.0', id, result: {} });
      }

      case 'ping': {
        return res.json({ jsonrpc: '2.0', id, result: {} });
      }

      case 'tools/list': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS_CATALOG,
          },
        });
      }

      case 'tools/call': {
        const toolName = params?.name;
        const args = params?.arguments || params?.args || {};

        if (!toolName) {
          return res.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: "Invalid params: 'name' field is required in tools/call.",
            },
          });
        }

        const toolResult = await executeMcpTool(toolName, args);
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(toolResult, null, 2),
              },
            ],
            isError: !toolResult.success,
          },
        });
      }

      default: {
        return res.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method '${method}' not found. Supported methods: initialize, ping, tools/list, tools/call.`,
          },
        });
      }
    }
  } catch (err: any) {
    logger.error(`MCP JSON-RPC Error on method '${method}'`, err);
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: err?.message || 'Internal JSON-RPC execution error.',
      },
    });
  }
}
