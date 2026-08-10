import React from 'react';
import { Coffee, Printer, CheckCircle2, X } from 'lucide-react';

export default function ReceiptInvoice({ receiptData, onClose }) {
  if (!receiptData) return null;

  const { shopName, shopAddress, shopPhone, order } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-8">
        {/* Header bar - no print */}
        <div className="no-print bg-coffee-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">Thanh Toán Thành Công</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-coffee-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" /> In Hoá Đơn
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-coffee-300 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Area */}
        <div className="p-8 font-mono text-gray-800 text-xs leading-relaxed bg-white" id="receipt-print-area">
          {/* Shop Header */}
          <div className="text-center pb-4 border-b border-dashed border-gray-300 space-y-1">
            <div className="inline-block p-2 rounded-full bg-coffee-50 mb-1">
              <Coffee className="w-8 h-8 text-coffee-800 mx-auto" />
            </div>
            <h2 className="font-extrabold text-sm text-gray-900">{shopName}</h2>
            <p className="text-[10px] text-gray-500">{shopAddress}</p>
            <p className="text-[10px] text-gray-500">Hotline: {shopPhone}</p>
          </div>

          {/* Bill Meta */}
          <div className="py-3 border-b border-dashed border-gray-300 space-y-1 text-[11px]">
            <div className="text-center font-bold text-gray-900 text-xs mb-2">
              HOÁ ĐƠN THANH TOÁN
            </div>
            <div className="flex justify-between">
              <span>Mã HĐ:</span>
              <span className="font-bold">{order.orderCode}</span>
            </div>
            <div className="flex justify-between">
              <span>Bàn:</span>
              <span className="font-bold">{order.tableName}</span>
            </div>
            <div className="flex justify-between">
              <span>Khách hàng:</span>
              <span>{order.customerName || 'Khách vãng lai'}</span>
            </div>
            <div className="flex justify-between">
              <span>Thu ngân:</span>
              <span>{order.staffName || 'Nhân viên'}</span>
            </div>
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <span>{order.paidAt || new Date().toLocaleString('vi-VN')}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-gray-300">
            <div className="grid grid-cols-12 font-bold border-b border-gray-200 pb-1 mb-2 text-[10px] uppercase text-gray-500">
              <span className="col-span-6">Tên món</span>
              <span className="col-span-2 text-center">SL</span>
              <span className="col-span-4 text-right">Thành tiền</span>
            </div>

            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px]">
                  <div className="col-span-6 font-medium text-gray-900">
                    {item.itemName}
                    {item.note && (
                      <div className="text-[9px] text-gray-400 italic">({item.note})</div>
                    )}
                  </div>
                  <div className="col-span-2 text-center">{item.quantity}</div>
                  <div className="col-span-4 text-right font-bold">
                    {item.totalPrice.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total calculation */}
          <div className="py-3 border-b border-dashed border-gray-300 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span>Tổng cộng món:</span>
              <span>{order.totalAmount?.toLocaleString('vi-VN')} đ</span>
            </div>
            {order.discountPercent > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Giảm giá ({order.discountPercent}%):</span>
                <span>
                  -
                  {(
                    (order.totalAmount * order.discountPercent) /
                    100
                  ).toLocaleString('vi-VN')}{' '}
                  đ
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs font-extrabold text-gray-900 pt-1.5 border-t border-gray-200">
              <span>TỔNG KHÁCH TRẢ:</span>
              <span className="text-sm text-coffee-800">
                {order.finalAmount?.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 pt-1">
              <span>Hình thức TT:</span>
              <span className="font-bold uppercase">
                {order.paymentMethod === 'TRANSFER_QR' ? 'Chuyển khoản QR' : 'Tiền mặt'}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 text-center space-y-1 text-[10px] text-gray-500">
            <p className="font-bold text-gray-700">CẢM ƠN QUÝ KHÁCH VÀ HẸN GẶP LẠI!</p>
            <p className="italic">Wifi: CafePOS_FreePass / Pass: cafepos2026</p>
          </div>
        </div>

        {/* Footer actions - no print */}
        <div className="no-print p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 text-white font-bold text-xs rounded-xl hover:bg-gray-900 transition"
          >
            Đóng Hoá Đơn
          </button>
        </div>
      </div>
    </div>
  );
}
