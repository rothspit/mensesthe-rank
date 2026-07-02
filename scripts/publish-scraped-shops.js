/**
 * スクレイプ済み店舗を公開（data_status: scraped → registered）
 *
 * 使用方法:
 *   node scripts/publish-scraped-shops.js
 *   node scripts/publish-scraped-shops.js --dry-run
 *   node scripts/publish-scraped-shops.js --limit 100
 *
 * 環境変数:
 *   SUPABASE_URL - Supabase プロジェクトURL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase サービスロールキー
 */

import { createClient } from '@supabase/supabase-js';

const CONFIG = {
  BATCH_SIZE: 200,
  FETCH_PAGE_SIZE: 1000,
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArgIndex = args.indexOf('--limit');
const limit = limitArgIndex >= 0 ? Number(args[limitArgIndex + 1]) : null;

if (limit !== null && (!Number.isFinite(limit) || limit <= 0)) {
  console.error('❌ --limit には正の数値を指定してください');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function fetchScrapedShopIds() {
  const ids = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('shops')
      .select('id')
      .eq('is_active', true)
      .eq('data_status', 'scraped')
      .order('created_at', { ascending: true })
      .range(offset, offset + CONFIG.FETCH_PAGE_SIZE - 1);

    if (error) throw error;
    if (!data?.length) break;

    ids.push(...data.map((shop) => shop.id));

    if (limit && ids.length >= limit) {
      return ids.slice(0, limit);
    }

    if (data.length < CONFIG.FETCH_PAGE_SIZE) break;
    offset += CONFIG.FETCH_PAGE_SIZE;
  }

  return ids;
}

async function publishBatch(ids) {
  const { data, error } = await supabase
    .from('shops')
    .update({
      data_status: 'registered',
      updated_at: new Date().toISOString(),
    })
    .in('id', ids)
    .select('id');

  if (error) throw error;
  return data?.length || 0;
}

async function main() {
  console.log('');
  console.log('📤 スクレイプ済み店舗の公開');
  console.log('='.repeat(50));
  console.log(`モード: ${dryRun ? 'ドライラン（更新なし）' : '本番更新'}`);
  if (limit) console.log(`上限: ${limit} 件`);
  console.log('');

  const shopIds = await fetchScrapedShopIds();
  console.log(`📋 公開対象: ${shopIds.length} 件`);

  if (shopIds.length === 0) {
    console.log('✨ 公開対象の店舗はありません');
    return;
  }

  if (dryRun) {
    console.log('🔍 ドライランのため更新は行いません');
    console.log(`   先頭5件: ${shopIds.slice(0, 5).join(', ')}`);
    return;
  }

  const batches = chunk(shopIds, CONFIG.BATCH_SIZE);
  let published = 0;

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    const count = await publishBatch(batch);
    published += count;
    console.log(`✅ [${i + 1}/${batches.length}] ${count} 件を registered に更新`);
  }

  console.log('');
  console.log('='.repeat(50));
  console.log(`📊 合計公開: ${published} 件`);
  console.log('✨ 公開処理完了!');

  if (process.env.GITHUB_OUTPUT) {
    const fs = await import('fs');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `published_count=${published}\n`);
  }
}

main().catch((error) => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
