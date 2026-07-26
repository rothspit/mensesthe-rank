# SEOパイプライン（編集部の下働き）

方針:

1. **問い合わせにつながる語だけ**
2. **毎日最大3本の下書き + PNGサムネ**（自動公開しない）
3. **人手ファクトチェック** → allowlist 公開
4. **弱い記事はリライト候補**
5. **著者・更新日を明示**（鈴木＝現場出身の案内役／田中＝元セラピ・はっきり姉御。交互・意図で割当。堅い真面目口調は避ける）
6. **X（旧Twitter）には投稿しない**（風俗隣接ジャンルの凍結リスク）

## コマンド

```bash
npm run seo:daily          # 日次3本 dry-run
npm run seo:daily:run      # 日次3本 + PNGサムネ書き込み
npm run seo:to-png -- path/to/image.webp
npm run seo:find-rising
npm run seo:find-rewrites
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

GitHub Actions: `.github/workflows/seo-daily-drafts.yml`（毎日）

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

任意（CI）: `GSC_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL`, `ANTHROPIC_API_KEY`
