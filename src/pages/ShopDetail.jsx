import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MapPin, ExternalLink, Trophy, Tag } from 'lucide-react';
import { useShop } from '../hooks/useShop';
import { SITE_NAME } from '../constants';

const getAvatarUrl = (twitterId) => {
  if (!twitterId) return 'https://placehold.co/400x400/e2e8f0/94a3b8?text=No+Image';
  const cleanId = twitterId.replace('@', '');
  return `https://unavatar.io/twitter/${cleanId}`;
};

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { shop, loading, error } = useShop(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <p className="text-slate-500 mb-4">店舗が見つかりませんでした</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          トップに戻る
        </button>
      </div>
    );
  }

  const tags = shop.seo_tags || [];
  const avatarUrl = getAvatarUrl(shop.twitter_id);
  const pageTitle = `${shop.shop_name}｜${shop.area_name}メンズエステ｜${SITE_NAME}`;
  const pageDescription = shop.main_concept
    ? `${shop.shop_name}は${shop.area_name}エリアのメンズエステ。${shop.main_concept}`
    : `${shop.shop_name}は${shop.area_name}エリアのメンズエステ店です。`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
      </Helmet>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 hidden sm:block">{SITE_NAME}</span>
          </Link>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto pt-16 pb-8 px-4">
        <div className="flex flex-col items-center pt-6 pb-4">
          <div className="w-32 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <img
              src={avatarUrl}
              alt={shop.shop_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x400/e2e8f0/94a3b8?text=No+Image';
              }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <h1 className="text-xl font-bold text-center text-slate-900 mb-2">{shop.shop_name}</h1>

          <div className="flex items-center justify-center text-sm text-slate-500 mb-4">
            <MapPin className="w-4 h-4 mr-1 text-blue-500" />
            <span>{shop.area_name}エリア</span>
          </div>

          {shop.main_concept && (
            <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-slate-700 text-sm text-center leading-relaxed">{shop.main_concept}</p>
            </div>
          )}

          {tags.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-center gap-1 mb-2 text-slate-400">
                <Tag className="w-3.5 h-3.5" />
                <span className="text-xs">タグ</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {shop.website_url && (
            <a
              href={shop.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-center flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              公式サイトで予約
            </a>
          )}

          {shop.twitter_id && (
            <a
              href={`https://x.com/${shop.twitter_id.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-slate-800 text-white font-bold rounded-xl text-center flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Xで詳細を見る
            </a>
          )}

          <Link
            to="/"
            className="w-full py-3.5 bg-white text-slate-700 font-medium rounded-xl text-center flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ランキング一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
