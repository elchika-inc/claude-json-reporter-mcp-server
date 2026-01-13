import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const tools: Tool[] = [
  {
    name: "list_projects",
    description:
      "Claude Code の履歴が存在するプロジェクト一覧を取得します。各プロジェクトのセッション数も含まれます。",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_sessions",
    description:
      "指定したプロジェクトのセッション一覧を取得します。セッションID、更新日時が含まれます。",
    inputSchema: {
      type: "object" as const,
      properties: {
        project_path: {
          type: "string",
          description: "プロジェクトのパス (例: /Users/xxx/projects/my-app)",
        },
      },
      required: ["project_path"],
    },
  },
  {
    name: "get_history",
    description:
      "Claude Code のグローバル履歴を取得します。日付やプロジェクトでフィルタリングできます。",
    inputSchema: {
      type: "object" as const,
      properties: {
        start_date: {
          type: "string",
          description: "開始日 (ISO 8601 形式、例: 2024-01-01)",
        },
        end_date: {
          type: "string",
          description: "終了日 (ISO 8601 形式、例: 2024-01-31)",
        },
        project: {
          type: "string",
          description: "プロジェクトパスでフィルタリング",
        },
        limit: {
          type: "number",
          description: "取得件数の上限 (デフォルト: 100)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_session_detail",
    description:
      "指定したセッションの詳細な会話履歴を取得します。ユーザーとアシスタントのメッセージ、ツール使用回数などのサマリーが含まれます。",
    inputSchema: {
      type: "object" as const,
      properties: {
        project_path: {
          type: "string",
          description: "プロジェクトのパス",
        },
        session_id: {
          type: "string",
          description: "セッションID (UUID)",
        },
      },
      required: ["project_path", "session_id"],
    },
  },
];
