---
name: daily-report
description: Claude Code の履歴から日報を自動生成する。MCP ツールで履歴を取得し、6種類のラベル (作業依頼、技術確認、フィードバック、コマンド、情報共有、質問) で分類、プロジェクト別にまとめた日報を出力する。Use when the user mentions 「日報」「日報作成」「今日の作業まとめ」「作業報告」「本日の作業」「作業履歴」or asks to summarize daily work activities.
---

# 日報生成スキル

Claude Code の履歴から日報を自動生成する。

## ワークフロー

### Step 1: 履歴データ取得

`mcp__claude-json-reporter__get_history` で今日の履歴を取得。

```
start_date: YYYY-MM-DD (今日)
end_date: YYYY-MM-DD (今日)
```

**検証**: entries が空でないことを確認。空の場合はユーザーに報告。

### Step 2: ラベリング

各エントリを以下のラベルで分類:

| ラベル | 識別子 | キーワード例 |
|-------|--------|-------------|
| 作業依頼 | `task_request` | 〜してほしい、実装、作成、マージ |
| 技術確認 | `tech_check` | 確認して、〜出てない？ |
| フィードバック | `feedback` | いい感じ、良さそう、違う |
| コマンド | `command` | /clear, /exit, /resume |
| 情報共有 | `info_share` | URL、ファイルパス |
| 質問 | `question` | 〜ですか？、可能？ |

**詳細ルール**: [./references/labeling-rules.md](./references/labeling-rules.md)

**検証**: 全エントリにラベルが付与されていることを確認。

### Step 3: 日報出力

以下のテンプレートで出力:

```markdown
# 日報 - YYYY-MM-DD

## サマリー

| ラベル | 件数 |
|-------|------|
| 作業依頼 | XX |
| 技術確認 | XX |
| フィードバック | XX |
| コマンド | XX |
| 情報共有 | XX |
| 質問 | XX |

## プロジェクト別作業内容

### project-name

- 作業内容1
- 作業内容2

## 詳細 (task_request のみ)

| 時刻 | プロジェクト | 内容 |
|------|-------------|------|
| HH:MM | project | display |
```

**検証**: サマリー件数合計 = 取得エントリ数

## デフォルト動作

- **日付指定なし**: 今日の日付を使用
- **プロジェクト指定なし**: 全プロジェクトを対象
- **出力形式**: Markdown テーブル形式

## エラーハンドリング

| エラー | 対処 |
|--------|------|
| MCP ツール未設定 | `.mcp.json` 確認、`bun run build` 実行、Claude Code 再起動 |
| 履歴なし | `~/.claude/history.jsonl` 存在確認、日付範囲拡大 |
| ラベリング迷い | 優先順位に従う (command > task_request > tech_check > question > feedback > info_share) |
