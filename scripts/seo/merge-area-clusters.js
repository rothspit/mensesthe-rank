#!/usr/bin/env node
/**
 * content/seo/cluster-drafts/*.json を areaSeoCluster.js へマージする（人手実行）
 *
 *   node scripts/seo/merge-area-clusters.js            # dry-run
 *   node scripts/seo/merge-area-clusters.js --apply     # 書き込み
 *   node scripts/seo/merge-area-clusters.js --apply --slug shinjuku
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const DRAFT_DIR = path.join(ROOT, 'content', 'seo', 'cluster-drafts');
const TARGET = path.join(ROOT, 'src', 'constants', 'areaSeoCluster.js');

function parseArgs(argv) {
  const args = { apply: false, slug: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--apply') args.apply = true;
    else if (argv[i] === '--slug') args.slug = argv[++i];
  }
  return args;
}

function loadDrafts(slugFilter) {
  if (!fs.existsSync(DRAFT_DIR)) return [];
  return fs
    .readdirSync(DRAFT_DIR)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => f !== '.gitkeep')
    .filter((f) => !slugFilter || f === `${slugFilter}.json`)
    .map((f) => JSON.parse(fs.readFileSync(path.join(DRAFT_DIR, f), 'utf8')));
}

function jsKey(key) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : JSON.stringify(key);
}

function toJsValue(value, indent = 2) {
  const pad = ' '.repeat(indent);
  const padIn = ' '.repeat(indent + 2);
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const body = value.map((item) => `${padIn}${toJsValue(item, indent + 2)}`).join(',\n');
    return `[\n${body},\n${pad}]`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) return '{}';
    const body = keys
      .map((k) => `${padIn}${jsKey(k)}: ${toJsValue(value[k], indent + 2)}`)
      .join(',\n');
    return `{\n${body},\n${pad}}`;
  }
  return 'null';
}

function buildEntry(draft) {
  const clean = {
    h2: draft.h2,
    paragraphs: draft.paragraphs,
    officialHeading: draft.officialHeading || '掲載店舗',
    officialLinks: draft.officialLinks || [],
    officialNote: draft.officialNote || '',
    guides: draft.guides || [],
    faqs: draft.faqs || [],
  };
  return `  ${jsKey(draft.areaSlug)}: ${toJsValue(clean, 2)},\n`;
}

function removeExistingEntry(source, key) {
  const patterns = [
    new RegExp(`  ${jsKey(key)}: \\{[\\s\\S]*?\\n  \\},\\n`),
    new RegExp(`  ${JSON.stringify(key)}: \\{[\\s\\S]*?\\n  \\},\\n`),
  ];
  for (const re of patterns) {
    if (re.test(source)) return source.replace(re, '');
  }
  return source;
}

function main() {
  const args = parseArgs(process.argv);
  const drafts = loadDrafts(args.slug);
  if (!drafts.length) {
    console.log('マージ対象の下書きがありません');
    return;
  }

  let source = fs.readFileSync(TARGET, 'utf8');
  const startMarker = 'export const AREA_SEO_CLUSTER = {';
  const startIdx = source.indexOf(startMarker);
  if (startIdx < 0) throw new Error('AREA_SEO_CLUSTER が見つかりません');

  const endIdx = source.indexOf('\n};', startIdx);
  if (endIdx < 0) throw new Error('AREA_SEO_CLUSTER 終端が見つかりません');

  for (const draft of drafts) {
    if (!draft.areaSlug) throw new Error('areaSlug のない下書きがあります');
    source = removeExistingEntry(source, draft.areaSlug);
    const insertAt = source.indexOf('\n};', source.indexOf(startMarker));
    source = `${source.slice(0, insertAt)}\n${buildEntry(draft)}${source.slice(insertAt)}`;
    console.log(`upsert: ${draft.areaSlug}`);
  }

  if (!args.apply) {
    console.log(`\n[dry-run] ${drafts.length} 件。書き込む場合は --apply`);
    return;
  }

  fs.writeFileSync(TARGET, source, 'utf8');
  console.log(`✅ wrote ${TARGET}`);
}

main();
