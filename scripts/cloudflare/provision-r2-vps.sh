#!/usr/bin/env bash
# R2 認証情報を VPS の Laravel .env に反映し、接続テストする
#
# 事前: Cloudflare ダッシュボードで R2 API トークンを発行
#   https://dash.cloudflare.com/ → R2 → Manage R2 API Tokens
#   権限: Object Read & Write / バケット: mensesthe-rank-images
#
# 使い方:
#   1) scripts/cloudflare/r2-credentials.local にキーを保存（example 参照）
#   2) bash scripts/cloudflare/provision-r2-vps.sh
#
# または環境変数で直接:
#   R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... bash scripts/cloudflare/provision-r2-vps.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOST="${VPS_HOST:-210.131.222.152}"
KEY="${VPS_KEY:-$HOME/WIFEHP.pem}"
USER="${VPS_USER:-root}"
APP_DIR="/var/www/mensesthe-rank/api"
SSH_OPTS=(-i "$KEY" -o StrictHostKeyChecking=accept-new)
CREDS_FILE="${ROOT}/scripts/cloudflare/r2-credentials.local"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-6f95d4743ef87bea0b2e5142cf2a9738}"
BUCKET="${R2_BUCKET:-mensesthe-rank-images}"
PUBLIC_URL="${R2_PUBLIC_URL:-https://pub-01e7da522ecd401f80dde51d5ed725ee.r2.dev}"

if [[ -f "${CREDS_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${CREDS_FILE}"
fi

if [[ -z "${R2_ACCESS_KEY_ID:-}" || -z "${R2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "❌ R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY が未設定です"
  echo ""
  echo "Cloudflare ダッシュボードを開きます:"
  echo "  R2 → Manage R2 API Tokens → Create API Token"
  echo "  権限: Object Read & Write / バケット: ${BUCKET}"
  echo ""
  open "https://dash.cloudflare.com/${ACCOUNT_ID}/r2/overview" 2>/dev/null || true
  echo "発行後、以下に保存して再実行してください:"
  echo "  cp scripts/cloudflare/r2-credentials.local.example scripts/cloudflare/r2-credentials.local"
  exit 1
fi

echo "==> VPS .env に R2 設定を反映..."
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" bash -s <<REMOTE
set -euo pipefail
ENV_FILE="${APP_DIR}/.env"
touch "\${ENV_FILE}"

set_env() {
  local key="\$1"
  local value="\$2"
  if grep -q "^\${key}=" "\${ENV_FILE}"; then
    sed -i "s|^\${key}=.*|\${key}=\${value}|" "\${ENV_FILE}"
  else
    echo "\${key}=\${value}" >> "\${ENV_FILE}"
  fi
}

set_env R2_ACCESS_KEY_ID "${R2_ACCESS_KEY_ID}"
set_env R2_SECRET_ACCESS_KEY "${R2_SECRET_ACCESS_KEY}"
set_env R2_BUCKET "${BUCKET}"
set_env R2_ENDPOINT "https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
set_env R2_PUBLIC_URL "${PUBLIC_URL}"
set_env FILESYSTEM_DISK "r2"

cd "${APP_DIR}"
php artisan config:clear
REMOTE

echo "==> R2 書き込みテスト..."
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/mensesthe-rank/api
php artisan tinker --execute="
use Illuminate\Support\Facades\Storage;
\$key = 'healthcheck/laravel-' . date('YmdHis') . '.txt';
Storage::disk('r2')->put(\$key, 'laravel r2 ok');
echo 'uploaded: ' . \$key . PHP_EOL;
echo 'public: ' . rtrim(env('R2_PUBLIC_URL'), '/') . '/' . \$key . PHP_EOL;
"
REMOTE

echo "✅ R2 接続完了"
