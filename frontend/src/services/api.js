const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cache helpers cho giao diện hiển thị 0ms instant load
export function getLocalCache(key) {
  try {
    const item = localStorage.getItem(`coffee_cache_${key}`);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}

export function setLocalCache(key, data) {
  try {
    localStorage.setItem(`coffee_cache_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Cannot write cache', e);
  }
}

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('coffee_pos_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Token hết hạn hoặc sai
        localStorage.removeItem('coffee_pos_token');
        localStorage.removeItem('coffee_pos_user');
      }
      throw new Error(data.message || 'Có lỗi xảy ra khi gọi API!');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const apiService = {
  // Auth
  login: (credentials) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => fetchApi('/auth/me'),

  // Categories & Menu
  getCategories: async () => {
    const res = await fetchApi('/categories');
    if (res?.success) setLocalCache('categories', res);
    return res;
  },
  getCachedCategories: () => getLocalCache('categories'),

  getMenu: async () => {
    const res = await fetchApi('/menu');
    if (res?.success) setLocalCache('menu', res);
    return res;
  },
  getCachedMenu: () => getLocalCache('menu'),

  createMenuItem: (item) => fetchApi('/menu', { method: 'POST', body: JSON.stringify(item) }),
  updateMenuItem: (id, item) => fetchApi(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteMenuItem: (id) => fetchApi(`/menu/${id}`, { method: 'DELETE' }),
  restoreMenuItem: (id) => fetchApi(`/menu/${id}/restore`, { method: 'PUT' }),

  // Tables
  getTables: async () => {
    const res = await fetchApi('/tables');
    if (res?.success) setLocalCache('tables', res);
    return res;
  },
  getCachedTables: () => getLocalCache('tables'),

  createTable: (table) => fetchApi('/tables', { method: 'POST', body: JSON.stringify(table) }),
  updateTable: (id, table) => fetchApi(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(table) }),
  deleteTable: (id) => fetchApi(`/tables/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = '') => fetchApi(`/orders${params}`),
  getTableOrder: (tableId) => fetchApi(`/orders/table/${tableId}`),
  saveOrder: (orderData) => fetchApi('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  payOrder: (orderId, payData) => fetchApi(`/orders/${orderId}/pay`, { method: 'PUT', body: JSON.stringify(payData) }),
  cancelOrder: (orderId) => fetchApi(`/orders/${orderId}`, { method: 'DELETE' }),
  deleteOrder: (id) => fetchApi(`/orders/${id}`, { method: 'DELETE' }),
  getReceipt: (orderId) => fetchApi(`/orders/${orderId}/receipt`),

  // Dashboard Reports
  getDashboard: async () => {
    const res = await fetchApi('/reports/dashboard');
    if (res?.success) setLocalCache('dashboard', res);
    return res;
  },
  getCachedDashboard: () => getLocalCache('dashboard'),
  closeDay: () => fetchApi('/reports/close-day', { method: 'POST' })
};
