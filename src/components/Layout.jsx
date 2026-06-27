import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Search, ShoppingBag, Users, Settings, LogOut, Package,
  CalendarDays, History, Zap, Newspaper, MoreHorizontal, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: '대시보드' },
  { path: '/calendar', icon: CalendarDays, label: '캘린더' },
  { path: '/search', icon: Search, label: '검색' },
  { path: '/products', icon: Package, label: '상품' },
  { path: '/sales', icon: ShoppingBag, label: '판매등록' },
  { path: '/customers', icon: Users, label: '고객' },
  { path: '/history', icon: History, label: '구매이력' },
  { path: '/sales-point', icon: Zap, label: '세일즈포인트' },
  { path: '/news', icon: Newspaper, label: '뉴스' },
  { path: '/settings', icon: Settings, label: '설정' },
];

// 모바일 하단 탭에 노출할 주요 메뉴 (나머지는 "더보기")
const BOTTOM_PATHS = ['/', '/customers', '/sales', '/sales-point'];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const brandName = localStorage.getItem('crm_brand') || 'AmorePacific';

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const go = (path) => { setMoreOpen(false); navigate(path); };

  const bottomItems = NAV_ITEMS.filter((i) => BOTTOM_PATHS.includes(i.path));
  const moreItems = NAV_ITEMS.filter((i) => !BOTTOM_PATHS.includes(i.path));

  return (
    <div className="min-h-screen flex">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="w-64 bg-white border-r border-gray-100 flex-col hidden md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider">{brandName}</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path)
                    ? 'bg-text text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-neon-pink'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-500 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
          >
            <LogOut size={20} />
            <span className="font-medium">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* ===== Mobile Top Bar ===== */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 flex items-center justify-between px-4 h-14"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <h1 className="text-lg font-bold tracking-wide truncate">{brandName}</h1>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2">
          <LogOut size={20} />
        </button>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-[4.5rem] md:pt-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* ===== Mobile Bottom Tab Bar ===== */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 flex justify-around items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className={`flex-1 flex flex-col items-center justify-center py-2 ${active ? 'text-neon-pink' : 'text-gray-400'}`}
            >
              <Icon size={22} />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-2 ${moreOpen ? 'text-neon-pink' : 'text-gray-400'}`}
        >
          <MoreHorizontal size={22} />
          <span className="text-[10px] mt-0.5 font-medium">더보기</span>
        </button>
      </nav>

      {/* ===== Mobile "더보기" Sheet ===== */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 pb-8 shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">메뉴</h2>
              <button onClick={() => setMoreOpen(false)} className="text-gray-400 p-1"><X size={22} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all ${
                      active ? 'border-neon-pink bg-pink-50 text-neon-pink' : 'border-gray-100 bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Icon size={24} />
                    <span className="text-xs mt-1.5 font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
