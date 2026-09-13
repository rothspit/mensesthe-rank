#!/usr/bin/env node
/**
 * 優先ハブ向けエリア SEO クラスター下書きを生成
 *
 *   node scripts/seo/generate-area-clusters.js --dry-run
 *   node scripts/seo/generate-area-clusters.js --execute --limit 5
 *
 * 出力: content/seo/cluster-drafts/{areaSlug}.json
 * 公開: merge-area-clusters.js を人手で実行（自動マージしない）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadLocalEnv } from './lib/load-env.js';
import {
  SEO_PRIORITY_HUBS,
  buildHubIntentQuery,
  getIntentByKey,
} from '../../src/constants/seoPriorityHubs.js';
import { getAreaSeoCluster } from '../../src/constants/areaSeoCluster.js';
import { getGuideSlugs, getIndexableAreaGuideSlugs } from '../../src/constants/articles.js';

loadLocalEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'content', 'seo', 'cluster-drafts');
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL
  || process.env.API_URL
  || 'https://api.mensesthe-rank.jp'
).replace(/\/$/, '');

function parseArgs(argv) {
  const args = { execute: false, limit: 5, force: false, slug: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--execute') args.execute = true;
    else if (argv[i] === '--dry-run') args.execute = false;
    else if (argv[i] === '--force') args.force = true;
    else if (argv[i] === '--limit') args.limit = Number(argv[++i]) || 5;
    else if (argv[i] === '--slug') args.slug = argv[++i];
  }
  return args;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json();
}

async function loadHubContext(hub) {
  let shops = [];
  try {
    shops = await fetchJson(
      `${API_BASE}/api/shops?area_slugs=${encodeURIComponent(hub.areaSlug)}&tab=ranking&limit=30&with_today=1`,
    );
  } catch {
    shops = [];
  }
  if (!Array.isArray(shops)) shops = shops?.data || [];

  const registered = shops.filter((s) => s.data_status === 'registered' || s.data_status === 'verified');
  const guideSlugs = new Set([
    ...getGuideSlugs(),
    ...getIndexableAreaGuideSlugs().map((s) => `area/${s}`),
  ]);

  const guides = [];
  const areaGuide = getIndexableAreaGuideSlugs().includes(hub.areaSlug);
  if (areaGuide) {
    guides.push({ href: `/guide/area/${hub.areaSlug}`, label: `${hub.name}の選び方` });
  }
  for (const intentKey of hub.intents || ['osusume']) {
    const intent = getIntentByKey(intentKey);
    if (!intent) continue;
    const query = buildHubIntentQuery(hub, intentKey);
    // 既存ガイドとの機械マッチは弱くてよい。候補リンクとして一覧へ
    guides.push({
      href: `/areas/${hub.areaSlug}`,
      label: `${hub.name}の店舗一覧`,
      query,
      intent: intentKey,
    });
  }
  // 重複 href を整理
  const seen = new Set();
  const uniqueGuides = [];
  for (const g of guides) {
    if (seen.has(g.href)) continue;
    seen.add(g.href);
    uniqueGuides.push(g);
  }

  return {
    shopCount: shops.length,
    registeredCount: registered.length,
    officialLinks: registered.slice(0, 4).map((shop) => ({
      href: `/areas/${shop.area_slug || hub.areaSlug}/shops/${shop.slug}`,
      label: `掲載店舗：${shop.name}`,
    })),
    guides: uniqueGuides.slice(0, 6),
    neighbors: hub.neighbors || [],
    existingGuideSlugs: [...guideSlugs],
  };
}

function templateCluster(hub, ctx) {
  const neighborText = (hub.neighbors || [])
    .slice(0, 2)
    .map((n) => n.name)
    .join('・');

  return {
    areaSlug: hub.areaSlug,
    h2: `${hub.name}でメンズエステを探すとき`,
    paragraphs: [
      `${hub.name}はメンズエステの候補が集まりやすいエリアです。今夜寄るなら、まずこのページの店舗一覧で出勤とアクセスを確認するのが早いです。${neighborText ? `近隣の${neighborText}も総武・私鉄・地下鉄の乗り継ぎで候補に入りやすいです。` : ''}`,
      `掲載は${ctx.shopCount}件前後（うち掲載申込店 ${ctx.registeredCount}件）。料金や初めての方向けの読み方は下のガイドへ分け、店名の確認はこの一覧を正本にしています。`,
    ],
    officialHeading: '掲載店舗',
    officialLinks: ctx.officialLinks,
    officialNote: ctx.officialLinks.length
      ? '掲載店舗は申込ベースです。出勤・予約は各店ページで確認してください。'
      : 'このエリアの掲載申込店は準備中です。一覧の店舗詳細から公式情報を確認してください。',
    guides: ctx.guides.map(({ href, label }) => ({ href, label })),
    faqs: [
      {
        q: `${hub.name}と近隣エリア、どちらを見ればいい？`,
        a: neighborText
          ? `今夜の到着駅が決まっているなら、その駅の一覧を優先してください。迷うときは${hub.name}の一覧から出勤がある店を見て、必要なら${neighborText}も比較してください。`
          : `${hub.name}の一覧で出勤とアクセスを確認するのが先です。候補が少ないときだけ近隣エリアへ広げてください。`,
      },
      {
        q: '初めてでも使いやすい見方は？',
        a: '店舗一覧で本日出勤がある店から絞り、各店舗ページのアクセス欄で徒歩分数を確認するのが失敗しにくいです。',
      },
      {
        q: '料金はどこで確認する？',
        a: 'コース料金は店ごとに違うため、各店舗ページと公式サイトを優先してください。エリア全体の相場感は料金ガイドがある場合のみ下のリンクから。',
      },
    ],
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'template',
      shopCount: ctx.shopCount,
      registeredCount: ctx.registeredCount,
    },
  };
}

async function llmEnrich(hub, draft) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!anthropicKey && !openaiKey) return draft;

  const prompt = `mensesthe-rank.jp のエリアSEOクラスター用に、次のJSONの h2 / paragraphs / faqs だけを改善したJSONを返してください。
ルール:
- テンプレ感のあるコピペ禁止。${hub.name}固有の交通・利用シーンに触れる
- 誇大表現・No.1断定・違法誘導禁止
- paragraphs は2文程度×2本
- faqs は3件
- officialLinks / guides は入力のまま維持
- JSONのみ返す

入力:
${JSON.stringify(draft, null, 2)}`;

  try {
    let text = null;
    if (anthropicKey) {
      const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}`);
      const data = await res.json();
      text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const data = await res.json();
      text = data.choices?.[0]?.message?.content || '';
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return draft;
    const parsed = JSON.parse(match[0]);
    return {
      ...draft,
      h2: parsed.h2 || draft.h2,
      paragraphs: parsed.paragraphs || draft.paragraphs,
      faqs: parsed.faqs || draft.faqs,
      meta: { ...draft.meta, source: 'llm' },
    };
  } catch (err) {
    console.warn(`LLM enrich skipped for ${hub.areaSlug}: ${err.message}`);
    return draft;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const hubs = SEO_PRIORITY_HUBS.filter((hub) => {
    if (args.slug) return hub.areaSlug === args.slug;
    if (args.force) return true;
    return !getAreaSeoCluster(hub.areaSlug);
  }).slice(0, args.limit);

  if (!hubs.length) {
    console.log('生成対象なし（既存クラスター済み、または --slug 不一致）');
    return;
  }

  console.log(`対象 ${hubs.length} 件 / execute=${args.execute}`);

  for (const hub of hubs) {
    const ctx = await loadHubContext(hub);
    let draft = templateCluster(hub, ctx);
    if (args.execute) {
      draft = await llmEnrich(hub, draft);
      const outPath = path.join(OUT_DIR, `${hub.areaSlug}.json`);
      fs.writeFileSync(outPath, `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
      console.log(`✅ ${hub.areaSlug} → ${path.relative(ROOT, outPath)}`);
    } else {
      console.log(`[dry-run] ${hub.areaSlug} shops=${ctx.shopCount} registered=${ctx.registeredCount}`);
    }
  }

  if (args.execute) {
    console.log('\n次: 内容確認後に `node scripts/seo/merge-area-clusters.js --apply`');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
