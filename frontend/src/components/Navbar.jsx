import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Coffee, LayoutGrid, ShoppingBag, BarChart3, UtensilsCrossed, LogOut, User } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-coffee-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('tables')}>
            <div className="w-10 h-10 rounded-xl bg-coffee-700 border border-coffee-500/30 flex items-center justify-center shadow-inner">
              <Coffee className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight text-amber-100">CAFE POS</h1>
              <p className="text-[10px] text-coffee-300 font-medium">Quản Lý & Bán Hàng</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'tables'
                  ? 'bg-coffee-700 text-amber-200 shadow-sm'
                  : 'text-coffee-200 hover:bg-coffee-800 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Sơ Đồ Bàn</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'pos'
                  ? 'bg-coffee-700 text-amber-200 shadow-sm'
                  : 'text-coffee-200 hover:bg-coffee-800 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Gọi Món (POS)</span>
            </button>

            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'menu'
                      ? 'bg-coffee-700 text-amber-200 shadow-sm'
                      : 'text-coffee-200 hover:bg-coffee-800 hover:text-white'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span className="hidden sm:inline">Thực Đơn</span>
                </button>

                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'dashboard'
                      ? 'bg-coffee-700 text-amber-200 shadow-sm'
                      : 'text-coffee-200 hover:bg-coffee-800 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Báo Cáo</span>
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3 border-l border-coffee-800 pl-4">
            <div className="flex items-center gap-2.5">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.fullName}
                className="w-8 h-8 rounded-full border border-coffee-500 object-cover"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-gray-100">{user?.fullName}</div>
                <div className="text-[10px] text-amber-300 uppercase font-semibold">
                  {user?.role === 'admin' ? ' Quản Lý' : ' Nhân Viên'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-2 text-coffee-300 hover:text-red-300 hover:bg-coffee-800 rounded-xl transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
