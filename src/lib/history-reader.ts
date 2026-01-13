import * as fs from "node:fs/promises";
import { homedir } from "node:os";
import * as path from "node:path";
import type {
  GetHistoryOptions,
  GlobalHistoryEntry,
  HistoryResult,
  MessageContent,
  MessageContentToolUse,
  ProjectInfo,
  SessionDetailResult,
  SessionHistoryEntry,
  SessionInfo,
} from "../types/index.js";

/**
 * Claude ディレクトリのパスを取得
 */
export function getClaudeDir(): string {
  return path.join(homedir(), ".claude");
}

/**
 * プロジェクトパスをエンコード (/ を - に変換)
 */
export function encodeProjectPath(projectPath: string): string {
  return projectPath.replace(/\//g, "-");
}

/**
 * エンコードされたパスをデコード
 */
export function decodeProjectPath(encodedPath: string): string {
  // 先頭の - を / に戻す
  if (encodedPath.startsWith("-")) {
    return encodedPath.replace(/-/g, "/");
  }
  return encodedPath;
}

/**
 * JSONL ファイルを読み取る
 */
export async function readJsonlFile<T>(filePath: string): Promise<T[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    return lines.map((line) => JSON.parse(line) as T);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * グローバル履歴ファイルのパスを取得
 */
export function getGlobalHistoryPath(): string {
  return path.join(getClaudeDir(), "history.jsonl");
}

/**
 * プロジェクトディレクトリのパスを取得
 */
export function getProjectsDir(): string {
  return path.join(getClaudeDir(), "projects");
}

/**
 * プロジェクト一覧を取得
 */
export async function listProjects(): Promise<ProjectInfo[]> {
  const projectsDir = getProjectsDir();

  try {
    const entries = await fs.readdir(projectsDir, { withFileTypes: true });
    const projects: ProjectInfo[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("-")) {
        const projectDir = path.join(projectsDir, entry.name);
        const files = await fs.readdir(projectDir);
        const sessionFiles = files.filter((f) => f.endsWith(".jsonl"));

        projects.push({
          name: path.basename(decodeProjectPath(entry.name)),
          path: decodeProjectPath(entry.name),
          encodedPath: entry.name,
          sessionCount: sessionFiles.length,
        });
      }
    }

    return projects;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * プロジェクトのセッション一覧を取得
 */
export async function listSessions(
  projectPath: string,
): Promise<SessionInfo[]> {
  const encodedPath = encodeProjectPath(projectPath);
  const projectDir = path.join(getProjectsDir(), encodedPath);

  try {
    const files = await fs.readdir(projectDir);
    const sessions: SessionInfo[] = [];

    for (const file of files) {
      if (file.endsWith(".jsonl")) {
        const filePath = path.join(projectDir, file);
        const stats = await fs.stat(filePath);
        const sessionId = file.replace(".jsonl", "");

        sessions.push({
          id: sessionId,
          projectPath,
          filePath,
          modifiedAt: stats.mtime,
        });
      }
    }

    // 更新日時で降順ソート
    return sessions.sort(
      (a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime(),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * グローバル履歴を取得
 */
export async function getHistory(
  options: GetHistoryOptions = {},
): Promise<HistoryResult> {
  const historyPath = getGlobalHistoryPath();
  const entries = await readJsonlFile<GlobalHistoryEntry>(historyPath);

  let filtered = entries;

  // 日付フィルタリング
  if (options.startDate) {
    const startTs = options.startDate.getTime();
    filtered = filtered.filter((e) => e.timestamp >= startTs);
  }

  if (options.endDate) {
    const endTs = options.endDate.getTime();
    filtered = filtered.filter((e) => e.timestamp <= endTs);
  }

  // プロジェクトフィルタリング
  if (options.project) {
    filtered = filtered.filter((e) => e.project === options.project);
  }

  // 新しい順にソート
  filtered.sort((a, b) => b.timestamp - a.timestamp);

  const totalCount = filtered.length;

  // 件数制限
  if (options.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return {
    entries: filtered,
    totalCount,
  };
}

/**
 * セッション詳細を取得
 */
export async function getSessionDetail(
  projectPath: string,
  sessionId: string,
): Promise<SessionDetailResult | null> {
  const encodedPath = encodeProjectPath(projectPath);
  const sessionFile = path.join(
    getProjectsDir(),
    encodedPath,
    `${sessionId}.jsonl`,
  );

  try {
    const entries = await readJsonlFile<SessionHistoryEntry>(sessionFile);

    // メッセージのみをフィルタリング
    const messages = entries.filter(
      (e) => e.type === "user" || e.type === "assistant",
    );

    // サマリーを計算
    let userMessageCount = 0;
    let assistantMessageCount = 0;
    let toolUseCount = 0;
    let startTime: string | undefined;
    let endTime: string | undefined;

    for (const entry of messages) {
      if (entry.type === "user") {
        userMessageCount++;
      } else if (entry.type === "assistant") {
        assistantMessageCount++;
        // tool_use をカウント
        if (entry.message?.content) {
          const contents = Array.isArray(entry.message.content)
            ? entry.message.content
            : [entry.message.content];
          for (const content of contents) {
            if (
              typeof content === "object" &&
              (content as MessageContent) !== null
            ) {
              if ((content as MessageContentToolUse).type === "tool_use") {
                toolUseCount++;
              }
            }
          }
        }
      }

      // 時間範囲
      if (entry.timestamp) {
        if (!startTime || entry.timestamp < startTime) {
          startTime = entry.timestamp;
        }
        if (!endTime || entry.timestamp > endTime) {
          endTime = entry.timestamp;
        }
      }
    }

    return {
      sessionId,
      projectPath,
      entries: messages,
      summary: {
        userMessageCount,
        assistantMessageCount,
        toolUseCount,
        startTime,
        endTime,
      },
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
