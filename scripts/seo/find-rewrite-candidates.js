#!/usr/bin/env node
/**
 * 公開ガイドのうち、効果の弱いページをリライト候補として出す
 *
 * ページCSV（GSC パフォーマンス → ページ）のスナップショット2つが必要:
 *   node scripts/seo/fetch-gsc-queries.js --csv pages-prev.csv --label pages-prev
 *   node scripts/seo/fetch-gsc-queries.js --csv pages-curr.csv --label pages-curr
 *   node scripts/seo/find-rewrite-candidates.js \
 *     --current content/seo/snapshots/pages-curr.json \
 *     --previous content/seo/snapshots/pages-prev.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GUIDE_ARTICLES, PUBLISHED_AREA_GUIDE_FILES } from '../../src/constants/articles.js';
import { SITE_URL } from '../../src/constants.js';
import { isoDate } from './lib/gsc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const SNAPSHOT_DIR = path.join(ROOT, 'content', 'seo', 'snapshots');
const OUT_DIR = path.join(ROOT, 'content', 'seo', 'rewrites');
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');

function parseArgs(argv) {
  const args = {
    current: null,
    previous: null,
    minImpressions: 50,
    maxCtr: 0.02,
    minPosition: 10,
    limit: 20,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--current') args.current = argv[++i];
    else if (argv[i] === '--previous') args.previous = argv[++i];
    else if (argv[i] === '--min-impressions') args.minImpressions = Number(argv[++i]);
    else if (argv[i] === '--max-ctr') args.maxCtr = Number(argv[++i]);
    else if (argv[i] === '--limit') args.limit = Number(argv[++i]);
  }
  return args;
}

function publishedGuidePaths() {
  const map = new Map();

  for (const [slug, meta] of Object.entries(GUIDE_ARTICLES)) {
    const url = `${SITE_URL}/guide/${slug}`;
    map.set(normalizeUrl(url), {
      kind: 'guide',
      slug,
      file: meta.file,
      title: meta.title,
      path: `/guide/${slug}`,
    });
  }

  const seenFiles = new Set();
  for (const [areaSlug, file] of Object.entries(PUBLISHED_AREA_GUIDE_FILES)) {
    if (seenFiles.has(file)) continue;
    seenFiles.add(file);
    const url = `${SITE_URL}/guide/area/${areaSlug}`;
    map.set(normalizeUrl(url), {
      kind: 'area_guide',
      slug: areaSlug,
      file,
      title: areaSlug,
      path: `/guide/area/${areaSlug}`,
    });
  }

  return map;
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    let p = u.pathname.replace(/\/$/, '') || '/';
    return `${u.origin}${p}`;
  } catch {
    return String(url).replace(/\/$/, '');
  }
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

function pickPageSnapshots(files) {
  const pageSnaps = files.filter((f) => {
    try {
      const data = loadSnapshot(f);
      return data.kind === 'page' || (data.rows?.[0] && data.rows[0].page);
    } catch {
      return false;
    }
  });
  return pageSnaps;
}

function articleUpdatedHint(baseName) {
  const filePath = path.join(ARTICLES_DIR, `${baseName}.md`);
  if (!fs.existsSync(filePath)) return null;
  const stat = fs.statSync(filePath);
  const days = Math.floor((Date.now() - stat.mtimeMs) / (86400 * 1000));
  return { mtime: stat.mtime.toISOString().slice(0, 10), daysSinceEdit: days };
}

function scoreRewrite(curr, prev, args) {
  const reasons = [];
  let score = 0;

  const lowCtr = curr.impressions >= args.minImpressions && curr.ctr > 0 && curr.ctr < args.maxCtr;
  if (lowCtr) {
    score += 40;
    reasons.push(`low_ctr:${(curr.ctr * 100).toFixed(2)}%`);
  }

  const softPosition =
    curr.impressions >= args.minImpressions && curr.position >= args.minPosition && curr.position <= 30;
  if (softPosition) {
    score += 25;
    reasons.push(`position:${curr.position.toFixed?.(1) ?? curr.position}`);
  }

  if (prev) {
    const drop =
      prev.impressions > 0 ? (prev.impressions - curr.impressions) / prev.impressions : 0;
    if (drop >= 0.25 && prev.impressions >= args.minImpressions) {
      score += 35;
      reasons.push(`impression_drop:${Math.round(drop * 100)}%`);
    }
    if (curr.position - prev.position >= 3 && curr.impressions >= args.minImpressions / 2) {
      score += 20;
      reasons.push('position_worse');
    }
  }

  // 表示があるのにクリックほぼゼロ
  if (curr.impressions >= args.minImpressions && curr.clicks <= 1) {
    score += 20;
    reasons.push('near_zero_clicks');
  }

  if (score < 40) return null;
  return { score, reasons };
}

function main() {
  const args = parseArgs(process.argv);
  const files = listSnapshots();
  let currentPath = args.current;
  let previousPath = args.previous;

  if (!currentPath || !previousPath) {
    const pageSnaps = pickPageSnapshots(files);
    if (pageSnaps.length < 2) {
      console.error(`ページ寸法のスナップショットが2つ必要です。

例:
  # GSC → パフォーマンス → ページ → CSVエクスポート（2時点）
  node scripts/seo/fetch-gsc-queries.js --csv pages-a.csv --label pages-a
  node scripts/seo/fetch-gsc-queries.js --csv pages-b.csv --label pages-b
  npm run seo:find-rewrites -- --current content/seo/snapshots/pages-b.json --previous content/seo/snapshots/pages-a.json`);
      process.exit(1);
    }
    previousPath = previousPath || pageSnaps[pageSnaps.length - 2];
    currentPath = currentPath || pageSnaps[pageSnaps.length - 1];
  }

  const current = loadSnapshot(currentPath);
  const previous = loadSnapshot(previousPath);
  const guides = publishedGuidePaths();
  const prevMap = new Map(
    (previous.rows || [])
      .filter((r) => r.page)
      .map((r) => [normalizeUrl(r.page), r]),
  );

  const candidates = [];

  for (const row of current.rows || []) {
    if (!row.page) continue;
    const key = normalizeUrl(row.page);
    const guide = guides.get(key);
    if (!guide) continue;

    const metrics = scoreRewrite(row, prevMap.get(key), args);
    if (!metrics) continue;

    const edit = articleUpdatedHint(guide.file);
    candidates.push({
      url: key,
      path: guide.path,
      kind: guide.kind,
      slug: guide.slug,
      file: `${guide.file}.md`,
      title: guide.title,
      current: {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      },
      previous: prevMap.has(key)
        ? {
            clicks: prevMap.get(key).clicks,
            impressions: prevMap.get(key).impressions,
            ctr: prevMap.get(key).ctr,
            position: prevMap.get(key).position,
          }
        : null,
      ...metrics,
      lastEdited: edit,
      action: 'manual_rewrite',
      note: '自動改稿しない。見出し・導入・FAQ・内部リンク・独自情報を人手で強化する。',
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, args.limit);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outJson = path.join(OUT_DIR, `${isoDate()}.json`);
  const outMd = path.join(OUT_DIR, `${isoDate()}.md`);
  const payload = {
    generatedAt: new Date().toISOString(),
    currentSnapshot: path.relative(ROOT, currentPath),
    previousSnapshot: path.relative(ROOT, previousPath),
    count: top.length,
    candidates: top,
  };

  fs.writeFileSync(outJson, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(outMd, renderMd(payload), 'utf8');

  console.log(`✅ リライト候補: ${top.length} 件`);
  console.log(`   ${path.relative(ROOT, outJson)}`);
  for (const c of top.slice(0, 8)) {
    console.log(`  - [${c.score}] ${c.path} (${c.reasons.join(', ')})`);
  }
}

function renderMd(payload) {
  const lines = [
    `# リライト候補（${payload.generatedAt.slice(0, 10)}）`,
    '',
    '自動では直しません。ファクトチェック付きで人手リライトしてください。',
    '',
    '| スコア | パス | 表示 | CTR | 順位 | 理由 | ファイル |',
    '|--------|------|------|-----|------|------|----------|',
  ];
  for (const c of payload.candidates) {
    lines.push(
      `| ${c.score} | ${c.path} | ${c.current.impressions} | ${(c.current.ctr * 100).toFixed(2)}% | ${Number(c.current.position).toFixed(1)} | ${c.reasons.join(', ')} | \`${c.file}\` |`,
    );
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

main();
