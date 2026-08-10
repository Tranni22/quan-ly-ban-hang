import React, { useState } from 'react';
import { apiService } from '../services/api';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  CheckCircle2,
  Printer,
  Sparkles,
  Coffee,
  AlertCircle
} from 'lucide-react';

export default function CheckoutModal({ order, table, onClose, onSuccessPayment }) {
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER_QR'); // 'TRANSFER_QR' or 'CASH'
  const [discountPercent, setDiscountPercent] = useState(0);
  const [cashGiven, setCashGiven] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = order?.totalAmount || 0;
  const discountAmount = (totalAmount * (discountPercent || 0)) / 100;
  const finalAmount = totalAmount - discountAmount;
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeMoney = cashGivenNum - finalAmount;

  // VietQR URL
  const qrUrl = `https://img.vietqr.io/image/MB-038228888-compact2.png?amount=${Math.round(
    finalAmount
  )}&addInfo=${encodeURIComponent(
    `Thanh toan ${order?.orderCode || 'DON CAFE'}`
  )}&accountName=QUAN%20CAFE%20POS`;

  const handleProcessPayment = async () => {
    if (!order?.id) {
      setError('Đơn hàng chưa được lưu vào hệ thống!');
      return;
    }

    if (paymentMethod === 'CASH' && cashGivenNum < finalAmount) {
      setError('Số tiền khách đưa chưa đủ!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiService.payOrder(order.id, {
        paymentMethod,
        discountPercent
      });

      if (res.success) {
        onSuccessPayment(res.data);
      }
    } catch (err) {
      setError(err.message || 'Lỗi xử lý thanh toán!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-8">
        {/* Modal Header */}
        <div className="bg-coffee-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-coffee-800 rounded-2xl border border-coffee-700">
              <CreditCard className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Thanh Toán Hoá Đơn</h3>
              <p className="text-xs text-coffee-300">
                Mã đơn: <span className="font-bold text-amber-200">{order?.orderCode || 'MỚI'}</span> • {table?.name || order?.tableName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-coffee-300 hover:text-white hover:bg-coffee-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Calculation & Method */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              1. Phương thức & Giảm giá
            </h4>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER_QR')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition ${
                  paymentMethod === 'TRANSFER_QR'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 font-bold'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <QrCode className="w-6 h-6 text-amber-600" />
                <span className="text-xs">Chuyển Khoản QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 font-bold'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-600" />
                <span className="text-xs">Tiền Mặt</span>
              </button>
            </div>

            {/* Discount Percentage */}
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="text-xs font-bold text-gray-600 flex items-center justify-between mb-1.5">
                <span>Chiết khấu / Giảm giá (%)</span>
                <span className="text-amber-700">-{discountAmount.toLocaleString('vi-VN')} đ</span>
              </label>
              <div className="flex items-center gap-2">
                {[0, 5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                      discountPercent === pct
                        ? 'bg-coffee-800 text-amber-200 border-coffee-800'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Input if CASH method selected */}
            {paymentMethod === 'CASH' && (
              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                <label className="text-xs font-bold text-emerald-900 block">Tiền khách đưa</label>
                <input
                  type="number"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="Nhập số tiền..."
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-sm text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {cashGivenNum > 0 && (
                  <div className="text-xs flex justify-between font-bold pt-1 border-t border-emerald-200 text-emerald-800">
                    <span>Tiền thừa trả khách:</span>
                    <span className={changeMoney < 0 ? 'text-red-600' : 'text-emerald-700'}>
                      {changeMoney >= 0 ? `${changeMoney.toLocaleString('vi-VN')} đ` : 'Chưa đủ tiền!'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: QR Code Display or Total Summary */}
          <div className="flex flex-col justify-between bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                2. Thông tin thanh toán
              </h4>

              {paymentMethod === 'TRANSFER_QR' ? (
                <div className="text-center p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                  <p className="text-[11px] text-gray-500 font-medium mb-2">
                    Quét mã VietQR bằng app Ngân hàng / Momo / ZaloPay
                  </p>
                  <img
                    src={qrUrl}
                    alt="VietQR Code"
                    className="w-44 h-44 mx-auto rounded-xl border p-1 bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 font-mono">
                    Nội dung: Thanh toan {order?.orderCode}
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center space-y-2">
                  <Banknote className="w-12 h-12 text-emerald-600 mx-auto" />
                  <p className="text-xs font-semibold text-gray-700">
                    Thu tiền mặt trực tiếp từ khách hàng
                  </p>
                  <p className="text-[11px] text-gray-400">Kiểm tra kỹ tiền polyme trước khi bấm hoàn tất</p>
                </div>
              )}
            </div>

            {/* Summary Box */}
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Tạm tính:</span>
                <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-xs text-amber-700 font-medium">
                  <span>Chiết khấu ({discountPercent}%):</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-coffee-950 pt-2 border-t border-gray-200">
                <span>TỔNG CẦN THU:</span>
                <span className="text-coffee-700 text-lg">{finalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-5 bg-gray-100 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-xs rounded-xl transition"
          >
            Đóng / Quay lại
          </button>

          <button
            type="button"
            onClick={handleProcessPayment}
            disabled={loading}
            className="px-6 py-2.5 bg-coffee-800 hover:bg-coffee-900 active:bg-coffee-950 text-white font-bold text-xs rounded-xl shadow-lg shadow-coffee-800/20 transition disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{loading ? 'Đang xử lý...' : 'Xác Nhận & Hoàn Tất'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
