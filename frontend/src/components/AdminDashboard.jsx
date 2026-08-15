import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import ReceiptInvoice from './ReceiptInvoice';
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
  RotateCcw,
  Download,
  Eye,
  Printer,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';

export default function AdminDashboard({ activeSubTab = 'reports' }) {
  const [subTab, setSubTab] = useState(activeSubTab); // 'reports' or 'menu'
  const [menuTab, setMenuTab] = useState('active'); // 'active' or 'deleted'
  const [reportFilter, setReportFilter] = useState('day'); // 'day', 'week', 'month'
  const [historyType, setHistoryType] = useState('shift'); // 'shift' or 'daily'
  const [dashboardData, setDashboardData] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

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

  // Sync subTab with activeSubTab prop changes
  useEffect(() => {
    if (activeSubTab) {
      setSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleCloseShift = async () => {
    if (confirm(`BẠN CÓ CHẮC CHẮN MUỐN CHỐT ${dashboardData?.currentShiftName || 'CA HIỆN TẠI'}?\n\nHành động này sẽ:\n1. Lưu lịch sử doanh thu ca hiện tại.\n2. Reset doanh thu ca về 0 để ca mới sẵn sàng bán tiếp.\n3. Dọn sơ đồ bàn về trạng thái Trống (EMPTY).`)) {
      try {
        const res = await apiService.closeShift();
        if (res.success) {
          alert(res.message);
          loadDashboardData(true);
        }
      } catch (err) {
        alert(err.message || 'Lỗi khi chốt ca!');
      }
    }
  };

  const handleCloseWeek = async () => {
    if (confirm(`BẠN CÓ CHẮC CHẮN MUỐN CHỐT BÁO CÁO TUẦN NÀY?\n(${dashboardData?.currentWeekRange || ''})\n\nHành động này sẽ tổng kết doanh thu tuần chuẩn 7 ngày và lưu vào Lịch Sử Báo Cáo Tuần.`)) {
      try {
        const res = await apiService.closeWeek();
        if (res.success) {
          alert(res.message);
          loadDashboardData(true);
        }
      } catch (err) {
        alert(err.message || 'Lỗi khi chốt tuần!');
      }
    }
  };

  const handleCloseMonth = async () => {
    if (confirm(`BẠN CÓ CHẮC CHẮN MUỐN CHỐT BÁO CÁO THÁNG NÀY?\n(${dashboardData?.currentMonthRange || ''})\n\nHành động này sẽ tổng kết doanh thu tháng chuẩn (28-31 ngày) và lưu vào Lịch Sử Báo Cáo Tháng.`)) {
      try {
        const res = await apiService.closeMonth();
        if (res.success) {
          alert(res.message);
          loadDashboardData(true);
        }
      } catch (err) {
        alert(err.message || 'Lỗi khi chốt tháng!');
      }
    }
  };

  const handleDeleteOrder = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn hóa đơn này khỏi lịch sử hệ thống để dọn bớt dữ liệu rác?')) {
      try {
        const res = await apiService.permanentDeleteOrder(id);
        if (res.success) {
          alert(res.message);
          loadDashboardData(true);
        }
      } catch (err) {
        alert(err.message || 'Lỗi khi xóa hóa đơn!');
      }
    }
  };

  // Xuất dữ liệu báo cáo ra file Excel / CSV chuẩn UTF-8 có BOM
  const handleExportCSV = () => {
    let filename = `Bao_Cao_${historyType.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    let csvContent = '\uFEFF'; // UTF-8 BOM để Excel hiển thị tiếng Việt không bị lỗi font

    if (historyType === 'shift') {
      csvContent += 'Mã Báo Cáo,Ngày,Ca Làm Việc,Số Lượng Đơn,Doanh Thu (VNĐ),Người Chốt,Thời Gian Chốt\n';
      (dashboardData?.shiftReportsHistory || []).forEach((r) => {
        csvContent += `"${r.id}","${r.reportDate}","${r.shiftName}","${r.totalOrders}","${r.totalRevenue}","${r.closedBy || 'Admin'}","${r.closedAt}"\n`;
      });
    } else if (historyType === 'daily') {
      csvContent += 'Mã Báo Cáo,Ngày Báo Cáo,Số Lượng Đơn,Doanh Thu (VNĐ),Thời Gian Chốt\n';
      (dashboardData?.dailyReportsHistory || []).forEach((r) => {
        csvContent += `"${r.id}","${r.reportDate}","${r.totalOrders}","${r.totalRevenue}","${r.closedAt}"\n`;
      });
    } else if (historyType === 'weekly') {
      csvContent += 'Mã Báo Cáo,Chu Kỳ Tuần,Từ Ngày,Đến Ngày,Số Lượng Đơn,Doanh Thu (VNĐ),Thời Gian Chốt\n';
      (dashboardData?.weeklyReportsHistory || []).forEach((r) => {
        csvContent += `"${r.id}","${r.weekCode || ''}","${r.startDate}","${r.endDate}","${r.totalOrders}","${r.totalRevenue}","${r.closedAt}"\n`;
      });
    } else {
      csvContent += 'Mã Báo Cáo,Chu Kỳ Tháng,Từ Ngày,Đến Ngày,Số Lượng Đơn,Doanh Thu (VNĐ),Thời Gian Chốt\n';
      (dashboardData?.monthlyReportsHistory || []).forEach((r) => {
        csvContent += `"${r.id}","${r.monthCode || ''}","${r.startDate}","${r.endDate}","${r.totalOrders}","${r.totalRevenue}","${r.closedAt}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Xem chi tiết và in lại hóa đơn
  const handleViewReceipt = async (orderId) => {
    try {
      const res = await apiService.getReceipt(orderId);
      if (res.success && res.receipt) {
        setSelectedReceipt(res.receipt);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tải chi tiết hóa đơn!');
    }
  };

  // Stale-While-Revalidate (SWR) pattern: load instant from cache, refresh in background
  const loadDashboardData = async (forceReload = false) => {
    const cachedDash = apiService.getCachedDashboard();
    const cachedMenu = apiService.getCachedMenu();
    let hasCache = false;

    if (cachedDash && cachedMenu && !forceReload) {
      setDashboardData(cachedDash.data);
      setCategories(cachedMenu.categories);
      setMenu(cachedMenu.allItems);
      setDeletedItems(cachedMenu.deletedItems || []);
      setLoading(false);
      hasCache = true;
    } else {
      setLoading(true);
    }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSubTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              subTab === 'reports'
                ? 'bg-coffee-800 text-amber-200 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📊 Báo Cáo Doanh Thu
          </button>
          <button
            onClick={() => setSubTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Thêm Món Mới
          </button>
        )}

        {subTab === 'reports' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCloseShift}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-red-700 hover:bg-red-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 border border-red-500/20"
              title="Chốt ca làm việc hiện tại và reset doanh thu ca về 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chốt {dashboardData?.currentShiftName || 'Ca'}</span>
            </button>

            <button
              onClick={handleCloseWeek}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 border border-purple-500/20"
              title="Chốt tổng kết báo cáo tuần này (chuẩn 7 ngày)"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Chốt Tuần Này</span>
            </button>

            <button
              onClick={handleCloseMonth}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 border border-emerald-500/20"
              title="Chốt tổng kết báo cáo tháng này (chuẩn 28-31 ngày)"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Chốt Tháng Này</span>
            </button>
          </div>
        )}
      </div>

      {subTab === 'reports' ? (
        /* REPORTS SECTION */
        <div className="space-y-5">
          {/* Lọc thời gian báo cáo */}
          <div className="flex items-center gap-1.5 bg-gray-200/60 p-1.5 rounded-2xl w-full sm:w-max">
            <button
              onClick={() => setReportFilter('day')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition ${
                reportFilter === 'day' ? 'bg-white text-coffee-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📅 Hôm Nay
            </button>
            <button
              onClick={() => setReportFilter('week')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition ${
                reportFilter === 'week' ? 'bg-white text-coffee-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🗓️ Tuần Này
            </button>
            <button
              onClick={() => setReportFilter('month')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition ${
                reportFilter === 'month' ? 'bg-white text-coffee-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📆 Tháng Này
            </button>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-gradient-to-br from-coffee-900 to-coffee-800 text-white rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-coffee-200">
                <span className="text-xs font-bold uppercase">
                  Doanh thu {reportFilter === 'day' ? `(${dashboardData?.currentShiftName || 'Ca hiện tại'})` : reportFilter === 'week' ? 'tuần này' : 'tháng này'}
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-200">
                {(reportFilter === 'day' 
                  ? (dashboardData?.todayRevenue || 0)
                  : reportFilter === 'week'
                  ? (dashboardData?.weekRevenue || 0)
                  : (dashboardData?.monthRevenue || 0)
                ).toLocaleString('vi-VN')} đ
              </div>
              <p className="text-[11px] text-coffee-300">
                {reportFilter === 'day'
                  ? `⚡ Đã chốt ${dashboardData?.shiftsToday || 0}/3 ca (Doanh thu ca sẽ về 0đ sau khi Chốt Ca)`
                  : reportFilter === 'week'
                  ? `🗓️ Lũy kế tuần 7 ngày: ${dashboardData?.currentWeekRange || ''} (Không reset khi chốt ca)`
                  : `📆 Lũy kế tháng chuẩn: ${dashboardData?.currentMonthRange || ''} (Không reset khi chốt ca)`}
              </p>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase">
                  Đơn hàng {reportFilter === 'day' ? 'hôm nay' : reportFilter === 'week' ? 'tuần này' : 'tháng này'}
                </span>
                <ShoppingBag className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">
                {reportFilter === 'day' 
                  ? (dashboardData?.todayOrders || 0)
                  : reportFilter === 'week'
                  ? (dashboardData?.weekOrders || 0)
                  : (dashboardData?.monthOrders || 0)
                } đơn
              </div>
              <p className="text-[11px] text-gray-400">Số đơn hoàn tất tương ứng</p>
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

          {/* Biểu đồ Cột Doanh Thu 7 Ngày & Tỷ lệ Thanh Toán */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 7 Days Revenue Bar Chart */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-coffee-600" />
                  Biểu Đồ Doanh Thu 7 Ngày Gần Nhất
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Xu hướng tăng trưởng</span>
              </div>

              {(!dashboardData?.recent7Days || dashboardData?.recent7Days.length === 0) ? (
                <div className="py-12 text-center text-gray-400 text-xs">Chưa có dữ liệu giao dịch 7 ngày qua</div>
              ) : (
                <div className="pt-4">
                  {(() => {
                    const days = dashboardData.recent7Days;
                    const maxRevenue = Math.max(...days.map((d) => d.revenue || 0), 1);
                    return (
                      <div className="grid grid-cols-7 gap-2 items-end h-44 pb-2 border-b border-gray-100">
                        {days.map((d, idx) => {
                          const heightPercent = Math.max(Math.round(((d.revenue || 0) / maxRevenue) * 100), 6);
                          const dayLabel = d.date ? d.date.split('-').slice(1).join('/') : `N-${idx + 1}`;
                          return (
                            <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                              <span className="text-[9px] font-bold text-coffee-800 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                {(d.revenue || 0).toLocaleString('vi-VN')} đ
                              </span>
                              <div
                                style={{ height: `${heightPercent}%` }}
                                className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 relative ${
                                  idx === days.length - 1
                                    ? 'bg-gradient-to-t from-coffee-800 to-amber-500 shadow-sm'
                                    : 'bg-gradient-to-t from-coffee-600 to-coffee-400 hover:from-coffee-700 hover:to-amber-400'
                                }`}
                              >
                                <div className="absolute inset-0 rounded-t-xl opacity-0 group-hover:opacity-20 bg-white transition"></div>
                              </div>
                              <span className="text-[10px] font-bold text-gray-500">{dayLabel}</span>
                              <span className="text-[9px] text-gray-400">{d.orders || 0} đơn</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Payment Methods Breakdown */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  Cơ Cấu Phương Thức Thanh Toán
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">Đối soát dòng tiền chuyển khoản vs tiền mặt</p>

                {(() => {
                  const orders = dashboardData?.recentOrders || [];
                  const qrOrders = orders.filter((o) => o.paymentMethod === 'TRANSFER_QR' && o.status === 'PAID');
                  const cashOrders = orders.filter((o) => o.paymentMethod !== 'TRANSFER_QR' && o.status === 'PAID');
                  const qrTotal = qrOrders.reduce((s, o) => s + (o.finalAmount || 0), 0);
                  const cashTotal = cashOrders.reduce((s, o) => s + (o.finalAmount || 0), 0);
                  const total = qrTotal + cashTotal || 1;
                  const qrPercent = Math.round((qrTotal / total) * 100);
                  const cashPercent = 100 - qrPercent;

                  return (
                    <div className="mt-4 space-y-3">
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                        <div style={{ width: `${qrPercent}%` }} className="bg-amber-500 h-full transition-all duration-500" title={`QR Code: ${qrPercent}%`}></div>
                        <div style={{ width: `${cashPercent}%` }} className="bg-emerald-500 h-full transition-all duration-500" title={`Tiền Mặt: ${cashPercent}%`}></div>
                      </div>

                      <div className="space-y-2 pt-2 text-xs">
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                            <span className="font-bold text-amber-900">VietQR Chuyển Khoản</span>
                          </div>
                          <span className="font-extrabold text-amber-900">{qrPercent}% ({qrTotal.toLocaleString('vi-VN')} đ)</span>
                        </div>

                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span className="font-bold text-emerald-900">Tiền Mặt Tại Két</span>
                          </div>
                          <span className="font-extrabold text-emerald-900">{cashPercent}% ({cashTotal.toLocaleString('vi-VN')} đ)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500 border border-gray-100">
                💡 <b>Mẹo quản trị:</b> Khuyến khích khách quét mã VietQR giúp đối soát 100% tự động, tránh thất thoát tiền mặt.
              </div>
            </div>
          </div>

          {/* Top Items & Recent Orders Row */}
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
                        {(item.totalSales || 0).toLocaleString('vi-VN')} đ
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
                      <th className="p-2.5 text-right">Tác vụ</th>
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
                        <td className="p-2.5 text-right flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewReceipt(ord.id)}
                            className="p-1.5 text-coffee-700 hover:bg-coffee-50 rounded-lg transition"
                            title="Xem chi tiết & in lại hóa đơn này"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Xóa vĩnh viễn hóa đơn này khỏi lịch sử"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Shift, Daily, Weekly & Monthly Reports History Section */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                📋 Lịch Sử Báo Cáo Doanh Thu Tổng Kết
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl no-scrollbar">
                  <button
                    onClick={() => setHistoryType('shift')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      historyType === 'shift'
                        ? 'bg-coffee-800 text-amber-200 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ☕ Theo Ca ({dashboardData?.shiftReportsHistory?.length || 0})
                  </button>
                  <button
                    onClick={() => setHistoryType('daily')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      historyType === 'daily'
                        ? 'bg-coffee-800 text-amber-200 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📅 Theo Ngày ({dashboardData?.dailyReportsHistory?.length || 0})
                  </button>
                  <button
                    onClick={() => setHistoryType('weekly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      historyType === 'weekly'
                        ? 'bg-coffee-800 text-amber-200 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🗓️ Theo Tuần ({dashboardData?.weeklyReportsHistory?.length || 0})
                  </button>
                  <button
                    onClick={() => setHistoryType('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      historyType === 'monthly'
                        ? 'bg-coffee-800 text-amber-200 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📆 Theo Tháng ({dashboardData?.monthlyReportsHistory?.length || 0})
                  </button>
                </div>

                <button
                  onClick={handleExportCSV}
                  title="Xuất bảng báo cáo ra file Excel / CSV đối soát"
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xuất Excel (CSV)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-2.5">Mốc Thời Gian / Chu Kỳ</th>
                    <th className="p-2.5">Phân Loại</th>
                    <th className="p-2.5">Tổng Số Đơn</th>
                    <th className="p-2.5">Tổng Doanh Thu</th>
                    <th className="p-2.5 text-right">Khoảng Ngày Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyType === 'shift' && (
                    dashboardData?.shiftReportsHistory?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400">
                          Chưa có lịch sử chốt ca nào. Hãy bấm "Chốt Ca" khi kết thúc ca làm việc!
                        </td>
                      </tr>
                    ) : (
                      dashboardData?.shiftReportsHistory?.map((rep) => (
                        <tr key={rep.id} className="hover:bg-gray-50/80 transition">
                          <td className="p-2.5 font-bold text-gray-900">{rep.reportDate}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                              {rep.shiftName}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium">{rep.totalOrders} đơn</td>
                          <td className="p-2.5 font-bold text-emerald-700">
                            {rep.totalRevenue.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2.5 text-right text-gray-400 text-[11px]">Chốt bởi: {rep.closedBy || 'Admin'} ({rep.closedAt})</td>
                        </tr>
                      ))
                    )
                  )}

                  {historyType === 'daily' && (
                    dashboardData?.dailyReportsHistory?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400">
                          Chưa có lịch sử chốt ngày nào.
                        </td>
                      </tr>
                    ) : (
                      dashboardData?.dailyReportsHistory?.map((rep) => (
                        <tr key={rep.id} className="hover:bg-gray-50/80 transition">
                          <td className="p-2.5 font-bold text-gray-900">{rep.reportDate}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-extrabold text-[10px]">
                              Báo Cáo Ngày (Trọn vẹn)
                            </span>
                          </td>
                          <td className="p-2.5 font-medium">{rep.totalOrders} đơn</td>
                          <td className="p-2.5 font-bold text-emerald-700">
                            {rep.totalRevenue.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2.5 text-right text-gray-400 text-[11px]">{rep.closedAt}</td>
                        </tr>
                      ))
                    )
                  )}

                  {historyType === 'weekly' && (
                    dashboardData?.weeklyReportsHistory?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400">
                          Chưa có dữ liệu báo cáo tuần nào.
                        </td>
                      </tr>
                    ) : (
                      dashboardData?.weeklyReportsHistory?.map((rep, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition">
                          <td className="p-2.5 font-bold text-gray-900">{rep.weekCode || rep.periodLabel}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-extrabold text-[10px]">
                              Tổng Kết Tuần
                            </span>
                          </td>
                          <td className="p-2.5 font-medium">{rep.totalOrders} đơn</td>
                          <td className="p-2.5 font-bold text-emerald-700">
                            {rep.totalRevenue.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2.5 text-right text-gray-500 font-medium text-[11px]">
                            Từ {rep.startDate} đến {rep.endDate}
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {historyType === 'monthly' && (
                    dashboardData?.monthlyReportsHistory?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400">
                          Chưa có dữ liệu báo cáo tháng nào.
                        </td>
                      </tr>
                    ) : (
                      dashboardData?.monthlyReportsHistory?.map((rep, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition">
                          <td className="p-2.5 font-bold text-gray-900">{rep.monthCode || rep.periodLabel}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-extrabold text-[10px]">
                              Tổng Kết Tháng
                            </span>
                          </td>
                          <td className="p-2.5 font-medium">{rep.totalOrders} đơn</td>
                          <td className="p-2.5 font-bold text-emerald-700">
                            {rep.totalRevenue.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2.5 text-right text-gray-500 font-medium text-[11px]">
                            Từ {rep.startDate} đến {rep.endDate}
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* MENU MANAGEMENT SECTION */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
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
                          {(item.price || 0).toLocaleString('vi-VN')} đ
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
                          {(item.price || 0).toLocaleString('vi-VN')} đ
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

      {/* Modal Xem & In Lại Hóa Đơn Lịch Sử */}
      {selectedReceipt && (
        <ReceiptInvoice
          receiptData={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
