import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'coffee_shop_pos_secret_key_2026_super_secure';
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

  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice < 0) {
    return res.status(400).json({ success: false, message: 'Giá tiền phải là số hợp lệ không âm!' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO menu_items (categoryId, name, price, description, image, isAvailable)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      categoryId,
      name,
      numPrice,
      description || '',
      image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
      isAvailable !== undefined ? (isAvailable ? 1 : 0) : 1
    );

    return res.json({ success: true, message: 'Thêm món mới thành công!', id: result.lastInsertRowid });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi thêm món mới!' });
  }
});

app.put('/api/menu/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { categoryId, name, price, description, image, isAvailable } = req.body;

  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    if (!item) return res.status(404).json({ success: false, message: 'Món không tồn tại!' });

    let finalPrice = item.price;
    if (price !== undefined) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, message: 'Giá tiền phải là số hợp lệ không âm!' });
      }
      finalPrice = numPrice;
    }

    const stmt = db.prepare(`
      UPDATE menu_items 
      SET categoryId = ?, name = ?, price = ?, description = ?, image = ?, isAvailable = ?
      WHERE id = ?
    `);

    stmt.run(
      categoryId !== undefined ? categoryId : item.categoryId,
      name !== undefined ? name : item.name,
      finalPrice,
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

// Chuyển bàn (Đổi bàn cho khách đang ngồi)
app.post('/api/tables/transfer', authenticateToken, (req, res) => {
  const { fromTableId, toTableId } = req.body;

  if (!fromTableId || !toTableId) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn đầy đủ bàn nguồn và bàn đích!' });
  }

  if (Number(fromTableId) === Number(toTableId)) {
    return res.status(400).json({ success: false, message: 'Bàn đích phải khác bàn nguồn!' });
  }

  try {
    const fromTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(fromTableId);
    const toTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(toTableId);

    if (!fromTable || !toTable) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin bàn!' });
    }

    const activeOrder = db.prepare("SELECT * FROM orders WHERE tableId = ? AND status = 'PENDING'").get(fromTableId);
    if (!activeOrder) {
      return res.status(400).json({ success: false, message: `Bàn ${fromTable.name} hiện không có đơn hàng nào đang phục vụ!` });
    }

    const targetOrder = db.prepare("SELECT * FROM orders WHERE tableId = ? AND status = 'PENDING'").get(toTableId);
    if (targetOrder) {
      return res.status(400).json({
        success: false,
        message: `Bàn ${toTable.name} đang có khách phục vụ! Hãy dùng tính năng 'Gộp Bàn' thay vì 'Chuyển Bàn'.`
      });
    }

    db.exec('BEGIN TRANSACTION');
    try {
      // Chuyển order sang bàn mới
      db.prepare('UPDATE orders SET tableId = ?, tableName = ? WHERE id = ?').run(toTable.id, toTable.name, activeOrder.id);

      // Cập nhật trạng thái bàn cũ thành EMPTY
      db.prepare("UPDATE tables SET status = 'EMPTY' WHERE id = ?").run(fromTable.id);

      // Cập nhật trạng thái bàn mới thành SERVING
      db.prepare("UPDATE tables SET status = 'SERVING' WHERE id = ?").run(toTable.id);

      db.exec('COMMIT');

      return res.json({
        success: true,
        message: `Đã chuyển toàn bộ hóa đơn từ ${fromTable.name} sang ${toTable.name} thành công!`
      });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (error) {
    console.error('Table transfer error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi chuyển bàn!' });
  }
});

