#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  handleGetHistory,
  handleGetSessionDetail,
  handleListProjects,
  handleListSessions,
  tools,
} from "./tools/index.js";

const server = new Server(
  {
    name: "claude-json-reporter-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ツール一覧のハンドラ
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// ツール実行のハンドラ
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_projects":
      return handleListProjects();

    case "list_sessions":
      return handleListSessions(args as { project_path: string });

    case "get_history":
      return handleGetHistory(
        args as {
          start_date?: string;
          end_date?: string;
          project?: string;
          limit?: number;
        },
      );

    case "get_session_detail":
      return handleGetSessionDetail(
        args as { project_path: string; session_id: string },
      );

    default:
      return {
        content: [{ type: "text" as const, text: `不明なツール: ${name}` }],
        isError: true,
      };
  }
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Claude JSON Reporter MCP server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
