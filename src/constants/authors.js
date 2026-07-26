/** 記事の著者・編集方針（エンタメ寄りの信頼＝キャラ立ち） */

export const AUTHORS = {
  suzuki: {
    id: 'suzuki',
    name: '鈴木',
    gender: 'male',
    role: '元メンズエステ勤務・編集担当',
    bio: '現場出身の編集です！みている方がいかに失敗をしないで、お店というより、いいセラピと出会えるかに特化して魂込めて編集頑張ってます！',
    tagline: '現場出身の案内役',
    voice:
      '距離が近い楽しい系の案内役。友だち感あり。説教や会社広報っぽい言い回しは禁止。',
    urlPath: '/about#author-suzuki',
    aboutLabel: '鈴木について',
  },
  tanaka: {
    id: 'tanaka',
    name: '田中',
    gender: 'female',
    role: '元セラピスト・編集担当',
    bio: '現場で施術してた側の人間です。客目線のお世辞より、「実際どうだったか」をハッキリ書きます。気持ちいい話もするけど、避けた方がいい店の気配も逃がしません。姉御肌で面倒見ます。',
    tagline: 'はっきりいう系の姉御',
    voice:
      'はっきりいう系の姉御肌。遠慮のない断定口調だが説教臭くしない。女の元セラピ視点で現場感を出す。',
    urlPath: '/about#author-tanaka',
    aboutLabel: '田中について',
  },
};

export const DEFAULT_AUTHOR = AUTHORS.suzuki;

export const AUTHOR_LIST = Object.values(AUTHORS);

/** 名前または id から著者を解決。なければ DEFAULT */
export function resolveAuthor(nameOrId) {
  if (!nameOrId) return DEFAULT_AUTHOR;
  const key = String(nameOrId).trim();
  const byId = AUTHORS[key.toLowerCase()];
  if (byId) return byId;
  const byName = AUTHOR_LIST.find((a) => a.name === key);
  return byName || DEFAULT_AUTHOR;
}

/**
 * 記事番号・意図でバランスよく割当。
 * 口コミ・選び方 → 田中（現場セラピ視点）
 * それ以外 → 鈴木 / 番号が偶数なら田中で交互に近づける
 */
export function pickAuthorForOpportunity(opportunity = {}, articleNumber = 0) {
  const query = `${opportunity.query || ''} ${opportunity.type || ''}`.toLowerCase();
  if (/口コミ|評判|選び方|体験|セラピスト|施術/.test(query)) {
    return AUTHORS.tanaka;
  }
  if (/料金|費用|相場|おすすめ|ランキング/.test(query)) {
    return AUTHORS.suzuki;
  }
  return articleNumber % 2 === 0 ? AUTHORS.tanaka : AUTHORS.suzuki;
}
