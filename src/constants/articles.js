/**
 * 公開する手書きエリアガイド（01〜20）。テンプレ量産分（23〜）は下書きのみ。
 * slug → content/articles のファイル名（拡張子なし）
 */
export const PUBLISHED_AREA_GUIDE_FILES = {
  shinjuku: '01-shinjuku',
  ikebukuro: '02-ikebukuro',
  yokohama: '03-yokohama',
  chiba: '04-chiba-funabashi',
  funabashi: '04-chiba-funabashi',
  osakaminami: '05-osaka',
  hakata: '06-hakata',
  nagoya: '07-nagoya',
  sakae: '07-nagoya',
  shibuya: '09-shibuya',
  ginza: '10-ginza',
  urawa: '11-urawa',
  shinagawa: '12-shinagawa',
  ueno: '13-ueno',
  kamata: '14-kamata',
  musashikosugi: '15-musashikosugi',
  omiya: '16-omiya',
  kyoto: '17-kyoto',
  'hamamatsu-hamamatsu': '18-hamamatsu',
  'hiroshima-hiroshima': '19-hiroshima',
  kawasaki: '20-kawasaki',
};

/** /guide/[slug] 用の全国・比較ガイド */
export const GUIDE_ARTICLES = {
  'beginner-40s': {
    file: '08-beginner-guide-40s',
    title: '40代から始めるメンズエステの選び方',
  },
  'shinjuku-vs-ikebukuro': {
    file: '21-shinjuku-vs-ikebukuro',
    title: '新宿と池袋どっち？メンズエステエリア比較',
  },
  'safe-selection-2026': {
    file: '22-safe-selection-fueiho',
    title: '改正風営法を知らないと損する、メンズエステの選び方',
  },
};

export function getGuideSlugs() {
  return Object.keys(GUIDE_ARTICLES);
}

export function getPublishedAreaGuideSlugs() {
  return Object.keys(PUBLISHED_AREA_GUIDE_FILES);
}

export function getPublishedAreaGuideFile(areaSlug) {
  return PUBLISHED_AREA_GUIDE_FILES[areaSlug] || null;
}

export function buildAreaGuidePath(areaSlug) {
  return `/guide/area/${areaSlug}`;
}
