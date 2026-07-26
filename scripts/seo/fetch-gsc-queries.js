#!/usr/bin/env node
/**
 * GSC クエリスナップショットを保存
 *
 * CSV:
 *   node scripts/seo/fetch-gsc-queries.js --csv path/to/export.csv
 *
 * API（googleapis + サービスアカウント）:
 *   node scripts/seo/fetch-gsc-queries.js --api --days 28
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  daysAgo,
  fetchGscSearchAnalytics,
  isoDate,
  loadGscCsvFile,
} from './lib/gsc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const SNAPSHOT_DIR = path.join(ROOT, 'content', 'seo', 'snapshots');

function parseArgs(argv) {
  const args = { csv: null, api: false, days: 28, label: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--csv') args.csv = argv[++i];
    else if (argv[i] === '--api') args.api = true;
    else if (argv[i] === '--days') args.days = Number(argv[++i]);
    else if (argv[i] === '--label') args.label = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  let rows;
  let meta = { source: null, startDate: null, endDate: null };

  if (args.csv) {
    const parsed = loadGscCsvFile(args.csv);
    rows = parsed.rows;
    meta = {
      source: 'csv',
      kind: parsed.kind,
      startDate: null,
      endDate: null,
      csvPath: path.resolve(args.csv),
    };
  } else if (args.api) {
    const endDate = daysAgo(3); // GSC は数日遅延
    const startDate = daysAgo(3 + args.days);
    rows = await fetchGscSearchAnalytics({ startDate, endDate, rowLimit: 2500 });
    meta = { source: 'api', kind: 'query', startDate, endDate, days: args.days };
  } else {
    console.error(`使い方:
  node scripts/seo/fetch-gsc-queries.js --csv exports/Performance-on-Search.csv
  node scripts/seo/fetch-gsc-queries.js --api --days 28`);
    process.exit(1);
  }

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const label = args.label || isoDate();
  const outPath = path.join(SNAPSHOT_DIR, `${label}.json`);

  const payload = {
    fetchedAt: new Date().toISOString(),
    ...meta,
    rowCount: rows.length,
    rows: rows.sort((a, b) => b.impressions - a.impressions),
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `✅ 保存: ${path.relative(ROOT, outPath)} (${rows.length} ${meta.kind === 'page' ? 'ページ' : 'クエリ'})`,
  );
}

main().catch((err) => {
  console.error('❌', err.message || err);
  process.exit(1);
});
