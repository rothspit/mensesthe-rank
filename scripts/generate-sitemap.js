/**
 * サイトマップ自動生成スクリプト
 * 
 * Supabaseから店舗データを取得し、public/sitemap.xml を生成
 * 
 * 使用方法:
 *   node scripts/generate-sitemap.js
 * 
 * 環境変数:
 *   VITE_SUPABASE_URL - Supabase プロジェクトURL
 *   VITE_SUPABASE_ANON_KEY - Supabase Anon Key
 *   BASE_URL - サイトのベースURL（省略時: https://esthe-now-8qe5.vercel.app）
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// __dirname の代替（ESモジュール用）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 設定
const CONFIG = {
  BASE_URL: process.env.BASE_URL || process.env.VITE_BASE_URL || 'https://esthe-now-8qe5.vercel.app',
  OUTPUT_DIR: 'public',
  OUTPUT_FILE: 'sitemap.xml',
};

// Supabaseクライアント初期化
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 日付をW3C Datetime形式 (YYYY-MM-DD) に変換
 */
function formatDate(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0];
  return new Date(dateString).toISOString().split('T')[0];
}

/**
 * XMLをエスケープ
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * サイトマップXMLを生成
 */
function generateSitemapXml(shops) {
  const today = formatDate();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- トップページ -->
  <url>
    <loc>${CONFIG.BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  // 店舗詳細ページ
  shops.forEach(shop => {
    const lastmod = formatDate(shop.updated_at || shop.created_at);

    xml += `
  <url>
    <loc>${CONFIG.BASE_URL}/shops/${escapeXml(shop.id)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += `
</urlset>
`;

  return xml;
}

/**
 * robots.txt を生成
 */
function generateRobotsTxt() {
  return `# robots.txt for ${CONFIG.BASE_URL}
User-agent: *
Allow: /

# Sitemap
Sitemap: ${CONFIG.BASE_URL}/sitemap.xml
`;
}

/**
 * メイン処理
 */
async function main() {
  console.log('');
  console.log('🗺️  サイトマップ生成');
  console.log('='.repeat(50));
  console.log(`📍 BASE_URL: ${CONFIG.BASE_URL}`);
  console.log(`📁 出力先: ${CONFIG.OUTPUT_DIR}/`);
  console.log('');

  // 店舗データを取得（is_active = true のみ）
  console.log('📋 Supabaseから店舗データを取得中...');
  
  const { data: shops, error: shopsError } = await supabase
    .from('shops')
    .select('id, updated_at, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (shopsError) {
    console.error('❌ 店舗データの取得に失敗:', shopsError.message);
    process.exit(1);
  }

  console.log(`✅ ${shops.length}件の店舗を取得`);
  console.log('');

  // 出力ディレクトリを確認・作成
  const outputDir = resolve(__dirname, '..', CONFIG.OUTPUT_DIR);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`📁 ディレクトリを作成: ${CONFIG.OUTPUT_DIR}/`);
  }

  // sitemap.xml を生成
  const sitemapXml = generateSitemapXml(shops);
  const sitemapPath = resolve(outputDir, CONFIG.OUTPUT_FILE);
  writeFileSync(sitemapPath, sitemapXml, 'utf-8');
  console.log(`✅ ${CONFIG.OUTPUT_DIR}/sitemap.xml を生成`);

  // robots.txt を生成
  const robotsTxt = generateRobotsTxt();
  const robotsPath = resolve(outputDir, 'robots.txt');
  writeFileSync(robotsPath, robotsTxt, 'utf-8');
  console.log(`✅ ${CONFIG.OUTPUT_DIR}/robots.txt を生成`);

  // 完了メッセージ
  console.log('');
  console.log('='.repeat(50));
  console.log(`📄 合計URL数: ${shops.length + 1}件`);
  console.log(`   └─ トップ: 1件 (priority: 1.0)`);
  console.log(`   └─ 店舗: ${shops.length}件 (priority: 0.8)`);
  console.log('');
  console.log('✨ サイトマップ生成完了!');
  console.log('');
}

// 実行
main().catch((error) => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
