#!/usr/bin/env bash
# R2 カスタムドメイン images.mensesthe-rank.jp を設定
#
# 前提: mensesthe-rank.jp が Cloudflare ゾーンとして追加済み（NS を Cloudflare に向ける）
#
# ゾーン追加後:
#   bash scripts/cloudflare/setup-images-domain.sh
#
# 環境変数（任意）:
#   CLOUDFLARE_ZONE_ID=...   # 未指定時は API で検索（要 CLOUDFLARE_API_TOKEN）
#   CLOUDFLARE_API_TOKEN=... # Zone:Read + R2:Edit
#   R2_BUCKET=mensesthe-rank-images
#   IMAGE_DOMAIN=images.mensesthe-rank.jp

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUCKET="${R2_BUCKET:-mensesthe-rank-images}"
DOMAIN="${IMAGE_DOMAIN:-images.mensesthe-rank.jp}"
ZONE_NAME="${ZONE_NAME:-mensesthe-rank.jp}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-6f95d4743ef87bea0b2e5142cf2a9738}"
HOST="${VPS_HOST:-210.131.222.152}"
KEY="${VPS_KEY:-$HOME/WIFEHP.pem}"
USER="${VPS_USER:-root}"
APP_DIR="/var/www/mensesthe-rank/api"
PUBLIC_URL="https://${DOMAIN}"

echo "==> Cloudflare 認証確認..."
if ! npx wrangler whoami 2>&1 | grep -qi "logged in"; then
  echo "❌ wrangler 未ログイン。先に: npx wrangler login"
  exit 1
fi

resolve_zone_id() {
  if [ -n "${CLOUDFLARE_ZONE_ID:-}" ]; then
    echo "$CLOUDFLARE_ZONE_ID"
    return
  fi

  if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    return 1
  fi

  curl -fsS "https://api.cloudflare.com/client/v4/zones?name=${ZONE_NAME}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else '')"
}

ZONE_ID="$(resolve_zone_id || true)"

if [ -z "$ZONE_ID" ]; then
  echo ""
  echo "❌ Cloudflare ゾーン '${ZONE_NAME}' が見つかりません"
  echo ""
  echo "【手順 A】Cloudflare にドメインを追加"
  echo "  1. https://dash.cloudflare.com → ウェブサイトを追加 → ${ZONE_NAME}"
  echo "  2. Free プランを選択"
  echo "  3. 表示された NS（例: xxx.ns.cloudflare.com）を xdomain で設定"
  echo "     現在の NS: ns1.xdomain.ne.jp / ns2.xdomain.ne.jp / ns3.xdomain.ne.jp"
  echo ""
  echo "【手順 B】Cloudflare DNS に既存レコードを移行（重要）"
  echo "  タイプ | 名前 | 値"
  echo "  A      | @    | 76.76.21.21          （Vercel フロント）"
  echo "  CNAME  | www  | cname.vercel-dns.com （Vercel）"
  echo "  A      | api  | 210.131.222.152      （Laravel API）"
  echo "  ※ xdomain の既存 MX/TXT も Cloudflare にコピーすること"
  echo ""
  echo "【手順 C】NS 切替後、再実行:"
  echo "  CLOUDFLARE_API_TOKEN=xxx bash scripts/cloudflare/setup-images-domain.sh"
  echo ""
  echo "  または ZONE_ID を直接指定:"
  echo "  CLOUDFLARE_ZONE_ID=xxx bash scripts/cloudflare/setup-images-domain.sh"
  exit 1
fi

echo "==> ゾーン ID: ${ZONE_ID}"

echo "==> 既存カスタムドメイン確認..."
if npx wrangler r2 bucket domain list "${BUCKET}" 2>/dev/null | grep -q "${DOMAIN}"; then
  echo "✅ ${DOMAIN} は既にバケット ${BUCKET} に接続済み"
else
  echo "==> カスタムドメイン接続: ${DOMAIN}"
  npx wrangler r2 bucket domain add "${BUCKET}" \
    --domain "${DOMAIN}" \
    --zone-id "${ZONE_ID}" \
    -y
fi

echo "==> VPS R2_PUBLIC_URL を更新..."
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" bash -s <<REMOTE
set -euo pipefail
ENV="${APP_DIR}/.env"
if grep -q '^R2_PUBLIC_URL=' "\$ENV"; then
  sed -i "s|^R2_PUBLIC_URL=.*|R2_PUBLIC_URL=${PUBLIC_URL}|" "\$ENV"
else
  echo "R2_PUBLIC_URL=${PUBLIC_URL}" >> "\$ENV"
fi
cd "${APP_DIR}"
php artisan config:clear
REMOTE

echo ""
echo "==> 動作確認（数分後に SSL 有効化）..."
echo "  curl -I ${PUBLIC_URL}/healthcheck/laravel-test.txt"
echo ""
echo "✅ 設定完了: ${PUBLIC_URL}"
