#!/usr/bin/env node
/**
 * 直近スナップショット同士を比較し、伸びているクエリを抽出
 *
 *   node scripts/seo/find-rising-keywords.js
 *   node scripts/seo/find-rising-keywords.js --current content/seo/snapshots/a.json --previous .../b.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  alreadyCovered,
  classifyQuery,
  loadExistingArticleQueries,
} from './lib/classify.js';
import { isoDate } from './lib/gsc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const SNAPSHOT_DIR = path.join(ROOT, 'content', 'seo', 'snapshots');
const OPP_DIR = path.join(ROOT, 'content', 'seo', 'opportunities');

function parseArgs(argv) {
  const args = {
    current: null,
    previous: null,
    minImpressions: 30,
    minGrowthRate: 0.3,
    minClicksGrowth: 2,
    limit: 30,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--current') args.current = argv[++i];
    else if (argv[i] === '--previous') args.previous = argv[++i];
    else if (argv[i] === '--min-impressions') args.minImpressions = Number(argv[++i]);
    else if (argv[i] === '--min-growth') args.minGrowthRate = Number(argv[++i]);
    else if (argv[i] === '--limit') args.limit = Number(argv[++i]);
  }
  return args;
}

function listSnapshots() {
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];
  return fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => path.join(SNAPSHOT_DIR, f));
}

function loadSnapshot(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function indexByQuery(rows) {
  const map = new Map();
  for (const row of rows || []) {
    if (row.query) map.set(row.query, row);
  }
  return map;
}

function scoreOpportunity(curr, prev, args) {
  const prevImpr = prev?.impressions || 0;
  const prevClicks = prev?.clicks || 0;
  const imprGrowth =
    prevImpr > 0 ? (curr.impressions - prevImpr) / prevImpr : curr.impressions > 0 ? 1 : 0;
  const clicksGrowth = curr.clicks - prevClicks;

  const positionOpportunity =
    curr.impressions >= args.minImpressions && curr.position >= 8 && curr.position <= 25;

  const rising =
    curr.impressions >= args.minImpressions &&
    (imprGrowth >= args.minGrowthRate || clicksGrowth >= args.minClicksGrowth);

  if (!rising && !positionOpportunity) return null;

  return {
    impressionsGrowthRate: Math.round(imprGrowth * 1000) / 1000,
    clicksDelta: clicksGrowth,
    positionOpportunity,
    rising,
    score:
      (rising ? 50 : 0) +
      (positionOpportunity ? 30 : 0) +
      Math.min(curr.impressions / 10, 40) +
      Math.min(Math.max(imprGrowth, 0) * 40, 40) +
      Math.min(Math.max(clicksGrowth, 0) * 5, 20),
  };
}

function main() {
  const args = parseArgs(process.argv);
  const files = listSnapshots();

  let currentPath = args.current;
  let previousPath = args.previous;

  if (!currentPath || !previousPath) {
    if (files.length < 2) {
      console.error(
        `スナップショットが2つ以上必要です。先に:
  node scripts/seo/fetch-gsc-queries.js --csv <前回.csv> --label previous
  node scripts/seo/fetch-gsc-queries.js --csv <今回.csv> --label current`,
      );
      process.exit(1);
    }
    previousPath = previousPath || files[files.length - 2];
    currentPath = currentPath || files[files.length - 1];
  }

  const current = loadSnapshot(currentPath);
  const previous = loadSnapshot(previousPath);
  const prevMap = indexByQuery(previous.rows);
  const existingTitles = loadExistingArticleQueries();

  const opportunities = [];

  for (const row of current.rows || []) {
    const metrics = scoreOpportunity(row, prevMap.get(row.query), args);
    if (!metrics) continue;

    const classified = classifyQuery(row.query);
    if (classified.type === 'skip') continue;

    const covered = alreadyCovered(row.query, existingTitles);
    opportunities.push({
      query: row.query,
      current: {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      },
      previous: prevMap.has(row.query)
        ? {
            clicks: prevMap.get(row.query).clicks,
            impressions: prevMap.get(row.query).impressions,
            position: prevMap.get(row.query).position,
          }
        : null,
      ...metrics,
      ...classified,
      alreadyCovered: covered,
      priority: covered
        ? 'low'
        : metrics.score + (classified.intent?.score || 0) >= 100
          ? 'high'
          : 'medium',
    });
  }

  opportunities.sort(
    (a, b) => b.score + (b.intent?.score || 0) - (a.score + (a.intent?.score || 0)),
  );
  const top = opportunities.slice(0, args.limit);

  fs.mkdirSync(OPP_DIR, { recursive: true });
  const outName = `${isoDate()}.json`;
  const outPath = path.join(OPP_DIR, outName);

  const payload = {
    generatedAt: new Date().toISOString(),
    currentSnapshot: path.relative(ROOT, currentPath),
    previousSnapshot: path.relative(ROOT, previousPath),
    criteria: {
      minImpressions: args.minImpressions,
      minGrowthRate: args.minGrowthRate,
      minClicksGrowth: args.minClicksGrowth,
    },
    count: top.length,
    opportunities: top,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const mdPath = path.join(OPP_DIR, `${isoDate()}.md`);
  fs.writeFileSync(mdPath, renderMarkdown(payload), 'utf8');

  console.log(`✅ 機会: ${top.length} 件`);
  console.log(`   JSON: ${path.relative(ROOT, outPath)}`);
  console.log(`   MD:   ${path.relative(ROOT, mdPath)}`);
  for (const o of top.slice(0, 10)) {
    console.log(
      `  - [${o.priority}] ${o.query} (imp ${o.current.impressions}, Δ${Math.round(o.impressionsGrowthRate * 100)}%, ${o.action})`,
    );
  }
}

function renderMarkdown(payload) {
  const lines = [
    `# SEO機会一覧（${payload.generatedAt.slice(0, 10)}）`,
    '',
    `- 今回: \`${payload.currentSnapshot}\``,
    `- 前回: \`${payload.previousSnapshot}\``,
    '',
    '| 優先度 | クエリ | 表示 | 成長 | 順位 | 種別 | アクション |',
    '|--------|--------|------|------|------|------|------------|',
  ];

  for (const o of payload.opportunities) {
    lines.push(
      `| ${o.priority} | ${o.query} | ${o.current.impressions} | ${Math.round(o.impressionsGrowthRate * 100)}% | ${o.current.position.toFixed?.(1) ?? o.current.position} | ${o.type} | ${o.action}${o.alreadyCovered ? '（既存あり）' : ''} |`,
    );
  }

  lines.push('', '下書き生成:', '```bash', 'npm run seo:generate-articles', '```', '');
  return `${lines.join('\n')}\n`;
}

main();
