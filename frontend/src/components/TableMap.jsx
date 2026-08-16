import React, { useState, useEffect, useMemo } from 'react';
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
  const [transferAreaFilter, setTransferAreaFilter] = useState('ALL');
  const [isTransferring, setIsTransferring] = useState(false);

  // Modal Gộp Bàn
  const [mergeFromTable, setMergeFromTable] = useState(null);
  const [targetMergeTableId, setTargetMergeTableId] = useState('');
  const [mergeAreaFilter, setMergeAreaFilter] = useState('ALL');
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
    setTransferAreaFilter('ALL');
    setTransferFromTable(table);
    setTargetTransferTableId(String(emptyTables[0].id));
  };

  // Danh sách bàn trống cho Modal Chuyển Bàn sơ đồ
  const emptyTransferTables = useMemo(() => {
    if (!transferFromTable) return [];
    return tables.filter((t) => t.status === 'EMPTY' && t.id !== transferFromTable.id);
  }, [tables, transferFromTable]);

  const transferAreas = useMemo(() => {
    return ['ALL', ...new Set(emptyTransferTables.map((t) => t.area))];
  }, [emptyTransferTables]);

  const filteredTransferTables = useMemo(() => {
    if (transferAreaFilter === 'ALL') return emptyTransferTables;
    return emptyTransferTables.filter((t) => t.area === transferAreaFilter);
  }, [emptyTransferTables, transferAreaFilter]);

  // Xử lý mở Modal Gộp Bàn
  const handleOpenMerge = (table) => {
    const servingTables = tables.filter((t) => t.status === 'SERVING' && t.id !== table.id);
    if (servingTables.length === 0) {
      alert('Hiện không có bàn đang phục vụ nào khác để gộp vào!');
      return;
    }
    setMergeAreaFilter('ALL');
    setMergeFromTable(table);
    setTargetMergeTableId(String(servingTables[0].id));
  };

  // Danh sách bàn phục vụ cho Modal Gộp Bàn sơ đồ
  const servingMergeTables = useMemo(() => {
    if (!mergeFromTable) return [];
    return tables.filter((t) => t.status === 'SERVING' && t.id !== mergeFromTable.id);
  }, [tables, mergeFromTable]);

  const mergeAreas = useMemo(() => {
    return ['ALL', ...new Set(servingMergeTables.map((t) => t.area))];
  }, [servingMergeTables]);

  const filteredMergeTables = useMemo(() => {
    if (mergeAreaFilter === 'ALL') return servingMergeTables;
    return servingMergeTables.filter((t) => t.area === mergeAreaFilter);
  }, [servingMergeTables, mergeAreaFilter]);

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

      {/* Modal Chuyển Bàn Trực Tiếp Từ Sơ Đồ - Tối ưu toàn diện Mobile & Desktop */}
      {transferFromTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90dvh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-gray-100 animate-scaleUp overflow-hidden">
            {/* Thanh gạt trang trí mobile */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />

            {/* Header cố định */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
                  <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-gray-900 text-base truncate">Chuyển Bàn Phục Vụ</h3>
                  <p className="text-xs text-gray-500 truncate">Chuyển toàn bộ đơn từ {transferFromTable.name} sang bàn trống</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferFromTable(null)}
                className="p-2 text-gray-400 hover:text-gray-700 active:scale-90 rounded-xl transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thân cuộn mượt mà */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 touch-pan-y">
              {/* Thông tin bàn nguồn */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-1.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-semibold">Bàn nguồn hiện tại:</span>
                  <span className="text-amber-950 font-extrabold text-sm">{transferFromTable.name} ({transferFromTable.area})</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Tổng tiền đơn đang chuyển:</span>
                  <span className="font-bold text-coffee-800 text-xs">{(transferFromTable.currentOrder?.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Bộ chọn bàn trống đích */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-800">
                    Chọn bàn trống đích ({emptyTransferTables.length} bàn sẵn sàng):
                  </label>
                  {targetTransferTableId && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Đã chọn: {tables.find((t) => String(t.id) === String(targetTransferTableId))?.name}
                    </span>
                  )}
                </div>

                {/* Filter Tabs Khu vực */}
                {transferAreas.length > 2 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 no-scrollbar">
                    {transferAreas.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setTransferAreaFilter(area)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 touch-manipulation ${
                          transferAreaFilter === area
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {area === 'ALL' ? 'Tất cả khu vực' : area}
                      </button>
                    ))}
                  </div>
                )}

                {/* Grid thẻ bàn trống */}
                {filteredTransferTables.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 sm:max-h-60 overflow-y-auto overscroll-contain p-1 rounded-2xl bg-gray-50/80 border border-gray-200/80 touch-pan-y">
                    {filteredTransferTables.map((t) => {
                      const isSelected = String(t.id) === String(targetTransferTableId);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTargetTransferTableId(String(t.id))}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer active:scale-95 touch-manipulation min-h-[64px] ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400 shadow-sm'
                              : 'bg-white hover:bg-amber-50/60 border-gray-200 text-gray-800 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-black text-sm truncate">{t.name}</span>
                            <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                          </div>
                          <div className="flex items-center justify-between text-[11px] mt-1.5 opacity-90">
                            <span className="truncate">{t.area}</span>
                            <span className="shrink-0 font-medium">{t.seats} chỗ</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Không có bàn trống nào phù hợp với bộ lọc này.
                  </div>
                )}
              </div>
            </div>

            {/* Footer cố định */}
            <div className="flex items-center gap-2.5 p-4 sm:px-5 sm:py-3.5 border-t border-gray-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setTransferFromTable(null)}
                disabled={isTransferring}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={isTransferring || !targetTransferTableId}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
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

      {/* Modal Gộp Bàn Trực Tiếp Từ Sơ Đồ - Tối ưu toàn diện Mobile & Desktop */}
      {mergeFromTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90dvh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-gray-100 animate-scaleUp overflow-hidden">
            {/* Thanh gạt trang trí mobile */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />

            {/* Header cố định */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-2xl shrink-0">
                  <GitMerge className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-gray-900 text-base truncate">Gộp Bàn Phục Vụ</h3>
                  <p className="text-xs text-gray-500 truncate">Gộp đơn từ {mergeFromTable.name} vào bàn đang phục vụ khác</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMergeFromTable(null)}
                className="p-2 text-gray-400 hover:text-gray-700 active:scale-90 rounded-xl transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thân cuộn mượt mà */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 touch-pan-y">
              {/* Thông tin bàn nguồn */}
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl space-y-1.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-semibold">Bàn nguồn cần gộp:</span>
                  <span className="text-indigo-950 font-extrabold text-sm">{mergeFromTable.name} ({mergeFromTable.area})</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Tiền đơn gộp:</span>
                  <span className="font-bold text-coffee-800 text-xs">{(mergeFromTable.currentOrder?.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Bộ chọn bàn gộp đích */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-800">
                    Chọn bàn nhận gộp ({servingMergeTables.length} bàn đang phục vụ):
                  </label>
                  {targetMergeTableId && (
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Đã chọn: {tables.find((t) => String(t.id) === String(targetMergeTableId))?.name}
                    </span>
                  )}
                </div>

                {/* Filter Tabs Khu vực */}
                {mergeAreas.length > 2 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 no-scrollbar">
                    {mergeAreas.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setMergeAreaFilter(area)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 touch-manipulation ${
                          mergeAreaFilter === area
                            ? 'bg-indigo-700 text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {area === 'ALL' ? 'Tất cả khu vực' : area}
                      </button>
                    ))}
                  </div>
                )}

                {/* Grid danh sách thẻ bàn đang phục vụ */}
                {filteredMergeTables.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 sm:max-h-60 overflow-y-auto overscroll-contain p-1 rounded-2xl bg-gray-50/80 border border-gray-200/80 touch-pan-y">
                    {filteredMergeTables.map((t) => {
                      const isSelected = String(t.id) === String(targetMergeTableId);
                      const tableTotal = t.currentOrder?.totalAmount || 0;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTargetMergeTableId(String(t.id))}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer active:scale-95 touch-manipulation min-h-[70px] ${
                            isSelected
                              ? 'bg-indigo-700 text-white border-indigo-800 ring-2 ring-indigo-400 shadow-sm'
                              : 'bg-white hover:bg-indigo-50/60 border-gray-200 text-gray-800 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-black text-sm truncate">{t.name}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 shrink-0">
                              {t.area}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-2 font-bold">
                            <span className="opacity-80 text-[11px]">Đang có đơn:</span>
                            <span className={isSelected ? 'text-amber-300' : 'text-coffee-800'}>
                              {tableTotal.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Không có bàn nào phù hợp với bộ lọc này.
                  </div>
                )}
              </div>
            </div>

            {/* Footer cố định */}
            <div className="flex items-center gap-2.5 p-4 sm:px-5 sm:py-3.5 border-t border-gray-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setMergeFromTable(null)}
                disabled={isMerging}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmMerge}
                disabled={isMerging || !targetMergeTableId}
                className="flex-1 py-3 bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
