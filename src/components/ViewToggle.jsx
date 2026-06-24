import { useState, lazy, Suspense } from 'react';
import { List, Map as MapIcon } from 'lucide-react';

const Map = lazy(() => import('./Map'));

export default function ViewToggle({ shops, children }) {
  const [viewMode, setViewMode] = useState('list');

  const shopsWithLocation = shops.filter(
    (shop) =>
      shop.lat != null &&
      shop.lng != null &&
      !isNaN(shop.lat) &&
      !isNaN(shop.lng)
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
          }`}
        >
          <List className="w-4 h-4" />
          リスト
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            viewMode === 'map'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          地図
          {shopsWithLocation.length > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                viewMode === 'map' ? 'bg-blue-500' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {shopsWithLocation.length}
            </span>
          )}
        </button>
      </div>

      {viewMode === 'list' ? (
        children
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          {shopsWithLocation.length > 0 ? (
            <Suspense
              fallback={
                <div className="h-[500px] flex items-center justify-center bg-slate-50">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">地図を読み込み中...</p>
                  </div>
                </div>
              }
            >
              <div className="h-[500px]">
                <Map shops={shopsWithLocation} />
              </div>
            </Suspense>
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <MapIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">位置情報のある店舗がありません</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
