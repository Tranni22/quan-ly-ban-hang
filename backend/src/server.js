import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from './db.js';

const JWT_SECRET = 'coffee_shop_pos_secret_key_2026_super_secure';
const PORT = process.env.PORT || 5000;

// Khởi tạo DB
initDatabase();

const app = express();

app.use(cors());
app.use(express.json());

// --- MIDDLEWARES ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Thiếu token xác thực!' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Yêu cầu quyền Quản lý (Admin)!' });
  }
}

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Tài khoản không tồn tại!' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu không đúng!' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: payload
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập!' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  return res.json({ success: true, user: req.user });
});

// --- CATEGORIES ROUTES ---
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sortOrder ASC').all();
    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi tải danh mục!' });
  }
});

app.post('/api/categories', authenticateToken, requireAdmin, (req, res) => {
  const { name, icon, sortOrder } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống!' });

  try {
    const stmt = db.prepare('INSERT INTO categories (name, icon, sortOrder) VALUES (?, ?, ?)');
    const result = stmt.run(name, icon || '☕', sortOrder || 0);
    return res.json({ success: true, message: 'Thêm danh mục thành công!', id: result.lastInsertRowid });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi thêm danh mục!' });
  }
});

// --- MENU ROUTES ---
app.get('/api/menu', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sortOrder ASC').all();
    
    // Chỉ lấy món ăn chưa bị xóa
    const items = db.prepare(`
      SELECT m.*, c.name as categoryName 
      FROM menu_items m 
      JOIN categories c ON m.categoryId = c.id 
      WHERE m.isDeleted = 0
      ORDER BY m.categoryId ASC, m.id ASC
    `).all();

    // Lấy các món đã bị xóa để hiển thị thùng rác khôi phục
    const deletedItems = db.prepare(`
      SELECT m.*, c.name as categoryName 
      FROM menu_items m 
      LEFT JOIN categories c ON m.categoryId = c.id 
      WHERE m.isDeleted = 1
      ORDER BY m.id DESC
    `).all();

    // Group items by category
    const categorizedMenu = categories.map(cat => ({
      ...cat,
      items: items.filter(item => item.categoryId === cat.id)
    }));

    // Bổ sung nhóm "Món Khác" nếu có món nào có categoryId không hợp lệ/đã bị xóa danh mục
    const orphanedItems = items.filter(item => !categories.some(cat => cat.id === item.categoryId));
    if (orphanedItems.length > 0) {
      categorizedMenu.push({
        id: 'orphaned',
        name: 'Món Khác',
        icon: '🏷️',
        sortOrder: 999,
        items: orphanedItems
      });
    }

    return res.json({ 
      success: true, 
      categories: categorizedMenu, 
      allItems: items,
      deletedItems: deletedItems 
    });
  } catch (error) {
    console.error('Lỗi tải danh sách món:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách món!' });
  }
});

app.post('/api/menu', authenticateToken, requireAdmin, (req, res) => {
  const { categoryId, name, price, description, image, isAvailable } = req.body;
  if (!categoryId || !name || price === undefined) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ danh mục, tên món và giá tiền!' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO menu_items (categoryId, name, price, description, image, isAvailable)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      categoryId,
      name,
      parseFloat(price),
      description || '',
      image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
      isAvailable !== undefined ? (isAvailable ? 1 : 0) : 1
    );

    return res.json({ success: true, message: 'Thêm món mới thành công!', id: result.lastInsertRowid });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi thêm món mới!' });
  }
});

app.put('/api/menu/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { categoryId, name, price, description, image, isAvailable } = req.body;

  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    if (!item) return res.status(404).json({ success: false, message: 'Món không tồn tại!' });

    const stmt = db.prepare(`
      UPDATE menu_items 
      SET categoryId = ?, name = ?, price = ?, description = ?, image = ?, isAvailable = ?
      WHERE id = ?
    `);

    stmt.run(
      categoryId !== undefined ? categoryId : item.categoryId,
      name !== undefined ? name : item.name,
      price !== undefined ? parseFloat(price) : item.price,
      description !== undefined ? description : item.description,
      image !== undefined ? image : item.image,
      isAvailable !== undefined ? (isAvailable ? 1 : 0) : item.isAvailable,
      id
    );

    return res.json({ success: true, message: 'Cập nhật món thành công!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật món!' });
  }
});

app.delete('/api/menu/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    // Chuyển sang Soft Delete (Đánh dấu đã xóa) để có thể khôi phục
    db.prepare('UPDATE menu_items SET isDeleted = 1 WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Đã xóa món khỏi thực đơn chính! (Có thể khôi phục từ Thùng rác)' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa món!' });
  }
});