// Gộp bàn (Gộp 2 bàn đang có khách vào chung 1 hóa đơn)
app.post('/api/tables/merge', authenticateToken, (req, res) => {
  const { fromTableId, toTableId } = req.body;

  if (!fromTableId || !toTableId) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn bàn nguồn và bàn đích cần gộp!' });
  }

  if (Number(fromTableId) === Number(toTableId)) {
    return res.status(400).json({ success: false, message: 'Bàn nguồn và bàn đích phải khác nhau!' });
  }

  try {
    const fromTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(fromTableId);
    const toTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(toTableId);

    if (!fromTable || !toTable) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin bàn!' });
    }

    const orderFrom = db.prepare("SELECT * FROM orders WHERE tableId = ? AND status = 'PENDING'").get(fromTableId);
    if (!orderFrom) {
      return res.status(400).json({ success: false, message: `Bàn ${fromTable.name} không có đơn hàng nào đang phục vụ!` });
    }

    const orderTo = db.prepare("SELECT * FROM orders WHERE tableId = ? AND status = 'PENDING'").get(toTableId);
    if (!orderTo) {
      return res.status(400).json({
        success: false,
        message: `Bàn ${toTable.name} hiện đang trống! Hãy dùng tính năng 'Chuyển Bàn'.`
      });
    }

    db.exec('BEGIN TRANSACTION');
    try {
      const fromItems = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(orderFrom.id);
      const toItems = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(orderTo.id);

      for (const fItem of fromItems) {
        // Tìm xem order đích đã có món cùng loại và cùng ghi chú chưa
        const existing = toItems.find(
          (t) => t.menuItemId === fItem.menuItemId && (t.note || '').trim() === (fItem.note || '').trim()
        );

        if (existing) {
          const newQty = existing.quantity + fItem.quantity;
          const newTotal = existing.price * newQty;
          db.prepare('UPDATE order_items SET quantity = ?, totalPrice = ? WHERE id = ?').run(newQty, newTotal, existing.id);
          db.prepare('DELETE FROM order_items WHERE id = ?').run(fItem.id);
          existing.quantity = newQty;
          existing.totalPrice = newTotal;
        } else {
          db.prepare('UPDATE order_items SET orderId = ? WHERE id = ?').run(orderTo.id, fItem.id);
        }
      }

      // Tính lại tổng tiền cho order đích
      const calculatedTotal = db.prepare('SELECT COALESCE(SUM(totalPrice), 0) as total FROM order_items WHERE orderId = ?').get(orderTo.id).total;

      db.prepare(`
        UPDATE orders 
        SET totalAmount = ?, finalAmount = ?, note = COALESCE(note, '') || CASE WHEN COALESCE(note, '') != '' THEN ' | ' ELSE '' END || 'Gộp từ ' || ?
        WHERE id = ?
      `).run(calculatedTotal, calculatedTotal, fromTable.name, orderTo.id);

      // Đánh dấu order cũ là đã CANCELLED do gộp bàn
      db.prepare(`
        UPDATE orders 
        SET status = 'CANCELLED', note = COALESCE(note, '') || ' [Đã gộp vào ' || ? || ']'
        WHERE id = ?
      `).run(toTable.name, orderFrom.id);

      // Trả bàn cũ về EMPTY
      db.prepare("UPDATE tables SET status = 'EMPTY' WHERE id = ?").run(fromTable.id);

      db.exec('COMMIT');

      return res.json({
        success: true,
        message: `Đã gộp toàn bộ món ăn từ ${fromTable.name} vào ${toTable.name} thành công!`
      });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (error) {
    console.error('Table merge error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi gộp bàn!' });
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

  // Validate số lượng từng món
  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Số lượng từng món phải là số nguyên dương lớn hơn 0!' });
    }
  }

  try {
    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
    if (!table) return res.status(404).json({ success: false, message: 'Bàn không tồn tại!' });

    db.exec('BEGIN TRANSACTION');

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
        const qty = parseInt(item.quantity, 10);
        const itemTotal = menuItem.price * qty;
        totalAmount += itemTotal;
        insertItem.run(
          orderId,
          menuItem.id,
          menuItem.name,
          menuItem.price,
          qty,
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

    db.exec('COMMIT');

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
    try { db.exec('ROLLBACK'); } catch (_) {}
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
    if (isNaN(discount) || discount < 0 || discount > 100) {
      return res.status(400).json({ success: false, message: 'Chiết khấu phải nằm trong khoảng từ 0% đến 100%!' });
    }

    const finalAmount = order.totalAmount * (1 - discount / 100);

    db.exec('BEGIN TRANSACTION');

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

    db.exec('COMMIT');

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
    try { db.exec('ROLLBACK'); } catch (_) {}
    console.error('Pay error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi xử lý thanh toán!' });
  }
});

