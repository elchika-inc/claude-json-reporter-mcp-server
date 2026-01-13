# Claude Code 履歴ファイル調査

## 概要

Claude Code の履歴ファイルを読み取り、日報を自動生成する MCP サーバーの実現可能性を調査した。

**参考記事**: https://blog.yudppp.com/posts/claude-code-history-mcp

## 調査結果

### 結論

**実現可能**

履歴ファイルは `~/.claude` 配下に JSONL 形式で保存されており、MCP サーバーから読み取り可能。

---

## 履歴ファイルの構造

### 1. グローバル履歴ファイル

**パス**: `~/.claude/history.jsonl`

ユーザーの入力履歴を時系列で保存。

```json
{
  "display": "readmeを作製してほしい",
  "pastedContents": {},
  "timestamp": 1759106678168,
  "project": "/Users/nishikawa/projects/elchika/pawmatch"
}
```

| フィールド | 説明 |
|-----------|------|
| `display` | ユーザーが入力したテキスト |
| `pastedContents` | 貼り付けられたコンテンツ |
| `timestamp` | Unix タイムスタンプ(ミリ秒) |
| `project` | プロジェクトのパス |

### 2. プロジェクト別セッションファイル

**パス**: `~/.claude/projects/<project-path>/<session-id>.jsonl`

プロジェクトパスは `/` を `-` に置換した形式で保存。

例: `/Users/nishikawa/projects/foo` → `-Users-nishikawa-projects-foo`

各セッションは UUID で識別され、詳細な会話履歴を含む。

---

## セッションファイルの形式

### メッセージタイプ

| type | 説明 |
|------|------|
| `user` | ユーザーのメッセージ |
| `assistant` | Claude の応答 |
| `file-history-snapshot` | ファイル履歴スナップショット |

### ユーザーメッセージ例

```json
{
  "parentUuid": "07e98295-175d-4269-b2ac-377a0774cf6e",
  "isSidechain": false,
  "userType": "external",
  "cwd": "/Users/nishikawa/projects/naoto24kawa/claude-json-reporter-mcp",
  "sessionId": "1ae56748-4957-4d84-a3e1-f98642f72b30",
  "version": "2.1.5",
  "gitBranch": "main",
  "type": "user",
  "message": {
    "role": "user",
    "content": "ユーザーの入力テキスト"
  },
  "uuid": "0eb37913-9e59-42ab-8c3c-2f84a98f3e34",
  "timestamp": "2026-01-13T05:43:06.855Z"
}
```

### アシスタントメッセージ例

```json
{
  "type": "assistant",
  "message": {
    "role": "assistant",
    "content": [
      {"type": "text", "text": "応答テキスト"},
      {"type": "thinking", "thinking": "思考内容"},
      {"type": "tool_use", "id": "toolu_xxx", "name": "Bash", "input": {...}}
    ]
  },
  "timestamp": "2026-01-13T05:43:38.212Z"
}
```

### フィールド一覧

| フィールド | 説明 |
|-----------|------|
| `type` | メッセージタイプ |
| `message.role` | `user` / `assistant` |
| `message.content` | メッセージ本文(配列またはテキスト) |
| `timestamp` | ISO 8601 形式 |
| `sessionId` | セッション UUID |
| `cwd` | 作業ディレクトリ |
| `gitBranch` | Git ブランチ名 |
| `version` | Claude Code バージョン |
| `uuid` | メッセージ UUID |
| `parentUuid` | 親メッセージの UUID |

---

## ディレクトリ構造

```
~/.claude/
├── history.jsonl                 # グローバル履歴
├── projects/
│   ├── -Users-xxx-project-a/
│   │   ├── <session-id-1>.jsonl  # セッション履歴
│   │   ├── <session-id-1>/       # セッション関連ファイル
│   │   ├── <session-id-2>.jsonl
│   │   └── ...
│   └── -Users-xxx-project-b/
│       └── ...
├── settings.json
├── CLAUDE.md
└── ...
```

---

## MCP サーバー実装方針

### 提供するツール

1. **get_history_by_date**
   - 日付範囲を指定して履歴を取得
   - 日報生成に使用

2. **get_history_by_project**
   - プロジェクトを指定して履歴を取得

3. **get_session_detail**
   - セッション ID を指定して詳細な会話履歴を取得

4. **list_projects**
   - 履歴が存在するプロジェクト一覧を取得

5. **list_sessions**
   - プロジェクト内のセッション一覧を取得

### 技術スタック

- TypeScript
- @modelcontextprotocol/sdk
- Node.js fs/promises

### 考慮事項

- **パフォーマンス**: 履歴ファイルが大きくなる可能性があるため、ストリーミング処理を検討
- **トークン量**: 返すデータ量を制限するオプションを用意
- **フィルタリング**: thinking や tool_use を除外するオプション

---

## 参考リンク

- [claude-code-history-mcp (npm)](https://www.npmjs.com/package/claude-code-history-mcp)
- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
