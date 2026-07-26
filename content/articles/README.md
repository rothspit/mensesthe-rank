# メンズエステ情報ランキング｜記事ドラフト

## 公開ルール

| 種別 | 公開先 | ファイル |
|------|--------|----------|
| 全国・比較ガイド | `/guide/{slug}` | `08-*`, `21-*`, `22-*` |
| 手書きエリアガイド | `/guide/area/{slug}` | `01-*` 〜 `20-*`（`src/constants/articles.js` で管理） |
| テンプレ量産（下書き） | **非公開** | `23-*` 以降 |

ランキングページ（`/areas/...`）には本文を埋め込まない。ガイドへのリンクのみ。

## 量産スクリプト

```bash
node scripts/generate-area-articles.js --top 50 --execute
```

生成物は下書き倉庫。公開前に個別編集し、`PUBLISHED_AREA_GUIDE_FILES` に追加する。

## Search Console 連携（伸びワード → 下書き）

```bash
npm run seo:demo          # サンプルCSVで一通り
npm run seo:find-rewrites # 効果の弱い公開記事の見張り
```

- 問い合わせ意図の語だけ対象
- 公開は人手校正のあと allowlist 追加
- 著者・編集方針: `/about`
- 詳細: [`content/seo/README.md`](../seo/README.md)
