/**
 * Google Search Console データ読み込み
 * - CSV（GSC画面からエクスポート）が標準
 * - サービスアカウントがあれば Search Analytics API も利用可
 */

import fs from 'fs';
import path from 'path';

const SITE_URL = process.env.GSC_SITE_URL || 'https://mensesthe-rank.jp/';

/**
 * GSC CSV（クエリ / ページ両対応、日本語・英語ヘッダー）
 * @returns {{ kind: 'query'|'page', rows: object[] }}
 */
export function parseGscCsv(csvText) {
  const lines = csvText.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  if (lines.length < 2) return { kind: 'query', rows: [] };

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = {
    query: findCol(header, ['上位のクエリ', 'クエリ', 'query', 'top queries']),
    page: findCol(header, ['上位のページ', 'ページ', 'page', 'top pages', 'ランディング ページ']),
    clicks: findCol(header, ['クリック数', 'clicks']),
    impressions: findCol(header, ['表示回数', 'impressions']),
    ctr: findCol(header, ['ctr']),
    position: findCol(header, ['掲載順位', 'position', '平均掲載順位']),
  };

  const kind = col.page >= 0 && col.query < 0 ? 'page' : 'query';
  if (kind === 'query' && col.query < 0) {
    throw new Error('GSC CSV にクエリ列またはページ列が見つかりません');
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    if (kind === 'page') {
      const page = (cells[col.page] || '').trim();
      if (!page) continue;
      rows.push({
        page,
        clicks: num(cells[col.clicks]),
        impressions: num(cells[col.impressions]),
        ctr: parseCtr(cells[col.ctr]),
        position: num(cells[col.position]),
      });
    } else {
      const query = (cells[col.query] || '').trim();
      if (!query) continue;
      rows.push({
        query,
        clicks: num(cells[col.clicks]),
        impressions: num(cells[col.impressions]),
        ctr: parseCtr(cells[col.ctr]),
        position: num(cells[col.position]),
      });
    }
  }
  return { kind, rows };
}

export function loadGscCsvFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`CSV が見つかりません: ${abs}`);
  return parseGscCsv(fs.readFileSync(abs, 'utf8'));
}

/** 後方互換: rows 配列だけ欲しいとき */
export function loadGscCsvRows(filePath) {
  const parsed = loadGscCsvFile(filePath);
  return parsed.rows;
}

/**
 * Search Analytics API（任意）
 * 必要環境変数:
 *   GSC_SITE_URL
 *   GOOGLE_APPLICATION_CREDENTIALS または GSC_SERVICE_ACCOUNT_JSON
 */
export async function fetchGscSearchAnalytics({ startDate, endDate, rowLimit = 1000 } = {}) {
  let google;
  try {
    ({ google } = await import('googleapis'));
  } catch {
    throw new Error(
      'googleapis 未インストールです。`npm i googleapis` するか、CSV モードを使ってください。',
    );
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    ...(process.env.GSC_SERVICE_ACCOUNT_JSON
      ? { credentials: JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON) }
      : {}),
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit,
      dataState: 'final',
    },
  });

  return (res.data.rows || []).map((row) => ({
    query: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

export function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return isoDate(d);
}

function findCol(header, names) {
  for (const name of names) {
    const idx = header.indexOf(name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function num(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/%/g, '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function parseCtr(v) {
  if (v == null || v === '') return 0;
  const s = String(v).trim();
  if (s.endsWith('%')) return num(s) / 100;
  const n = num(s);
  return n > 1 ? n / 100 : n;
}
