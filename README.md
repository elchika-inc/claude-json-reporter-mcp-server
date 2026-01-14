# claude-json-reporter-mcp-server

[![npm version](https://badge.fury.io/js/claude-json-reporter-mcp-server.svg)](https://www.npmjs.com/package/claude-json-reporter-mcp-server)
[![Node.js Version](https://img.shields.io/node/v/claude-json-reporter-mcp-server.svg)](https://nodejs.org)

Claude Code の履歴ファイルを読み取る MCP (Model Context Protocol) サーバー。日報生成や作業分析に活用できます。

## 特徴

- Claude Code の会話履歴 (`~/.claude`) にアクセス
- プロジェクト別、日付別のフィルタリング
- セッション詳細の取得
- 日報生成の自動化に最適
- Claude Plugins 対応 (日報生成スキル付属)

## インストール

### npm

```bash
npm install -g claude-json-reporter-mcp-server
```

### ソースから

```bash
git clone https://github.com/elchika-inc/claude-json-reporter-mcp-server.git
cd claude-json-reporter-mcp-server
npm install
npm run build
```

## セットアップ

### 方法1: MCP サーバーとして使用

MCP サーバーとして直接使用する場合の設定です。

#### グローバル設定

`~/.claude/settings.json` に追加:

```json
{
  "mcpServers": {
    "claude-json-reporter": {
      "command": "npx",
      "args": ["-y", "claude-json-reporter-mcp-server"]
    }
  }
}
```

#### プロジェクト設定

プロジェクトの `.mcp.json` に追加:

```json
{
  "mcpServers": {
    "claude-json-reporter": {
      "command": "npx",
      "args": ["-y", "claude-json-reporter-mcp-server"]
    }
  }
}
```

### 方法2: Claude Plugin として使用

日報生成スキルを含む Claude Plugin として使用する場合の設定です。

#### インストール

```bash
claude plugins:add elchika-inc/claude-json-reporter
```

#### 使い方

Plugin をインストールすると、以下のスキルが利用可能になります:

- **daily-report**: 日報生成スキル

```
/daily-report              # 今日の日報を生成
/daily-report 2024-01-15   # 特定日の日報を生成
```

日報は以下の6つのラベルで分類されます:
- 作業依頼 (task_request)
- 技術確認 (tech_check)
- フィードバック (feedback)
- コマンド (command)
- 情報共有 (info_share)
- 質問 (question)

## MCP ツール

### list_projects

履歴が存在するプロジェクト一覧を取得。

```typescript
// 入力: なし

// 出力
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

プロジェクトのセッション一覧を取得。

```typescript
// 入力
{
  "project_path": "/Users/xxx/projects/my-app"
}

// 出力
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

グローバル履歴を取得。日付・プロジェクトでフィルタリング可能。

```typescript
// 入力
{
  "start_date": "2024-01-15",  // ISO 8601 形式 (任意)
  "end_date": "2024-01-15",    // ISO 8601 形式 (任意)
  "project": "/Users/xxx/...", // プロジェクトパス (任意)
  "limit": 100                 // 取得件数上限 (デフォルト: 100)
}

// 出力
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

セッションの詳細な会話履歴を取得。

```typescript
// 入力
{
  "project_path": "/Users/xxx/projects/my-app",
  "session_id": "abc123-..."
}

// 出力
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

```
今日の作業履歴から日報を作成してください。
get_history ツールで今日の履歴を取得し、プロジェクトごとにまとめてください。
```

### 特定日の履歴取得

```
2024-01-15 の作業履歴を確認してください。
```

### プロジェクト作業サマリー

```
/Users/xxx/projects/my-app の最近のセッションを確認し、
何を実装したかサマリーを作成してください。
```

## 動作環境

- Node.js >= 18.0.0
- Claude Code

## 開発

```bash
# 開発モード
npm run dev

# テスト
npm run test

# リント
npm run lint

# ビルド
npm run build
```

## 関連リンク

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 公式ドキュメント
- [Claude Code](https://claude.ai/code) - Anthropic 公式 CLI

## Author

[elchika-inc](https://github.com/elchika-inc)
