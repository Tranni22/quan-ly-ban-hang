import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { apiService } from '../services/api';
import { SkeletonMenuGrid } from './SkeletonLoader';
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
  ShoppingBag
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

    let isMounted = true;
    const loadTableOrder = async () => {
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
      }
    };

    loadTableOrder();
    return () => {
      isMounted = false;
    };
  }, [selectedTable]);

  // Handlers tối ưu bằng useCallback
  const handleAddToCart = useCallback((item) => {
    if (!item?.id) return;
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
  }, []);

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
        setNotification('Đã lưu đơn và gửi order tới Bar/Bếp thành công!');
        setTimeout(() => setNotification(''), 3000);
        return { success: true, orderId: savedId };
      }
      return { success: false };
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu đơn!');
      return { success: false };
    } finally {
      setSaving(false);
    }
  }, [selectedTable, cart, customerName, orderNote]);

  // Filtered Menu dùng useMemo để không tính toán lại dư thừa
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

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      alert('Vui lòng chọn món trước!');
      return;
    }
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
    }
  }, [cart, handleSaveOrder, onCheckoutTable, selectedTable, currentOrderId, customerName, cartTotal]);

  const handleSelectTableChange = useCallback(
    (e) => {
      const selectedVal = e.target.value;
      const tbl = tables.find((t) => String(t.id) === String(selectedVal));
      if (tbl) setSelectedTable(tbl);
    },
    [tables, setSelectedTable]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)] pb-16 md:pb-0 relative">
      {/* Khung thực đơn bên trái (Cols 7/12) */}
      <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Thanh tìm kiếm & chọn danh mục */}
        <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
          <div className="flex items-center gap-3">
            {/* Ô tìm kiếm món */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm món cà phê, trà, bánh ngọt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-coffee-600 focus:ring-2 focus:ring-coffee-600/20 outline-none transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chọn bàn */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Bàn:</span>
              <select
                value={selectedTable?.id || ''}
                onChange={handleSelectTableChange}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-coffee-800 outline-none focus:border-coffee-600 shadow-2xs"
              >
                {tables.map((tbl) => (
                  <option key={tbl.id} value={tbl.id}>
                    {tbl.name} ({tbl.area})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Danh mục nằm ngang */}
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
        <div className="flex-1 p-4 overflow-y-auto">
          {loading && menu.length === 0 ? (
            <SkeletonMenuGrid count={6} />
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

      {/* Khung giỏ hàng & Thanh toán bên phải (Cols 5/12) */}
      <div id="cart-section" className="lg:col-span-5 flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-100 bg-coffee-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-400 text-coffee-950 font-black text-xs rounded shadow-2xs">
                {selectedTable?.name || 'Chưa chọn bàn'}
              </span>
              <span className="text-xs text-coffee-200">{selectedTable?.area}</span>
            </div>
            <p className="text-[11px] text-coffee-300 mt-1">Đơn hàng đang tạo / phục vụ</p>
          </div>

          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              title="Xóa tất cả món trong đơn"
              className="text-xs text-coffee-300 hover:text-red-300 p-1.5 hover:bg-coffee-800 rounded-lg transition"
            >
              Xóa hết
            </button>
          )}
        </div>

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
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 pb-28 sm:pb-3">
          {cart.length === 0 ? (
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
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-600">Tổng tạm tính:</span>
            <span className="font-extrabold text-coffee-900 text-lg">
              {cartTotal.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSaveOrder}
              disabled={saving || cart.length === 0}
              className="py-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{saving ? 'Đang gửi...' : 'Gửi Đơn Bar/Bếp'}</span>
            </button>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="py-3 bg-coffee-800 hover:bg-coffee-900 active:bg-coffee-950 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              <span>Thanh Toán Ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Cart Button cho Mobile khi có món trong giỏ */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-14 left-3 right-3 bg-coffee-900 text-white p-3 rounded-2xl shadow-2xl z-30 flex items-center justify-between border border-amber-400/30">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 bg-amber-400 text-coffee-950 rounded-xl font-black text-xs">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-extrabold border-2 border-coffee-900">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            <div>
              <div className="text-[11px] text-amber-200 font-bold">Món đã chọn</div>
              <div className="text-xs font-black text-white">{cartTotal.toLocaleString('vi-VN')} đ</div>
            </div>
          </div>

          <button
            onClick={() => {
              const cartElem = document.getElementById('cart-section');
              if (cartElem) cartElem.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-coffee-950 font-black text-xs rounded-xl shadow transition"
          >
            Xem món đã chọn ↓
          </button>
        </div>
      )}
    </div>
  );
}
