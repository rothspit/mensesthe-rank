/**
 * 記事下書き1本の生成（本文 + PNGサムネ）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyQuery, slugifyKeyword } from './classify.js';
import { isoDate } from './gsc.js';
import { generateArticleThumbnailPng } from './thumbnail.js';
import { loadLocalEnv } from './load-env.js';
import { pickAuthorForOpportunity } from '../../../src/constants/authors.js';

loadLocalEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../../..');
export const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');
const SITE_URL = 'https://mensesthe-rank.jp';

export function nextArticleNumber() {
  let max = 0;
  if (!fs.existsSync(ARTICLES_DIR)) return 1;
  for (const file of fs.readdirSync(ARTICLES_DIR)) {
    const m = file.match(/^(\d+)-/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

export function draftExistsForQuery(query) {
  const needle = slugifyKeyword(query);
  if (!fs.existsSync(ARTICLES_DIR)) return null;
  for (const file of fs.readdirSync(ARTICLES_DIR)) {
    if (!file.endsWith('.md')) continue;
    if (file.includes(needle) || file.includes('gsc-') || file.includes('daily-')) {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
      if (raw.includes(query) || raw.includes(`**target_query**: ${query}`)) return file;
    }
  }
  return null;
}

export function opportunityFromQuery(query, extras = {}) {
  const classified = classifyQuery(query);
  if (classified.type === 'skip' && classified.reason === 'brand_or_empty') {
    return classified;
  }
  if (classified.type === 'skip') {
    return {
      type: 'topical',
      query,
      area: null,
      action: 'new_guide_draft',
      priority: extras.priority || 'medium',
      alreadyCovered: false,
      intent: classified.intent || {
        isInquiryIntent: true,
        score: 50,
        reasons: ['queue_override'],
      },
    };
  }
  return {
    ...classified,
    priority: extras.priority || 'medium',
    alreadyCovered: false,
  };
}

function buildWritingPrompt({ title, query, outline, author }) {
  return `あなたは mensesthe-rank.jp の日本語SEOライター。この記事の著者は「${author.name}」（${author.role}／${author.tagline}）。
語り口: ${author.voice}
この業界はエンタメ。堅い企業広報・説教口調は禁止。キャラは楽しい系（または姉御の距離感）。読みやすく距離が近い語りで書く。
対象読者は40〜60代男性。比較しやすさ・失敗しにくい選び方は大事だが、真面目ぶらない。
誇大表現・違法誘導・店舗の「おすすめNo.1」断定は禁止。料金は目安で変動する旨を書く。
検索クエリ「${query}」向けの記事本文を Markdown で書いてください。
タイトル: ${title}
構成ヒント:
${outline.map((h, i) => `${i + 1}. ${h}`).join('\n')}
要件:
- H2/H3 を使う
- 内部リンクとして /areas/ や /guide/ を自然に入れる
- 3000〜5000字程度
- 先頭に # タイトル行は不要（本文のみ）
- 「（下書き）」というプレースホルダは一切使わない
- 「当サイトでは」「当社は」は避ける。著者キャラの一人称で書いてよい`;
}

async function maybeLlmExpand({ title, query, outline, author }) {
  const prompt = buildWritingPrompt({ title, query, outline, author });

  // Anthropic 優先（.env.local の ANTHROPIC_API_KEY）
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        temperature: 0.6,
        system:
          'あなたはエンタメ寄りの日本語SEO編集者です。堅い広報口調は禁止。指定された著者キャラの声で完成原稿のみを返します。',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 240)}`);
    }
    const data = await res.json();
    const text = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
    return text || null;
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      messages: [
        { role: 'system', content: 'あなたはエンタメ寄りの日本語SEO編集者です。指定された著者キャラの声で書きます。' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

function buildOutline(opp) {
  if (opp.type === 'area' && opp.area) {
    return [
      `${opp.area.label}でメンズエステを探すポイント`,
      'エリアの特徴と利用シーン',
      '料金の目安とコースの見方',
      '安心して選ぶためのチェックリスト',
      `関連ランキングへの誘導（/areas/${opp.area.slug}）`,
      'よくある質問',
    ];
  }
  if (opp.type === 'comparison') {
    return [
      '比較の結論を先に提示',
      '各エリア・条件の違い',
      'どんな人にどっちが向くか',
      'ランキングの見方',
      'よくある質問',
    ];
  }
  return [
    `${opp.query}で調べている人が知りたいこと`,
    '失敗しない選び方の基準',
    '料金・エリア・口コミの見方',
    'おすすめの探し方（当サイトの使い方）',
    'よくある質問',
  ];
}

function buildTemplateBody({ title, query, opp, outline }) {
  const areaLink =
    opp.area?.slug != null
      ? `\n\nエリアの店舗ランキングは [こちら](/areas/${opp.area.slug}) から比較できます。`
      : '';

  const sections = outline
    .map(
      (h) => `## ${h}

（下書き）「${query}」に関連するポイントを、具体的な判断基準とともに追記してください。
`,
    )
    .join('\n');

  return `# ${title}

検索クエリ「${query}」で訪れる方向けのガイドです。メンズエステ情報ランキングでは、全国の店舗をエリア別に比較できます。${areaLink}

${sections}
## この記事のまとめ

「${query}」で迷っている方は、まずエリアを決め、料金と口コミの見方をそろえたうえで、ランキングから候補を絞り込むのがおすすめです。
`;
}

/**
 * @param {{ query: string, opp?: object, articleNumber: number, execute: boolean, source?: string }} opts
 */
