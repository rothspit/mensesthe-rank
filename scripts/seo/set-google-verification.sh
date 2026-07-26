#!/usr/bin/env bash
# Google Search Console 所有権確認タグを Vercel に設定して再デプロイ
#
# 1. https://search.google.com/search-console にアクセス
# 2. プロパティ追加 → URL プレフィックス → https://mensesthe-rank.jp
# 3. 確認方法: HTML タグ → content="..." の値をコピー
# 4. 実行:
#      bash scripts/seo/set-google-verification.sh YOUR_VERIFICATION_CODE
#
# 5. デプロイ後、Search Console で「確認」をクリック
# 6. 左メニュー → サイトマップ → https://mensesthe-rank.jp/sitemap.xml を送信

set -euo pipefail

CODE="${1:-}"
if [ -z "$CODE" ]; then
  echo "使い方: bash scripts/seo/set-google-verification.sh <verification_code>"
  echo ""
  echo "Search Console → 所有権の確認 → HTML タグ"
  echo '  <meta name="google-site-verification" content="ここ" />'
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if ! command -v vercel >/dev/null 2>&1; then
  echo "❌ vercel CLI が必要です: npm i -g vercel"
  exit 1
fi

echo "==> Vercel 環境変数 VITE_GOOGLE_SITE_VERIFICATION を設定..."
printf '%s' "$CODE" | vercel env add VITE_GOOGLE_SITE_VERIFICATION production --force 2>/dev/null \
  || printf '%s' "$CODE" | vercel env add VITE_GOOGLE_SITE_VERIFICATION production

echo "==> 本番デプロイ..."
vercel deploy --prod --yes

echo ""
echo "✅ デプロイ完了"
echo ""
echo "次: Search Console で「確認」をクリック"
echo "その後: サイトマップに https://mensesthe-rank.jp/sitemap.xml を送信"
