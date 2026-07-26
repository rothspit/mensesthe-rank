#!/usr/bin/env bash
# 本番運用の残りセットアップを一括実行
#
# 1. scripts/setup.production.local.example をコピー
#      cp scripts/setup.production.local.example scripts/setup.production.local
# 2. GITHUB_TOKEN / R2 キーを記入
# 3. bash scripts/setup-production.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL="${ROOT}/scripts/setup.production.local"

if [ -f "$LOCAL" ]; then
  # shellcheck disable=SC1090
  source "$LOCAL"
fi

echo "==> 本番セットアップ"
echo ""

# GitHub ADMIN_TOKEN
if [ -n "${GITHUB_TOKEN:-}" ]; then
  bash "${ROOT}/scripts/github/set-admin-token-secret.sh"
else
  echo "⏭  GitHub: GITHUB_TOKEN 未設定 → スキップ"
  echo "   手動: GitHub → rothspit/mensesthe-rank → Settings → Secrets → ADMIN_TOKEN"
  echo "   値: ${ADMIN_TOKEN:-（VPS app_config.admin_token）}"
fi

echo ""

# R2
if [ -n "${R2_ACCESS_KEY_ID:-}" ] && [ -n "${R2_SECRET_ACCESS_KEY:-}" ]; then
  bash "${ROOT}/scripts/cloudflare/configure-r2-on-vps.sh"
else
  echo "⏭  R2: 認証情報未設定 → スキップ"
  echo "   Cloudflare → R2 → Manage R2 API Tokens"
  echo "   権限: Object Read & Write / バケット: mensesthe-rank-images"
  echo "   設定: R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... bash scripts/cloudflare/configure-r2-on-vps.sh"
fi

echo ""
echo "==> 完了"
