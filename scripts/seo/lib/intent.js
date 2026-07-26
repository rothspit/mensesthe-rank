/**
 * 問い合わせ・比較決断につながりやすいクエリだけ通す
 */

/** 決断・問い合わせ寄りの語 */
const DECISION_SIGNALS = [
  'おすすめ',
  '選び方',
  '比較',
  'どっち',
  '違い',
  '料金',
  '相場',
  '安い',
  '口コミ',
  '評判',
  '人気',
  'ランキング',
  '初めて',
  '初心者',
  '始め',
  '失敗',
  '安心',
  '安全',
  '予約',
  '電話',
  '店舗',
  '店',
  '求人', // 姉妹導線ではなく店舗側問い合わせも含む
];

/** 情報収集だけでCVにつながりにくい語 */
const LOW_INTENT = [
  'とは',
  '意味',
  '英語',
  '画像',
  'イラスト',
  'wiki',
  'wikipedia',
  'ニュース',
];

/**
 * @returns {{ isInquiryIntent: boolean, score: number, reasons: string[] }}
 */
export function scoreInquiryIntent(query, { hasArea = false, type = null } = {}) {
  const q = String(query || '').trim();
  const reasons = [];
  let score = 0;

  if (!q) {
    return { isInquiryIntent: false, score: 0, reasons: ['empty'] };
  }

  for (const weak of LOW_INTENT) {
    if (q.includes(weak)) {
      return { isInquiryIntent: false, score: 0, reasons: [`low_intent:${weak}`] };
    }
  }

  const hits = DECISION_SIGNALS.filter((s) => q.includes(s));
  if (hits.length) {
    score += Math.min(hits.length * 25, 60);
    reasons.push(`decision:${hits.slice(0, 3).join(',')}`);
  }

  if (hasArea) {
    score += 25;
    reasons.push('has_area');
  }

  if (type === 'comparison') {
    score += 20;
    reasons.push('comparison');
  }
  if (type === 'area' && hits.length) {
    score += 15;
    reasons.push('area_plus_decision');
  }

  // 「エリア + メンズエステ」だけでも店舗探し意図は強い
  if (hasArea && /メンズエステ|メンエス/.test(q)) {
    score += 20;
    reasons.push('area_mens_esthe');
  }

  // 決策語なし・エリアなしの短い語は捨てる
  if (score < 40 && hits.length === 0 && !hasArea) {
    reasons.push('below_threshold');
    return { isInquiryIntent: false, score, reasons };
  }

  const isInquiryIntent = score >= 40;
  if (!isInquiryIntent) reasons.push('below_threshold');
  return { isInquiryIntent, score, reasons };
}
