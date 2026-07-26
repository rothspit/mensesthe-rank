#!/usr/bin/env bash
# GitHub Actions に ADMIN_TOKEN シークレットを登録
#
# 事前準備:
#   1. GitHub Personal Access Token (repo 権限) を発行
#   2. export GITHUB_TOKEN=ghp_...
#
# 実行:
#   bash scripts/github/set-admin-token-secret.sh
#
# または ADMIN_TOKEN を直接指定:
#   ADMIN_TOKEN=xxx GITHUB_TOKEN=ghp_... bash scripts/github/set-admin-token-secret.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REPO="${GITHUB_REPO:-rothspit/mensesthe-rank}"
HOST="${VPS_HOST:-210.131.222.152}"
KEY="${VPS_KEY:-$HOME/WIFEHP.pem}"
USER="${VPS_USER:-root}"
GH="${GH_BIN:-$(command -v gh || true)}"

if [ -z "${ADMIN_TOKEN:-}" ]; then
  echo "==> VPS から admin_token を取得..."
  ADMIN_TOKEN=$(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" \
    "cd /var/www/mensesthe-rank/api && php artisan tinker --execute=\"echo DB::table('app_config')->where('key','admin_token')->value('value');\"" \
    | tr -d '\r\n')
fi

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ admin_token を取得できませんでした"
  exit 1
fi

echo "==> GitHub シークレット ADMIN_TOKEN を登録 (${REPO})..."

if [ -n "$GH" ] && "$GH" auth status >/dev/null 2>&1; then
  printf '%s' "$ADMIN_TOKEN" | "$GH" secret set ADMIN_TOKEN --repo "$REPO"
  echo "✅ ADMIN_TOKEN シークレットを登録しました（gh CLI）"
  echo ""
  echo "確認: https://github.com/${REPO}/settings/secrets/actions"
  exit 0
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "❌ GitHub 認証が必要です。どちらかを実行してください:"
  echo ""
  echo "【A】gh CLI（おすすめ）"
  echo "  brew install gh   # 未インストールの場合"
  echo "  gh auth login"
  echo "  bash scripts/github/set-admin-token-secret.sh"
  echo ""
  echo "【B】Personal Access Token"
  echo "  GitHub → Settings → Developer settings → Personal access tokens"
  echo "  → repo スコープ付きトークンを発行して:"
  echo "  export GITHUB_TOKEN=ghp_..."
  echo "  bash scripts/github/set-admin-token-secret.sh"
  exit 1
fi

node <<'NODE' "$REPO" "$ADMIN_TOKEN"
const crypto = require('crypto');
const https = require('https');

const [repo, secretValue] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'mensesthe-rank-setup',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function encryptSecret(publicKey, secretValue) {
  const key = Buffer.from(publicKey, 'base64');
  const message = Buffer.from(secretValue, 'utf8');
  const sealed = crypto.publicEncrypt(
    {
      key,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    message,
  );
  return Buffer.from(sealed).toString('base64');
}

(async () => {
  const keyRes = await request('GET', `/repos/${repo}/actions/secrets/public-key`);
  if (keyRes.status !== 200) {
    console.error('❌ public-key 取得失敗:', keyRes.status, keyRes.body);
    process.exit(1);
  }

  const { key_id: keyId, key: publicKey } = keyRes.body;
  const encrypted = encryptSecret(publicKey, secretValue);

  const putRes = await request('PUT', `/repos/${repo}/actions/secrets/ADMIN_TOKEN`, {
    encrypted_value: encrypted,
    key_id: keyId,
  });

  if (putRes.status !== 201 && putRes.status !== 204) {
    console.error('❌ シークレット登録失敗:', putRes.status, putRes.body);
    process.exit(1);
  }

  console.log('✅ ADMIN_TOKEN シークレットを登録しました');
})();
NODE

echo ""
echo "確認: GitHub → ${REPO} → Settings → Secrets and variables → Actions"
