import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Coffee, LayoutGrid, ShoppingBag, BarChart3, UtensilsCrossed, LogOut, Sliders } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Top Main Navbar */}
      <header className="bg-coffee-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('tables')}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-coffee-700 border border-coffee-500/30 flex items-center justify-center shadow-inner">
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
              </div>
              <div>
                <h1 className="font-extrabold text-base sm:text-lg leading-none tracking-tight text-amber-100">
                  CAFE POS
                </h1>
                <p className="text-[9px] sm:text-[10px] text-coffee-300 font-medium">Quản Lý & Bán Hàng</p>
              </div>
            </div>

            {/* Navigation Links Desktop */}
            <nav className="hidden md:flex items-center space-x-1.5">
              <button
                onClick={() => setActiveTab('tables')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'tables'
                    ? 'bg-coffee-700 text-amber-200 shadow-sm'
                    : 'text-coffee-200 hover:bg-coffee-800 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Sơ Đồ Bàn</span>
              </button>

              <button
                onClick={() => setActiveTab('pos')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'pos'
                    ? 'bg-coffee-700 text-amber-200 shadow-sm'
                    : 'text-coffee-200 hover:bg-coffee-800 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Gọi Món (POS)</span>
              </button>

              {user?.role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('table-designer')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'table-designer'
                        ? 'bg-coffee-700 text-amber-200 shadow-sm'
                        : 'text-coffee-200 hover:bg-coffee-800 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Thiết Kế Bàn</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'menu'
                        ? 'bg-coffee-700 text-amber-200 shadow-sm'
                        : 'text-coffee-200 hover:bg-coffee-800 hover:text-white'
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Thực Đơn</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'dashboard'
                        ? 'bg-coffee-700 text-amber-200 shadow-sm'
                        : 'text-coffee-200 hover:bg-coffee-800 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Báo Cáo</span>
                  </button>
                </>
              )}
            </nav>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2.5 border-l border-coffee-800 pl-3">
              <div className="flex items-center gap-2">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={user?.fullName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-coffee-500 object-cover"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-gray-100">{user?.fullName}</div>
                  <div className="text-[10px] text-amber-300 uppercase font-semibold">
                    {user?.role === 'admin' ? ' Quản Lý' : ' Nhân Viên'}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Đăng xuất"
                className="p-1.5 text-coffee-300 hover:text-red-300 hover:bg-coffee-800 rounded-xl transition"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Siêu mượt cho Điện thoại) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-coffee-950/95 backdrop-blur-lg border-t border-coffee-800 text-white z-40 px-2 py-1.5 shadow-lg">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition ${
              activeTab === 'tables' ? 'text-amber-300 bg-coffee-800/80' : 'text-coffee-300 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Sơ Bàn</span>
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition ${
              activeTab === 'pos' ? 'text-amber-300 bg-coffee-800/80' : 'text-coffee-300 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Gọi Món</span>
          </button>

          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('table-designer')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition ${
                  activeTab === 'table-designer' ? 'text-amber-300 bg-coffee-800/80' : 'text-coffee-300 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Th.Kế Bàn</span>
              </button>

              <button
                onClick={() => setActiveTab('menu')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition ${
                  activeTab === 'menu' ? 'text-amber-300 bg-coffee-800/80' : 'text-coffee-300 hover:text-white'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Thực Đơn</span>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition ${
                  activeTab === 'dashboard' ? 'text-amber-300 bg-coffee-800/80' : 'text-coffee-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Báo Cáo</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
