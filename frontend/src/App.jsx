import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import TableMap from './components/TableMap';
import OrderPOS from './components/OrderPOS';
import CheckoutModal from './components/CheckoutModal';
import ReceiptInvoice from './components/ReceiptInvoice';
import AdminDashboard from './components/AdminDashboard';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tables'); // 'tables', 'pos', 'menu', 'dashboard'

  // Selection states
  const [selectedTable, setSelectedTable] = useState(null);

  // Checkout & Receipt Modal states
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [checkoutTable, setCheckoutTable] = useState(null);
  const [paidReceiptData, setPaidReceiptData] = useState(null);

  if (!user) {
    return <LoginModal />;
  }

  const handleSelectTableFromMap = (table) => {
    setSelectedTable(table);
    setActiveTab('pos');
  };

  const handleCheckoutTable = (table, order) => {
    setCheckoutTable(table);
    setCheckoutOrder(order);
  };

  const handleSuccessPayment = (paidOrderData) => {
    setCheckoutOrder(null);
    setCheckoutTable(null);

    // Show Receipt Modal
    setPaidReceiptData({
      shopName: 'COFFEE POS - QUÁN CÀ PHÊ PHIN & ESPRESSO',
      shopAddress: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      shopPhone: '0908.123.456 - 028.3822.8888',
      order: paidOrderData
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'tables' && (
          <TableMap
            onSelectTable={handleSelectTableFromMap}
            onCheckoutTable={handleCheckoutTable}
          />
        )}

        {activeTab === 'pos' && (
          <OrderPOS
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            onCheckoutTable={handleCheckoutTable}
          />
        )}

        {activeTab === 'menu' && <AdminDashboard activeSubTab="menu" />}

        {activeTab === 'dashboard' && <AdminDashboard activeSubTab="reports" />}
      </main>

      {/* Checkout Modal */}
      {checkoutOrder && (
        <CheckoutModal
          order={checkoutOrder}
          table={checkoutTable}
          onClose={() => {
            setCheckoutOrder(null);
            setCheckoutTable(null);
          }}
          onSuccessPayment={handleSuccessPayment}
        />
      )}

      {/* Paid Receipt Invoice Modal */}
      {paidReceiptData && (
        <ReceiptInvoice
          receiptData={paidReceiptData}
          onClose={() => setPaidReceiptData(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
