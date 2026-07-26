/**
 * クエリ意図分類・エリア照合
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUBLISHED_AREA_GUIDE_FILES, GUIDE_ARTICLES } from '../../../src/constants/articles.js';
import { scoreInquiryIntent } from './intent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../../..');
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');

/** クエリ内の地名 → area slug（部分一致） */
const AREA_ALIASES = [
  { patterns: ['新宿'], slug: 'shinjuku', label: '新宿' },
  { patterns: ['池袋'], slug: 'ikebukuro', label: '池袋' },
  { patterns: ['渋谷'], slug: 'shibuya', label: '渋谷' },
  { patterns: ['横浜'], slug: 'yokohama', label: '横浜' },
  { patterns: ['船橋', '西船橋'], slug: 'funabashi', label: '船橋' },
  { patterns: ['千葉'], slug: 'chiba', label: '千葉' },
  { patterns: ['大阪', '難波', '梅田'], slug: 'osakaminami', label: '大阪' },
  { patterns: ['博多', '福岡'], slug: 'hakata', label: '博多' },
  { patterns: ['名古屋', '名駅'], slug: 'nagoya', label: '名古屋' },
  { patterns: ['栄'], slug: 'sakae', label: '栄' },
  { patterns: ['銀座'], slug: 'ginza', label: '銀座' },
  { patterns: ['上野'], slug: 'ueno', label: '上野' },
  { patterns: ['品川'], slug: 'shinagawa', label: '品川' },
  { patterns: ['大宮'], slug: 'omiya', label: '大宮' },
  { patterns: ['浦和'], slug: 'urawa', label: '浦和' },
  { patterns: ['川崎'], slug: 'kawasaki', label: '川崎' },
  { patterns: ['京都'], slug: 'kyoto', label: '京都' },
  { patterns: ['浜松'], slug: 'hamamatsu-hamamatsu', label: '浜松' },
  { patterns: ['広島'], slug: 'hiroshima-hiroshima', label: '広島' },
  { patterns: ['武蔵小杉', '小杉'], slug: 'musashikosugi', label: '武蔵小杉' },
  { patterns: ['蒲田'], slug: 'kamata', label: '蒲田' },
];

const BRAND_NOISE = /mensesthe-rank|メンズエステ情報ランキング|サイトマップ/i;

export function classifyQuery(query) {
  const q = String(query || '').trim();
  if (!q || BRAND_NOISE.test(q)) {
    return { type: 'skip', reason: 'brand_or_empty', query: q };
  }

  const area = matchArea(q);
  const isCompare = /どっち|比較|vs|versus|違い/.test(q);
  const isHowTo = /選び方|始め|初めて|初心者|料金|相場|安い|おすすめ|口コミ|ランキング/.test(q);
  const isGenre = /アジアン|人妻|熟女|出張|リラク|高級/.test(q);

  let result;
  if (isCompare) {
    result = {
      type: 'comparison',
      query: q,
      area,
      suggestedRoute: '/guide/{slug}',
      action: area?.hasPublishedGuide ? 'enrich_existing' : 'new_guide_draft',
    };
  } else if (area) {
    result = {
      type: 'area',
      query: q,
      area,
      suggestedRoute: `/areas/${area.slug}`,
      guideRoute: area.hasPublishedGuide ? `/guide/area/${area.slug}` : null,
      action: area.hasPublishedGuide ? 'enrich_existing' : 'new_area_guide_draft',
    };
  } else if (isGenre || isHowTo) {
    result = {
      type: 'topical',
      query: q,
      area: null,
      suggestedRoute: '/guide/{slug}',
      action: 'new_guide_draft',
    };
  } else {
    result = {
      type: 'topical',
      query: q,
      area: null,
      suggestedRoute: '/guide/{slug}',
      action: 'new_guide_draft',
    };
  }

  const intent = scoreInquiryIntent(q, {
    hasArea: Boolean(area),
    type: result.type,
  });

  if (!intent.isInquiryIntent) {
    return {
      type: 'skip',
      reason: 'not_inquiry_intent',
      query: q,
      intent,
    };
  }

  return { ...result, intent };
}

export function matchArea(query) {
  for (const entry of AREA_ALIASES) {
    if (entry.patterns.some((p) => query.includes(p))) {
      return {
        slug: entry.slug,
        label: entry.label,
        hasPublishedGuide: Boolean(PUBLISHED_AREA_GUIDE_FILES[entry.slug]),
      };
    }
  }
  return null;
}

export function loadExistingArticleQueries() {
  const titles = new Set();
  if (!fs.existsSync(ARTICLES_DIR)) return titles;

  for (const file of fs.readdirSync(ARTICLES_DIR)) {
    if (!file.endsWith('.md') || file === 'README.md') continue;
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
    const titleLine = raw.match(/^#\s+(.+)$/m);
    if (titleLine) titles.add(normalize(titleLine[1]));
    const seoTitle = raw.match(/\*\*title\*\*:\s*(.+)/);
    if (seoTitle) titles.add(normalize(seoTitle[1]));
  }

  for (const entry of Object.values(GUIDE_ARTICLES)) {
    if (entry.title) titles.add(normalize(entry.title));
  }

  return titles;
}

export function alreadyCovered(query, existingTitles) {
  const nq = normalize(query);
  for (const title of existingTitles) {
    if (title.includes(nq) || nq.includes(title.slice(0, Math.min(12, title.length)))) {
      return true;
    }
  }
  return false;
}

export function slugifyKeyword(query) {
  return String(query)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u3040-\u30ff\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'keyword';
}

function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/【.*?】/g, '')
    .replace(/[｜|].*$/, '')
    .replace(/\s+/g, '')
    .trim();
}
