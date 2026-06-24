import React, { useState, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  MapPin,
  Menu,
  Search,
  TrendingUp,
  Clock,
  Briefcase,
  X,
  ExternalLink,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { useShops } from './hooks/useShops';
import ShopDetail from './pages/ShopDetail';
import ViewToggle from './components/ViewToggle';
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from './constants';

const RANK_STYLES = {
  1: 'bg-amber-500 text-white',
  2: 'bg-slate-400 text-white',
  3: 'bg-amber-700 text-white',
  default: 'bg-slate-100 text-slate-600 border border-slate-200',
};

function RankBadge({ rank }) {
  const style = RANK_STYLES[rank] || RANK_STYLES.default;
  return (
    <div
      className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${style}`}
    >
      {rank}
    </div>
  );
}

function RankingRow({ shop, rank }) {
  const tags = shop.seo_tags || [];

  return (
    <Link
      to={`/shops/${shop.id}`}
      className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <RankBadge rank={rank} />

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
          {shop.shop_name}
        </h3>
        <div className="flex items-center text-xs text-slate-500 mt-0.5">
          <MapPin className="w-3 h-3 mr-0.5 flex-shrink-0" />
          <span className="truncate">{shop.area_name}</span>
        </div>
        {shop.main_concept && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{shop.main_concept}</p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] bg-blue-50 text-blue-600 rounded px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 flex-shrink-0" />
    </Link>
  );
}

function Header({ onMenuClick, areas, areasWithData, selectedArea, onAreaChange }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-900 leading-tight truncate">{SITE_NAME}</p>
            <p className="text-[10px] text-slate-500 leading-tight hidden sm:block">{SITE_TAGLINE}</p>
          </div>
        </Link>

        <button
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
          onClick={onMenuClick}
          aria-label="メニュー"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => onAreaChange('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
            selectedArea === 'all'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
          }`}
        >
          全国
        </button>
        {areas.map((area) => {
          const hasData = areasWithData.has(area.slug);
          return (
            <button
              key={area.slug}
              onClick={() => hasData && onAreaChange(area.slug)}
              disabled={!hasData}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                selectedArea === area.slug
                  ? 'bg-blue-600 text-white border-blue-600'
                  : hasData
                    ? 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
              }`}
            >
              {area.name}
              {!hasData && <span className="ml-1 text-[9px]">準備中</span>}
            </button>
          );
        })}
      </div>
    </header>
  );
}

function Footer({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'ranking', icon: TrendingUp, label: 'ランキング' },
    { id: 'new', icon: Clock, label: '新着' },
    { id: 'jobs', icon: Briefcase, label: '求人' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-safe">
      <div className="max-w-3xl mx-auto flex items-center justify-around px-4 py-2">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
              activeTab === id ? 'text-blue-600' : 'text-slate-400'
            }`}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-0.5">{label}</span>
          </button>
        ))}
      </div>
    </footer>
  );
}

function SideMenu({ isOpen, onClose }) {
  const items = [
    { icon: TrendingUp, label: '人気ランキング', href: '/' },
    { icon: MapPin, label: 'エリアから探す', href: '/' },
    { icon: Briefcase, label: '求人を探す（準備中）', href: null },
    { icon: Search, label: '掲載について（準備中）', href: null },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-72 z-50 bg-white border-l border-slate-200 transform transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-900">メニュー</span>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav className="p-3">
          {items.map((item, i) => {
            const content = (
              <>
                <item.icon className="w-5 h-5 text-blue-600" />
                <span className="text-slate-700 text-sm">{item.label}</span>
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={i}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={i}
                className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 cursor-not-allowed"
              >
                {content}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm">
            店舗様ログイン（準備中）
          </button>
        </div>
      </div>
    </>
  );
}

function TopPage() {
  const [activeTab, setActiveTab] = useState('ranking');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState('all');

  const { shops, areas, areasWithData, loading, error } = useShops(selectedArea);

  const rankedShops = useMemo(() => {
    if (activeTab === 'new') {
      return [...shops].reverse();
    }
    return shops;
  }, [shops, activeTab]);

  const selectedAreaName =
    selectedArea === 'all'
      ? '全国'
      : areas.find((a) => a.slug === selectedArea)?.name || '';

  const pageTitle =
    selectedArea === 'all'
      ? `${SITE_NAME}｜${SITE_TAGLINE}`
      : `${selectedAreaName}のメンズエステランキング｜${SITE_NAME}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:type" content="website" />
      </Helmet>

      <Header
        onMenuClick={() => setMenuOpen(true)}
        areas={areas}
        areasWithData={areasWithData}
        selectedArea={selectedArea}
        onAreaChange={setSelectedArea}
      />

      <main className="max-w-3xl mx-auto pt-36 pb-24 px-4">
        <div className="mb-5 p-4 bg-white border border-slate-200 rounded-xl">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            {selectedAreaName}のメンズエステランキング
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            人気店舗をランキング形式で掲載。口コミ・求人情報も順次追加予定。
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            {activeTab === 'ranking' ? '人気ランキング' : activeTab === 'new' ? '新着店舗' : '求人'}
          </h2>
          <span className="text-xs text-slate-400">{rankedShops.length}件</span>
        </div>

        {activeTab === 'jobs' ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">求人ページは準備中です</p>
            <p className="text-sm text-slate-400 mt-1">セラピスト求人を順次掲載予定</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-xl">
            データの取得に失敗しました
          </div>
        ) : (
          <ViewToggle shops={rankedShops}>
            {rankedShops.length > 0 ? (
              <div className="flex flex-col gap-2">
                {rankedShops.map((shop, index) => (
                  <RankingRow
                    key={shop.id || shop.twitter_id || index}
                    shop={shop}
                    rank={index + 1}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-xl">
                このエリアの店舗はまだ登録されていません
              </div>
            )}
          </ViewToggle>
        )}
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TopPage />} />
      <Route path="/shops/:id" element={<ShopDetail />} />
    </Routes>
  );
}
