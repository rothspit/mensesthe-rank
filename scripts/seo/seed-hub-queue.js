#!/usr/bin/env node
/**
 * 優先ハブ × 意図を content/seo/queue.json にシード
 *
 *   node scripts/seo/seed-hub-queue.js
 *   node scripts/seo/seed-hub-queue.js --force-pending
 *
 * 既存 done / pending の同一 query はスキップ（--force-pending で pending 再投入しない）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listHubGuideQueries } from '../../src/constants/seoPriorityHubs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const QUEUE_PATH = path.join(ROOT, 'content', 'seo', 'queue.json');

function parseArgs(argv) {
  const args = { forcePending: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--force-pending') args.forcePending = true;
  }
  return args;
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) {
    return { version: 1, dailyLimit: 3, notes: '', items: [] };
  }
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
}

function main() {
  const args = parseArgs(process.argv);
  const queue = loadQueue();
  const existing = new Map((queue.items || []).map((item) => [item.query, item]));
  const candidates = listHubGuideQueries();

  let added = 0;
  let skipped = 0;

  for (const item of candidates) {
    const prev = existing.get(item.query);
    if (prev) {
      if (prev.status === 'done' || (prev.status === 'pending' && !args.forcePending)) {
        skipped += 1;
        continue;
      }
    }
    existing.set(item.query, {
      query: item.query,
      status: 'pending',
      areaSlug: item.areaSlug,
      intent: item.intent,
      region: item.region,
      source: 'priority-hub',
      seededAt: new Date().toISOString(),
    });
    added += 1;
  }

  // 順序: 既存 done を先に残し、pending を後ろに（daily は pending 先頭から拾う）
  const items = [...existing.values()].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'done' ? -1 : 1;
  });

  // pending を priority-hub 優先で前へ
  const done = items.filter((i) => i.status === 'done');
  const pendingHub = items.filter((i) => i.status === 'pending' && i.source === 'priority-hub');
  const pendingOther = items.filter((i) => i.status === 'pending' && i.source !== 'priority-hub');

  const next = {
    ...queue,
    version: 1,
    dailyLimit: queue.dailyLimit || 3,
    notes:
      queue.notes
      || 'priority hubs × 意図を seed-hub-queue で投入。GSC機会があれば daily はそちら優先。done は再生成しない。',
    focus: 'priority-hubs',
    items: [...done, ...pendingHub, ...pendingOther],
  };

  fs.writeFileSync(QUEUE_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`✅ queue updated: added=${added} skipped=${skipped} pending=${pendingHub.length + pendingOther.length}`);
  console.log(path.relative(ROOT, QUEUE_PATH));
}

main();