// Lấy mã VietQR động theo đơn hàng
app.get('/api/orders/:id/vietqr', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });

    const finalAmount = order.finalAmount !== null && order.finalAmount !== undefined ? order.finalAmount : order.totalAmount;
    const accountNo = '038228888';
    const accountName = 'QUAN CAFE POS';
    const bankCode = 'MB';
    const memo = `Thanh toan ${order.orderCode || 'DON CAFE'}`;
    const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${Math.round(finalAmount)}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;

    return res.json({
      success: true,
      data: {
        qrUrl,
        finalAmount,
        orderCode: order.orderCode,
        accountNo,
        accountName,
        bankCode,
        memo
      }
    });
  } catch (error) {
    console.error('VietQR error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tạo mã QR thanh toán!' });
  }
});

// Hủy đơn hàng
app.delete('/api/orders/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });

    if (order.status === 'PAID' || order.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng đã thanh toán hoặc đã chốt ca!' });
    }

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

// Helper tính khung thời gian Tuần chuẩn (Thứ 2 -> Chủ Nhật 7 ngày)
function getWeekRange(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diffToMonday));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (dateObj) => dateObj.toISOString().split('T')[0];
  return {
    mondayStr: format(monday),
    sundayStr: format(sunday)
  };
}

// Helper tính khung thời gian Tháng chuẩn (Ngày 01 -> 28/29/30/31)
function getMonthRange(d = new Date()) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const format = (dateObj) => dateObj.toISOString().split('T')[0];
  return {
    firstDayStr: format(firstDay),
    lastDayStr: format(lastDay)
  };
}

