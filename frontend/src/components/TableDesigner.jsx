import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '../services/api';
import {
  Layout,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Coffee,
  Users,
  Building,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Sliders
} from 'lucide-react';

export default function TableDesigner() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [tableName, setTableName] = useState('');
  const [tableArea, setTableArea] = useState('Tầng 1 (Trong nhà)');
  const [customAreaInput, setCustomAreaInput] = useState('');
  const [tableSeats, setTableSeats] = useState(4);

  // Filter
  const [activeAreaFilter, setActiveAreaFilter] = useState('ALL');

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getTables();
      if (res.success) {
        setTables(res.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách bàn:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const areasList = useMemo(() => {
    const defaultAreas = [
      'Tầng 1 (Trong nhà)',
      'Tầng 1 (Cửa kính)',
      'Tầng 2 (Máy lạnh)',
      'Tầng 2 (Ban công)',
      'Sân Vườn (Ngoài trời)',
      'Khu VIP Hộp'
    ];
    const existingAreas = tables.map((t) => t.area).filter(Boolean);
    return Array.from(new Set([...defaultAreas, ...existingAreas]));
  }, [tables]);

  const filteredTables = useMemo(() => {
    if (activeAreaFilter === 'ALL') return tables;
    return tables.filter((t) => t.area === activeAreaFilter);
  }, [tables, activeAreaFilter]);

  const stats = useMemo(() => {
    const totalTables = tables.length;
    const totalSeats = tables.reduce((sum, t) => sum + (t.seats || 0), 0);
    const uniqueAreas = new Set(tables.map((t) => t.area)).size;
    return { totalTables, totalSeats, uniqueAreas };
  }, [tables]);

  const resetForm = () => {
    setEditingId(null);
    setTableName('');
    setTableArea('Tầng 1 (Trong nhà)');
    setCustomAreaInput('');
    setTableSeats(4);
  };

  const handleEditTable = (table) => {
    setEditingId(table.id);
    setTableName(table.name);
    setTableArea(table.area);
    setTableSeats(table.seats || 4);
    setCustomAreaInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tableName.trim()) {
      alert('Vui lòng nhập tên bàn!');
      return;
    }

    const finalArea = tableArea === 'CUSTOM' ? customAreaInput.trim() : tableArea;
    if (!finalArea) {
      alert('Vui lòng chọn hoặc nhập tên khu vực!');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Cập nhật
        const res = await apiService.updateTable(editingId, {
          name: tableName.trim(),
          area: finalArea,
          seats: Number(tableSeats)
        });
        if (res.success) {
          setNotification('Đã cập nhật bàn thành công!');
          resetForm();
          loadTables();
        }
      } else {
        // Thêm mới
        const res = await apiService.createTable({
          name: tableName.trim(),
          area: finalArea,
          seats: Number(tableSeats)
        });
        if (res.success) {
          setNotification('Đã thêm bàn mới vào sơ đồ thành công!');
          resetForm();
          loadTables();
        }
      }
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu thông tin bàn!');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi sơ đồ không?`)) {
      try {
        const res = await apiService.deleteTable(id);
        if (res.success) {
          setNotification(`Đã xóa "${name}" thành công!`);
          setTimeout(() => setNotification(''), 3000);
          loadTables();
        }
      } catch (err) {
        alert(err.message || 'Lỗi khi xóa bàn!');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-coffee-900 via-coffee-800 to-amber-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Bố Thắng Studio Layout
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            🎨 Thiết Kế & Quản Lý Sơ Đồ Bàn Quán Cà Phê
          </h2>
          <p className="text-xs text-coffee-200 mt-1 max-w-2xl">
            Tùy chỉnh linh hoạt sơ đồ bàn, số lượng ghế và chia khu vực riêng biệt cho từng không gian quán (Tầng 1, Tầng 2, Ban công, Sân vườn, Phòng VIP...).
          </p>
        </div>

        {/* Stats Summary Badges */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <div className="text-center px-3 border-r border-white/10">
            <div className="text-xs text-coffee-200">Tổng số bàn</div>
            <div className="text-lg font-black text-amber-300">{stats.totalTables} bàn</div>
          </div>
          <div className="text-center px-3 border-r border-white/10">
            <div className="text-xs text-coffee-200">Sức chứa</div>
            <div className="text-lg font-black text-emerald-300">{stats.totalSeats} ghế</div>
          </div>
          <div className="text-center px-3">
            <div className="text-xs text-coffee-200">Khu vực</div>
            <div className="text-lg font-black text-sky-300">{stats.uniqueAreas} khu</div>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Grid: Form Left (Col-4) & Preview Right (Col-8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Designer Inputs */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-coffee-600" />
              {editingId ? 'Chỉnh Sửa Thông Tin Bàn' : 'Thêm Bàn Mới Cho Quán'}
            </h3>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Hủy sửa
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Tên bàn */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Tên Bàn / Số Bàn *</label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Vd: Bàn 01, Bàn Ban Công 02, Bàn VIP 1..."
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-coffee-600 transition"
                required
              />
            </div>

            {/* Chọn Khu vực */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Khu Vực Không Gian *</label>
              <select
                value={tableArea}
                onChange={(e) => setTableArea(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-coffee-600 font-medium transition"
              >
                {areasList.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
                <option value="CUSTOM">+ Tạo khu vực mới...</option>
              </select>

              {/* Ô nhập khu vực mới nếu chọn CUSTOM */}
              {tableArea === 'CUSTOM' && (
                <input
                  type="text"
                  value={customAreaInput}
                  onChange={(e) => setCustomAreaInput(e.target.value)}
                  placeholder="Nhập tên khu vực mới (vd: Tầng Trệt, Sân Thượng...)"
                  className="w-full mt-2 px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs outline-none focus:bg-white focus:border-coffee-600 transition"
                  required
                />
              )}
            </div>

            {/* Số ghế */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Sức Chứa (Số Ghế)</label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 4, 6, 8].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTableSeats(s)}
                    className={`py-2 rounded-xl font-bold border transition ${
                      tableSeats === s
                        ? 'bg-coffee-800 text-amber-200 border-coffee-800 shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {s} Ghế
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="30"
                value={tableSeats}
                onChange={(e) => setTableSeats(Number(e.target.value))}
                className="w-full mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-coffee-600 transition"
              />
            </div>

            {/* Nút bấm tác vụ */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-coffee-800 hover:bg-coffee-900 active:bg-coffee-950 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{saving ? 'Đang lưu...' : editingId ? 'Cập Nhật Thông Tin Bàn' : 'Thêm Bàn Vào Sơ Đồ'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview: Interactive Layout Grid */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-coffee-600" />
                Sơ Đồ Không Gian Bàn Hiện Tại
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Nhấp vào nút Sửa hoặc Xóa trên từng thẻ bàn để quản lý nhanh.
              </p>
            </div>

            {/* Reload Button */}
            <button
              onClick={loadTables}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 transition flex items-center gap-1 text-xs font-semibold"
              title="Tải lại sơ đồ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Cập nhật</span>
            </button>
          </div>

          {/* Area Tabs Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveAreaFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                activeAreaFilter === 'ALL'
                  ? 'bg-coffee-800 text-amber-200 shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🌐 Tất cả ({tables.length})
            </button>
            {areasList.map((area) => {
              const count = tables.filter((t) => t.area === area).length;
              if (count === 0 && activeAreaFilter !== area) return null;
              return (
                <button
                  key={area}
                  onClick={() => setActiveAreaFilter(area)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                    activeAreaFilter === area
                      ? 'bg-coffee-800 text-amber-200 shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📍 {area} ({count})
                </button>
              );
            })}
          </div>

          {/* Cards Grid */}
          {loading && tables.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">Đang tải sơ đồ bàn...</div>
          ) : filteredTables.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center">
              <Coffee className="w-10 h-10 text-gray-200 mb-2" />
              <p>Chưa có bàn nào ở khu vực này.</p>
              <p className="text-[11px] text-gray-300 mt-1">Dùng form bên trái để thêm bàn mới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredTables.map((table) => (
                <div
                  key={table.id}
                  className={`p-3.5 rounded-2xl border transition duration-200 flex flex-col justify-between h-36 relative group shadow-2xs ${
                    editingId === table.id
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
                      : 'bg-white border-gray-200 hover:border-coffee-500 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      ID #{table.id}
                    </span>
                    <span className="text-[11px] font-bold text-coffee-800 flex items-center gap-1">
                      <Users className="w-3 h-3 text-coffee-600" /> {table.seats} ghế
                    </span>
                  </div>

                  <div className="my-1 text-center">
                    <h4 className="font-extrabold text-gray-800 text-sm">{table.name}</h4>
                    <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{table.area}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEditTable(table)}
                      className="flex-1 py-1 bg-gray-50 hover:bg-amber-100 hover:text-amber-900 text-gray-600 font-bold text-[11px] rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id, table.name)}
                      className="p-1 bg-gray-50 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-lg transition"
                      title="Xóa bàn này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
