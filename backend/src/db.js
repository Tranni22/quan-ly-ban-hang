import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve('cafe.db');
const db = new DatabaseSync(dbPath);

// Enable Foreign Keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  console.log('📦 Đang khởi tạo cơ sở dữ liệu...');

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullName TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        avatar TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT DEFAULT '☕',
        sortOrder INTEGER DEFAULT 0
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoryId INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        image TEXT,
        isAvailable INTEGER DEFAULT 1,
        isDeleted INTEGER DEFAULT 0,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    // Thực hiện ALTER TABLE để tương thích an toàn nếu database cũ đã tồn tại
    try {
      db.exec('ALTER TABLE menu_items ADD COLUMN isDeleted INTEGER DEFAULT 0;');
    } catch (e) {
      // Bỏ qua nếu cột đã tồn tại
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        area TEXT NOT NULL DEFAULT 'Tầng 1',
        status TEXT NOT NULL DEFAULT 'EMPTY',
        seats INTEGER DEFAULT 4
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderCode TEXT UNIQUE NOT NULL,
        tableId INTEGER,
        tableName TEXT,
        userId INTEGER,
        staffName TEXT,
        customerName TEXT DEFAULT 'Khách vãng lai',
        totalAmount REAL DEFAULT 0,
        discountPercent REAL DEFAULT 0,
        finalAmount REAL DEFAULT 0,
        paymentMethod TEXT DEFAULT 'UNPAID',
        status TEXT DEFAULT 'PENDING',
        note TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        paidAt DATETIME
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER NOT NULL,
        menuItemId INTEGER,
        itemName TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        note TEXT,
        totalPrice REAL NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reportDate TEXT NOT NULL,
        totalOrders INTEGER DEFAULT 0,
        totalRevenue REAL DEFAULT 0,
        closedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS shift_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reportDate TEXT NOT NULL,
        shiftNumber INTEGER NOT NULL,
        shiftName TEXT NOT NULL,
        totalOrders INTEGER DEFAULT 0,
        totalRevenue REAL DEFAULT 0,
        closedBy TEXT DEFAULT 'Admin',
        closedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS weekly_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekCode TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        totalOrders INTEGER DEFAULT 0,
        totalRevenue REAL DEFAULT 0,
        closedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS monthly_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monthCode TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        totalOrders INTEGER DEFAULT 0,
        totalRevenue REAL DEFAULT 0,
        closedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.log('Lỗi tạo bảng (được bỏ qua nếu dùng Memory Adapter):', e.message);
  }

  seedInitialData();
}

