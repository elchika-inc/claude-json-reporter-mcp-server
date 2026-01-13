import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as historyReader from "../lib/history-reader.js";
import {
  handleGetHistory,
  handleGetSessionDetail,
  handleListProjects,
  handleListSessions,
} from "../tools/handlers.js";

// history-reader モジュールをモック
vi.mock("../lib/history-reader.js");

// content からテキストを取得するヘルパー
function getTextContent(result: CallToolResult): string {
  const content = result.content[0];
  if (content.type === "text") {
    return content.text;
  }
  throw new Error("Expected text content");
}

describe("handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("handleListProjects", () => {
    it("プロジェクト一覧を返す", async () => {
      const mockProjects = [
        {
          name: "my-app",
          path: "/Users/test/projects/my-app",
          encodedPath: "-Users-test-projects-my-app",
          sessionCount: 5,
        },
        {
          name: "another-app",
          path: "/Users/test/projects/another-app",
          encodedPath: "-Users-test-projects-another-app",
          sessionCount: 3,
        },
      ];

      vi.mocked(historyReader.listProjects).mockResolvedValue(mockProjects);

      const result = await handleListProjects();

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");

      const data = JSON.parse(getTextContent(result));
      expect(data.count).toBe(2);
      expect(data.projects).toEqual(mockProjects);
    });

    it("エラー時はエラーメッセージを返す", async () => {
      vi.mocked(historyReader.listProjects).mockRejectedValue(
        new Error("Test error"),
      );

      const result = await handleListProjects();

      expect(result.isError).toBe(true);
      expect(getTextContent(result)).toContain("プロジェクト一覧の取得に失敗");
    });
  });

  describe("handleListSessions", () => {
    it("セッション一覧を返す", async () => {
      const mockSessions = [
        {
          id: "session-1",
          projectPath: "/Users/test/projects/my-app",
          filePath: "/path/to/session-1.jsonl",
          modifiedAt: new Date("2024-01-15T10:00:00Z"),
        },
        {
          id: "session-2",
          projectPath: "/Users/test/projects/my-app",
          filePath: "/path/to/session-2.jsonl",
          modifiedAt: new Date("2024-01-14T10:00:00Z"),
        },
      ];

      vi.mocked(historyReader.listSessions).mockResolvedValue(mockSessions);

      const result = await handleListSessions({
        project_path: "/Users/test/projects/my-app",
      });

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(getTextContent(result));
      expect(data.count).toBe(2);
      expect(data.sessions[0].id).toBe("session-1");
    });

    it("project_path がない場合はエラー", async () => {
      const result = await handleListSessions({
        project_path: "",
      });

      expect(result.isError).toBe(true);
      expect(getTextContent(result)).toContain("project_path は必須");
    });
  });

  describe("handleGetHistory", () => {
    it("履歴を返す", async () => {
      const mockHistory = {
        entries: [
          {
            display: "Test input",
            pastedContents: {},
            timestamp: 1705312800000,
            project: "/Users/test/projects/my-app",
          },
        ],
        totalCount: 1,
      };

      vi.mocked(historyReader.getHistory).mockResolvedValue(mockHistory);

      const result = await handleGetHistory({});

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(getTextContent(result));
      expect(data.totalCount).toBe(1);
      expect(data.entries[0].display).toBe("Test input");
    });

    it("日付フィルターが正しく適用される", async () => {
      vi.mocked(historyReader.getHistory).mockResolvedValue({
        entries: [],
        totalCount: 0,
      });

      await handleGetHistory({
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      });

      expect(historyReader.getHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
      );
    });
  });

  describe("handleGetSessionDetail", () => {
    it("セッション詳細を返す", async () => {
      const mockDetail = {
        sessionId: "test-session",
        projectPath: "/Users/test/projects/my-app",
        entries: [
          {
            type: "user" as const,
            message: { role: "user" as const, content: "Hello" },
            timestamp: "2024-01-15T10:00:00Z",
          },
          {
            type: "assistant" as const,
            message: {
              role: "assistant" as const,
              content: [{ type: "text" as const, text: "Hi there!" }],
            },
            timestamp: "2024-01-15T10:00:01Z",
          },
        ],
        summary: {
          userMessageCount: 1,
          assistantMessageCount: 1,
          toolUseCount: 0,
          startTime: "2024-01-15T10:00:00Z",
          endTime: "2024-01-15T10:00:01Z",
        },
      };

      vi.mocked(historyReader.getSessionDetail).mockResolvedValue(mockDetail);

      const result = await handleGetSessionDetail({
        project_path: "/Users/test/projects/my-app",
        session_id: "test-session",
      });

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(getTextContent(result));
      expect(data.sessionId).toBe("test-session");
      expect(data.summary.userMessageCount).toBe(1);
    });

    it("セッションが見つからない場合はエラー", async () => {
      vi.mocked(historyReader.getSessionDetail).mockResolvedValue(null);

      const result = await handleGetSessionDetail({
        project_path: "/Users/test/projects/my-app",
        session_id: "nonexistent",
      });

      expect(result.isError).toBe(true);
      expect(getTextContent(result)).toContain("見つかりません");
    });

    it("必須パラメータがない場合はエラー", async () => {
      const result1 = await handleGetSessionDetail({
        project_path: "",
        session_id: "test",
      });
      expect(result1.isError).toBe(true);

      const result2 = await handleGetSessionDetail({
        project_path: "/test",
        session_id: "",
      });
      expect(result2.isError).toBe(true);
    });
  });
});