export async function createArticleDraft({
  query,
  opp = null,
  articleNumber,
  execute = false,
  source = 'daily-queue',
  force = false,
}) {
  const opportunity = opp || opportunityFromQuery(query);
  if (opportunity.type === 'skip' && opportunity.reason === 'brand_or_empty') {
    return { skipped: true, reason: opportunity.reason };
  }

  const existing = draftExistsForQuery(query);
  if (existing && !force) {
    return { skipped: true, reason: 'exists', existing };
  }

  const year = new Date().getFullYear();
  const slug = `${source === 'daily-queue' ? 'daily' : 'gsc'}-${slugifyKeyword(query)}`;
  const title =
    opportunity.type === 'area' && opportunity.area
      ? `${opportunity.area.label}のメンズエステの選び方｜${query}【${year}】`
      : `${query}｜メンズエステの探し方と選び方【${year}】`;
  const description = `${query}でお悩みの方向けに、メンズエステの選び方・料金の見方・エリアランキングの活用法をわかりやすく解説します。`;
  const guideSlug = slug.slice(0, 60);
  const canonical = `${SITE_URL}/guide/${guideSlug}`;
  const outline = buildOutline(opportunity);
  const author = pickAuthorForOpportunity(opportunity, articleNumber);

  let body = null;
  let usedLlm = false;
  try {
    body = await maybeLlmExpand({ title, query, outline, author });
    usedLlm = Boolean(body);
  } catch (err) {
    console.warn('LLM本文スキップ:', err.message);
  }
  if (!body) body = buildTemplateBody({ title, query, opp: opportunity, outline });

  const fileBase = `${String(articleNumber).padStart(3, '0')}-${slug}`;
  const fileName = `${fileBase}.md`;
  const badge = opportunity.area?.label || (opportunity.type === 'comparison' ? '比較' : 'ガイド');

  let thumbPublicPath = null;
  if (execute) {
    const thumb = await generateArticleThumbnailPng({
      fileBase,
      title: title.replace(/【\d+】$/, '').replace(/｜.*/, ''),
      badge,
    });
    thumbPublicPath = thumb.publicPath;
  }

  const markdown = `# ${title}

## SEOメタ情報

- **title**: ${title}
- **description**: ${description}
- **canonical**: ${canonical}
- **og_image**: ${thumbPublicPath || `/images/articles/${fileBase}.png`}
- **記事タイプ**: 自動下書き（非公開・要ファクトチェック）
- **target_query**: ${query}
- **opportunity_type**: ${opportunity.type}
- **priority**: ${opportunity.priority || 'medium'}
- **著者**: ${author.name}
- **肩書き**: ${author.role}
- **経歴**: ${author.bio}
- **更新日**: ${isoDate()}
- **source**: ${source}
- **fact_check**: pending（公開前に必ず人手確認）
- **distribution**: no_x（風俗系アカウントの凍結リスクのため X 投稿しない）
${opportunity.area ? `- **対応エリアページ**: /areas/${opportunity.area.slug}\n` : ''}
---

## 本文

${body}
`;

  if (execute) {
    fs.writeFileSync(path.join(ARTICLES_DIR, fileName), markdown, 'utf8');
  }

  return {
    skipped: false,
    file: fileName,
    fileBase,
    query,
    title,
    type: opportunity.type,
    priority: opportunity.priority || 'medium',
    usedLlm,
    thumbPublicPath,
    publishHint:
      opportunity.type === 'area' && opportunity.area
        ? `PUBLISHED_AREA_GUIDE_FILES に '${opportunity.area.slug}': '${fileBase}' を追加（内容精査後）`
        : `GUIDE_ARTICLES に '${guideSlug}' を追加（内容精査後）`,
  };
}
