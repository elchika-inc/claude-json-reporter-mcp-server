import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  getHistory,
  getSessionDetail,
  listProjects,
  listSessions,
} from "../lib/index.js";

function jsonResult(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

export async function handleListProjects(): Promise<CallToolResult> {
  try {
    const projects = await listProjects();
    return jsonResult({
      projects,
      count: projects.length,
    });
  } catch (error) {
    return errorResult(`プロジェクト一覧の取得に失敗しました: ${error}`);
  }
}

export async function handleListSessions(args: {
  project_path: string;
}): Promise<CallToolResult> {
  try {
    if (!args.project_path) {
      return errorResult("project_path は必須です");
    }

    const sessions = await listSessions(args.project_path);
    return jsonResult({
      projectPath: args.project_path,
      sessions: sessions.map((s) => ({
        id: s.id,
        modifiedAt: s.modifiedAt.toISOString(),
      })),
      count: sessions.length,
    });
  } catch (error) {
    return errorResult(`セッション一覧の取得に失敗しました: ${error}`);
  }
}

export async function handleGetHistory(args: {
  start_date?: string;
  end_date?: string;
  project?: string;
  limit?: number;
}): Promise<CallToolResult> {
  try {
    const options: Parameters<typeof getHistory>[0] = {};

    if (args.start_date) {
      const startDate = new Date(args.start_date);
      startDate.setHours(0, 0, 0, 0);
      options.startDate = startDate;
    }
    if (args.end_date) {
      // 終了日は当日の終わりまで含める
      const endDate = new Date(args.end_date);
      endDate.setHours(23, 59, 59, 999);
      options.endDate = endDate;
    }
    if (args.project) {
      options.project = args.project;
    }
    options.limit = args.limit ?? 100;

    const result = await getHistory(options);

    return jsonResult({
      entries: result.entries.map((e) => ({
        display: e.display,
        project: e.project,
        timestamp: new Date(e.timestamp).toISOString(),
      })),
      totalCount: result.totalCount,
      returnedCount: result.entries.length,
    });
  } catch (error) {
    return errorResult(`履歴の取得に失敗しました: ${error}`);
  }
}

export async function handleGetSessionDetail(args: {
  project_path: string;
  session_id: string;
}): Promise<CallToolResult> {
  try {
    if (!args.project_path) {
      return errorResult("project_path は必須です");
    }
    if (!args.session_id) {
      return errorResult("session_id は必須です");
    }

    const result = await getSessionDetail(args.project_path, args.session_id);

    if (!result) {
      return errorResult("指定されたセッションが見つかりません");
    }

    // メッセージを簡略化して返す
    const messages = result.entries.map((entry) => {
      const content = entry.message?.content;
      let text = "";

      if (typeof content === "string") {
        text = content;
      } else if (Array.isArray(content)) {
        // テキストのみを抽出
        const textContents = content
          .filter(
            (c) => typeof c === "object" && c !== null && c.type === "text",
          )
          .map((c) => (c as { type: "text"; text: string }).text);
        text = textContents.join("\n");
      }

      return {
        role: entry.type,
        text: text.slice(0, 500) + (text.length > 500 ? "..." : ""),
        timestamp: entry.timestamp,
      };
    });

    return jsonResult({
      sessionId: result.sessionId,
      projectPath: result.projectPath,
      summary: result.summary,
      messages,
    });
  } catch (error) {
    return errorResult(`セッション詳細の取得に失敗しました: ${error}`);
  }
}
