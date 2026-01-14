# ラベリングルール詳細

## 目次

1. [ラベル定義](#ラベル定義)
2. [分類キーワード](#分類キーワード)
3. [優先順位](#優先順位)
4. [出力形式](#出力形式)
5. [実行例](#実行例)

---

## ラベル定義

| ラベル | 識別子 | 説明 |
|-------|--------|------|
| 作業依頼 | `task_request` | 実装、Issue作成、PR作成、マージ、デプロイなどの依頼 |
| 技術確認 | `tech_check` | CI状態、エラー確認、動作確認の依頼 |
| フィードバック | `feedback` | 作業結果への評価やコメント |
| コマンド | `command` | /clear, /exit, /resume などのCLIコマンド |
| 情報共有 | `info_share` | URL共有、コンテキスト提供 |
| 質問 | `question` | 技術的な質問や確認 |

---

## 分類キーワード

### task_request (作業依頼)

**キーワードパターン:**
- 「〜してほしい」「〜してくれ」「〜して」「〜お願い」
- 「実装」「作成」「削除」「更新」「マージ」「デプロイ」
- 「Issue化して」「PR作成」

**例:**
```
Issue化して、実装して、テストの改善も行って、PR作成まで実行してほしい
```

### tech_check (技術確認)

**キーワードパターン:**
- 「確認して」「チェックして」
- 「〜出てない？」「〜通ってますか？」
- 「どうなった？」「できた？」

**例:**
```
CIエラー出てない？
テスト通ってますか？
```

### feedback (フィードバック)

**キーワードパターン:**
- 「いい感じ」「良さそう」「OK」
- 「思ったのと違う」「〜ではない」
- 「機能してない」「壊れてる」

**例:**
```
いい感じ
良さそう
```

### command (コマンド)

**パターン:**
- `/` で始まるもの

**例:**
```
/clear
/exit
/resume
```

### info_share (情報共有)

**キーワードパターン:**
- URL (https://...)
- ファイルパス指定のみ
- 「〜を追加した」「〜を対応した」(報告形式)

**例:**
```
https://github.com/user/repo/pull/123
src/components/Button.tsx
```

### question (質問)

**キーワードパターン:**
- 「〜ですか？」「〜か？」
- 「可能？」「必要？」

**例:**
```
この実装で問題ないですか？
TypeScriptに移行は必要？
```

---

## 優先順位

複数のラベルに該当する場合の優先順位:

1. `command` - `/` で始まる場合は最優先
2. `task_request` - 依頼が含まれる場合
3. `tech_check` - 確認依頼の場合
4. `question` - 疑問文の場合
5. `feedback` - 評価コメントの場合
6. `info_share` - 情報提供のみの場合

---

## 出力形式

```json
{
  "entries": [
    {
      "display": "PRを全部マージしてほしい",
      "project": "/Users/xxx/projects/my-app",
      "timestamp": "2026-01-13T14:14:10.728Z",
      "label": "task_request"
    }
  ],
  "summary": {
    "task_request": 52,
    "tech_check": 14,
    "feedback": 9,
    "command": 14,
    "info_share": 4,
    "question": 3
  }
}
```

---

## 実行例

### 入力 (get_history の結果)

```json
{
  "entries": [
    {
      "display": "実装してほしい",
      "project": "/Users/dev/my-app",
      "timestamp": "2026-01-13T09:00:00.000Z"
    },
    {
      "display": "CIエラー出てない？",
      "project": "/Users/dev/my-app",
      "timestamp": "2026-01-13T10:30:00.000Z"
    },
    {
      "display": "いい感じ",
      "project": "/Users/dev/my-app",
      "timestamp": "2026-01-13T11:00:00.000Z"
    },
    {
      "display": "/clear",
      "project": "/Users/dev/other-project",
      "timestamp": "2026-01-13T14:00:00.000Z"
    }
  ],
  "totalCount": 4
}
```

### ラベリング結果

| display | label |
|---------|-------|
| 実装してほしい | `task_request` |
| CIエラー出てない？ | `tech_check` |
| いい感じ | `feedback` |
| /clear | `command` |

### 出力 (日報)

```markdown
# 日報 - 2026-01-13

## サマリー

| ラベル | 件数 |
|-------|------|
| 作業依頼 | 1 |
| 技術確認 | 1 |
| フィードバック | 1 |
| コマンド | 1 |
| 情報共有 | 0 |
| 質問 | 0 |

## プロジェクト別作業内容

### my-app

- 機能実装作業
- CI確認

### other-project

- セッションクリア

## 詳細 (task_request のみ)

| 時刻 | プロジェクト | 内容 |
|------|-------------|------|
| 09:00 | my-app | 実装してほしい |
```
