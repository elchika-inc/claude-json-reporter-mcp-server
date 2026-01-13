/**
 * グローバル履歴エントリ (~/.claude/history.jsonl)
 */
export interface GlobalHistoryEntry {
  display: string;
  pastedContents: Record<string, unknown>;
  timestamp: number;
  project: string;
}

/**
 * セッションメッセージの content 要素
 */
export interface MessageContentText {
  type: "text";
  text: string;
}

export interface MessageContentThinking {
  type: "thinking";
  thinking: string;
}

export interface MessageContentToolUse {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface MessageContentToolResult {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type MessageContent =
  | MessageContentText
  | MessageContentThinking
  | MessageContentToolUse
  | MessageContentToolResult
  | string;

/**
 * セッション履歴エントリ (~/.claude/projects/<project>/<session>.jsonl)
 */
export interface SessionHistoryEntry {
  type: "user" | "assistant" | "file-history-snapshot";
  message?: {
    role: "user" | "assistant";
    content: MessageContent | MessageContent[];
  };
  timestamp: string;
  sessionId?: string;
  cwd?: string;
  gitBranch?: string;
  version?: string;
  uuid?: string;
  parentUuid?: string | null;
  isSidechain?: boolean;
  userType?: string;
  isMeta?: boolean;
}

/**
 * プロジェクト情報
 */
export interface ProjectInfo {
  name: string;
  path: string;
  encodedPath: string;
  sessionCount: number;
}

/**
 * セッション情報
 */
export interface SessionInfo {
  id: string;
  projectPath: string;
  filePath: string;
  modifiedAt: Date;
}

/**
 * 履歴取得オプション
 */
export interface GetHistoryOptions {
  startDate?: Date;
  endDate?: Date;
  project?: string;
  limit?: number;
}

/**
 * 履歴取得結果
 */
export interface HistoryResult {
  entries: GlobalHistoryEntry[];
  totalCount: number;
}

/**
 * セッション詳細取得結果
 */
export interface SessionDetailResult {
  sessionId: string;
  projectPath: string;
  entries: SessionHistoryEntry[];
  summary: {
    userMessageCount: number;
    assistantMessageCount: number;
    toolUseCount: number;
    startTime?: string;
    endTime?: string;
  };
}
