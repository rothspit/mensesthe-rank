#!/usr/bin/env bash
# R2 認証情報を VPS に設定して接続テスト
#
# ダッシュボードでトークン発行後:
#   R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=yyy bash scripts/cloudflare/configure-r2-on-vps.sh
#
# または対話式:
#   bash scripts/cloudflare/configure-r2-on-vps.sh

set -euo pipefail

HOST="${VPS_HOST:-210.131.222.152}"
KEY="${VPS_KEY:-$HOME/WIFEHP.pem}"
USER="${VPS_USER:-root}"
APP_DIR="/var/www/mensesthe-rank/api"
ACCOUNT_ID="${R2_ACCOUNT_ID:-6f95d4743ef87bea0b2e5142cf2a9738}"
BUCKET="${R2_BUCKET:-mensesthe-rank-images}"
PUBLIC_URL="${R2_PUBLIC_URL:-https://pub-01e7da522ecd401f80dde51d5ed725ee.r2.dev}"

if [ -z "${R2_ACCESS_KEY_ID:-}" ]; then
  read -r -p "R2 Access Key ID: " R2_ACCESS_KEY_ID
fi
if [ -z "${R2_SECRET_ACCESS_KEY:-}" ]; then
  read -r -s -p "R2 Secret Access Key: " R2_SECRET_ACCESS_KEY
  echo ""
fi

if [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ]; then
  echo "❌ R2 認証情報が空です"
  echo ""
  echo "Cloudflare ダッシュボード → R2 → Manage R2 API Tokens"
  echo "  権限: Object Read & Write / バケット: ${BUCKET}"
  exit 1
fi

echo "==> VPS .env を更新..."
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" bash -s <<REMOTE
set -euo pipefail
ENV="${APP_DIR}/.env"
touch "\$ENV"

upsert_env() {
  local key="\$1"
  local val="\$2"
  if grep -q "^\${key}=" "\$ENV"; then
    sed -i "s|^\${key}=.*|\${key}=\${val}|" "\$ENV"
  else
    echo "\${key}=\${val}" >> "\$ENV"
  fi
}

upsert_env R2_ACCESS_KEY_ID "${R2_ACCESS_KEY_ID}"
upsert_env R2_SECRET_ACCESS_KEY "${R2_SECRET_ACCESS_KEY}"
upsert_env R2_BUCKET "${BUCKET}"
upsert_env R2_ENDPOINT "https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
upsert_env R2_PUBLIC_URL "${PUBLIC_URL}"
upsert_env FILESYSTEM_DISK r2

cd "${APP_DIR}"
php artisan config:clear
REMOTE

echo "==> R2 書き込みテスト..."
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/mensesthe-rank/api
php artisan tinker --execute="
use Illuminate\Support\Facades\Storage;
\$key = 'healthcheck/laravel-' . date('YmdHis') . '.txt';
Storage::disk('r2')->put(\$key, 'laravel r2 ok');
\$url = rtrim(env('R2_PUBLIC_URL'), '/') . '/' . \$key;
echo \"uploaded: {\$key}\n\";
echo \"public: {\$url}\n\";
"
REMOTE

echo "✅ R2 設定完了"
