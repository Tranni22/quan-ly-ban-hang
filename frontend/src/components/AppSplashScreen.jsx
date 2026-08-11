import React from 'react';
import { Coffee, Sparkles } from 'lucide-react';

export default function AppSplashScreen({ text = 'Đang khởi động Coffee POS...' }) {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-amber-950 via-coffee-900 to-amber-900 text-white flex flex-col items-center justify-center p-6 select-none font-sans transition-opacity duration-300">
      {/* Dynamic Background Glow */}
      <div className="absolute w-72 h-72 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Animated Coffee Cup Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shadow-2xl backdrop-blur-md animate-bounce">
            <Coffee className="w-10 h-10 text-amber-300" />
          </div>
          <Sparkles className="w-6 h-6 text-amber-400 absolute -top-2 -right-2 animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl font-black tracking-tight text-amber-100 flex items-center gap-2 mb-1">
          COFFEE POS <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">PRO</span>
        </h1>
        <p className="text-xs text-amber-200/70 mb-6 font-medium">Hệ Thống Quản Lý Gọi Món Siêu Tốc</p>

        {/* Smooth Loading Bar */}
        <div className="w-48 h-1.5 bg-amber-950/60 rounded-full overflow-hidden border border-amber-500/20 relative shadow-inner">
          <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-pulse w-full"></div>
        </div>

        <p className="mt-3 text-[11px] text-amber-300/80 font-medium tracking-wide animate-pulse">
          {text}
        </p>
      </div>
    </div>
  );
}
