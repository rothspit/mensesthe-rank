#!/usr/bin/env bash
# R2 接続テスト（Laravel .env に R2_* が設定済みであること）
#
#   bash scripts/cloudflare/test-r2.sh
#
# または VPS 上:
#   cd /var/www/mensesthe-rank/api && php artisan tinker --execute="..."

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOST="${VPS_HOST:-210.131.222.152}"
KEY="${VPS_KEY:-$HOME/WIFEHP.pem}"
USER="${VPS_USER:-root}"
APP_DIR="/var/www/mensesthe-rank/api"
SSH_OPTS=(-i "$KEY" -o StrictHostKeyChecking=accept-new)

echo "==> R2 設定確認（VPS）..."
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/mensesthe-rank/api

missing=0
for key in R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET R2_ENDPOINT R2_PUBLIC_URL; do
  if ! grep -q "^${key}=." .env 2>/dev/null; then
    echo "❌ .env に ${key} がありません"
    missing=1
  fi
done
if [ "$missing" -eq 1 ]; then
  echo ""
  echo "ダッシュボードで R2 API Token を発行し、.env に追記してください。"
  echo "参考: scripts/cloudflare/r2.env.example"
  exit 1
fi

php artisan tinker --execute="
use Illuminate\Support\Facades\Storage;
\$key = 'healthcheck/laravel-' . date('YmdHis') . '.txt';
Storage::disk('r2')->put(\$key, 'laravel r2 ok');
\$url = rtrim(env('R2_PUBLIC_URL'), '/') . '/' . \$key;
echo \"uploaded: {\$key}\n\";
echo \"public: {\$url}\n\";
"

echo "✅ R2 書き込み OK"
REMOTE
