/**
 * SEO 優先ハブの単一ソース。
 * エリアクラスター生成・ガイド queue・フッターナビ・ジャンル相互リンクがここを参照する。
 */

export const GUIDE_INTENTS = [
  { key: 'osusume', label: 'おすすめ', querySuffix: 'おすすめ' },
  { key: 'ryokin', label: '料金', querySuffix: '料金' },
  { key: 'hajimete', label: '初めて', querySuffix: '初めて' },
  { key: 'docchi', label: '比較', querySuffix: 'どっち' },
];

/**
 * @typedef {{
 *   areaSlug: string,
 *   name: string,
 *   regionSlug?: string,
 *   intents?: string[],
 *   neighbors?: { slug: string, name: string }[],
 *   genreHints?: string[],
 * }} SeoPriorityHub
 */

/** @type {SeoPriorityHub[]} */
export const SEO_PRIORITY_HUBS = [
  {
    areaSlug: 'shinjuku',
    name: '新宿',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'shibuya', name: '渋谷' },
      { slug: 'ikebukuro', name: '池袋' },
    ],
    genreHints: ['mature', 'luxury'],
  },
  {
    areaSlug: 'ikebukuro',
    name: '池袋',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'shinjuku', name: '新宿' },
      { slug: 'ueno', name: '上野' },
    ],
    genreHints: ['mature', 'asian-esthe'],
  },
  {
    areaSlug: 'shibuya',
    name: '渋谷',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'shinjuku', name: '新宿' },
      { slug: 'ebisu', name: '恵比寿' },
    ],
    genreHints: ['luxury', 'relaxation-only'],
  },
  {
    areaSlug: 'ueno',
    name: '上野',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin'],
    neighbors: [
      { slug: 'ikebukuro', name: '池袋' },
      { slug: 'akihabara', name: '秋葉原' },
    ],
    genreHints: ['asian-esthe', 'mature'],
  },
  {
    areaSlug: 'yokohama',
    name: '横浜',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'kawasaki', name: '川崎' },
      { slug: 'sakuragicho', name: '桜木町' },
    ],
    genreHints: ['mature', 'delivery-esthe'],
  },
  {
    areaSlug: 'kawasaki',
    name: '川崎',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin'],
    neighbors: [
      { slug: 'yokohama', name: '横浜' },
      { slug: 'shinjuku', name: '新宿' },
    ],
    genreHints: ['mature'],
  },
  {
    areaSlug: 'funabashi',
    name: '船橋',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin', 'hajimete', 'docchi'],
    neighbors: [
      { slug: 'nishifunabashi', name: '西船橋' },
      { slug: 'tsudanuma', name: '津田沼' },
    ],
    genreHints: ['mature', 'asian-esthe'],
  },
  {
    areaSlug: 'nishifunabashi',
    name: '西船橋',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin', 'hajimete', 'docchi'],
    neighbors: [
      { slug: 'funabashi', name: '船橋' },
      { slug: 'ichikawa', name: '市川' },
    ],
    genreHints: ['mature', 'luxury'],
  },
  {
    areaSlug: 'hachioji',
    name: '八王子',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'tachikawa', name: '立川' },
      { slug: 'machida', name: '町田' },
    ],
    genreHints: ['mature', 'relaxation-only'],
  },
  {
    areaSlug: 'tachikawa',
    name: '立川',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin'],
    neighbors: [
      { slug: 'hachioji', name: '八王子' },
      { slug: 'kokubunji', name: '国分寺' },
    ],
    genreHints: ['mature'],
  },
  {
    areaSlug: 'machida',
    name: '町田',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin'],
    neighbors: [
      { slug: 'hachioji', name: '八王子' },
      { slug: 'yokohama', name: '横浜' },
    ],
    genreHints: ['mature'],
  },
  {
    areaSlug: 'omiya',
    name: '大宮',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'urawa', name: '浦和' },
      { slug: 'kawagoe', name: '川越' },
    ],
    genreHints: ['mature', 'asian-esthe'],
  },
  {
    areaSlug: 'chiba',
    name: '千葉',
    regionSlug: 'kanto',
    intents: ['osusume', 'ryokin'],
    neighbors: [
      { slug: 'funabashi', name: '船橋' },
      { slug: 'tsudanuma', name: '津田沼' },
    ],
    genreHints: ['mature'],
  },
  {
    areaSlug: 'osaka',
    name: '大阪',
    regionSlug: 'kinki',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'osakakita', name: '梅田・北大阪' },
      { slug: 'osakaminami', name: '難波・南大阪' },
    ],
    genreHints: ['mature', 'asian-esthe', 'luxury'],
  },
  {
    areaSlug: 'osakakita',
    name: '梅田',
    regionSlug: 'kinki',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'osaka', name: '大阪' },
      { slug: 'osakaminami', name: '難波' },
    ],
    genreHints: ['luxury', 'mature'],
  },
  {
    areaSlug: 'osakaminami',
    name: '難波',
    regionSlug: 'kinki',
    intents: ['osusume', 'ryokin'],
    neighbors: [
      { slug: 'osakakita', name: '梅田' },
      { slug: 'shinsaibashi', name: '心斎橋' },
    ],
    genreHints: ['asian-esthe', 'mature'],
  },
  {
    areaSlug: 'kyoto',
    name: '京都',
    regionSlug: 'kinki',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'osaka', name: '大阪' },
      { slug: 'osakakita', name: '梅田' },
    ],
    genreHints: ['luxury', 'relaxation-only'],
  },
  {
    areaSlug: 'kobe',
    name: '神戸',
    regionSlug: 'kinki',
    intents: ['osusume', 'ryokin'],
    neighbors: [
      { slug: 'osaka', name: '大阪' },
      { slug: 'osakakita', name: '梅田' },
    ],
    genreHints: ['mature', 'luxury'],
  },
  {
    areaSlug: 'nagoya',
    name: '名古屋',
    regionSlug: 'tokai',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'sakae', name: '栄' },
      { slug: 'kanayama', name: '金山' },
    ],
    genreHints: ['mature', 'asian-esthe'],
  },
  {
    areaSlug: 'sakae',
    name: '栄',
    regionSlug: 'tokai',
    intents: ['osusume', 'ryokin'],
    neighbors: [
      { slug: 'nagoya', name: '名古屋' },
      { slug: 'kanayama', name: '金山' },
    ],
    genreHints: ['luxury', 'mature'],
  },
  {
    areaSlug: 'hakata',
    name: '博多',
    regionSlug: 'kyushu-okinawa',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [
      { slug: 'tenjin-station', name: '天神' },
      { slug: 'fukuoka', name: '福岡' },
    ],
    genreHints: ['mature', 'asian-esthe'],
  },
  {
    areaSlug: 'tenjin-station',
    name: '天神',
    regionSlug: 'kyushu-okinawa',
    intents: ['osusume', 'ryokin'],
    neighbors: [
      { slug: 'hakata', name: '博多' },
      { slug: 'fukuoka', name: '福岡' },
    ],
    genreHints: ['luxury', 'mature'],
  },
  {
    areaSlug: 'sapporo',
    name: '札幌',
    regionSlug: 'hokkaido',
    intents: ['osusume', 'ryokin', 'hajimete'],
    neighbors: [],
    genreHints: ['mature', 'asian-esthe'],
  },
  {
    areaSlug: 'sendai',
    name: '仙台',
    regionSlug: 'minami-tohoku',
    intents: ['osusume', 'ryokin'],
    neighbors: [],
    genreHints: ['mature'],
  },
  {
    areaSlug: 'hiroshima',
    name: '広島',
    regionSlug: 'chugoku',
    intents: ['osusume', 'ryokin'],
    neighbors: [],
    genreHints: ['mature'],
  },
];

export function getSeoPriorityHub(areaSlug) {
  return SEO_PRIORITY_HUBS.find((hub) => hub.areaSlug === areaSlug) || null;
}

export function getIntentByKey(key) {
  return GUIDE_INTENTS.find((intent) => intent.key === key) || null;
}

/** ガイド queue 用クエリ文字列 */
export function buildHubIntentQuery(hub, intentKey) {
  const intent = getIntentByKey(intentKey);
  if (!intent) return null;
  if (intentKey === 'docchi' && hub.neighbors?.[0]) {
    return `${hub.name} ${hub.neighbors[0].name} メンズエステ どっち`;
  }
  return `${hub.name} メンズエステ ${intent.querySuffix}`;
}

export function listHubGuideQueries() {
  const queries = [];
  for (const hub of SEO_PRIORITY_HUBS) {
    const intents = hub.intents || ['osusume', 'ryokin'];
    for (const intentKey of intents) {
      const query = buildHubIntentQuery(hub, intentKey);
      if (query) {
        queries.push({
          query,
          areaSlug: hub.areaSlug,
          intent: intentKey,
          region: hub.regionSlug || null,
        });
      }
    }
  }
  return queries;
}
