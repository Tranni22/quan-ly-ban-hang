import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Coffee,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart2,
  Calendar,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

export default function AdminDashboard({ activeSubTab = 'reports' }) {
  const [subTab, setSubTab] = useState(activeSubTab); // 'reports' or 'menu'
  const [menuTab, setMenuTab] = useState('active'); // 'active' or 'deleted'
  const [dashboardData, setDashboardData] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State cho thêm/sửa món
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: 1,
    name: '',
    price: '',
    description: '',
    image: '',
    isAvailable: true
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, menuRes] = await Promise.all([
        apiService.getDashboard(),
        apiService.getMenu()
      ]);

      if (dashRes.success) setDashboardData(dashRes.data);
      if (menuRes.success) {
        setCategories(menuRes.categories);
        setMenu(menuRes.allItems);
        setDeletedItems(menuRes.deletedItems || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreItem = async (id) => {
    try {
      const res = await apiService.restoreMenuItem(id);
      if (res.success) {
        alert('Khôi phục món ăn về thực đơn chính thành công!');
        loadDashboardData();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi khôi phục món!');
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      categoryId: categories[0]?.id || 1,
      name: '',
      price: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
      isAvailable: true
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      categoryId: item.categoryId,
      name: item.name,
      price: item.price,
      description: item.description || '',
      image: item.image || '',
      isAvailable: Boolean(item.isAvailable)
    });
    setShowModal(true);
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await apiService.updateMenuItem(editingItem.id, formData);
      } else {
        await apiService.createMenuItem(formData);
      }
      setShowModal(false);
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu thông tin món!');
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa món này khỏi thực đơn?')) {
      try {
        await apiService.deleteMenuItem(id);
        loadDashboardData();
      } catch (err) {
        alert(err.message || 'Lỗi khi xóa món!');
      }
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      await apiService.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'reports'
                ? 'bg-coffee-800 text-amber-200 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📊 Báo Cáo Doanh Thu
          </button>
          <button
            onClick={() => setSubTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'menu'
                ? 'bg-coffee-800 text-amber-200 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ☕ Quản Lý Thực Đơn Menu
          </button>
        </div>

        {subTab === 'menu' && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm Món Mới
          </button>
        )}
      </div>

      {subTab === 'reports' ? (
        /* REPORTS SECTION */
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-gradient-to-br from-coffee-900 to-coffee-800 text-white rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-coffee-200">
                <span className="text-xs font-bold uppercase">Doanh thu hôm nay</span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-200">
                {(dashboardData?.todayRevenue || 0).toLocaleString('vi-VN')} đ
              </div>
              <p className="text-[11px] text-coffee-300">Tổng doanh thu các đơn đã thanh toán</p>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase">Đơn hàng hôm nay</span>
                <ShoppingBag className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">
                {dashboardData?.todayOrders || 0} đơn
              </div>
              <p className="text-[11px] text-gray-400">Số đơn hoàn tất trong ngày</p>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase">Bàn đang phục vụ</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">
                {dashboardData?.servingTables || 0} / {dashboardData?.totalTables || 0} bàn
              </div>
              <p className="text-[11px] text-gray-400">Công suất quán hiện tại</p>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase">Tỷ lệ lấp đầy</span>
                <Coffee className="w-5 h-5 text-coffee-600" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">
                {dashboardData?.totalTables
                  ? Math.round((dashboardData.servingTables / dashboardData.totalTables) * 100)
                  : 0}
                %
              </div>
              <p className="text-[11px] text-gray-400">Số bàn có khách / Tổng số bàn</p>
            </div>
          </div>

          {/* Charts & Top Items Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top 5 Items (Cols 5) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                🏆 Top Món Bán Chạy Nhất
              </h3>

              <div className="space-y-3">
                {dashboardData?.topItems?.length === 0 ? (
                  <p className="text-xs text-gray-400">Chưa có dữ liệu bán hàng</p>
                ) : (
                  dashboardData?.topItems?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-coffee-800 text-amber-200 font-extrabold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-gray-800">{item.itemName}</h4>
                          <span className="text-[10px] text-gray-400">
                            Đã bán: {item.totalQty} ly / phần
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-coffee-800">
                        {item.totalSales.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Orders List (Cols 7) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                📋 Lịch Sử Đơn Hàng Gần Đây
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-100">
                    <tr>
                      <th className="p-2.5">Mã Đơn</th>
                      <th className="p-2.5">Bàn</th>
                      <th className="p-2.5">Tổng Tiền</th>
                      <th className="p-2.5">Hình Thức</th>
                      <th className="p-2.5">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboardData?.recentOrders?.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-2.5 font-bold text-gray-900">{ord.orderCode}</td>
                        <td className="p-2.5 font-medium">{ord.tableName}</td>
                        <td className="p-2.5 font-bold text-coffee-800">
                          {ord.finalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 uppercase">
                            {ord.paymentMethod === 'TRANSFER_QR' ? 'QR Code' : 'Tiền mặt'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              ord.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status === 'PAID'
                              ? 'Đã Thanh Toán'
                              : ord.status === 'CANCELLED'
                              ? 'Đã Hủy'
                              : 'Chờ Phục Vụ'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MENU MANAGEMENT SECTION */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5 space-y-4">
          {/* Sub-tabs cho Menu active và Menu đã xóa (Recycle Bin) */}
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <button
              onClick={() => setMenuTab('active')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1.5 ${
                menuTab === 'active'
                  ? 'bg-coffee-50 text-coffee-900 border border-coffee-200'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>✅ Đang Kinh Doanh</span>
              <span className="bg-coffee-100 text-coffee-800 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                {menu.length}
              </span>
            </button>
            <button
              onClick={() => setMenuTab('deleted')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1.5 ${
                menuTab === 'deleted'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <span>🗑️ Thùng Rác (Đã Xóa)</span>
              <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                {deletedItems.length}
              </span>
            </button>
          </div>

          <div className="overflow-x-auto">
            {menuTab === 'active' ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Hình ảnh</th>
                    <th className="p-3">Tên món</th>
                    <th className="p-3">Danh mục</th>
                    <th className="p-3">Giá bán</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {menu.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400">
                        Chưa có món ăn nào trong thực đơn. Nhấp "Thêm Món Mới" để bắt đầu!
                      </td>
                    </tr>
                  ) : (
                    menu.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'}
                            alt={item.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400';
                            }}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-gray-900 text-xs">{item.name}</div>
                          <div className="text-[10px] text-gray-400 line-clamp-1">{item.description}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 bg-coffee-50 text-coffee-800 font-semibold rounded-lg text-[11px]">
                            {item.categoryName || 'Món Khác'}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-coffee-800">
                          {item.price.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleAvailable(item)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                              item.isAvailable
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {item.isAvailable ? (
                              <>
                                <CheckCircle className="w-3 h-3" /> Còn hàng
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Hết hàng
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              /* TAB THÙNG RÁC - HIỂN THỊ MÓN ĐÃ XÓA VÀ NÚT KHÔI PHỤC */
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Hình ảnh</th>
                    <th className="p-3">Tên món</th>
                    <th className="p-3">Danh mục</th>
                    <th className="p-3">Giá bán cũ</th>
                    <th className="p-3 text-right">Khôi phục</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deletedItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400">
                        Thùng rác trống rỗng. Chưa có món ăn nào bị xóa!
                      </td>
                    </tr>
                  ) : (
                    deletedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-red-50/20 transition">
                        <td className="p-3">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'}
                            alt={item.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400';
                            }}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 grayscale opacity-60"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-gray-500 text-xs line-through">{item.name}</div>
                          <div className="text-[10px] text-gray-400 line-clamp-1">{item.description}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[11px]">
                            {item.categoryName || 'Món Khác'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-gray-500">
                          {item.price.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRestoreItem(item.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[10px] rounded-xl shadow-xs transition flex items-center gap-1.5 ml-auto"
                            title="Khôi phục món ăn này"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Khôi Phục
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT MENU ITEM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-coffee-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingItem ? 'Chỉnh Sửa Món' : 'Thêm Món Mới Vào Thực Đơn'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-coffee-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Danh mục món</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-coffee-600"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên món *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Cà Phê Muối Huế"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-coffee-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="35000"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-coffee-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mô tả món</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả hương vị, nguyên liệu..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-coffee-600"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Link Ảnh Minh Họa</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-coffee-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-coffee-600 rounded"
                />
                <label htmlFor="isAvailable" className="font-semibold text-gray-700">
                  Món này đang có sẵn để bán
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-coffee-800 hover:bg-coffee-900 text-white font-bold rounded-xl shadow"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
