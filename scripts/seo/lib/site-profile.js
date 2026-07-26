/**
 * サイト横断SEO運用の共通方針（mensesthe-rank / deli-rank など）
 * ドメイン固有値は SITE_SEO_PROFILE で差し替える
 */

export const SITE_SEO_PROFILE = {
  siteKey: 'mensesthe-rank',
  siteName: 'メンズエステ情報ランキング',
  siteUrl: 'https://mensesthe-rank.jp',
  verticalLabel: 'メンズエステ',
  inquiryLabel: '電話・予約・掲載申込',
  // 姉妹メディアは運営者ページでのみ紹介（総当たり相互リンク禁止）
  sisterMedia: [
    {
      name: 'デリヘル情報ランキング',
      url: 'https://deli-rank.jp',
      note: '同運営の別ジャンル比較メディア（必要時のみ言及）',
    },
  ],
  distribution: {
    xTwitter: 'disabled', // 凍結リスクのため集客投稿しない
    primary: 'organic_search',
  },
  dailyArticleLimit: 3,
};

/** クロスリリンク禁止事項（コードと運用の両方の正） */
export const CROSS_LINK_POLICY = {
  allow: [
    '運営者・メディア紹介ページでの一覧',
    '記事本文で編集上自然な紹介（押し売りリンクにしない）',
    '著者プロフィールからの関連メディア',
  ],
  deny: [
    '全サイトフッターでの相互リンク常設',
    '無関係ジャンルへの機械的な内部リンク量産',
    '同一文言・同一アンカーのサイト間コピー',
  ],
};
