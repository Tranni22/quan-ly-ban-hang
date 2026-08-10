import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Users, Plus, CreditCard, RefreshCw, Coffee, AlertCircle, Clock } from 'lucide-react';

export default function TableMap({ onSelectTable, onCheckoutTable }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [error, setError] = useState('');

  const loadTables = async () => {
    setLoading(true);
    try {
      const res = await apiService.getTables();
      if (res.success) {
        setTables(res.data);
      }
    } catch (err) {
      setError('Lỗi tải danh sách bàn!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
    const interval = setInterval(loadTables, 5000); // Auto refresh mỗi 5s
    return () => clearInterval(interval);
  }, []);

  const areas = ['ALL', ...new Set(tables.map((t) => t.area))];

  const filteredTables = selectedArea === 'ALL' ? tables : tables.filter((t) => t.area === selectedArea);

  const emptyCount = tables.filter((t) => t.status === 'EMPTY').length;
  const servingCount = tables.filter((t) => t.status === 'SERVING').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Coffee className="w-6 h-6 text-coffee-600" />
            Sơ đồ bàn của bố thắng code tặng idol duy ghi
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Chọn bàn để gọi món hoặc thực hiện thanh toán</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Trống: {emptyCount} bàn</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Đang phục vụ: {servingCount} bàn</span>
          </div>

          <button
            onClick={loadTables}
            title="Tải lại sơ đồ"
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Area Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedArea === area
                ? 'bg-coffee-800 text-amber-200 shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {area === 'ALL' ? '🗺️ Tất cả khu vực' : `📍 ${area}`}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      {loading && tables.length === 0 ? (
        <div className="p-12 text-center text-gray-400">Đang tải danh sách bàn...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTables.map((table) => {
            const isServing = table.status === 'SERVING';
            const order = table.currentOrder;

            return (
              <div
                key={table.id}
                className={`relative rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between h-44 shadow-sm hover:shadow-md ${
                  isServing
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-white border-gray-200 hover:border-coffee-500 hover:bg-coffee-50/20'
                }`}
              >
                {/* Top Status Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      isServing
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isServing ? 'Đang dùng' : 'Bàn trống'}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                    <Users className="w-3 h-3" /> {table.seats}
                  </span>
                </div>

                {/* Center Table Info */}
                <div className="my-2 text-center">
                  <h3 className="text-lg font-bold text-gray-800">{table.name}</h3>
                  <p className="text-[11px] text-gray-500 font-medium">{table.area}</p>

                  {isServing && order && (
                    <div className="mt-1.5 inline-block bg-amber-200/60 px-2 py-1 rounded-lg text-amber-900 font-extrabold text-xs">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="mt-auto pt-2 border-t border-gray-100/80">
                  {isServing ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => onSelectTable(table)}
                        className="w-full py-1.5 bg-white border border-amber-300 text-amber-900 font-bold text-[11px] rounded-lg hover:bg-amber-100 transition flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Gọi
                      </button>
                      <button
                        onClick={() => onCheckoutTable(table, order)}
                        className="w-full py-1.5 bg-coffee-700 hover:bg-coffee-800 text-white font-bold text-[11px] rounded-lg shadow transition flex items-center justify-center gap-1"
                      >
                        <CreditCard className="w-3 h-3" /> Tính
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectTable(table)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Mở Bàn
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
