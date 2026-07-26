#!/usr/bin/env bash
# Cloudflare R2 バケット初期セットアップ
#
# 事前準備:
#   1. Cloudflare ダッシュボードで mensesthe-rank.jp が管理されていること
#   2. ターミナルで一度ログイン:
#        npx wrangler login
#
# 実行:
#   bash scripts/cloudflare/setup-r2.sh
#
# 作成後（ダッシュボードで手動）:
#   R2 → バケット → mensesthe-rank-images → Settings → Custom Domains
#   → images.mensesthe-rank.jp を追加
#
# API トークン（Laravel 用）:
#   Cloudflare Dashboard → My Profile → API Tokens
#   → Create Token → "Edit Cloudflare R2" テンプレート
#   → バケット mensesthe-rank-images のみ許可
#   → .env に R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY を設定

set -euo pipefail

BUCKET_NAME="${R2_BUCKET_NAME:-mensesthe-rank-images}"

echo "==> Cloudflare 認証確認..."
if ! npx wrangler whoami 2>/dev/null | grep -q "You are logged in"; then
  echo ""
  echo "未ログインです。先に実行してください:"
  echo "  npx wrangler login"
  echo ""
  exit 1
fi

echo "==> バケット作成: ${BUCKET_NAME}"
if npx wrangler r2 bucket create "${BUCKET_NAME}" 2>&1; then
  echo "✅ バケットを作成しました"
else
  echo "（既に存在する場合はスキップして続行）"
fi

echo ""
echo "==> バケット一覧"
npx wrangler r2 bucket list

echo ""
echo "==> 公開 URL（暫定 r2.dev）"
if npx wrangler r2 bucket dev-url get "${BUCKET_NAME}" 2>/dev/null | grep -q 'https://'; then
  npx wrangler r2 bucket dev-url get "${BUCKET_NAME}" 2>/dev/null | grep 'https://' || true
else
  echo "  npx wrangler r2 bucket dev-url enable ${BUCKET_NAME} -y"
fi

echo ""
echo "==> 次の手順"
echo ""
echo "【A】R2 API トークン（Laravel 書き込み用・必須）"
echo "  ダッシュボード → R2 → Manage R2 API Tokens → Create API Token"
echo "  権限: Object Read & Write / バケット: ${BUCKET_NAME} のみ"
echo ""
echo "【B】カスタムドメイン images.mensesthe-rank.jp"
echo "  bash scripts/cloudflare/setup-images-domain.sh"
echo "  ※ mensesthe-rank.jp の DNS は xdomain（NS: xdomain.ne.jp）のため、"
echo "    先に Cloudflare ゾーン追加 + NS 切替が必要（スクリプト内に手順あり）"
echo ""
echo "【C】VPS .env に設定:"
echo ""
cat <<'ENV'
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=mensesthe-rank-images
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://images.mensesthe-rank.jp
FILESYSTEM_DISK=r2
ENV