function seedInitialData() {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
    if (userCount === 0) {
      console.log('🌱 Seed dữ liệu tài khoản mẫu...');
      const hashedAdmin = bcrypt.hashSync('admin123', 10);
      const hashedStaff = bcrypt.hashSync('staff123', 10);

      const insertUser = db.prepare(`
        INSERT INTO users (username, password, fullName, role, avatar)
        VALUES (?, ?, ?, ?, ?)
      `);

      insertUser.run('admin', hashedAdmin, 'Bố Thắng Cụ Code', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
      insertUser.run('staff1', hashedStaff, 'Trần Thị Thu Ngân', 'staff', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
      insertUser.run('staff2', hashedStaff, 'Lê Văn Phục Vụ', 'staff', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
    }

    const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()?.count || 0;
    if (catCount === 0) {
      console.log('🌱 Seed dữ liệu Danh mục & Menu cà phê...');
      const insertCat = db.prepare('INSERT INTO categories (name, icon, sortOrder) VALUES (?, ?, ?)');
      insertCat.run('Cà Phê Truyền Thống', '☕', 1);
      insertCat.run('Cà Phê Pha Máy', '🥤', 2);
      insertCat.run('Trà & Trà Sữa', '🍵', 3);
      insertCat.run('Đá Xay & Sinh Tố', '🧋', 4);
      insertCat.run('Bánh Ngọt & Tráng Miệng', '🍰', 5);

      const insertMenu = db.prepare(`
        INSERT INTO menu_items (categoryId, name, price, description, image, isAvailable)
        VALUES (?, ?, ?, ?, ?, 1)
      `);

      insertMenu.run(1, 'Cà Phê Đen Đá', 25000, 'Cà phê Phin Robusta Đắk Lắk đậm đà nguyên chất', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400');
      insertMenu.run(1, 'Cà Phê Sữa Đá', 29000, 'Cà phê phin kết hợp sữa đặc Ngôi Sao Phương Nam thơm béo', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400');
      insertMenu.run(1, 'Cà Phê Muối Huế', 35000, 'Lớp kem muối béo ngậy quyện cùng cà phê phin đậm vị', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400');
      insertMenu.run(1, 'Bạc Xỉu Sài Gòn', 32000, 'Nhiều sữa ít cà phê, béo ngậy ngọt dịu thích hợp cho mọi người', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400');
      insertMenu.run(1, 'Cà Phê Trứng Hà Nội', 39000, 'Kem trứng đánh bông sánh mịn trên nền espresso đậm đà', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400');

      insertMenu.run(2, 'Espresso Doppio', 35000, 'Cà phê nguyên chất chiết suất áp suất cao 2 shot', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400');
      insertMenu.run(2, 'Americano Đá', 32000, 'Espresso pha loãng với nước tinh khiết & đá mát lạnh', 'https://images.pexels.com/photos/5741238/pexels-photo-5741238.jpeg?auto=compress&cs=tinysrgb&w=400');
      insertMenu.run(2, 'Cappuccino Cinnamon', 45000, 'Espresso cùng bọt sữa mịn rắc bột quế thơm lừng', 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400');
      insertMenu.run(2, 'Caramel Latte', 49000, 'Sữa tươi thanh trùng, espresso và sốt caramel béo ngọt', 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400');

      insertMenu.run(3, 'Trà Đào Cam Sả', 39000, 'Trà đen đậm vị kết hợp sả tươi, cam vàng và đào miếng giòn', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400');
      insertMenu.run(3, 'Trà Mãng Cầu Đắk Lắk', 39000, 'Trà nhài thanh mát và thịt mãng cầu tươi chua ngọt hấp dẫn', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400');
      insertMenu.run(3, 'Trà Sen Vàng Kem Cheese', 45000, 'Trà oolong, hạt sen béo bùi và lớp kem cheese mặn béo', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600');
      insertMenu.run(3, 'Matcha Latte Uji Nhật Bản', 45000, 'Bột Matcha cao cấp nhập khẩu Nhật Bản và sữa tươi', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400');

      insertMenu.run(4, 'Sinh Tố Bơ Đắk Lắk Gelato', 45000, 'Bơ sáp béo dẻo xay cùng sữa tươi và kem gelato dừa', 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400');
      insertMenu.run(4, 'Freeze Cà Phê Phin Sô-cô-la', 49000, 'Cà phê đá xay cùng thạch cà phê giòn ngon và kem tươi', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400');
      insertMenu.run(4, 'Matcha Ice Blended', 49000, 'Matcha đá xay rắc vụn bánh oreo và kem tươi phủ trên', 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400');

      insertMenu.run(5, 'Bánh Croissant Bơ Tỏi', 35000, 'Bánh sừng bò ngàn lớp thơm lừng bơ Pháp tươi nóng', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400');
      insertMenu.run(5, 'Bánh Tiramisu Ca Cao', 39000, 'Bánh tiramisu Ý mềm mịn, thơm hương rượu rum & cafe', 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=400');
      insertMenu.run(5, 'Cheesecake Chanh Dây', 42000, 'Bánh phô mai nướng phủ sốt chanh dây tươi chua ngọt', 'https://images.pexels.com/photos/10141891/pexels-photo-10141891.jpeg?auto=compress&cs=tinysrgb&w=400');
    }

    const tableCount = db.prepare('SELECT COUNT(*) as count FROM tables').get()?.count || 0;
    if (tableCount < 20) {
      console.log('🌱 Seed bổ sung dữ liệu Sơ đồ bàn...');
      const insertTable = db.prepare('INSERT INTO tables (name, area, seats, status) VALUES (?, ?, ?, ?)');

      insertTable.run('Bàn 01', 'Tầng 1 (Trong nhà)', 4, 'EMPTY');
      insertTable.run('Bàn 02', 'Tầng 1 (Trong nhà)', 2, 'EMPTY');
      insertTable.run('Bàn 03', 'Tầng 1 (Trong nhà)', 4, 'EMPTY');
      insertTable.run('Bàn 04', 'Tầng 1 (Trong nhà)', 6, 'EMPTY');
      insertTable.run('Bàn 05', 'Tầng 1 (Cửa kính)', 2, 'EMPTY');
      insertTable.run('Bàn 06', 'Tầng 1 (Cửa kính)', 4, 'EMPTY');
      insertTable.run('Bàn 07', 'Tầng 1 (Trong nhà)', 4, 'EMPTY');
      insertTable.run('Bàn 08', 'Tầng 1 (Trong nhà)', 6, 'EMPTY');
      insertTable.run('Bàn 09', 'Tầng 1 (Sảnh chính)', 4, 'EMPTY');
      insertTable.run('Bàn 10', 'Tầng 1 (Sảnh chính)', 8, 'EMPTY');

      insertTable.run('Bàn 11', 'Tầng 2 (Máy lạnh)', 4, 'EMPTY');
      insertTable.run('Bàn 12', 'Tầng 2 (Máy lạnh)', 4, 'EMPTY');
      insertTable.run('Bàn 13', 'Tầng 2 (Máy lạnh)', 2, 'EMPTY');
      insertTable.run('Bàn 14', 'Tầng 2 (Máy lạnh)', 6, 'EMPTY');
      insertTable.run('Bàn 15', 'Tầng 2 (Ban công)', 4, 'EMPTY');
      insertTable.run('Bàn 16', 'Tầng 2 (Ban công)', 2, 'EMPTY');
      insertTable.run('Bàn 17', 'Tầng 2 (Cửa sổ)', 4, 'EMPTY');
      insertTable.run('Bàn 18', 'Tầng 2 (Cửa sổ)', 4, 'EMPTY');
      insertTable.run('Bàn 19', 'Tầng 2 (Phòng nhóm)', 8, 'EMPTY');
      insertTable.run('Bàn 20', 'Tầng 2 (Phòng nhóm)', 10, 'EMPTY');
    }
  } catch (err) {
    console.error('Lỗi khi seed data:', err);
  }
}

export default db;
