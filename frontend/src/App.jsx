import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import TableMap from './components/TableMap';
import OrderPOS from './components/OrderPOS';
import CheckoutModal from './components/CheckoutModal';
import ReceiptInvoice from './components/ReceiptInvoice';
import AdminDashboard from './components/AdminDashboard';
import TableDesigner from './components/TableDesigner';
import AppSplashScreen from './components/AppSplashScreen';
import { SpeedInsights } from '@vercel/speed-insights/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 font-black text-xl">
              ☕
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Đã xảy ra sự cố nhỏ!</h2>
            <p className="text-xs text-gray-500 mb-6">
              Hệ thống đã tự động khôi phục an toàn. Hãy nhấp nút bên dưới để tiếp tục sử dụng.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 bg-coffee-800 hover:bg-coffee-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              Tải Lại Trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tables'); // 'tables', 'pos', 'menu', 'dashboard'
  const [isInitializing, setIsInitializing] = useState(true);

  // Selection states
  const [selectedTable, setSelectedTable] = useState(null);

  // Checkout & Receipt Modal states
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [checkoutTable, setCheckoutTable] = useState(null);
  const [paidReceiptData, setPaidReceiptData] = useState(null);

  useEffect(() => {
    // Ứng dụng khởi tạo mượt trong 500ms để đảm bảo UI mượt mà tuyệt đối
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return <AppSplashScreen text="Đang chuẩn bị dữ liệu mượt mà..." />;
  }

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
        <div className={activeTab === 'tables' ? 'block' : 'hidden'}>
          <TableMap
            onSelectTable={handleSelectTableFromMap}
            onCheckoutTable={handleCheckoutTable}
          />
        </div>

        <div className={activeTab === 'pos' ? 'block' : 'hidden'}>
          <OrderPOS
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            onCheckoutTable={handleCheckoutTable}
          />
        </div>

        <div className={activeTab === 'table-designer' ? 'block' : 'hidden'}>
          <TableDesigner />
        </div>

        <div className={activeTab === 'menu' ? 'block' : 'hidden'}>
          <AdminDashboard activeSubTab="menu" />
        </div>

        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <AdminDashboard activeSubTab="reports" />
        </div>
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

      {/* Vercel Speed Insights */}
      <SpeedInsights />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
