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

/** /guide/[slug] 用の全国・比較ガイド + 日次キーワード記事 */
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
  // 日次キーワード記事（人手リライト前提で公開）
  'daily-shinjuku-osusume': {
    file: '960-daily-新宿-メンズエステ-おすすめ',
    title: '新宿メンズエステのおすすめの探し方',
  },
  'daily-ikebukuro-ryokin': {
    file: '961-daily-池袋-メンズエステ-料金',
    title: '池袋メンズエステの料金の見方',
  },
  'daily-yokohama-kuchikomi': {
    file: '962-daily-横浜-メンズエステ-口コミ',
    title: '横浜メンズエステの口コミの見方',
  },
  'daily-funabashi-osusume': {
    file: '963-daily-船橋-メンズエステ-おすすめ',
    title: '船橋メンズエステのおすすめの選び方',
  },
  'daily-nishifunabashi-kuchikomi': {
    file: '964-daily-西船橋-メンズエステ-口コミ',
    title: '西船橋メンズエステの口コミの見方',
  },
  'daily-chiba-erabikata': {
    file: '965-daily-千葉-メンズエステ-選び方',
    title: '千葉メンズエステの選び方',
  },
  'daily-funabashi-ryokin': {
    file: '966-daily-船橋-メンズエステ-料金',
    title: '船橋メンズエステの料金の見方',
  },
  'daily-kashiwa-osusume': {
    file: '967-daily-柏-メンズエステ-おすすめ',
    title: '柏メンズエステのおすすめの探し方',
  },
  'daily-matsudo-kuchikomi': {
    file: '968-daily-松戸-メンズエステ-口コミ',
    title: '松戸メンズエステの口コミの見方',
  },
  'daily-ichikawa-erabikata': {
    file: '969-daily-市川-メンズエステ-選び方',
    title: '市川メンズエステの選び方',
  },
  'daily-funabashi-nishifunabashi-docchi': {
    file: '970-daily-船橋-西船橋-メンズエステ-どっち',
    title: '船橋と西船橋どっち？メンズエステ比較',
  },
  'daily-chiba-hajimete': {
    file: '971-daily-千葉-メンズエステ-初めて',
    title: '千葉で初めてのメンズエステ',
  },
  'daily-nishifunabashi-ryokin': {
    file: '972-daily-西船橋-メンズエステ-料金',
    title: '西船橋メンズエステの料金の見方',
  },
  'daily-tsudanuma-osusume': {
    file: '973-daily-津田沼-メンズエステ-おすすめ',
    title: '津田沼メンズエステのおすすめの探し方',
  },
  'daily-motoyawata-kuchikomi': {
    file: '974-daily-本八幡-メンズエステ-口コミ',
    title: '本八幡メンズエステの口コミの見方',
  },
  'daily-chiba-soba': {
    file: '975-daily-千葉-メンズエステ-相場',
    title: '千葉メンズエステの相場の見方',
  },
  'daily-funabashi-hajimete-40s': {
    file: '976-daily-船橋-メンズエステ-初めて-40代',
    title: '船橋で40代から始めるメンズエステ',
  },
  'daily-kashiwa-ryokin': {
    file: '977-daily-柏-メンズエステ-料金',
    title: '柏メンズエステの料金の見方',
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
