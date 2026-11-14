#!/usr/bin/env node
/**
 * GSC 日別データを保存（週次スナップショットの 28 日合計とは別）
 *
 *   node scripts/seo/fetch-gsc-daily.js --days 28 --out content/seo/daily
 *
 * 出力:
 *   totals.json  … 日別のサイト合計（--total-days 日、既定 120）
 *   queries.json … 日別 × クエリ（--days 日）
 *   pages.json   … 日別 × ページ（--days 日）
 *
 * dataState=all のため firstIncompleteDate 以降の日は確定前の値。
 */

import fs from 'fs';
import path from 'path';
import { daysAgo, isoDate } from './lib/gsc.js';

const SITE_URL = process.env.GSC_SITE_URL || 'https://mensesthe-rank.jp/';
const PAGE_SIZE = 25000; // Search Analytics API の rowLimit 上限

function parseArgs(argv) {
  const args = { days: 28, totalDays: 120, out: 'content/seo/daily', maxRows: 100000 };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--days') args.days = Number(argv[++i]);
    else if (argv[i] === '--total-days') args.totalDays = Number(argv[++i]);
    else if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--max-rows') args.maxRows = Number(argv[++i]);
  }
  return args;
}

async function createClient() {
  let google;
  try {
    ({ google } = await import('googleapis'));
  } catch {
    throw new Error('googleapis 未インストールです。`npm i googleapis` してください。');
  }
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    ...(process.env.GSC_SERVICE_ACCOUNT_JSON
      ? { credentials: JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON) }
      : {}),
  });
  return google.searchconsole({ version: 'v1', auth });
}

async function queryAll(client, { startDate, endDate, dimensions, maxRows }) {
  const rows = [];
  let metadata = null;
  for (let startRow = 0; startRow < maxRows; startRow += PAGE_SIZE) {
    const res = await client.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit: Math.min(PAGE_SIZE, maxRows - startRow),
        startRow,
        dataState: 'all',
      },
    });
    metadata ??= res.data.metadata || null;
    const batch = res.data.rows || [];
    for (const row of batch) {
      const out = {};
      dimensions.forEach((dim, i) => {
        out[dim] = row.keys?.[i] || '';
      });
      out.clicks = row.clicks || 0;
      out.impressions = row.impressions || 0;
      out.ctr = row.ctr || 0;
      out.position = row.position || 0;
      rows.push(out);
    }
    if (batch.length < PAGE_SIZE) break;
  }
  return { rows, metadata };
}

/**
 * 期間まとめて取ると上限行数でクリックの少ない行（直近の日に多い）が切れるので、1日ずつ取る
 */
async function queryPerDay(client, { startDate, endDate, dimensions, maxRows }) {
  const rows = [];
  let metadata = null;
  for (let day = startDate; day <= endDate; day = nextDay(day)) {
    const result = await queryAll(client, { startDate: day, endDate: day, dimensions, maxRows });
    if (!metadata?.firstIncompleteDate && result.metadata?.firstIncompleteDate) metadata = result.metadata;
    rows.push(...result.rows);
  }
  return { rows, metadata };
}

function nextDay(day) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return isoDate(d);
}

async function main() {
  const args = parseArgs(process.argv);
  const client = await createClient();
  const endDate = isoDate();
  const outDir = path.resolve(args.out);
  fs.mkdirSync(outDir, { recursive: true });

  const jobs = [
    { file: 'totals.json', dimensions: ['date'], startDate: daysAgo(args.totalDays) },
    { file: 'queries.json', dimensions: ['date', 'query'], startDate: daysAgo(args.days), perDay: true },
    { file: 'pages.json', dimensions: ['date', 'page'], startDate: daysAgo(args.days), perDay: true },
  ];

  for (const job of jobs) {
    const { rows, metadata } = job.perDay
      ? await queryPerDay(client, { ...job, endDate, maxRows: args.maxRows })
      : await queryAll(client, {
        startDate: job.startDate,
        endDate,
        dimensions: job.dimensions,
        maxRows: args.maxRows,
      });
    const payload = {
      fetchedAt: new Date().toISOString(),
      siteUrl: SITE_URL,
      startDate: job.startDate,
      endDate,
      dimensions: job.dimensions,
      dataState: 'all',
      firstIncompleteDate: metadata?.firstIncompleteDate || null,
      rowCount: rows.length,
      rows,
    };
    fs.writeFileSync(path.join(outDir, job.file), JSON.stringify(payload));
    console.log(`${job.file}: ${rows.length} 行（${job.startDate}〜${endDate}）`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
