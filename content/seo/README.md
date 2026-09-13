# SEOパイプライン（編集部の下働き）

方針:

1. **問い合わせにつながる語だけ**
2. **毎日最大3本の下書き + PNGサムネ**（自動公開しない）
3. **人手ファクトチェック** → allowlist 公開
4. **弱い記事はリライト候補**
5. **著者・更新日を明示**（鈴木＝現場出身の案内役／田中＝元セラピ・はっきり姉御。交互・意図で割当。堅い真面目口調は避ける）
6. **X（旧Twitter）には投稿しない**（風俗隣接ジャンルの凍結リスク）
7. **エリアクラスターも下書きまで自動・本番反映は人手**

## 仕組み化の全体像

| レーン | 自動化 | 公開 |
|--------|--------|------|
| sitemap / メタ / 都道府県SSR / パンくず / フッター | コード恒久化 | デプロイで即反映 |
| 優先ハブ定義 | [`src/constants/seoPriorityHubs.js`](../../src/constants/seoPriorityHubs.js) | — |
| エリアクラスター下書き | 週次 GHA `seo-area-clusters` | `merge-area-clusters --apply` 後に反映 |
| ガイド下書き | 日次 GHA `seo-daily-drafts` | `articles.js` allowlist |
| GSC スナップショット | 週次 GHA `seo-gsc-weekly` | 機会ファイルのみ（Secrets 必須） |

```
GSC weekly → opportunities/
priority hubs → queue.json (seed-hub-queue)
                ↓
         daily-generate (3本) → PR
                ↓
         人手 allowlist

priority hubs → generate-area-clusters → cluster-drafts/*.json → PR
                ↓
         人手 merge-area-clusters --apply
```

## コマンド

```bash
npm run seo:daily          # 日次3本 dry-run
npm run seo:daily:run      # 日次3本 + PNGサムネ書き込み
npm run seo:seed-hub-queue # 優先ハブ×意図を queue に投入
npm run seo:clusters       # クラスター下書き dry-run
npm run seo:clusters:run   # クラスター下書き生成
npm run seo:clusters:merge # マージ dry-run
npm run seo:clusters:merge:apply  # areaSeoCluster.js へ反映
npm run seo:to-png -- path/to/image.webp
npm run seo:find-rising
npm run seo:find-rewrites
npm run seo:fetch-api      # GSC API（要 credentials）
```

## 日次フロー

```
GSC機会（あれば優先） + content/seo/queue.json
  → daily-generate.js（3本）
  → content/articles/*-daily-*.md
  → public/images/articles/*.png  ← 必ず PNG
  → proposals/*-daily.md
  → PR（GHA）→ 人手校正 → allowlist
```

GitHub Actions:

- `.github/workflows/seo-daily-drafts.yml`（毎日）
- `.github/workflows/seo-area-clusters.yml`（週1）
- `.github/workflows/seo-gsc-weekly.yml`（週1・Secrets 未設定なら skip）

## エリアクラスター

1. `npm run seo:clusters:run`（または週次 PR）
2. `content/seo/cluster-drafts/{slug}.json` を確認
3. `npm run seo:clusters:merge:apply`
4. 差分レビュー後にデプロイ

薄い `content/articles` の一括 allowlist は禁止。西船橋型の固有文だけを入れる。

## PNG 必須ルール

- 記事サムネ出力は **sharp 経由で PNG のみ**
- WebP/AVIF/JPEG/SVG は `npm run seo:to-png -- <file>` で変換
- next/image / OG 連携は PNG パス（`/images/articles/...png`）を前提

## 配信（SNS）

| チャネル | 方針 |
|---------|------|
| サイト内ガイド | メイン |
| Search Console | 流入監視・伸び語・リライト |
| X / Twitter | **使わない**（凍結リスク） |

店舗の X リンク表示（店舗申告）は別問題。サイト側の集客投稿は行わない。

## 横展開（deli-rank / Diabro）

同じ型を使う。変えるもの: site-profile / 著者 / intent辞書 / エリア別名 / CV導線。  
クロスリリンクは `/about` の関連メディアのみ。

渡し用プロンプト（そのまま他リポジトリに貼る）:

- [DELIRANK_HANDOFF_PROMPT.md](./DELIRANK_HANDOFF_PROMPT.md)
- [DIABRO_HANDOFF_PROMPT.md](./DIABRO_HANDOFF_PROMPT.md) … [diabro.co.jp](https://diabro.co.jp/) 軽配送求人向け

## API / Secrets

ローカルはプロジェクト直下の `.env.local`（git外）:

```bash
ANTHROPIC_API_KEY=...          # 本文生成（優先）
# OPENAI_API_KEY=...           # Anthropic が無いときの代替
ANTHROPIC_MODEL=claude-sonnet-4-5
```

GitHub Actions Secrets:

| Secret | 用途 |
|--------|------|
| `ANTHROPIC_API_KEY` | 日次下書き・クラスター LLM |
| `OPENAI_API_KEY` | 任意フォールバック |
| `GSC_SERVICE_ACCOUNT_JSON` | Search Console API（未設定なら GSC 週次は skip） |
| `GSC_SITE_URL` | 例 `https://mensesthe-rank.jp/` |

### GSC サービスアカウント手順（要約）

1. Google Cloud でサービスアカウント作成 → JSON キー発行
2. Search Console でサイトのユーザーにその SA メールを追加（権限: 所有者またはフル）
3. GitHub Secrets に JSON 全文を `GSC_SERVICE_ACCOUNT_JSON` として登録
4. `GSC_SITE_URL=https://mensesthe-rank.jp/` を登録
5. `seo-gsc-weekly` を workflow_dispatch で一度実行し、PR が立つことを確認
