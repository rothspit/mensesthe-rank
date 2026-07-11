# メンズエステ情報ランキング｜記事ドラフト（全22本）

電車作業用の文案ドラフト。VPS の rank プロジェクトに移植してください。

## Tier 1 エリアピラー（7本）— 料金相場・FAQ 拡充済み

| # | ファイル | タイトル | リンク先 |
|---|----------|----------|----------|
| 01 | `01-shinjuku.md` | 新宿【2026】 | `/areas/shinjuku` |
| 02 | `02-ikebukuro.md` | 池袋【2026】 | `/areas/ikebukuro` |
| 03 | `03-yokohama.md` | 横浜【2026】 | `/areas/yokohama` |
| 04 | `04-chiba-funabashi.md` | 千葉・船橋【2026】 | `/areas/chiba`, `/areas/funabashi` |
| 05 | `05-osaka.md` | 大阪【2026】 | `/areas/osakaminami` |
| 06 | `06-hakata.md` | 博多【2026】 | `/areas/hakata` |
| 07 | `07-nagoya.md` | 名古屋【2026】 | `/areas/nagoya`, `/areas/sakae` |

## Tier 2 エリアピラー（12本）

| # | ファイル | タイトル | リンク先 |
|---|----------|----------|----------|
| 09 | `09-shibuya.md` | 渋谷【2026】 | `/areas/shibuya` |
| 10 | `10-ginza.md` | 銀座【2026】 | `/areas/ginza` |
| 11 | `11-urawa.md` | 浦和【2026】 | `/areas/urawa` |
| 12 | `12-shinagawa.md` | 品川【2026】 | `/areas/shinagawa` |
| 13 | `13-ueno.md` | 上野【2026】 | `/areas/ueno` |
| 14 | `14-kamata.md` | 蒲田【2026】 | `/areas/kamata` |
| 15 | `15-musashikosugi.md` | 武蔵小杉【2026】 | `/areas/musashikosugi` |
| 16 | `16-omiya.md` | 大宮【2026】 | `/areas/omiya` |
| 17 | `17-kyoto.md` | 京都【2026】 | `/areas/kyoto` |
| 18 | `18-hamamatsu.md` | 浜松【2026】 | `/areas/hamamatsu-hamamatsu` |
| 19 | `19-hiroshima.md` | 広島【2026】 | `/areas/hiroshima-hiroshima` |
| 20 | `20-kawasaki.md` | 川崎【2026】 | `/areas/kawasaki` |

## 比較・安心・全国ガイド（3本）

| # | ファイル | タイトル | 用途 |
|---|----------|----------|------|
| 08 | `08-beginner-guide-40s.md` | 40代から始める選び方 | 全国ハブ |
| 21 | `21-shinjuku-vs-ikebukuro.md` | 新宿 vs 池袋 比較 | 比較記事 |
| 22 | `22-safe-selection-fueiho.md` | 改正風営法×安心の選び方 | サブ（客目線） |

## コンテンツ方針

- ターゲット: 40〜60代男性
- トーン: 信頼性・高級感・客目線
- 摘発: 速報ではなく「安心の選び方」に昇華（22番）
- 各記事: SEO title / description / 内部リンク / 料金相場 / FAQ

## 移植時のメモ

- 各ファイル先頭の **SEOメタ情報** → Next.js `metadata`
- `/areas/...` リンク → そのまま内部リンク
- `/guide/...` → 記事ページ用ルートを新設

## エリア件数（2026-07-11 確認）

新宿132 / 池袋127 / 横浜154 / 千葉138 / 博多200 / 大阪南175 / 名古屋149  
渋谷80 / 銀座97 / 浦和105 / 品川80 / 上野115 / 蒲田133 / 武蔵小杉98 / 大宮94 / 京都122 / 浜松136 / 広島79 / 川崎73
