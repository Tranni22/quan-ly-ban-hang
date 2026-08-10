import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Coffee, Lock, User, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginModal() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (!res.success) {
      setError(res.message);
    }
  };

  const fillQuickAccount = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-coffee-800 to-coffee-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md mb-3 border border-white/20 shadow-inner">
            <Coffee className="w-9 h-9 text-amber-200" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">COFFEE POS SYSTEM</h1>
          <p className="text-coffee-100 text-sm mt-1">Phần mềm Quản lý Quán Cà Phê Professional</p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username (vd: admin, staff1)"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-coffee-600 focus:ring-2 focus:ring-coffee-600/20 outline-none transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-coffee-600 focus:ring-2 focus:ring-coffee-600/20 outline-none transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-coffee-700 hover:bg-coffee-800 active:bg-coffee-900 text-white font-semibold rounded-xl shadow-lg shadow-coffee-700/20 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                </>
              )}
            </button>
          </form>

          {/* Chọn nhanh tài khoản mẫu */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-center font-medium text-gray-500 mb-3 uppercase tracking-wider">
              ⚡ Đăng nhập nhanh tài khoản mẫu
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin', 'admin123')}
                className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Quản Lý (Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('staff1', 'staff123')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Nhân Viên Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
