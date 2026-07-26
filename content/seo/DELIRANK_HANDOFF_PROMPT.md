# Deli-rank 移植用プロンプト（mensesthe-rank 準拠）

次のプロンプトを、deli-rank（https://deli-rank.jp）のリポジトリでそのまま貼って実行してください。

---

## プロンプト本文（コピー用）

```
あなたは deli-rank.jp（デリヘル店舗の比較・ランキングサイト）の実装担当です。
mensesthe-rank.jp で稼働中の「SEO編集部パイプライン」を、同じ設計思想で移植してください。

# 目標
- Search Console（またはキーワードキュー）から、問い合わせ・比較決断につながりやすい語だけ拾う
- 毎日最大3本の記事下書きを自動生成（自動公開は禁止）
- サムネも自動生成し、出力は必ず PNG（WebP/AVIF/JPEG/SVG は sharp で PNG 化）
- 最終ファクトチェックは人手
- 効果の弱い公開記事はリライト候補として見張る
- 著者・更新日を記事に明示（E-E-A-T）
- X（旧Twitter）への集客投稿はしない（凍結リスク）
- 他サイトとの総当たり相互リンクはしない。運営者ページでの姉妹メディア紹介のみ

# mensesthe-rank 側の参照実装（同じ型を踏襲）
リポジトリ: esthe-now（本番 mensesthe-rank.jp）

必須参考ファイル:
- content/seo/README.md
- content/seo/queue.json
- scripts/seo/daily-generate.js
- scripts/seo/generate-keyword-articles.js
- scripts/seo/find-rising-keywords.js
- scripts/seo/find-rewrite-candidates.js
- scripts/seo/fetch-gsc-queries.js
- scripts/seo/convert-to-png.js
- scripts/seo/lib/intent.js
- scripts/seo/lib/classify.js
- scripts/seo/lib/article-draft.js
- scripts/seo/lib/thumbnail.js
- scripts/seo/lib/to-png.js
- scripts/seo/lib/gsc.js
- scripts/seo/lib/site-profile.js
- src/constants/authors.js
- src/constants/articles.js（allowlist公開）
- src/components/ArticleByline.jsx
- src/components/ArticleHeroImage.jsx
- src/app/about/page.jsx（編集方針・関連メディア）
- .github/workflows/seo-daily-drafts.yml

# deli-rank 固有の差し替え
SITE_SEO_PROFILE を次に変更:
- siteKey: deli-rank
- siteName: デリヘル情報ランキング（実際の正式名称に合わせる）
- siteUrl: https://deli-rank.jp
- verticalLabel: デリヘル
- inquiryLabel: 電話・予約・掲載申込
- sisterMedia: mensesthe-rank.jp を関連メディアとして /about のみに掲載
- distribution.xTwitter: disabled
- dailyArticleLimit: 3

intent / classify 辞書:
- mensesthe → デリヘル語彙に置換（デリヘル、出稼ぎ、即ヒメ、口コミ、料金、相場、おすすめ、選び方、初めて、比較、エリア名など）
- エリア別名は deli-rank のエリアマスタに合わせる
- 問い合わせ意図以外は skip

記事ルート:
- 既存のガイド/記事の公開方式があればそれに合わせる
- なければ Markdown + allowlist（公開は人手）を導入
- 下書きは自動でインデックスさせない

サムネ:
- public/images/articles/{fileBase}.png
- sharp で 1200x630 PNG 必須
- ブランドカラーは deli-rank のデザインに合わせる（コピー禁止色でも可）
- CI では fonts-noto-cjk を入れる

日次:
- npm script: seo:daily / seo:daily:run
- GitHub Actions で毎日3本PR（自動マージしない）
- PR本文に「要ファクトチェック」「X投稿しない」を明記

禁止:
- 自動公開
- X自動投稿・マニュアル運用前提のX導線増設
- mensesthe-rank と deli-rank のフッター相互リンク量産
- 違法・危険行為・年齢確認を曖昧にする表現

# 成果物
1. 上記スクリプト一式の移植
2. /about（著者・編集方針・関連メディア）
3. 記事Byline + PNGヒーロー
4. queue.json（デリヘル向け問い合わせ語で初期投入）
5. README（運用手順）
6. 動作確認: seo:daily:run で3本+PNGが生成されること

まず現状の deli-rank リポジトリ構造を調べ、衝突を避けて最小差分で実装してください。
```

---

## 補足（運用メモ）

- mensesthe と deli は **運用エンジンを共有、リンク網は共有しない**
- 今日の mensesthe 分チェック後、同じコマンド体系で deli も回す