app.put('/api/menu/:id/restore', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    // Khôi phục món ăn về thực đơn chính
    db.prepare('UPDATE menu_items SET isDeleted = 0 WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Khôi phục món ăn thành công!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi khôi phục món ăn!' });
  }
});

// --- TABLES ROUTES ---
app.get('/api/tables', (req, res) => {
  try {
    const tables = db.prepare('SELECT * FROM tables ORDER BY id ASC').all();
    
    // Đính kèm order active cho bàn nếu có
    const activeOrders = db.prepare(`
      SELECT * FROM orders WHERE status = 'PENDING'
    `).all();

    const tablesWithOrder = tables.map(tbl => {
      const currentOrder = activeOrders.find(ord => ord.tableId === tbl.id);
      return {
        ...tbl,
        currentOrder: currentOrder || null
      };
    });

    return res.json({ success: true, data: tablesWithOrder });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách bàn!' });
  }
});

app.post('/api/tables', authenticateToken, requireAdmin, (req, res) => {
  const { name, area, seats } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Tên bàn không được để trống!' });

  try {
    const stmt = db.prepare('INSERT INTO tables (name, area, seats) VALUES (?, ?, ?)');
    const result = stmt.run(name, area || 'Tầng 1', seats || 4);
    return res.json({ success: true, message: 'Thêm bàn thành công!', id: result.lastInsertRowid });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi thêm bàn!' });
  }
});

app.put('/api/tables/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, area, seats, status } = req.body;

  try {
    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
    if (!table) return res.status(404).json({ success: false, message: 'Bàn không tồn tại!' });

    const stmt = db.prepare(`
      UPDATE tables 
      SET name = ?, area = ?, seats = ?, status = ?
      WHERE id = ?
    `);

    stmt.run(
      name !== undefined ? name : table.name,
      area !== undefined ? area : table.area,
      seats !== undefined ? Number(seats) : table.seats,
      status !== undefined ? status : table.status,
      id
    );

    return res.json({ success: true, message: 'Cập nhật thông tin bàn thành công!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật bàn!' });
  }
});

app.delete('/api/tables/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM tables WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Đã xóa bàn khỏi sơ đồ!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa bàn!' });
  }
});

