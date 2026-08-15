import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { SkeletonTableGrid } from './SkeletonLoader';
import ReceiptInvoice from './ReceiptInvoice';
import {
  Users,
  Plus,
  CreditCard,
  RefreshCw,
  Coffee,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  GitMerge,
  Printer,
  Check,
  X,
  CheckCircle2,
  Receipt
} from 'lucide-react';

export default function TableMap({ onSelectTable, onCheckoutTable }) {
  const cachedData = apiService.getCachedTables()?.data;
  const [tables, setTables] = useState(cachedData || []);
  const [loading, setLoading] = useState(!cachedData || cachedData.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  // Modal Chuyển Bàn
  const [transferFromTable, setTransferFromTable] = useState(null);
  const [targetTransferTableId, setTargetTransferTableId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Modal Gộp Bàn
  const [mergeFromTable, setMergeFromTable] = useState(null);
  const [targetMergeTableId, setTargetMergeTableId] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // In Phiếu Tạm Tính
  const [provisionalReceiptData, setProvisionalReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const loadTables = async (isBackground = false) => {
    if (!isBackground) {
      if (tables.length === 0) setLoading(true);
      else setIsRefreshing(true);
    }
    try {
      const res = await apiService.getTables();
      if (res.success) {
        setTables(res.data || []);
      }
    } catch (err) {
      setError('Lỗi tải danh sách bàn!');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTables(tables.length > 0);
    const interval = setInterval(() => loadTables(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const areas = ['ALL', ...new Set((tables || []).map((t) => t.area))];
  const filteredTables = selectedArea === 'ALL' ? (tables || []) : (tables || []).filter((t) => t.area === selectedArea);

  const emptyCount = (tables || []).filter((t) => t.status === 'EMPTY').length;
  const servingCount = (tables || []).filter((t) => t.status === 'SERVING').length;

  // Xử lý mở Modal Chuyển Bàn
  const handleOpenTransfer = (table) => {
    const emptyTables = tables.filter((t) => t.status === 'EMPTY' && t.id !== table.id);
    if (emptyTables.length === 0) {
      alert('Hiện không có bàn nào còn trống để chuyển sang!');
      return;
    }
    setTransferFromTable(table);
    setTargetTransferTableId(String(emptyTables[0].id));
  };

  // Xác nhận chuyển bàn
  const handleConfirmTransfer = async () => {
    if (!transferFromTable?.id || !targetTransferTableId) return;
    setIsTransferring(true);
    try {
      const res = await apiService.transferTable(transferFromTable.id, Number(targetTransferTableId));
      if (res.success) {
        setNotification(`✅ ${res.message}`);
        setTimeout(() => setNotification(''), 4000);
        setTransferFromTable(null);
        await loadTables(false);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi chuyển bàn!');
    } finally {
      setIsTransferring(false);
    }
  };

  // Xử lý mở Modal Gộp Bàn
  const handleOpenMerge = (table) => {
    const servingTables = tables.filter((t) => t.status === 'SERVING' && t.id !== table.id);
    if (servingTables.length === 0) {
      alert('Hiện không có bàn đang phục vụ nào khác để gộp vào!');
      return;
    }
    setMergeFromTable(table);
    setTargetMergeTableId(String(servingTables[0].id));
  };

  // Xác nhận gộp bàn
  const handleConfirmMerge = async () => {
    if (!mergeFromTable?.id || !targetMergeTableId) return;
    setIsMerging(true);
    try {
      const res = await apiService.mergeTable(mergeFromTable.id, Number(targetMergeTableId));
      if (res.success) {
        setNotification(`✅ ${res.message}`);
        setTimeout(() => setNotification(''), 4000);
        setMergeFromTable(null);
        await loadTables(false);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi gộp bàn!');
    } finally {
      setIsMerging(false);
    }
  };

  // In phiếu tạm tính trực tiếp từ sơ đồ bàn
  const handlePrintProvisionalFromMap = async (table) => {
    setLoadingReceipt(true);
    try {
      const res = await apiService.getTableOrder(table.id);
      if (res.success && res.data) {
        const order = res.data;
        const mockReceipt = {
          shopName: 'COFFEE POS - QUÁN CÀ PHÊ PHIN & ESPRESSO',
          shopAddress: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          shopPhone: '0908.123.456 - 028.3822.8888',
          isProvisional: true,
          order: {
            orderCode: order.orderCode || `ORD-TT-${order.id}`,
            tableName: `${table.name} (${table.area})`,
            customerName: order.customerName || 'Khách vãng lai',
            staffName: 'Nhân viên phục vụ',
            paidAt: new Date().toLocaleString('vi-VN'),
            totalAmount: order.totalAmount || 0,
            finalAmount: order.finalAmount || order.totalAmount || 0,
            discountPercent: order.discountPercent || 0,
            paymentMethod: 'CHƯA THANH TOÁN (TẠM TÍNH)',
            items: (order.items || []).map((i) => ({
              itemName: i.itemName,
              quantity: i.quantity,
              totalPrice: i.totalPrice,
              note: i.note
            }))
          }
        };
        setProvisionalReceiptData(mockReceipt);
      } else {
        alert('Bàn này chưa có món nào hoặc đơn hàng đã hoàn tất!');
      }
    } catch (err) {
      alert(err.message || 'Lỗi lấy thông tin phiếu tạm tính của bàn!');
    } finally {
      setLoadingReceipt(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-20 md:pb-0">
      {/* Toast thông báo */}
      {notification && (
        <div className="fixed top-18 right-4 z-50 p-4 bg-coffee-900 text-amber-200 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-coffee-700" />
            Sơ đồ bàn quán cà phê
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Quản lý phục vụ, chuyển bàn, gộp bàn và in phiếu tạm tính ra bàn tức thì
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Trống: {emptyCount} bàn</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Có khách: {servingCount} bàn</span>
          </div>

          <button
            onClick={() => loadTables(false)}
            title="Tải lại sơ đồ"
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition ml-auto sm:ml-0"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing || loading ? 'animate-spin text-coffee-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Area Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
              selectedArea === area
                ? 'bg-coffee-800 text-amber-200 shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {area === 'ALL' ? '🗺️ Tất cả khu vực' : `📍 ${area}`}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      {loading && tables.length === 0 ? (
        <SkeletonTableGrid count={12} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredTables.map((table) => {
            const isServing = table.status === 'SERVING';
            const order = table.currentOrder;

            return (
              <div
                key={table.id}
                className={`relative rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isServing
                    ? 'bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-white border-gray-200 hover:border-coffee-500 hover:bg-coffee-50/20'
                }`}
              >
                {/* Top Status Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] sm:text-[11px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                      isServing
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isServing ? '🟡 Đang phục vụ' : '🟢 Bàn trống'}
                  </span>
                  <span className="text-[11px] text-gray-500 flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5 text-gray-400" /> {table.seats} chỗ
                  </span>
                </div>

                {/* Center Table Info */}
                <div className="my-3 text-center">
                  <h3 className="text-base sm:text-lg font-black text-gray-900">{table.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">{table.area}</p>

                  {isServing && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-amber-200/70 px-2.5 py-1 rounded-xl text-amber-950 font-black text-xs sm:text-sm border border-amber-300 shadow-2xs">
                      {(order?.totalAmount || 0).toLocaleString('vi-VN')} đ
                    </div>
                  )}
                </div>

                {/* Actions Panel */}
                <div className="mt-auto pt-2.5 border-t border-gray-100 space-y-1.5">
                  {isServing ? (
                    <>
                      {/* 2 Nút chính: Gọi món & Thanh toán */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectTable(table)}
                          className="w-full py-2 bg-coffee-800 hover:bg-coffee-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-300" /> Gọi Món
                        </button>
                        <button
                          type="button"
                          onClick={() => onCheckoutTable(table, order)}
                          className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Tính Tiền
                        </button>
                      </div>

                      {/* 3 Nút nghiệp vụ chuyên nghiệp: In tạm tính, Chuyển bàn, Gộp bàn */}
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => handlePrintProvisionalFromMap(table)}
                          disabled={loadingReceipt}
                          title="In phiếu tạm tính cho khách xem"
                          className="py-1.5 px-1 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 font-bold text-[10px] sm:text-[11px] rounded-lg border border-gray-300 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Printer className="w-3 h-3 text-coffee-700 flex-shrink-0" />
                          <span>In Phiếu</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenTransfer(table)}
                          title="Chuyển sang bàn trống khác"
                          className="py-1.5 px-1 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 font-bold text-[10px] sm:text-[11px] rounded-lg border border-amber-200 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-amber-700 flex-shrink-0" />
                          <span>Chuyển</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenMerge(table)}
                          title="Gộp chung với bàn đang phục vụ khác"
                          className="py-1.5 px-1 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-900 font-bold text-[10px] sm:text-[11px] rounded-lg border border-indigo-200 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <GitMerge className="w-3 h-3 text-indigo-700 flex-shrink-0" />
                          <span>Gộp Bàn</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectTable(table)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Mở Bàn & Gọi Món
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Chuyển Bàn Trực Tiếp Từ Sơ Đồ */}
      {transferFromTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Chuyển Bàn Phục Vụ</h3>
                  <p className="text-xs text-gray-500">Chuyển toàn bộ đơn hàng sang bàn trống mới</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferFromTable(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-2xl space-y-1 text-xs">
              <div className="font-bold text-gray-700">
                Bàn nguồn hiện tại: <span className="text-amber-900 font-extrabold">{transferFromTable.name} ({transferFromTable.area})</span>
              </div>
              <div className="text-gray-600">
                Tổng tiền đơn đang chuyển: <span className="font-bold text-coffee-800">{(transferFromTable.currentOrder?.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Chọn bàn trống đích chuyển sang:
              </label>
              <select
                value={targetTransferTableId}
                onChange={(e) => setTargetTransferTableId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-coffee-900 outline-none focus:border-coffee-600 shadow-2xs"
              >
                {tables
                  .filter((t) => t.status === 'EMPTY' && t.id !== transferFromTable.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      🟢 {t.name} — Khu vực: {t.area} ({t.seats} chỗ)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTransferFromTable(null)}
                disabled={isTransferring}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={isTransferring || !targetTransferTableId}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isTransferring ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang chuyển...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Xác Nhận Chuyển</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gộp Bàn Trực Tiếp Từ Sơ Đồ */}
      {mergeFromTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-2xl">
                  <GitMerge className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Gộp Bàn Phục Vụ</h3>
                  <p className="text-xs text-gray-500">Gộp các món của bàn này vào một bàn đang có khách</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMergeFromTable(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/60 rounded-2xl space-y-1 text-xs">
              <div className="font-bold text-gray-700">
                Bàn nguồn cần gộp: <span className="text-indigo-900 font-extrabold">{mergeFromTable.name} ({mergeFromTable.area})</span>
              </div>
              <div className="text-gray-600">
                Tiền đơn gộp: <span className="font-bold text-coffee-800">{(mergeFromTable.currentOrder?.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Chọn bàn đích (Bàn đang phục vụ sẽ nhận gộp):
              </label>
              <select
                value={targetMergeTableId}
                onChange={(e) => setTargetMergeTableId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-indigo-950 outline-none focus:border-indigo-600 shadow-2xs"
              >
                {tables
                  .filter((t) => t.status === 'SERVING' && t.id !== mergeFromTable.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      🟡 {t.name} ({t.area}) — Đang có đơn: {(t.currentOrder?.totalAmount || 0).toLocaleString('vi-VN')} đ
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setMergeFromTable(null)}
                disabled={isMerging}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmMerge}
                disabled={isMerging || !targetMergeTableId}
                className="flex-1 py-2.5 bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isMerging ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang gộp...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Xác Nhận Gộp Bàn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal In Phiếu Tạm Tính Ngay Tại Sơ Đồ Bàn */}
      {provisionalReceiptData && (
        <ReceiptInvoice
          receiptData={provisionalReceiptData}
          onClose={() => setProvisionalReceiptData(null)}
        />
      )}
    </div>
  );
}
