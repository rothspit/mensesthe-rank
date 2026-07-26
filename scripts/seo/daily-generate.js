#!/usr/bin/env node
/**
 * 毎日 N 本（既定3）の記事下書き + PNGサムネを生成
 *
 * 優先順位:
 * 1. 最新 GSC 機会（問い合わせ意図）
 * 2. content/seo/queue.json の pending
 *
 *   node scripts/seo/daily-generate.js
 *   node scripts/seo/daily-generate.js --execute --limit 3
 *
 * 自動公開しない。X への自動投稿もしない。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createArticleDraft,
  nextArticleNumber,
} from './lib/article-draft.js';
import { isoDate } from './lib/gsc.js';
import { loadLocalEnv } from './lib/load-env.js';

loadLocalEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const QUEUE_PATH = path.join(ROOT, 'content', 'seo', 'queue.json');
const OPP_DIR = path.join(ROOT, 'content', 'seo', 'opportunities');
const PROPOSAL_DIR = path.join(ROOT, 'content', 'seo', 'proposals');

function parseArgs(argv) {
  const args = { execute: false, limit: 3, force: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--execute') args.execute = true;
    else if (argv[i] === '--dry-run') args.execute = false;
    else if (argv[i] === '--limit') args.limit = Number(argv[++i]) || 3;
    else if (argv[i] === '--force') args.force = true;
  }
  return args;
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) {
    return { version: 1, dailyLimit: 3, items: [] };
  }
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
}

function latestOpportunityCandidates(limit) {
  if (!fs.existsSync(OPP_DIR)) return [];
  const files = fs.readdirSync(OPP_DIR).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) return [];
  const payload = JSON.parse(fs.readFileSync(path.join(OPP_DIR, files[files.length - 1]), 'utf8'));
  return (payload.opportunities || [])
    .filter((o) => !o.alreadyCovered && o.priority !== 'low')
    .slice(0, limit)
    .map((o) => ({ query: o.query, opp: o, source: 'gsc-rising' }));
}

async function main() {
  const args = parseArgs(process.argv);
  const queue = loadQueue();
  const limit = args.limit || queue.dailyLimit || 3;

  const fromGsc = latestOpportunityCandidates(limit);
  const needed = Math.max(0, limit - fromGsc.length);
  const fromQueue = (queue.items || [])
    .filter((item) => item.status === 'pending')
    .slice(0, needed)
    .map((item) => ({ query: item.query, opp: null, source: 'daily-queue', queueItem: item }));

  const batch = [...fromGsc, ...fromQueue].slice(0, limit);

  if (!batch.length) {
    console.error('生成候補がありません。queue.json に pending を足すか、seo:find-rising を実行してください。');
    process.exit(1);
  }

  console.log(`📅 日次生成: ${batch.length} 本予定（execute=${args.execute}）`);
  console.log('⚠️  自動公開なし / X自動投稿なし / 最終ファクトチェックは手動');

  let articleNumber = nextArticleNumber();
  const created = [];

  for (const item of batch) {
    const result = await createArticleDraft({
      query: item.query,
      opp: item.opp,
      articleNumber,
      execute: args.execute,
      source: item.source,
      force: args.force,
    });

    if (result.skipped) {
      console.log(`⏭  ${item.query} (${result.reason}${result.existing ? `: ${result.existing}` : ''})`);
      if (item.queueItem && args.execute && result.reason === 'exists') {
        item.queueItem.status = 'done';
        item.queueItem.doneAt = new Date().toISOString();
        item.queueItem.note = `already exists: ${result.existing}`;
      }
      continue;
    }

    console.log(
      `${args.execute ? '📝' : '🔎'} ${result.file} ← ${result.query} (${result.usedLlm ? 'LLM' : 'template'}${result.thumbPublicPath ? ` / ${result.thumbPublicPath}` : ''})`,
    );

    if (args.execute) {
      created.push(result);
      articleNumber += 1;
      if (item.queueItem) {
        item.queueItem.status = 'done';
        item.queueItem.doneAt = new Date().toISOString();
        item.queueItem.file = result.file;
        item.queueItem.thumb = result.thumbPublicPath;
      }
    }
  }

  if (args.execute) {
    saveQueue(queue);
    fs.mkdirSync(PROPOSAL_DIR, { recursive: true });
    const proposalPath = path.join(PROPOSAL_DIR, `${isoDate()}-daily.md`);
    const lines = [
      `# 日次下書き提案（${isoDate()}）`,
      '',
      `- 件数: ${created.length}`,
      '- 公開前に必ず人手でファクトチェック',
      '- **X（旧Twitter）には投稿しない**（凍結リスク）',
      '- サムネは PNG（`public/images/articles/`）',
      '',
      '| ファイル | クエリ | サムネ | 公開ヒント |',
      '|----------|--------|--------|------------|',
      ...created.map(
        (c) =>
          `| \`${c.file}\` | ${c.query} | ${c.thumbPublicPath || '-'} | ${c.publishHint} |`,
      ),
      '',
    ];
    fs.writeFileSync(proposalPath, `${lines.join('\n')}\n`, 'utf8');
    console.log(`✅ ${created.length} 件 / ${path.relative(ROOT, proposalPath)}`);
  } else {
    console.log('dry-run です。書き込む場合は --execute');
  }
}

main().catch((err) => {
  console.error('❌', err.message || err);
  process.exit(1);
});