// --- ORDERS ROUTES ---
app.get('/api/orders', authenticateToken, (req, res) => {
  const { status, date } = req.query;
  try {
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND date(createdAt) = date(?)';
      params.push(date);
    }

    query += ' ORDER BY id DESC';

    const orders = db.prepare(query).all(...params);

    // Lấy kèm chi tiết món
    const getItemStmt = db.prepare('SELECT * FROM order_items WHERE orderId = ?');
    const fullOrders = orders.map(ord => ({
      ...ord,
      items: getItemStmt.all(ord.id)
    }));

    return res.json({ success: true, data: fullOrders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách đơn hàng!' });
  }
});

app.get('/api/orders/table/:tableId', authenticateToken, (req, res) => {
  const { tableId } = req.params;
  try {
    const activeOrder = db.prepare(`
      SELECT * FROM orders WHERE tableId = ? AND status = 'PENDING'
    `).get(tableId);

    if (!activeOrder) {
      return res.json({ success: true, data: null });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(activeOrder.id);
    return res.json({
      success: true,
      data: {
        ...activeOrder,
        items
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi tìm đơn hàng của bàn!' });
  }
});

// Tạo order mới hoặc cập nhật order của bàn
app.post('/api/orders', authenticateToken, (req, res) => {
  const { tableId, items, note, customerName } = req.body;
  if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn bàn và ít nhất 1 món!' });
  }

  try {
    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
    if (!table) return res.status(404).json({ success: false, message: 'Bàn không tồn tại!' });

    // Kiểm tra xem bàn đã có đơn PENDING chưa
    let order = db.prepare("SELECT * FROM orders WHERE tableId = ? AND status = 'PENDING'").get(tableId);
    let orderId;

    if (order) {
      // Đã có đơn PENDING -> Xóa các item cũ để thay bằng items mới
      orderId = order.id;
      db.prepare('DELETE FROM order_items WHERE orderId = ?').run(orderId);
    } else {
      // Chưa có đơn PENDING -> Tạo đơn mới
      const countToday = db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(createdAt) = date('now')").get().count;
      const orderCode = `ORD-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${String(countToday + 1).padStart(3, '0')}`;

      const insertOrder = db.prepare(`
        INSERT INTO orders (orderCode, tableId, tableName, userId, staffName, customerName, note, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
      `);

      const result = insertOrder.run(
        orderCode,
        table.id,
        table.name,
        req.user.id,
        req.user.fullName,
        customerName || 'Khách vãng lai',
        note || ''
      );
      orderId = result.lastInsertRowid;
    }

    // Chèn danh sách món mới vào order_items & tính tổng tiền
    let totalAmount = 0;
    const insertItem = db.prepare(`
      INSERT INTO order_items (orderId, menuItemId, itemName, price, quantity, note, totalPrice)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(item.menuItemId);
      if (menuItem) {
        const itemTotal = menuItem.price * item.quantity;
        totalAmount += itemTotal;
        insertItem.run(
          orderId,
          menuItem.id,
          menuItem.name,
          menuItem.price,
          item.quantity,
          item.note || '',
          itemTotal
        );
      }
    });

    // Cập nhật tổng tiền đơn hàng
    db.prepare(`
      UPDATE orders 
      SET totalAmount = ?, finalAmount = ?, note = ?, customerName = ? 
      WHERE id = ?
    `).run(totalAmount, totalAmount, note || '', customerName || 'Khách vãng lai', orderId);

    // Đổi trạng thái bàn sang SERVING
    db.prepare("UPDATE tables SET status = 'SERVING' WHERE id = ?").run(tableId);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const updatedItems = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(orderId);

    return res.json({
      success: true,
      message: 'Đã lưu đơn gọi món thành công!',
      data: {
        ...updatedOrder,
        items: updatedItems
      }
    });
  } catch (error) {
    console.error('Create/update order error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi lưu đơn hàng!' });
  }
});

// Thanh toán hóa đơn
app.put('/api/orders/:id/pay', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { paymentMethod, discountPercent } = req.body;

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });

    if (order.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã được thanh toán trước đó!' });
    }

    const discount = parseFloat(discountPercent || 0);
    const finalAmount = order.totalAmount * (1 - discount / 100);

    // Cập nhật Order status = PAID
    db.prepare(`
      UPDATE orders 
      SET status = 'PAID',
          paymentMethod = ?,
          discountPercent = ?,
          finalAmount = ?,
          paidAt = datetime('now', 'localtime')
      WHERE id = ?
    `).run(paymentMethod || 'CASH', discount, finalAmount, id);

    // Đổi trạng thái bàn thành EMPTY (nếu không còn order pending khác)
    if (order.tableId) {
      const otherPending = db.prepare("SELECT COUNT(*) as count FROM orders WHERE tableId = ? AND status = 'PENDING' AND id != ?")
        .get(order.tableId, id).count;
      if (otherPending === 0) {
        db.prepare("UPDATE tables SET status = 'EMPTY' WHERE id = ?").run(order.tableId);
      }
    }

    const paidOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(id);

    return res.json({
      success: true,
      message: 'Thanh toán thành công! Hoàn tất đơn hàng.',
      data: {
        ...paidOrder,
        items
      }
    });
  } catch (error) {
    console.error('Pay error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi xử lý thanh toán!' });
  }
});

// Hủy đơn hàng
app.delete('/api/orders/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });

    db.prepare("UPDATE orders SET status = 'CANCELLED' WHERE id = ?").run(id);

    if (order.tableId) {
      db.prepare("UPDATE tables SET status = 'EMPTY' WHERE id = ?").run(order.tableId);
    }

    return res.json({ success: true, message: 'Đã hủy đơn hàng thành công!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi hủy đơn hàng!' });
  }
});

// Lấy chi tiết hóa đơn
app.get('/api/orders/:id/receipt', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });

    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(id);

    return res.json({
      success: true,
      receipt: {
        shopName: 'COFFEE POS - QUÁN CÀ PHÊ PHIN & ESPRESSO',
        shopAddress: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        shopPhone: '0908.123.456 - 028.3822.8888',
        order: {
          ...order,
          items
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi xuất hóa đơn!' });
  }
});

// --- DASHBOARD & REPORTS ROUTES ---
app.get('/api/reports/dashboard', authenticateToken, (req, res) => {
  try {
    // 0. Đếm số ca đã chốt trong ngày hôm nay
    const shiftsToday = db.prepare(`
      SELECT COUNT(*) as count FROM shift_reports 
      WHERE reportDate = date('now', 'localtime')
    `).get().count;

    const currentShiftNum = (shiftsToday % 3) + 1;
    const shiftNames = { 1: 'Ca 1 (Sáng)', 2: 'Ca 2 (Chiều)', 3: 'Ca 3 (Tối)' };
    const currentShiftName = shiftNames[currentShiftNum];

    // 1. Thống kê ca hiện tại (Chỉ tính các đơn status = 'PAID' chưa chốt ca)
    const todaySales = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue
      FROM orders 
      WHERE status = 'PAID' AND date(paidAt) = date('now', 'localtime')
    `).get();

    // 1b. Thống kê tuần này (Tính từ các đơn PAID hoặc CLOSED trong tuần hiện tại - Tự động reset theo Tuần)
    const weekSales = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue
      FROM orders 
      WHERE status IN ('PAID', 'CLOSED') 
        AND strftime('%Y', paidAt) = strftime('%Y', 'now')
        AND strftime('%W', paidAt) = strftime('%W', 'now')
    `).get();

    // 1c. Thống kê tháng này (Tính từ các đơn PAID hoặc CLOSED trong tháng hiện tại - Tự động reset theo Tháng)
    const monthSales = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue
      FROM orders 
      WHERE status IN ('PAID', 'CLOSED') 
        AND strftime('%Y', paidAt) = strftime('%Y', 'now')
        AND strftime('%m', paidAt) = strftime('%m', 'now')
    `).get();

    // 2. Tổng số bàn đang phục vụ
    const servingTables = db.prepare("SELECT COUNT(*) as count FROM tables WHERE status = 'SERVING'").get().count;
    const totalTables = db.prepare("SELECT COUNT(*) as count FROM tables").get().count;

    // 3. Top 5 món bán chạy nhất (từ đơn PAID và CLOSED)
    const topItems = db.prepare(`
      SELECT itemName, SUM(quantity) as totalQty, SUM(totalPrice) as totalSales
      FROM order_items oi
      JOIN orders o ON oi.orderId = o.id
      WHERE o.status IN ('PAID', 'CLOSED')
      GROUP BY itemName
      ORDER BY totalQty DESC
      LIMIT 5
    `).all();

    // 4. Doanh thu 7 ngày gần nhất
    const recent7Days = db.prepare(`
      SELECT 
        date(paidAt) as date,
        COUNT(*) as orderCount,
        COALESCE(SUM(finalAmount), 0) as revenue
      FROM orders
      WHERE status IN ('PAID', 'CLOSED')
      GROUP BY date(paidAt)
      ORDER BY date DESC
      LIMIT 7
    `).all();

    // 5. Danh sách đơn hàng vừa thanh toán gần đây
    const recentOrders = db.prepare(`
      SELECT * FROM orders ORDER BY id DESC LIMIT 20
    `).all();

    // 6. Lịch sử chốt ca (Shift Reports History)
    const shiftReportsHistory = db.prepare(`
      SELECT * FROM shift_reports ORDER BY id DESC LIMIT 30
    `).all();

    // 7. Lịch sử báo cáo ngày đã chốt (Daily Reports History)
    const dailyReportsHistory = db.prepare(`
      SELECT * FROM daily_reports ORDER BY id DESC LIMIT 30
    `).all();

    // 8. Lịch sử báo cáo tổng kết theo Tuần (Weekly Reports History)
    const weeklyReportsHistory = db.prepare(`
      SELECT 
        strftime('Tuần %W (%Y)', paidAt) as periodLabel,
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue,
        MIN(date(paidAt)) as startDate,
        MAX(date(paidAt)) as endDate
      FROM orders
      WHERE status IN ('PAID', 'CLOSED') AND paidAt IS NOT NULL
      GROUP BY strftime('%Y-W%W', paidAt)
      ORDER BY strftime('%Y-W%W', paidAt) DESC
      LIMIT 20
    `).all();

    // 9. Lịch sử báo cáo tổng kết theo Tháng (Monthly Reports History)
    const monthlyReportsHistory = db.prepare(`
      SELECT 
        strftime('Tháng %m/%Y', paidAt) as periodLabel,
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue,
        MIN(date(paidAt)) as startDate,
        MAX(date(paidAt)) as endDate
      FROM orders
      WHERE status IN ('PAID', 'CLOSED') AND paidAt IS NOT NULL
      GROUP BY strftime('%Y-%m', paidAt)
      ORDER BY strftime('%Y-%m', paidAt) DESC
      LIMIT 20
    `).all();

    return res.json({
      success: true,
      data: {
        shiftsToday,
        currentShiftNum,
        currentShiftName,
        todayRevenue: todaySales.totalRevenue,
        todayOrders: todaySales.totalOrders,
        weekRevenue: weekSales.totalRevenue,
        weekOrders: weekSales.totalOrders,
        monthRevenue: monthSales.totalRevenue,
        monthOrders: monthSales.totalOrders,
        servingTables,
        totalTables,
        topItems,
        recent7Days,
        recentOrders,
        shiftReportsHistory,
        dailyReportsHistory,
        weeklyReportsHistory,
        monthlyReportsHistory
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải báo cáo thống kê!' });
  }
});

// Chốt ca / Báo cáo ca (Mặc định 3 Ca/Ngày: Ca 1 - Sáng, Ca 2 - Chiều, Ca 3 - Tối)
app.post('/api/reports/close-day', authenticateToken, requireAdmin, (req, res) => {
  try {
    const reportDate = new Date().toISOString().split('T')[0];
    const staffName = req.user?.fullName || 'Admin';

    // 1. Đếm số ca đã chốt hôm nay
    const shiftsToday = db.prepare(`
      SELECT COUNT(*) as count FROM shift_reports 
      WHERE reportDate = date('now', 'localtime')
    `).get().count;

    const shiftNum = (shiftsToday % 3) + 1;
    const shiftNames = { 1: 'Ca 1 (Sáng)', 2: 'Ca 2 (Chiều)', 3: 'Ca 3 (Tối & Chốt Ngày)' };
    const shiftName = shiftNames[shiftNum];

    // 2. Lấy tổng số đơn và doanh thu các đơn 'PAID' chưa chốt hiện tại
    const shiftSummary = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue
      FROM orders 
      WHERE status = 'PAID' AND date(paidAt) = date('now', 'localtime')
    `).get();

    // 3. Lưu bản ghi vào bảng shift_reports
    db.prepare(`
      INSERT INTO shift_reports (reportDate, shiftNumber, shiftName, totalOrders, totalRevenue, closedBy, closedAt)
      VALUES (date('now', 'localtime'), ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(shiftNum, shiftName, shiftSummary.totalOrders, shiftSummary.totalRevenue, staffName);

    // 4. Chuyển trạng thái các đơn 'PAID' vừa chốt ca thành 'CLOSED' để reset ca mới về 0
    db.prepare(`
      UPDATE orders 
      SET status = 'CLOSED' 
      WHERE status = 'PAID' AND date(paidAt) = date('now', 'localtime')
    `).run();

    // 5. Nếu đây là Ca 3 (hoặc đã chốt đủ 3 ca trong ngày) -> Tự động chốt Báo Cáo Ngày vào daily_reports
    let isFullDayClosed = false;
    if (shiftNum === 3 || shiftsToday >= 2) {
      isFullDayClosed = true;
      const fullDaySummary = db.prepare(`
        SELECT 
          SUM(totalOrders) as totalOrders,
          SUM(totalRevenue) as totalRevenue
        FROM shift_reports 
        WHERE reportDate = date('now', 'localtime')
      `).get();

      db.prepare(`
        INSERT INTO daily_reports (reportDate, totalOrders, totalRevenue, closedAt)
        VALUES (date('now', 'localtime'), ?, ?, datetime('now', 'localtime'))
      `).run(fullDaySummary.totalOrders || 0, fullDaySummary.totalRevenue || 0);
    }

    // 6. Chuyển tất cả bàn về trống (EMPTY)
    db.prepare("UPDATE tables SET status = 'EMPTY'").run();

    // 7. Hủy các đơn 'PENDING' rác
    db.prepare("UPDATE orders SET status = 'CANCELLED' WHERE status = 'PENDING'").run();

    let successMsg = `☕ ĐÃ CHỐT THÀNH CÔNG: ${shiftName}!\n• Doanh thu ca: ${(shiftSummary.totalRevenue || 0).toLocaleString('vi-VN')} đ (${shiftSummary.totalOrders || 0} đơn)\n• Doanh thu ca đã được reset về 0 để sẵn sàng cho ca tiếp theo.`;
    if (isFullDayClosed) {
      successMsg += `\n\n🎉 HOÀN TẤT BÁO CÁO NGÀY (${reportDate})!\nĐã chốt trọn vẹn 3/3 ca trong ngày và lưu vào Lịch Sử Báo Cáo Ngày. Ngày mai ca 1 sẵn sàng!`;
    }

    return res.json({ 
      success: true, 
      message: successMsg
    });
  } catch (error) {
    console.error('Close shift error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi chốt ca báo cáo!' });
  }
});

// Xóa hóa đơn cụ thể khỏi lịch sử để dọn bớt đơn hàng rác
app.delete('/api/orders/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Đã xóa hóa đơn khỏi lịch sử thành công!' });
  } catch (error) {
    console.error('Delete order error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa hóa đơn!' });
  }
});

// Endpoint kiểm tra sức khỏe server
app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', time: new Date().toISOString() });
});

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Cafe POS Backend đang chạy tại http://localhost:${PORT}`);
  });
}
