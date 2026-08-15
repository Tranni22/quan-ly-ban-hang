import React, { useState } from 'react';
import { Coffee, Printer, CheckCircle2, X, Copy, Check, Share2 } from 'lucide-react';

export default function ReceiptInvoice({ receiptData, onClose }) {
  if (!receiptData) return null;

  const { shopName, shopAddress, shopPhone, order } = receiptData;
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBill = () => {
    const itemsText = (order.items || [])
      .map((i) => `- ${i.itemName || i.name} x${i.quantity}: ${(i.totalPrice || (i.price * i.quantity)).toLocaleString('vi-VN')} đ${i.note ? ` (${i.note})` : ''}`)
      .join('\n');

    const billText = `☕ ${shopName || 'COFFEE POS'}
📍 ${shopAddress || '123 Nguyễn Huệ, Q.1, TP.HCM'}
📞 Hotline: ${shopPhone || '0908.123.456'}
--------------------------------
${receiptData.isProvisional ? '📋 PHIẾU TẠM TÍNH BÀN' : '🧾 HÓA ĐƠN THANH TOÁN'}
Mã: ${order.orderCode || 'N/A'}
Bàn: ${order.tableName || 'N/A'}
Khách: ${order.customerName || 'Khách vãng lai'}
Thời gian: ${order.paidAt || new Date().toLocaleString('vi-VN')}
--------------------------------
${itemsText}
--------------------------------
Tổng tiền: ${(order.totalAmount || 0).toLocaleString('vi-VN')} đ
${order.discountPercent > 0 ? `Giảm giá: -${(((order.totalAmount || 0) * order.discountPercent) / 100).toLocaleString('vi-VN')} đ (${order.discountPercent}%)\n` : ''}TỔNG THANH TOÁN: ${(order.finalAmount || order.totalAmount || 0).toLocaleString('vi-VN')} đ
Thanh toán: ${order.paymentMethod === 'TRANSFER_QR' ? 'Chuyển khoản QR' : order.paymentMethod === 'CASH' ? 'Tiền mặt' : order.paymentMethod || 'Chưa thanh toán'}
--------------------------------
Cảm ơn và hẹn gặp lại quý khách!`;

    navigator.clipboard.writeText(billText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: receiptData.isProvisional ? 'Phiếu Tạm Tính Bàn' : 'Hóa Đơn Cafe POS',
          text: `Hóa đơn bàn ${order.tableName} - Tổng tiền: ${(order.finalAmount || order.totalAmount || 0).toLocaleString('vi-VN')} đ`
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyBill();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-8">
        {/* Header bar - no print */}
        <div className="no-print bg-coffee-900 text-white p-3.5 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-5 h-5 ${receiptData.isProvisional ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className="text-xs sm:text-sm font-black text-amber-100">
              {receiptData.isProvisional ? 'Phiếu Tạm Tính Ra Bàn' : 'Hóa Đơn Thanh Toán'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-coffee-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-coffee-200 hover:text-white rounded-xl hover:bg-coffee-800 transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Area - Khổ in nhiệt 80mm/58mm chuẩn POS */}
        <div className="p-6 sm:p-8 font-mono text-gray-900 text-xs leading-relaxed bg-white max-h-[70vh] overflow-y-auto" id="receipt-print-area">
          {/* Shop Header */}
          <div className="text-center pb-3 border-b border-dashed border-gray-400 space-y-1">
            <div className="inline-block p-2 rounded-full bg-coffee-50 mb-1">
              <Coffee className="w-7 h-7 sm:w-8 sm:h-8 text-coffee-900 mx-auto" />
            </div>
            <h2 className="font-black text-xs sm:text-sm text-gray-950 uppercase tracking-tight">{shopName || 'COFFEE POS'}</h2>
            <p className="text-[10px] text-gray-600">{shopAddress || '123 Đường Nguyễn Huệ, Quận 1, TP.HCM'}</p>
            <p className="text-[10px] text-gray-600">Hotline: {shopPhone || '0908.123.456'}</p>
          </div>

          {/* Bill Meta */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
            <div className="text-center font-black text-gray-950 text-xs mb-1">
              {receiptData.isProvisional ? 'PHIẾU TẠM TÍNH (CHƯA THANH TOÁN)' : 'HÓA ĐƠN THANH TOÁN'}
            </div>
            {receiptData.isProvisional && (
              <div className="text-center text-[10px] text-amber-900 font-bold italic mb-1.5 bg-amber-50 py-0.5 rounded border border-amber-200">
                (Quý khách vui lòng đối chiếu món & số lượng)
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Mã đơn:</span>
              <span className="font-black text-gray-900">{order.orderCode || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bàn:</span>
              <span className="font-black text-coffee-900">{order.tableName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Khách hàng:</span>
              <span className="font-semibold">{order.customerName || 'Khách vãng lai'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Thu ngân/Phục vụ:</span>
              <span>{order.staffName || 'Nhân viên'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Thời gian:</span>
              <span>{order.paidAt || new Date().toLocaleString('vi-VN')}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-gray-400">
            <div className="grid grid-cols-12 font-black border-b border-gray-300 pb-1 mb-2 text-[10px] uppercase text-gray-600">
              <span className="col-span-6">Tên món</span>
              <span className="col-span-2 text-center">SL</span>
              <span className="col-span-4 text-right">T.Tiền</span>
            </div>

            <div className="space-y-1.5">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px] items-start">
                  <div className="col-span-6 font-bold text-gray-900 pr-1">
                    {item.itemName || item.name}
                    {item.note && (
                      <div className="text-[9px] text-gray-500 italic font-normal">({item.note})</div>
                    )}
                  </div>
                  <div className="col-span-2 text-center font-bold">{item.quantity}</div>
                  <div className="col-span-4 text-right font-black">
                    {(item.totalPrice || (item.price * item.quantity)).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total calculation */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng cộng món:</span>
              <span className="font-bold">{(order.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
            </div>
            {order.discountPercent > 0 && (
              <div className="flex justify-between text-amber-800 font-bold">
                <span>Giảm giá ({order.discountPercent}%):</span>
                <span>
                  -
                  {(
                    ((order.totalAmount || 0) * order.discountPercent) /
                    100
                  ).toLocaleString('vi-VN')}{' '}
                  đ
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs font-black text-gray-950 pt-1.5 border-t border-gray-300">
              <span>TỔNG KHÁCH TRẢ:</span>
              <span className="text-sm text-coffee-950 font-black">
                {(order.finalAmount || order.totalAmount || 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 pt-1">
              <span>Hình thức TT:</span>
              <span className="font-bold uppercase text-gray-800">
                {order.paymentMethod === 'TRANSFER_QR'
                  ? 'Chuyển khoản QR'
                  : order.paymentMethod === 'CASH'
                  ? 'Tiền mặt'
                  : order.paymentMethod || 'Chưa thanh toán'}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 text-center space-y-1 text-[10px] text-gray-600">
            <p className="font-black text-gray-900">CẢM ƠN QUÝ KHÁCH VÀ HẸN GẶP LẠI!</p>
            <p className="italic text-[9px]">Wifi: CafePOS_FreePass / Pass: cafepos2026</p>
          </div>
        </div>

        {/* Footer actions - no print */}
        <div className="no-print p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyBill}
              className="px-3 py-2 bg-white hover:bg-gray-100 active:scale-95 text-gray-800 font-bold text-xs rounded-xl border border-gray-300 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>

            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                type="button"
                onClick={handleShare}
                className="p-2 bg-white hover:bg-gray-100 active:scale-95 text-gray-800 rounded-xl border border-gray-300 transition shadow-2xs cursor-pointer"
                title="Chia sẻ hóa đơn"
              >
                <Share2 className="w-3.5 h-3.5 text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-coffee-800 hover:bg-coffee-900 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>In Hóa Đơn</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 active:scale-95 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
