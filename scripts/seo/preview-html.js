#!/usr/bin/env node
/**
 * 記事 Markdown をサイト寄りの HTML プレビューに変換して開く
 *
 *   node scripts/seo/preview-html.js
 *   node scripts/seo/preview-html.js content/articles/963-daily-船橋-メンズエステ-おすすめ.md
 *   npm run seo:preview
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { marked } from 'marked';
import { resolveAuthor } from '../../src/constants/authors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'public', 'previews');
const INDEX_PATH = path.join(OUT_DIR, 'index.html');

marked.setOptions({ gfm: true, breaks: false });

function parseArticle(raw) {
  const seo = {};
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const bodyMarker = raw.indexOf('## 本文');
  const seoPart = bodyMarker >= 0 ? raw.slice(0, bodyMarker) : raw;
  const bodyMd = bodyMarker >= 0 ? raw.slice(bodyMarker + '## 本文'.length).trim() : raw;

  for (const [key, re] of [
    ['title', /\*\*title\*\*:\s*(.+)/],
    ['description', /\*\*description\*\*:\s*(.+)/],
    ['ogImage', /\*\*(?:og_image|サムネ|thumbnail)\*\*:\s*(.+)/i],
    ['author', /\*\*(?:著者|author)\*\*:\s*(.+)/i],
    ['role', /\*\*(?:肩書き|role)\*\*:\s*(.+)/i],
    ['bio', /\*\*(?:経歴|bio)\*\*:\s*(.+)/i],
    ['updatedAt', /\*\*(?:更新日|updated)\*\*:\s*(.+)/i],
    ['query', /\*\*target_query\*\*:\s*(.+)/],
  ]) {
    const m = seoPart.match(re);
    if (m) seo[key] = m[1].trim();
  }

  const author = resolveAuthor(seo.author);
  seo.author = author.name;
  seo.role = seo.role || author.role;
  seo.bio = seo.bio || author.bio;
  seo.tagline = author.tagline;

  return {
    heading: titleMatch?.[1]?.trim() || seo.title || '無題',
    seo,
    html: marked.parse(bodyMd),
  };
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPage({ heading, seo, html, fileBase }) {
  // file:// でも見えるよう public/ からの相対パスにする
  let og = seo.ogImage || null;
  if (og?.startsWith('/images/')) {
    og = `..${og}`;
  } else if (og && !og.startsWith('http') && !og.startsWith('.')) {
    og = `../${og.replace(/^\//, '')}`;
  }
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(seo.title || heading)}｜プレビュー</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --primary: #1A365D;
      --accent: #E5A158;
      --bg: #FAFBFC;
      --surface: #FFFFFF;
      --text: #1A1A1A;
      --muted: #666666;
      --border: #E2E4E8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Noto Sans JP", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
    }
    .banner {
      background: #fff7ed;
      border-bottom: 1px solid #fed7aa;
      color: #9a3412;
      font-size: 13px;
      padding: 10px 16px;
      text-align: center;
    }
    .banner a { color: #c2410c; font-weight: 700; }
    .wrap {
      max-width: 720px;
      margin: 0 auto;
      padding: 24px 16px 80px;
    }
    article {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 20px 32px;
      box-shadow: 0 2px 12px rgba(26,54,93,.06);
    }
    @media (min-width: 768px) {
      article { padding: 32px; }
    }
    .hero {
      position: relative;
      aspect-ratio: 1200 / 630;
      border-radius: 12px;
      overflow: hidden;
      background: #EEF0F3;
      margin-bottom: 24px;
    }
    .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .byline {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .byline .label { font-size: 12px; font-weight: 700; color: #777; letter-spacing: .04em; }
    .byline .name { font-weight: 700; margin-top: 4px; }
    .byline .role, .byline .date { font-size: 14px; color: var(--muted); }
    .body h1 { font-size: 24px; line-height: 1.35; color: var(--text); margin: 0 0 16px; }
    .body h2 {
      font-size: 20px; font-weight: 700; color: var(--primary);
      margin: 32px 0 12px; line-height: 1.4;
    }
    .body h3 { font-size: 16px; font-weight: 700; margin: 24px 0 8px; }
    .body p { margin: 0 0 14px; color: #555; }
    .body ul, .body ol { padding-left: 1.25rem; margin: 0 0 14px; color: #555; }
    .body li { margin: 4px 0; }
    .body a { color: var(--primary); font-weight: 600; text-decoration: none; }
    .body a:hover { text-decoration: underline; }
    .body strong { color: var(--text); }
    .body table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 14px; }
    .body th, .body td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    .body th { background: #EEF0F3; }
    .meta {
      margin-top: 28px; padding-top: 16px; border-top: 1px dashed var(--border);
      font-size: 12px; color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="banner">
    プレビュー（非公開下書き）｜<a href="./index.html">一覧に戻る</a>｜元ファイル: ${escapeHtml(fileBase)}.md
  </div>
  <div class="wrap">
    <article>
      ${
        og
          ? `<div class="hero"><img src="${escapeHtml(og)}" alt="" /></div>`
          : ''
      }
      <aside class="byline">
        <div>
          <div class="label">この記事の案内役</div>
          ${seo.tagline ? `<div class="role" style="color:#E5A158;font-weight:700">${escapeHtml(seo.tagline)}</div>` : ''}
          <div class="name">${escapeHtml(seo.author)}</div>
          <div class="role">${escapeHtml(seo.role)}</div>
          ${
            seo.bio
              ? `<div class="role" style="margin-top:8px;max-width:36rem">${escapeHtml(seo.bio)}</div>`
              : ''
          }
        </div>
        ${
          seo.updatedAt
            ? `<div class="date">更新日：${escapeHtml(seo.updatedAt)}</div>`
            : ''
        }
      </aside>
      <div class="body">
        ${html}
      </div>
      <div class="meta">
        ${seo.query ? `target_query: ${escapeHtml(seo.query)}` : ''}
        ${seo.description ? `<br/>${escapeHtml(seo.description)}` : ''}
      </div>
    </article>
  </div>
</body>
</html>`;
}

function toPreviewSlug(fileBase) {
  return fileBase
    .replace(/[^\w\u3040-\u30ff\u4e00-\u9fff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function collectTargets(argv) {
  const explicit = argv.slice(2).filter((a) => !a.startsWith('-'));
  if (explicit.length) {
    return explicit.map((p) => path.resolve(ROOT, p));
  }
  const dir = path.join(ROOT, 'content', 'articles');
  return fs
    .readdirSync(dir)
    .filter((f) => /^9(6[0-5])-daily-/.test(f) && f.endsWith('.md'))
    .sort()
    .map((f) => path.join(dir, f));
}

function main() {
  const files = collectTargets(process.argv);
  if (!files.length) {
    console.error('対象の Markdown がありません');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cards = [];

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      console.warn('skip missing', filePath);
      continue;
    }
    const fileBase = path.basename(filePath, '.md');
    const parsed = parseArticle(fs.readFileSync(filePath, 'utf8'));
    const outName = `${toPreviewSlug(fileBase)}.html`;
    const outPath = path.join(OUT_DIR, outName);
    fs.writeFileSync(outPath, renderPage({ ...parsed, fileBase }), 'utf8');
    cards.push({
      href: `./${outName}`,
      title: parsed.seo.title || parsed.heading,
      query: parsed.seo.query || '',
      file: fileBase,
      author: parsed.seo.author || '',
      tagline: parsed.seo.tagline || '',
    });
    console.log(`✅ ${path.relative(ROOT, outPath)}`);
  }

  const index = `<!DOCTYPE html>
<html lang="ja"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>記事プレビュー一覧</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet" />
<style>
body{font-family:"Noto Sans JP",sans-serif;background:#FAFBFC;margin:0;padding:24px;color:#1A1A1A}
h1{font-size:22px;color:#1A365D}
ul{list-style:none;padding:0;max-width:720px}
li{margin:0 0 12px}
a{display:block;padding:16px;border:1px solid #E2E4E8;border-radius:12px;background:#fff;text-decoration:none;color:#1A1A1A}
a:hover{border-color:#1A365D}
.q{font-size:12px;color:#666;margin-top:4px}
.author{font-size:12px;font-weight:700;color:#E5A158;margin-top:6px}
</style></head><body>
<h1>記事プレビュー（HTML）</h1>
<p style="color:#666;font-size:14px">本番レイアウトに近い見た目確認用。公開は別途 allowlist が必要です。</p>
<ul>
${cards
  .map(
    (c) =>
      `<li><a href="${c.href}"><strong>${escapeHtml(c.title)}</strong><div class="author">${escapeHtml(c.author)}${c.tagline ? ` · ${escapeHtml(c.tagline)}` : ''}</div><div class="q">${escapeHtml(c.query)} · ${escapeHtml(c.file)}</div></a></li>`,
  )
  .join('\n')}
</ul>
</body></html>`;
  fs.writeFileSync(INDEX_PATH, index, 'utf8');
  console.log(`✅ ${path.relative(ROOT, INDEX_PATH)}`);

  try {
    execSync(`open "${INDEX_PATH}"`, { stdio: 'ignore' });
  } catch {
    console.log(`ブラウザで開く: ${INDEX_PATH}`);
  }
}

main();
