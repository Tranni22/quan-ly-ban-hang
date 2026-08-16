import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { apiService } from '../services/api';
import { SkeletonMenuGrid } from './SkeletonLoader';
import ReceiptInvoice from './ReceiptInvoice';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  CreditCard,
  Coffee,
  X,
  Edit2,
  CheckCircle,
  AlertCircle,
  FileText,
  Check,
  ShoppingBag,
  ArrowRightLeft,
  GitMerge,
  Printer,
  ChevronRight,
  Receipt,
  RotateCcw
} from 'lucide-react';

// Thẻ món ăn trong thực đơn - Đã bọc React.memo để tránh re-render khi giỏ hàng thay đổi
const MenuItemCard = memo(function MenuItemCard({ item, onAddToCart }) {
  const [added, setAdded] = useState(false);

  const handleClick = useCallback(() => {
    if (!item?.isAvailable) return;
    onAddToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 400);
  }, [item, onAddToCart]);

  const priceFormatted = (item?.price || 0).toLocaleString('vi-VN');

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-transform duration-100 ease-out cursor-pointer flex flex-col justify-between select-none active:scale-[0.96] touch-manipulation ${
        !item?.isAvailable ? 'opacity-50 pointer-events-none' : 'hover:border-coffee-500'
      }`}
    >
      <div className="relative h-28 w-full bg-gray-100 overflow-hidden">
        <img
          src={item?.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'}
          alt={item?.name || 'Món ăn'}
          loading="lazy"
          decoding="async"
          width="200"
          height="112"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute top-2 right-2 bg-coffee-900/85 backdrop-blur-md text-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-amber-200/20 shadow-xs">
          {priceFormatted} đ
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-gray-800 text-xs line-clamp-1 group-hover:text-coffee-700 transition">
            {item?.name || 'Chưa tên'}
          </h4>
          <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{item?.description || ''}</p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer ${
            added
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-coffee-50 group-hover:bg-coffee-700 text-coffee-800 group-hover:text-white'
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5 animate-bounce" /> Đã thêm
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Thêm món
            </>
          )}
        </button>
      </div>
    </div>
  );
});

// Dòng món ăn trong giỏ hàng - Memoized & quản lý ghi chú cục bộ
const CartItemRow = memo(function CartItemRow({
  item,
  onUpdateQty,
  onUpdateNote,
  onRemoveItem
}) {
  const [localNote, setLocalNote] = useState(item?.note || '');

  useEffect(() => {
    setLocalNote(item?.note || '');
  }, [item?.note]);

  const handleNoteBlur = useCallback(() => {
    if (localNote !== item?.note) {
      onUpdateNote(item?.menuItemId, localNote);
    }
  }, [item?.menuItemId, item?.note, localNote, onUpdateNote]);

  const handleNoteKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }, []);

  const priceFormatted = (item?.price || 0).toLocaleString('vi-VN');

  return (
    <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-coffee-300 transition duration-150">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h5 className="font-bold text-gray-800 text-xs">{item?.name || 'Món'}</h5>
          <div className="text-[11px] text-coffee-700 font-semibold mt-0.5">
            {priceFormatted} đ
          </div>
        </div>

        {/* Nút tăng giảm số lượng */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl select-none">
          <button
            onClick={() => onUpdateQty(item?.menuItemId, -1)}
            className="w-6 h-6 rounded-lg bg-white shadow-2xs hover:bg-gray-200 active:scale-90 flex items-center justify-center text-gray-700 transition"
            title="Giảm số lượng"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-6 text-center font-bold text-xs">{item?.quantity || 1}</span>
          <button
            onClick={() => onUpdateQty(item?.menuItemId, 1)}
            className="w-6 h-6 rounded-lg bg-coffee-700 text-white shadow-2xs hover:bg-coffee-800 active:scale-90 flex items-center justify-center transition"
            title="Tăng số lượng"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <button
          onClick={() => onRemoveItem(item?.menuItemId)}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          title="Xóa món này"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Ghi chú riêng cho món */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
        <Edit2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={handleNoteBlur}
          onKeyDown={handleNoteKeyDown}
          placeholder="Ghi chú món (vd: ít đường, không đá...)"
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[11px] text-gray-600 outline-none focus:bg-white focus:border-coffee-500 transition"
        />
      </div>
    </div>
  );
});

export default function OrderPOS({ selectedTable, setSelectedTable, onCheckoutTable }) {
  const cachedMenuData = apiService.getCachedMenu();
  const cachedTablesData = apiService.getCachedTables();

  const [menu, setMenu] = useState(cachedMenuData?.allItems || []);
  const [categories, setCategories] = useState(cachedMenuData?.categories || []);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [tables, setTables] = useState(cachedTablesData?.data || []);

  // Cart / Order State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Khách vãng lai');
  const [orderNote, setOrderNote] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const [loading, setLoading] = useState(!cachedMenuData);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // Trạng thái modal xác nhận chống ấn nhầm cho nhân viên
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);
  const [showConfirmCheckoutModal, setShowConfirmCheckoutModal] = useState(false);

  // Trạng thái modal chuyển bàn & gộp bàn
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [targetTransferTableId, setTargetTransferTableId] = useState('');
  const [targetMergeTableId, setTargetMergeTableId] = useState('');
  const [transferAreaFilter, setTransferAreaFilter] = useState('ALL');
  const [mergeAreaFilter, setMergeAreaFilter] = useState('ALL');
  const [transferring, setTransferring] = useState(false);

  // Trạng thái phiếu tạm tính
  const [provisionalReceipt, setProvisionalReceipt] = useState(null);

  // Tải Menu & Tables
  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground && menu.length === 0) {
      setLoading(true);
    }
    try {
      const [menuRes, tablesRes] = await Promise.all([
        apiService.getMenu(),
        apiService.getTables()
      ]);

      if (menuRes.success) {
        setCategories(menuRes.categories || []);
        setMenu(menuRes.allItems || []);
      }

      if (tablesRes.success) {
        setTables(tablesRes.data || []);
        setSelectedTable((prev) => (!prev && tablesRes.data?.length > 0 ? tablesRes.data[0] : prev));
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu POS:', err);
    } finally {
      setLoading(false);
    }
  }, [menu.length, setSelectedTable]);

  useEffect(() => {
    loadData(menu.length > 0);
  }, []);

  // Tải Order của bàn đang được chọn
  useEffect(() => {
    if (!selectedTable) return;

    setCurrentOrderId(null);
    setCart([]);
    setOrderNote('');
    setCustomerName('Khách vãng lai');

    let isMounted = true;
    const loadTableOrder = async () => {
      setCartLoading(true);
      try {
        const res = await apiService.getTableOrder(selectedTable.id);
        if (!isMounted) return;

        if (res.success && res.data) {
          setCurrentOrderId(res.data.id);
          setCustomerName(res.data.customerName || 'Khách vãng lai');
          setOrderNote(res.data.note || '');
          const formattedItems = (res.data.items || []).map((item) => ({
            menuItemId: item.menuItemId,
            name: item.itemName,
            price: item.price,
            quantity: item.quantity,
            note: item.note || ''
          }));
          setCart(formattedItems);
        } else {
          setCurrentOrderId(null);
          setCart([]);
          setOrderNote('');
          setCustomerName('Khách vãng lai');
        }
      } catch (err) {
        console.error('Lỗi khi tải đơn hàng bàn:', err);
      } finally {
        if (isMounted) setCartLoading(false);
      }
    };

    loadTableOrder();
    return () => {
      isMounted = false;
    };
  }, [selectedTable?.id]);

  // Handlers tối ưu bằng useCallback
  const handleAddToCart = useCallback((item) => {
    if (!item?.id || cartLoading) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [
          ...prev,
          {
            menuItemId: item.id,
            name: item.name || 'Món',
            price: item.price || 0,
            quantity: 1,
            note: ''
          }
        ];
      }
    });
  }, [cartLoading]);

  const handleUpdateQty = useCallback((menuItemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menuItemId === menuItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  const handleUpdateNote = useCallback((menuItemId, noteText) => {
    setCart((prev) =>
      prev.map((item) =>
        item.menuItemId === menuItemId ? { ...item, note: noteText } : item
      )
    );
  }, []);

  const handleRemoveItem = useCallback((menuItemId) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const handleClearCart = useCallback(() => {
    if (cart.length > 0 && window.confirm('Bạn có chắc chắn muốn xóa hết các món đã chọn?')) {
      setCart([]);
    }
  }, [cart.length]);

  // Lưu đơn gọi món xuống backend
  const handleSaveOrder = useCallback(async () => {
    if (!selectedTable) {
      alert('Vui lòng chọn bàn trước!');
      return { success: false };
    }
    if (cart.length === 0) {
      alert('Vui lòng chọn ít nhất 1 món!');
      return { success: false };
    }

    setSaving(true);
    try {
      const res = await apiService.saveOrder({
        tableId: selectedTable.id,
        items: cart,
        customerName,
        note: orderNote
      });

      if (res.success) {
        const savedId = res.data?.id;
        if (savedId) {
          setCurrentOrderId(savedId);
        }
        setNotification('✅ Đã lưu đơn và gửi order tới Bar/Bếp thành công!');
        setTimeout(() => setNotification(''), 3000);
        setIsCartOpenMobile(false);
        return { success: true, orderId: savedId };
      }
      alert(res.message || 'Lưu đơn không thành công. Vui lòng thử lại!');
      return { success: false };
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu đơn!');
      return { success: false };
    } finally {
      setSaving(false);
    }
  }, [selectedTable, cart, customerName, orderNote]);

  // Filtered Menu dùng useMemo
  const filteredMenu = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return menu.filter((item) => {
      if (!item) return false;
      const matchCat = activeCategory === 'ALL' || item.categoryId === activeCategory;
      const matchSearch = !term || (item.name && item.name.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });
  }, [menu, activeCategory, searchTerm]);

  // Giỏ hàng Tổng cộng dùng useMemo
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item?.price || 0) * (item?.quantity || 1), 0);
  }, [cart]);

  const handleOpenSendModal = useCallback(() => {
    if (!selectedTable) {
      alert('Vui lòng chọn bàn trước!');
      return;
    }
    if (cart.length === 0) {
      alert('Vui lòng chọn ít nhất 1 món!');
      return;
    }
    setShowConfirmSendModal(true);
  }, [selectedTable, cart.length]);

  const handleOpenCheckoutModal = useCallback(() => {
    if (!selectedTable) {
      alert('Vui lòng chọn bàn trước!');
      return;
    }
    if (cart.length === 0) {
      alert('Vui lòng chọn món trước!');
      return;
    }
    setShowConfirmCheckoutModal(true);
  }, [selectedTable, cart.length]);

  const handleConfirmSend = useCallback(async () => {
    setShowConfirmSendModal(false);
    await handleSaveOrder();
  }, [handleSaveOrder]);

  const handleConfirmCheckout = useCallback(async () => {
    setShowConfirmCheckoutModal(false);
    const saveRes = await handleSaveOrder();
    if (saveRes.success && onCheckoutTable) {
      const targetOrderId = saveRes.orderId || currentOrderId;
      onCheckoutTable(selectedTable, {
        id: targetOrderId,
        totalAmount: cartTotal,
        items: cart,
        tableName: selectedTable?.name,
        customerName
      });
      setIsCartOpenMobile(false);
    }
  }, [handleSaveOrder, onCheckoutTable, currentOrderId, selectedTable, cartTotal, cart, customerName]);

  const handleSelectTableChange = useCallback(
    (e) => {
      const selectedVal = e.target.value;
      const tbl = tables.find((t) => String(t.id) === String(selectedVal));
      if (tbl) setSelectedTable(tbl);
    },
    [tables, setSelectedTable]
  );

  const handleOpenTransferModal = () => {
    if (!selectedTable) return;
    const emptyTables = tables.filter((t) => t.status === 'EMPTY' && t.id !== selectedTable.id);
    if (emptyTables.length === 0) {
      alert('Hiện không có bàn nào còn trống để chuyển sang!');
      return;
    }
    setTransferAreaFilter('ALL');
    setTargetTransferTableId(String(emptyTables[0].id));
    setShowTransferModal(true);
  };

  const handleOpenMergeModal = () => {
    if (!selectedTable) return;
    const servingTables = tables.filter((t) => t.status === 'SERVING' && t.id !== selectedTable.id);
    if (servingTables.length === 0) {
      alert('Hiện không có bàn đang phục vụ nào khác để gộp vào!');
      return;
    }
    setMergeAreaFilter('ALL');
    setTargetMergeTableId(String(servingTables[0].id));
    setShowMergeModal(true);
  };

  // Danh sách bàn trống phục vụ Chuyển Bàn
  const emptyTransferTables = useMemo(() => {
    if (!selectedTable) return [];
    return tables.filter((t) => t.status === 'EMPTY' && t.id !== selectedTable.id);
  }, [tables, selectedTable]);

  const transferAreas = useMemo(() => {
    return ['ALL', ...new Set(emptyTransferTables.map((t) => t.area))];
  }, [emptyTransferTables]);

  const filteredTransferTables = useMemo(() => {
    if (transferAreaFilter === 'ALL') return emptyTransferTables;
    return emptyTransferTables.filter((t) => t.area === transferAreaFilter);
  }, [emptyTransferTables, transferAreaFilter]);

  // Danh sách bàn đang phục vụ dùng cho Gộp Bàn
  const servingMergeTables = useMemo(() => {
    if (!selectedTable) return [];
    return tables.filter((t) => t.status === 'SERVING' && t.id !== selectedTable.id);
  }, [tables, selectedTable]);

  const mergeAreas = useMemo(() => {
    return ['ALL', ...new Set(servingMergeTables.map((t) => t.area))];
  }, [servingMergeTables]);

  const filteredMergeTables = useMemo(() => {
    if (mergeAreaFilter === 'ALL') return servingMergeTables;
    return servingMergeTables.filter((t) => t.area === mergeAreaFilter);
  }, [servingMergeTables, mergeAreaFilter]);

  const handleTransferTable = async () => {
    if (!selectedTable?.id || !targetTransferTableId) return;
    setTransferring(true);
    try {
      const res = await apiService.transferTable(selectedTable.id, Number(targetTransferTableId));
      if (res.success) {
        setNotification(`✅ ${res.message}`);
        setTimeout(() => setNotification(''), 3500);
        setShowTransferModal(false);
        const tablesRes = await apiService.getTables();
        if (tablesRes.success) {
          setTables(tablesRes.data || []);
          const destTbl = tablesRes.data?.find((t) => t.id === Number(targetTransferTableId));
          if (destTbl) setSelectedTable(destTbl);
        }
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi chuyển bàn!');
    } finally {
      setTransferring(false);
    }
  };

  const handleMergeTable = async () => {
    if (!selectedTable?.id || !targetMergeTableId) return;
    setTransferring(true);
    try {
      const res = await apiService.mergeTable(selectedTable.id, Number(targetMergeTableId));
      if (res.success) {
        setNotification(`✅ ${res.message}`);
        setTimeout(() => setNotification(''), 3500);
        setShowMergeModal(false);
        const tablesRes = await apiService.getTables();
        if (tablesRes.success) {
          setTables(tablesRes.data || []);
          const destTbl = tablesRes.data?.find((t) => t.id === Number(targetMergeTableId));
          if (destTbl) setSelectedTable(destTbl);
        }
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi gộp bàn!');
    } finally {
      setTransferring(false);
    }
  };

  const handlePrintProvisional = () => {
    if (cart.length === 0) {
      alert('Vui lòng chọn ít nhất 1 món để in phiếu tạm tính!');
      return;
    }
    const mockReceipt = {
      shopName: 'COFFEE POS - QUÁN CÀ PHÊ PHIN & ESPRESSO',
      shopAddress: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      shopPhone: '0908.123.456 - 028.3822.8888',
      isProvisional: true,
      order: {
        orderCode: currentOrderId ? `ORD-TT-${currentOrderId}` : `TT-${Date.now().toString().slice(-6)}`,
        tableName: selectedTable ? `${selectedTable.name} (${selectedTable.area})` : 'Mang về',
        customerName: customerName || 'Khách vãng lai',
        staffName: 'Thu Ngân',
        paidAt: new Date().toLocaleString('vi-VN'),
        totalAmount: cartTotal,
        finalAmount: cartTotal,
        discountPercent: 0,
        paymentMethod: 'CHƯA THANH TOÁN (TẠM TÍNH)',
        items: cart.map((i) => ({
          itemName: i.name,
          quantity: i.quantity,
          totalPrice: i.price * i.quantity,
          note: i.note
        }))
      }
    };
    setProvisionalReceipt(mockReceipt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[calc(100vh-110px)] h-auto pb-20 md:pb-0 relative">
      {/* Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 z-[100] bg-white/50 backdrop-blur-[2px] flex flex-col items-center justify-center select-none cursor-wait">
          <div className="bg-coffee-900 text-white p-5 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-400/30">
            <div className="w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold tracking-wide">Đang lưu đơn gửi Bar/Bếp...</span>
          </div>
        </div>
      )}

      {/* Khung thực đơn bên trái (Cols 7/12) */}
      <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Thanh tìm kiếm & chọn bàn chuyên nghiệp */}
        <div className="p-3.5 sm:p-4 border-b border-gray-100 space-y-3 bg-gray-50/60">
          {/* Hàng 1: Ô tìm kiếm món */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm món cà phê, trà, bánh ngọt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:border-coffee-600 focus:ring-2 focus:ring-coffee-600/20 outline-none transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Nút giỏ hàng nhanh trên mobile nếu có món */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCartOpenMobile(true)}
                className="lg:hidden px-3 py-2.5 bg-coffee-800 text-amber-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              </button>
            )}
          </div>

          {/* Hàng 2: Chọn bàn & Các nút Chức năng Chuyên Nghiệp (Chuyển bàn, Gộp bàn, In tạm tính) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2 sm:p-2.5 rounded-xl border border-gray-200/80 shadow-2xs">
            {/* Bộ chọn bàn */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5 text-coffee-700" /> Bàn:
              </span>
              <select
                value={selectedTable?.id || ''}
                onChange={handleSelectTableChange}
                disabled={saving || transferring}
                className="flex-1 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-coffee-950 outline-none focus:border-coffee-600 cursor-pointer transition truncate"
              >
                {tables.map((tbl) => (
                  <option key={tbl.id} value={tbl.id}>
                    {tbl.name} ({tbl.area}) - {tbl.status === 'SERVING' ? '🟡 Có khách' : '🟢 Trống'}
                  </option>
                ))}
              </select>
            </div>

            {/* Nút Chuyển bàn, Gộp bàn & In Tạm Tính - Luôn hiển thị to rõ trên cả Điện thoại & Máy tính */}
            {selectedTable && (
              <div className="flex items-center gap-1.5 justify-end flex-wrap pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <button
                  type="button"
                  onClick={handleOpenTransferModal}
                  disabled={saving || transferring}
                  title="Chuyển toàn bộ đơn sang bàn trống khác"
                  className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-300 text-amber-950 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <span>Chuyển Bàn</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenMergeModal}
                  disabled={saving || transferring}
                  title="Gộp đơn của bàn này vào một bàn đang phục vụ khác"
                  className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 border border-indigo-300 text-indigo-950 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <GitMerge className="w-3.5 h-3.5 text-indigo-700 flex-shrink-0" />
                  <span>Gộp Bàn</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintProvisional}
                  disabled={cart.length === 0}
                  title="In phiếu tạm tính cho khách xem trước khi thanh toán"
                  className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 border border-gray-300 text-gray-800 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer disabled:opacity-40"
                >
                  <Printer className="w-3.5 h-3.5 text-coffee-700 flex-shrink-0" />
                  <span>In Phiếu</span>
                </button>
              </div>
            )}
          </div>

          {/* Danh mục nằm ngang cuộn mượt */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                activeCategory === 'ALL'
                  ? 'bg-coffee-800 text-amber-200 shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              ☕ Tất cả món
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  activeCategory === cat.id
                    ? 'bg-coffee-800 text-amber-200 shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Lưới các món ăn */}
        <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto overscroll-contain touch-pan-y max-h-[calc(100vh-250px)] md:max-h-none no-scrollbar">
          {loading && menu.length === 0 ? (
            <SkeletonMenuGrid count={6} />
          ) : activeCategory === 'ALL' ? (
            (() => {
              const term = searchTerm.trim().toLowerCase();
              const renderedCategories = categories.map((cat) => {
                const itemsInCat = menu.filter(
                  (item) =>
                    item &&
                    item.categoryId === cat.id &&
                    (!term || (item.name && item.name.toLowerCase().includes(term)))
                );
                if (itemsInCat.length === 0) return null;

                return (
                  <div key={cat.id} className="mb-6">
                    <h3 className="text-xs font-black text-coffee-900 bg-coffee-50/90 border border-coffee-100 px-3 py-2 rounded-xl mb-3 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-md">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      <span className="text-[10px] bg-coffee-200/50 text-coffee-800 px-1.5 py-0.5 rounded-md font-bold">
                        {itemsInCat.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {itemsInCat.map((item) => (
                        <MenuItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
                      ))}
                    </div>
                  </div>
                );
              }).filter(Boolean);

              if (renderedCategories.length === 0) {
                return <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy món phù hợp</div>;
              }
              return <div className="space-y-2">{renderedCategories}</div>;
            })()
          ) : filteredMenu.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy món phù hợp</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {filteredMenu.map((item) => (
                <MenuItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Khung giỏ hàng & Thanh toán bên phải (Cols 5/12) - Trên mobile trượt lên dạng slide-over */}
      <div
        id="cart-section"
        className={`lg:col-span-5 flex-col h-full bg-white border border-gray-100 shadow-xs overflow-hidden rounded-2xl transition-all duration-300 ${
          isCartOpenMobile
            ? 'fixed inset-0 z-50 flex flex-col h-[100dvh] w-full bg-white'
            : 'hidden lg:flex'
        }`}
      >
        {/* Cart Header */}
        <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-coffee-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-400 text-coffee-950 font-black text-xs rounded-lg shadow-2xs">
                {selectedTable?.name || 'Chưa chọn bàn'}
              </span>
              <span className="text-xs text-coffee-200">{selectedTable?.area}</span>
            </div>
            <p className="text-[11px] text-coffee-300 mt-0.5">Đơn hàng đang tạo & phục vụ</p>
          </div>

          <div className="flex items-center gap-1.5">
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                title="Xóa tất cả món trong đơn"
                className="text-xs text-coffee-300 hover:text-red-300 px-2 py-1 hover:bg-coffee-800 rounded-lg transition"
              >
                Xóa hết
              </button>
            )}

            {/* Nút đóng giỏ hàng chỉ hiện trên Mobile */}
            <button
              onClick={() => setIsCartOpenMobile(false)}
              className="lg:hidden p-1.5 hover:bg-coffee-800 text-coffee-200 hover:text-white rounded-lg transition"
              title="Đóng giỏ hàng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thanh công cụ nhanh bên trong giỏ hàng (Chuyển bàn, Gộp bàn, In tạm tính) */}
        {selectedTable && (
          <div className="px-3 py-2 bg-coffee-800/20 border-b border-gray-100 flex items-center justify-between gap-1.5 text-xs">
            <button
              type="button"
              onClick={handleOpenTransferModal}
              disabled={saving || transferring}
              className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold flex items-center justify-center gap-1 text-[11px] transition"
            >
              <ArrowRightLeft className="w-3 h-3 text-amber-700" /> Chuyển Bàn
            </button>
            <button
              type="button"
              onClick={handleOpenMergeModal}
              disabled={saving || transferring}
              className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg font-bold flex items-center justify-center gap-1 text-[11px] transition"
            >
              <GitMerge className="w-3 h-3 text-indigo-700" /> Gộp Bàn
            </button>
            <button
              type="button"
              onClick={handlePrintProvisional}
              disabled={cart.length === 0}
              className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg font-bold flex items-center justify-center gap-1 text-[11px] transition disabled:opacity-40"
            >
              <Printer className="w-3 h-3 text-coffee-800" /> In Tạm Tính
            </button>
          </div>
        )}

        {/* Thông báo thao tác */}
        {notification && (
          <div className="m-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Tên khách & Ghi chú chung */}
        <div className="p-3 bg-gray-50/70 border-b border-gray-100 grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Tên Khách</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Khách vãng lai"
              className="w-full mt-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-coffee-600 text-xs transition"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Ghi chú chung</label>
            <input
              type="text"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="Vd: Ngồi tầng 2..."
              className="w-full mt-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-coffee-600 text-xs transition"
            />
          </div>
        </div>

        {/* Danh sách các món trong Giỏ hàng */}
        <div className="flex-1 p-3 overflow-y-auto overscroll-contain touch-pan-y space-y-2.5 pb-28 sm:pb-3 relative">
          {cartLoading ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full animate-pulse">
              <div className="w-8 h-8 border-2 border-coffee-800 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-semibold text-gray-500">Đang tải giỏ hàng của bàn...</p>
            </div>
          ) : cart.length === 0 ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
              <Coffee className="w-12 h-12 text-gray-200 mb-2" />
              <p className="text-sm font-medium">Chưa có món nào trong đơn</p>
              <p className="text-xs text-gray-300 mt-1">Chọn món ở danh mục bên trái để bắt đầu</p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItemRow
                key={item.menuItemId}
                item={item}
                onUpdateQty={handleUpdateQty}
                onUpdateNote={handleUpdateNote}
                onRemoveItem={handleRemoveItem}
              />
            ))
          )}
        </div>

        {/* Tổng tiền & Nút tác vụ */}
        <div className="p-3.5 sm:p-4 border-t border-gray-100 bg-gray-50 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-600">Tổng tạm tính:</span>
            <span className="font-black text-coffee-900 text-lg">
              {cartTotal.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <button
            type="button"
            onClick={handlePrintProvisional}
            disabled={cart.length === 0}
            className="w-full py-2.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Printer className="w-4 h-4 text-coffee-700" />
            <span>In Phiếu Tạm Tính Ra Bàn</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleOpenSendModal}
              disabled={saving || cart.length === 0}
              className="py-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{saving ? 'Đang gửi...' : 'Gửi Đơn Bar/Bếp'}</span>
            </button>

            <button
              onClick={handleOpenCheckoutModal}
              disabled={saving || cart.length === 0}
              className="py-3 bg-coffee-800 hover:bg-coffee-900 active:bg-coffee-950 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              <span>Thanh Toán Ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Xác Nhận Gửi Bếp */}
      {showConfirmSendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Xác Nhận Gửi Đơn Bar/Bếp</h3>
                <p className="text-xs text-gray-500">Kiểm tra lại thông tin trước khi gửi xuống quầy</p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Bàn phục vụ:</span>
                <span className="text-coffee-800">{selectedTable?.name} ({selectedTable?.area})</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800">
                <span>Khách hàng:</span>
                <span>{customerName}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2">
                <span>Tổng món & tiền:</span>
                <span className="text-amber-700">{cart.reduce((s, i) => s + i.quantity, 0)} món — {cartTotal.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSendModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Hủy / Kiểm tra lại
              </button>
              <button
                onClick={handleConfirmSend}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Xác Nhận Gửi Bếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Thanh Toán */}
      {showConfirmCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-coffee-100 text-coffee-800 rounded-2xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Xác Nhận Thanh Toán Bàn</h3>
                <p className="text-xs text-gray-500">Chuyển sang màn hình thu ngân thanh toán</p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Bàn thanh toán:</span>
                <span className="text-coffee-800">{selectedTable?.name} ({selectedTable?.area})</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800">
                <span>Khách hàng:</span>
                <span>{customerName}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2">
                <span>Tổng tiền thanh toán:</span>
                <span className="text-coffee-900 text-base">{cartTotal.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmCheckoutModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Hủy / Xem lại
              </button>
              <button
                onClick={handleConfirmCheckout}
                className="flex-1 py-3 bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Xác Nhận Thanh Toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bar cho Mobile khi có món trong giỏ */}
      {cart.length > 0 && !isCartOpenMobile && (
        <div className="lg:hidden fixed bottom-14 left-3 right-3 bg-coffee-950 text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl z-30 flex items-center justify-between border border-amber-400/40 backdrop-blur-md animate-slideUp">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative p-2 bg-amber-400 text-coffee-950 rounded-xl font-black text-xs flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-extrabold border-2 border-coffee-950">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            <div className="truncate">
              <div className="text-[10px] text-amber-200 font-bold truncate">
                {selectedTable?.name || 'Đơn hàng'}
              </div>
              <div className="text-xs font-black text-white">
                {cartTotal.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handlePrintProvisional}
              title="In phiếu tạm tính"
              className="p-2 bg-coffee-800 hover:bg-coffee-700 text-amber-200 rounded-xl border border-coffee-700 active:scale-95 transition"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpenMobile(true)}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-coffee-950 font-black text-xs rounded-xl shadow transition flex items-center gap-1"
            >
              <span>Xem Đơn</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Chuyển Bàn - Tối ưu toàn diện cho Điện Thoại & Máy Tính */}
      {showTransferModal && (
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
                  <h3 className="font-black text-gray-900 text-base truncate">Chuyển Bàn POS</h3>
                  <p className="text-xs text-gray-500 truncate">Chuyển toàn bộ đơn từ {selectedTable?.name} sang bàn trống</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 active:scale-90 rounded-xl transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thân cuộn mượt mà trên Mobile (touch-pan-y, overscroll-contain) */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 touch-pan-y">
              {/* Thông tin bàn nguồn */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-1.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-semibold">Bàn nguồn:</span>
                  <span className="text-amber-950 font-extrabold text-sm">{selectedTable?.name} ({selectedTable?.area})</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Tổng tiền đơn:</span>
                  <span className="font-bold text-coffee-800 text-xs">{cartTotal.toLocaleString('vi-VN')} đ ({cart.reduce((s, i) => s + i.quantity, 0)} món)</span>
                </div>
              </div>

              {/* Bộ chọn bàn trống */}
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

                {/* Lưới danh sách thẻ bàn trống - Chạm chọn cực nhạy, vuốt cuộn mượt mà */}
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

            {/* Footer cố định ở đáy */}
            <div className="flex items-center gap-2.5 p-4 sm:px-5 sm:py-3.5 border-t border-gray-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                disabled={transferring}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleTransferTable}
                disabled={transferring || !targetTransferTableId}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {transferring ? (
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

      {/* Modal Gộp Bàn - Tối ưu toàn diện cho Điện Thoại & Máy Tính */}
      {showMergeModal && (
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
                  <h3 className="font-black text-gray-900 text-base truncate">Gộp Bàn POS</h3>
                  <p className="text-xs text-gray-500 truncate">Gộp tất cả món từ {selectedTable?.name} vào bàn đang phục vụ khác</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 active:scale-90 rounded-xl transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thân cuộn mượt mà trên Mobile */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 touch-pan-y">
              {/* Thông tin bàn nguồn */}
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl space-y-1.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-semibold">Bàn nguồn cần gộp:</span>
                  <span className="text-indigo-950 font-extrabold text-sm">{selectedTable?.name} ({selectedTable?.area})</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Tiền đơn gộp:</span>
                  <span className="font-bold text-coffee-800 text-xs">{cartTotal.toLocaleString('vi-VN')} đ</span>
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

                {/* Lưới danh sách thẻ bàn đang phục vụ */}
                {filteredMergeTables.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 sm:max-h-60 overflow-y-auto overscroll-contain p-1 rounded-2xl bg-gray-50/80 border border-gray-200/80 touch-pan-y">
                    {filteredMergeTables.map((t) => {
                      const isSelected = String(t.id) === String(targetMergeTableId);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTargetMergeTableId(String(t.id))}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer active:scale-95 touch-manipulation min-h-[64px] ${
                            isSelected
                              ? 'bg-indigo-700 text-white border-indigo-800 ring-2 ring-indigo-400 shadow-sm'
                              : 'bg-white hover:bg-indigo-50/60 border-gray-200 text-gray-800 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-black text-sm truncate">{t.name} ({t.area})</span>
                            <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`} />
                          </div>
                          <div className="flex items-center justify-between text-[11px] mt-1.5 opacity-90">
                            <span>Đơn hiện tại:</span>
                            <span className="font-bold">{(t.currentOrder?.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Không có bàn đang phục vụ nào khác phù hợp.
                  </div>
                )}
              </div>
            </div>

            {/* Footer cố định ở đáy */}
            <div className="flex items-center gap-2.5 p-4 sm:px-5 sm:py-3.5 border-t border-gray-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                disabled={transferring}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleMergeTable}
                disabled={transferring || !targetMergeTableId}
                className="flex-1 py-3 bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {transferring ? (
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

      {/* Modal In Phiếu Tạm Tính Ra Bàn */}
      {provisionalReceipt && (
        <ReceiptInvoice
          receiptData={provisionalReceipt}
          onClose={() => setProvisionalReceipt(null)}
        />
      )}
    </div>
  );
}
