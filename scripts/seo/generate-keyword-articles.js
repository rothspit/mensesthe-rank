#!/usr/bin/env node
/**
 * 伸びワード機会から SEO 記事下書き + PNGサムネを生成（自動公開しない）
 *
 *   node scripts/seo/generate-keyword-articles.js --execute --limit 5
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createArticleDraft, nextArticleNumber } from './lib/article-draft.js';
import { isoDate } from './lib/gsc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const OPP_DIR = path.join(ROOT, 'content', 'seo', 'opportunities');

function parseArgs(argv) {
  const args = { execute: false, limit: 5, opportunity: null, force: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--execute') args.execute = true;
    else if (argv[i] === '--dry-run') args.execute = false;
    else if (argv[i] === '--limit') args.limit = Number(argv[++i]);
    else if (argv[i] === '--opportunity') args.opportunity = argv[++i];
    else if (argv[i] === '--force') args.force = true;
  }
  return args;
}

function latestOpportunityFile() {
  if (!fs.existsSync(OPP_DIR)) return null;
  const files = fs.readdirSync(OPP_DIR).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) return null;
  return path.join(OPP_DIR, files[files.length - 1]);
}

async function main() {
  const args = parseArgs(process.argv);
  const oppPath = args.opportunity || latestOpportunityFile();
  if (!oppPath || !fs.existsSync(oppPath)) {
    console.error('機会ファイルがありません。先に npm run seo:find-rising か npm run seo:daily を使ってください。');
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(oppPath, 'utf8'));
  const candidates = (payload.opportunities || [])
    .filter((o) => !o.alreadyCovered || args.force)
    .filter((o) => o.priority !== 'low' || args.force)
    .slice(0, args.limit);

  if (!candidates.length) {
    console.log('生成対象がありません。');
    return;
  }

  let articleNumber = nextArticleNumber();
  const created = [];

  for (const opp of candidates) {
    const result = await createArticleDraft({
      query: opp.query,
      opp,
      articleNumber,
      execute: args.execute,
      source: 'gsc-rising-keywords',
      force: args.force,
    });

    if (result.skipped) {
      console.log(`⏭  skip (${result.reason}): ${opp.query}`);
      continue;
    }

    console.log(
      `${args.execute ? '📝' : '🔎'} ${result.file} ← ${opp.query} (${result.usedLlm ? 'LLM' : 'template'})`,
    );

    if (args.execute) {
      created.push(result);
      articleNumber += 1;
    }
  }

  if (args.execute && created.length) {
    const proposalDir = path.join(ROOT, 'content', 'seo', 'proposals');
    fs.mkdirSync(proposalDir, { recursive: true });
    const proposalPath = path.join(proposalDir, `${isoDate()}.md`);
    fs.writeFileSync(
      proposalPath,
      [
        `# 公開提案（${isoDate()}）`,
        '',
        '自動生成下書きです。公開前に人手校正。**X投稿はしない。**',
        '',
        '| ファイル | クエリ | サムネ | 公開ヒント |',
        '|----------|--------|--------|------------|',
        ...created.map(
          (c) => `| \`${c.file}\` | ${c.query} | ${c.thumbPublicPath || '-'} | ${c.publishHint} |`,
        ),
        '',
      ].join('\n'),
      'utf8',
    );
    console.log(`✅ ${created.length} 件 / ${path.relative(ROOT, proposalPath)}`);
  } else if (!args.execute) {
    console.log('dry-run です。--execute で書き込み + PNGサムネ生成');
  }
}

main().catch((err) => {
  console.error('❌', err.message || err);
  process.exit(1);
});
