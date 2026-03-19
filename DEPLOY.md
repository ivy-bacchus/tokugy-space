# tokugy space — Cloudflare Pages デプロイ手順

## 事前準備：スプレッドシートの共有設定

サイトがイベント情報を読み込むために、スプレッドシートを公開設定にする必要があります。

1. [スプレッドシートを開く](https://docs.google.com/spreadsheets/d/14E6pCpk2jO4INeRxx3tm7ZLrNCu3EgGeuUXe7tX8_oo/)
2. 右上「共有」→「リンクを知っている全員」→「閲覧者」に変更
3. 保存

これだけで完了です（「ウェブに公開」は不要）。

---

## Cloudflare Pages へのデプロイ

### 方法A：ドラッグ&ドロップ（最も簡単）

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左メニュー「Workers & Pages」→「Pages」→「プロジェクトを作成」
3. 「直接アップロード」タブを選択
4. プロジェクト名を入力（例: `tokugy-space`）
5. `tokugy_space` フォルダ全体をドラッグ&ドロップ
6. 「デプロイ」ボタンをクリック

→ `https://tokugy-space.pages.dev` で公開されます。

### 方法B：GitHub 連携（更新が楽）

1. このフォルダを GitHub リポジトリとして公開（private OK）
2. Cloudflare Pages でリポジトリを連携
3. ビルド設定は不要（静的ファイルのため）
4. 以後 `git push` するだけで自動更新

---

## カスタムドメイン接続（Xserver の場合）

Cloudflare Pages にカスタムドメインを設定する場合、Xserver 側の DNS 設定が必要です。

### ① Cloudflare Pages 側
1. Pages プロジェクト → 「カスタムドメイン」→「ドメインを設定」
2. サブドメインを入力（例: `space.tokugy.com`）
3. 表示された CNAME レコードをコピー

```
タイプ: CNAME
名前:   space
値:     tokugy-space.pages.dev
```

### ② Xserver 側（サーバーパネル）
1. Xserver サーバーパネルにログイン
2. 「DNS設定」→ 対象ドメイン（tokugy.com）を選択
3. 「DNS レコードの追加」
   - 種別: CNAME
   - ホスト名: space
   - 内容: tokugy-space.pages.dev
4. 保存（反映まで最大48時間）

---

## イベントの更新方法

スプレッドシートに1行追加するだけです。

| 列 | 内容 | 例 |
|---|---|---|
| A: タイトル | イベント名 | コーヒーの淹れ方教室 |
| B: 日付 | YYYY/MM/DD 形式 | 2026/04/05 |
| C: 時間 | HH:MM〜HH:MM 形式 | 10:30〜12:00 |
| D: カテゴリ | ワークショップ / イベント / マルシェ | ワークショップ |
| E: 説明 | イベントの説明文 | 初心者歓迎！... |
| F: 定員 | 人数 or 制限なし | 10名 |
| G: 申込URL | 申込先URL（なければ空白） | |
| H: 公開 | TRUE（公開）/ FALSE（非公開） | TRUE |

- 日付が過去のものは「過去のイベント」に自動移動
- H列が FALSE のものは表示されない（下書き状態）

---

## ファイル構成

```
tokugy_space/
├── index.html        # トップページ
├── events.html       # イベント一覧ページ
├── css/
│   └── style.css     # スタイルシート
└── js/
    └── sheets.js     # Google Sheets 連携
```

スプレッドシート ID を変更する場合は `js/sheets.js` の先頭を編集してください。
