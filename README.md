# claude-json-reporter-mcp

Claude Code の履歴ファイルを読み取り、日報生成などに活用できる MCP サーバー。

## 概要

Claude Code は `~/.claude` 配下に会話履歴を JSONL 形式で保存しています。この MCP サーバーを使うことで、履歴データにアクセスし、日報の自動生成などに活用できます。

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/naoto24kawa/claude-json-reporter-mcp.git
cd claude-json-reporter-mcp

# 依存関係をインストール
bun install

# ビルド
bun run build
```

## Claude Code での設定

`~/.claude/settings.json` に以下を追加:

```json
{
  "mcpServers": {
    "claude-json-reporter": {
      "command": "node",
      "args": ["/path/to/claude-json-reporter-mcp/dist/index.js"]
    }
  }
}
```

または、プロジェクトの `.mcp.json` に追加:

```json
{
  "mcpServers": {
    "claude-json-reporter": {
      "command": "node",
      "args": ["./dist/index.js"]
    }
  }
}
```

## 提供ツール

### list_projects

Claude Code の履歴が存在するプロジェクト一覧を取得します。

```
入力: なし

出力:
{
  "projects": [
    {
      "name": "my-app",
      "path": "/Users/xxx/projects/my-app",
      "encodedPath": "-Users-xxx-projects-my-app",
      "sessionCount": 5
    }
  ],
  "count": 1
}
```

### list_sessions

指定したプロジェクトのセッション一覧を取得します。

```
入力:
- project_path: プロジェクトのパス (例: /Users/xxx/projects/my-app)

出力:
{
  "projectPath": "/Users/xxx/projects/my-app",
  "sessions": [
    {
      "id": "abc123-...",
      "modifiedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

### get_history

グローバル履歴を取得します。日付やプロジェクトでフィルタリングできます。

```
入力:
- start_date: 開始日 (ISO 8601 形式、任意)
- end_date: 終了日 (ISO 8601 形式、任意)
- project: プロジェクトパス (任意)
- limit: 取得件数の上限 (デフォルト: 100)

出力:
{
  "entries": [
    {
      "display": "ユーザーの入力テキスト",
      "project": "/Users/xxx/projects/my-app",
      "timestamp": "2024-01-15T10:00:00.000Z"
    }
  ],
  "totalCount": 100,
  "returnedCount": 50
}
```

### get_session_detail

セッションの詳細な会話履歴を取得します。

```
入力:
- project_path: プロジェクトのパス
- session_id: セッション ID (UUID)

出力:
{
  "sessionId": "abc123-...",
  "projectPath": "/Users/xxx/projects/my-app",
  "summary": {
    "userMessageCount": 10,
    "assistantMessageCount": 10,
    "toolUseCount": 25,
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z"
  },
  "messages": [...]
}
```

## 使用例

### 日報生成

Claude Code で以下のようにプロンプトを入力:

```
今日の作業履歴から日報を作成してください。
get_history ツールで今日の履歴を取得し、プロジェクトごとにまとめてください。
```

### プロジェクトの作業サマリー

```
/Users/xxx/projects/my-app の最近のセッションを確認し、
何を実装したかサマリーを作成してください。
```

## 開発

```bash
# 開発モード (ファイル変更を監視)
bun run dev

# テスト実行
bun run test

# リント
bun run lint

# フォーマット
bun run format
```

## ファイル構造

```
src/
├── index.ts              # エントリーポイント
├── types/
│   ├── index.ts
│   └── history.ts        # 型定義
├── lib/
│   ├── index.ts
│   └── history-reader.ts # 履歴読み取りロジック
├── tools/
│   ├── index.ts
│   ├── definitions.ts    # ツール定義
│   └── handlers.ts       # ツールハンドラー
└── __tests__/            # テスト
```

## 参考

- [claude-code-history-mcp](https://blog.yudppp.com/posts/claude-code-history-mcp) - 参考にした記事
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 公式ドキュメント

## ライセンス

MIT