// --- DASHBOARD & REPORTS ROUTES ---
app.get('/api/reports/dashboard', authenticateToken, (req, res) => {
  try {
    const weekRange = getWeekRange();
    const monthRange = getMonthRange();

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

    // 1b. Thống kê tuần này (Tính theo khung thời gian Thứ 2 -> Chủ Nhật chuẩn)
    const weekSales = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue
      FROM orders 
      WHERE status IN ('PAID', 'CLOSED') 
        AND date(paidAt) >= ? AND date(paidAt) <= ?
    `).get(weekRange.mondayStr, weekRange.sundayStr);

    // 1c. Thống kê tháng này (Tính theo khung thời gian Ngày 01 -> Ngày cuối tháng 28/29/30/31 chuẩn)
    const monthSales = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue
      FROM orders 
      WHERE status IN ('PAID', 'CLOSED') 
        AND date(paidAt) >= ? AND date(paidAt) <= ?
    `).get(monthRange.firstDayStr, monthRange.lastDayStr);

    // 2. Tổng số bàn đang phục vụ
    const servingTables = db.prepare("SELECT COUNT(*) as count FROM tables WHERE status = 'SERVING'").get().count;
    const totalTables = db.prepare("SELECT COUNT(*) as count FROM tables").get().count;

    // 3. Top 5 món bán chạy nhất
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

    // 8. Lịch sử báo cáo đã chốt Tuần (Weekly Reports History)
    const weeklyReportsHistory = db.prepare(`
      SELECT * FROM weekly_reports ORDER BY id DESC LIMIT 20
    `).all();

    // 9. Lịch sử báo cáo đã chốt Tháng (Monthly Reports History)
    const monthlyReportsHistory = db.prepare(`
      SELECT * FROM monthly_reports ORDER BY id DESC LIMIT 20
    `).all();

    return res.json({
      success: true,
      data: {
        shiftsToday,
        currentShiftNum,
        currentShiftName,
        currentWeekRange: `${weekRange.mondayStr} đến ${weekRange.sundayStr}`,
        currentMonthRange: `${monthRange.firstDayStr} đến ${monthRange.lastDayStr}`,
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

// 1. NÚT 1: Chốt Ca Hiện Tại / Chốt Bây Giờ
app.post('/api/reports/close-shift', authenticateToken, requireAdmin, (req, res) => {
  try {
    const reportDate = new Date().toISOString().split('T')[0];
    const staffName = req.user?.fullName || 'Admin';

    db.exec('BEGIN TRANSACTION');

    const shiftsToday = db.prepare(`
      SELECT COUNT(*) as count FROM shift_reports 
      WHERE reportDate = date('now', 'localtime')
    `).get().count;

    const shiftNum = (shiftsToday % 3) + 1;
    const shiftNames = { 1: 'Ca 1 (Sáng)', 2: 'Ca 2 (Chiều)', 3: 'Ca 3 (Tối & Chốt Ngày)' };
    const shiftName = shiftNames[shiftNum];

    const shiftSummary = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue
      FROM orders 
      WHERE status = 'PAID' AND date(paidAt) = date('now', 'localtime')
    `).get();

    db.prepare(`
      INSERT INTO shift_reports (reportDate, shiftNumber, shiftName, totalOrders, totalRevenue, closedBy, closedAt)
      VALUES (date('now', 'localtime'), ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(shiftNum, shiftName, shiftSummary.totalOrders, shiftSummary.totalRevenue, staffName);

    // Cập nhật cả daily_reports cho ngày hôm nay
    const dayTotal = db.prepare(`
      SELECT SUM(totalOrders) as totalOrders, SUM(totalRevenue) as totalRevenue
      FROM shift_reports WHERE reportDate = date('now', 'localtime')
    `).get();

    const existingDaily = db.prepare("SELECT id FROM daily_reports WHERE reportDate = date('now', 'localtime')").get();
    if (existingDaily) {
      db.prepare(`
        UPDATE daily_reports 
        SET totalOrders = ?, totalRevenue = ?, closedAt = datetime('now', 'localtime')
        WHERE reportDate = date('now', 'localtime')
      `).run(dayTotal.totalOrders, dayTotal.totalRevenue);
    } else {
      db.prepare(`
        INSERT INTO daily_reports (reportDate, totalOrders, totalRevenue, closedAt)
        VALUES (date('now', 'localtime'), ?, ?, datetime('now', 'localtime'))
      `).run(dayTotal.totalOrders, dayTotal.totalRevenue);
    }

    db.prepare(`
      UPDATE orders SET status = 'CLOSED' 
      WHERE status = 'PAID' AND date(paidAt) = date('now', 'localtime')
    `).run();

    db.prepare("UPDATE tables SET status = 'EMPTY'").run();
    db.prepare("UPDATE orders SET status = 'CANCELLED' WHERE status = 'PENDING'").run();

    db.exec('COMMIT');

    return res.json({
      success: true,
      message: `⚡ ĐÃ CHỐT CA THÀNH CÔNG: ${shiftName}!\n• Doanh thu ca: ${(shiftSummary.totalRevenue || 0).toLocaleString('vi-VN')} đ (${shiftSummary.totalOrders || 0} đơn)\n• Đã lưu vào Lịch Sử Chốt Ca & Ngày.`
    });
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    console.error('Close shift error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi chốt ca!' });
  }
});

// Tương thích ngược endpoint close-day
app.post('/api/reports/close-day', authenticateToken, requireAdmin, (req, res) => {
  return app._router.handle({ ...req, url: '/api/reports/close-shift' }, res);
});

// 2. NÚT 2: Chốt Báo Cáo Tuần Này (Chuẩn 7 Ngày: Thứ 2 -> Chủ Nhật)
app.post('/api/reports/close-week', authenticateToken, requireAdmin, (req, res) => {
  try {
    const weekRange = getWeekRange();
    db.exec('BEGIN TRANSACTION');

    const weekSales = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue
      FROM orders 
      WHERE status IN ('PAID', 'CLOSED') 
        AND date(paidAt) >= ? AND date(paidAt) <= ?
    `).get(weekRange.mondayStr, weekRange.sundayStr);

    const weekCode = `Tuần (${weekRange.mondayStr} - ${weekRange.sundayStr})`;

    db.prepare(`
      INSERT INTO weekly_reports (weekCode, startDate, endDate, totalOrders, totalRevenue, closedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(weekCode, weekRange.mondayStr, weekRange.sundayStr, weekSales.totalOrders, weekSales.totalRevenue);

    db.exec('COMMIT');

    return res.json({
      success: true,
      message: `🗓️ ĐÃ CHỐT BÁO CÁO TUẦN THÀNH CÔNG!\n• Khung thời gian chuẩn 7 ngày: ${weekRange.mondayStr} đến ${weekRange.sundayStr}\n• Tổng doanh thu tuần: ${(weekSales.totalRevenue || 0).toLocaleString('vi-VN')} đ (${weekSales.totalOrders || 0} đơn)\n• Đã lưu vào Lịch Sử Báo Cáo Tuần.`
    });
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    console.error('Close week error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi chốt tuần!' });
  }
});

// 3. NÚT 3: Chốt Báo Cáo Tháng Này (Chuẩn 28/29/30/31 Ngày từ Ngày 01 -> Cuối Tháng)
app.post('/api/reports/close-month', authenticateToken, requireAdmin, (req, res) => {
  try {
    const monthRange = getMonthRange();
    db.exec('BEGIN TRANSACTION');

    const monthSales = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(finalAmount), 0) as totalRevenue
      FROM orders 
      WHERE status IN ('PAID', 'CLOSED') 
        AND date(paidAt) >= ? AND date(paidAt) <= ?
    `).get(monthRange.firstDayStr, monthRange.lastDayStr);

    const now = new Date();
    const monthCode = `Tháng ${now.getMonth() + 1}/${now.getFullYear()} (${monthRange.firstDayStr} - ${monthRange.lastDayStr})`;

    db.prepare(`
      INSERT INTO monthly_reports (monthCode, startDate, endDate, totalOrders, totalRevenue, closedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(monthCode, monthRange.firstDayStr, monthRange.lastDayStr, monthSales.totalOrders, monthSales.totalRevenue);

    db.exec('COMMIT');

    return res.json({
      success: true,
      message: `📆 ĐÃ CHỐT BÁO CÁO THÁNG THÀNH CÔNG!\n• Khung thời gian chuẩn tháng: ${monthRange.firstDayStr} đến ${monthRange.lastDayStr}\n• Tổng doanh thu tháng: ${(monthSales.totalRevenue || 0).toLocaleString('vi-VN')} đ (${monthSales.totalOrders || 0} đơn)\n• Đã lưu vào Lịch Sử Báo Cáo Tháng.`
    });
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    console.error('Close month error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi chốt tháng!' });
  }
});

// Xóa vĩnh viễn hóa đơn cụ thể khỏi lịch sử để dọn bớt đơn hàng rác
app.delete('/api/orders/:id/permanent', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.exec('BEGIN TRANSACTION');
    db.prepare('DELETE FROM order_items WHERE orderId = ?').run(id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    db.exec('COMMIT');
    return res.json({ success: true, message: 'Đã xóa vĩnh viễn hóa đơn khỏi lịch sử thành công!' });
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    console.error('Permanent delete order error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa vĩnh viễn hóa đơn!' });
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
