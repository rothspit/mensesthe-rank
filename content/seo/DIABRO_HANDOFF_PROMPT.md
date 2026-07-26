# Diabro 移植用プロンプト（mensesthe-rank SEOパイプライン準拠）

対象サイト: [https://diabro.co.jp/](https://diabro.co.jp/)  
事業: 軽配送ドライバー求人（寮完備・初期費用0・西船橋拠点など）

mensesthe-rank で動かしている「SEO編集部パイプライン」を、求人・採用LPサイト向けに移植するためのプロンプトです。  
デリランク用と同じ型。差し替えは **業種語彙・CV定義・禁止表現** が中心です。

---

## プロンプト本文（コピー用）

```
あなたは diabro.co.jp（軽配送ドライバー求人・寮完備の採用サイト）の実装担当です。
mensesthe-rank.jp で稼働中の「SEO編集部パイプライン」を、同じ設計思想で移植してください。

# サイトの実態（必ず守る）
- 正式サイト: https://diabro.co.jp/
- 事業: 軽配送ドライバー募集（業務委託・正社員）、寮完備、初期費用0、西船橋拠点、未経験歓迎
- 主なCV: LINE相談 / WEB応募 / チャットボット相談（電話だけに依存しない）
- トンマナ: 不安解消・具体待遇・FAQ。誇大な年収保証や違法表現は禁止
- 参考LP文言の方向性: 寮・初期費用ゼロ・日収目安・未経験OK・直行直帰 など

# 目標
- Search Console（またはキーワードキュー）から、「応募・相談につながる検索語」だけ拾う
- 毎日最大3本の記事下書きを自動生成（自動公開は禁止）
- サムネも自動生成し、出力は必ず PNG（WebP/AVIF/JPEG/SVG は sharp で PNG 化）
- 最終ファクトチェックは人手（待遇数値・寮条件・地域は特に厳密）
- 効果の弱い公開記事はリライト候補として見張る
- 著者・更新日を記事に明示（採用企業としての信頼性）
- X（旧Twitter）への採用集客自動投稿は必須にしない（運用方針に合わせてオフ可）
- 他サイト（mensesthe / deli-rank 等）との総当たり相互リンクはしない
  - 運営者・グループ紹介が必要なら /about 相当ページのみ

# mensesthe-rank 側の参照実装（同じ型を踏襲）
リポジトリ: mensesthe-rank（本番 mensesthe-rank.jp）

必須参考ファイル:
- content/seo/README.md
- content/seo/queue.json
- content/seo/DELIRANK_HANDOFF_PROMPT.md（横展開の型の例）
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
- src/app/about/page.jsx
- .github/workflows/seo-daily-drafts.yml

# Diabro 固有の差し替え

SITE_SEO_PROFILE:
- siteKey: diabro
- siteName: Diabro（またはサイト正式名称）
- siteUrl: https://diabro.co.jp
- verticalLabel: 軽配送ドライバー求人
- inquiryLabel: LINE相談・WEB応募・面談予約
- sisterMedia: 必要な場合のみ about に掲載（強制しない）
- dailyArticleLimit: 3
- distribution.primary: organic_search + owned_landing

## 問い合わせ意図（intent）辞書の例
通す（高優先）:
- 軽配送 求人 / 軽貨物 ドライバー 求人
- 配送 ドライバー 寮付き / 寮完備 ドライバー
- 軽貨物 未経験 / 配送 未経験 歓迎
- 日払い 配送 / 日払い ドライバー
- 初期費用 0 寮 / 敷金礼金なし 寮 仕事
- 西船橋 ドライバー 求人 / 船橋 配送 求人
- 軽自動車 配送 給料 / 軽貨物 年収 / 軽貨物 月収
- 普通免許 配送 仕事 / AT 配送 求人
- 副業 配送 ドライバー / Wワーク 軽貨物
- 女性 配送 ドライバー / 女性 軽貨物

落とす（低意図・ブランドノイズ）:
- 会社名だけのナビクエリ（必要な例外以外）
- 単なる画像・意味・英語などの情報クエリ
- 競合名の誹謗・根拠のない比較煽り

## 記事タイプ例
- エリア×求人（西船橋・船橋・千葉・関東 など）
- 寮付き・初期費用0の実態解説（誇大禁止、条件はファクトチェック必須）
- 未経験向け始め方 / 1日の流れ / よくある不安FAQ
- 待遇比較の読み方（金額はレンジ表記、確定保証にしない）
- 「こういう人向け」ペルソナ記事（地元を出たい、住む場所が必要、など）

## ファクトチェック必須項目（自動公開禁止の理由）
- 月収・日収の表記（目安であることが明確か）
- 寮の初期費用・支払いタイミング
- 勤務時間・休日・エリア
- 応募導線（LINE / フォーム）が現行LPと一致しているか
- 景表法・職業安定法に抵触しうる表現がないか

## サムネ
- public/images/articles/{fileBase}.png
- 1200x630 PNG 必須（sharp）
- トーン: 信頼性・生活再建・仕事の安心感（煽りイエローだけでなく、落ち着いた実務感）
- CI では fonts-noto-cjk

## 日次
- npm script: seo:daily / seo:daily:run
- GitHub Actions で毎日3本PR（自動マージしない）
- PR本文に「要ファクトチェック（待遇・寮条件）」を明記

## CV導線（記事から）
各記事の結論付近に、現行LPと同じ応募CTAへ内部リンク:
- 無料相談 / LINE / WEB応募（diabro.co.jp の現行導線に合わせる）
ランキングサイト型の「店舗電話」ではない。採用CVに合わせること。

# 禁止
- 自動公開
- 根拠のない高収入の断定
- 違法行為・危険運転・無免許などを想起させる表現
- 夜職・風俗サイトとの相互リンク量産
- mensesthe / deli-rank への機械的クロスリリンク

# 成果物
1. 上記スクリプト一式の移植（または Next 既存構成への統合）
2. /about または既存の会社情報ページに編集方針・著者
3. 記事Byline + PNGヒーロー
4. queue.json（上記問い合わせ語で初期投入）
5. README（運用手順・ファクトチェック項目）
6. 動作確認: seo:daily:run で3本+PNGが生成されること
7. 可能なら既存LP（https://diabro.co.jp/）への内部リンク設計

まず現状の diabro リポジトリ構造を調べ、衝突を避けて最小差分で実装してください。
フレームワークが Next 以外でも、Markdown下書き + PNG + 日次3本 + allowlist/人手公開 の型は維持してください。
```

---

## 横展開の位置づけ

| サイト | 縦型 | CV |
|--------|------|-----|
| mensesthe-rank.jp | メンズエステ比較 | 電話・予約・掲載 |
| deli-rank.jp | デリヘル比較 | 電話・予約・掲載 |
| diabro.co.jp | 軽配送求人 | LINE・応募・面談 |

共通: 毎日3本 / PNG / 人手ファクト / 自動公開なし / 総当たりリンクなし  
違う: 語彙・著者・ファクト項目・CTA

## mensesthe 今日の分との関係

Diabro用プロンプトは独立。mensesthe の今日の下書きチェックとは別作業で進めてよい。
