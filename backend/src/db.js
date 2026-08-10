import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

let DatabaseSync = null;
try {
  const mod = await import('node:sqlite');
  DatabaseSync = mod.DatabaseSync;
} catch (err) {
  console.log('node:sqlite chưa sẵn sàng, chuyển sang bộ nhớ dữ liệu tích hợp.');
}

let db = null;

if (DatabaseSync) {
  const isVercel = process.env.VERCEL === '1';
  let dbPath = path.resolve('cafe.db');

  if (isVercel) {
    const tmpPath = path.join('/tmp', 'cafe.db');
    try {
      if (!fs.existsSync(tmpPath)) {
        const origPath = path.resolve(process.cwd(), 'backend', 'cafe.db');
        if (fs.existsSync(origPath)) {
          fs.copyFileSync(origPath, tmpPath);
        } else if (fs.existsSync(dbPath)) {
          fs.copyFileSync(dbPath, tmpPath);
        }
      }
      dbPath = tmpPath;
    } catch (err) {
      console.error('Lỗi sao chép DB trên Vercel:', err);
    }
  }

  try {
    db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys = ON;');
  } catch (err) {
    console.error('Lỗi khởi tạo DatabaseSync:', err);
    db = null;
  }
}

// Fallback Memory Adapter nếu không có node:sqlite native
if (!db) {
  console.log('🌱 Đang khởi chạy Bộ nhớ Dữ liệu Tích hợp Serverless...');
  
  const tablesStore = {
    users: [],
    categories: [],
    menu_items: [],
    tables: [],
    orders: [],
    order_items: []
  };

  db = {
    exec: () => {},
    prepare: (sql) => {
      const lowerSql = sql.toLowerCase();
      return {
        get: (...params) => {
          if (lowerSql.includes('from users where username =')) {
            return tablesStore.users.find(u => u.username === params[0]) || null;
          }
          if (lowerSql.includes('from tables where id =')) {
            return tablesStore.tables.find(t => t.id === Number(params[0])) || null;
          }
          if (lowerSql.includes('from orders where tableid =') && lowerSql.includes('pending')) {
            return tablesStore.orders.find(o => o.tableId === Number(params[0]) && o.status === 'PENDING') || null;
          }
          if (lowerSql.includes('from orders where id =')) {
            return tablesStore.orders.find(o => o.id === Number(params[0])) || null;
          }
          if (lowerSql.includes('from menu_items where id =')) {
            return tablesStore.menu_items.find(m => m.id === Number(params[0])) || null;
          }
          if (lowerSql.includes('count(*)')) {
            if (lowerSql.includes('from users')) return { count: tablesStore.users.length };
            if (lowerSql.includes('from categories')) return { count: tablesStore.categories.length };
            if (lowerSql.includes('from tables')) return { count: tablesStore.tables.length };
            if (lowerSql.includes('from orders')) return { count: tablesStore.orders.length };
          }
          return null;
        },
        all: (...params) => {
          if (lowerSql.includes('from categories')) {
            return [...tablesStore.categories].sort((a,b) => a.sortOrder - b.sortOrder);
          }
          if (lowerSql.includes('from menu_items')) {
            return tablesStore.menu_items.map(m => {
              const cat = tablesStore.categories.find(c => c.id === m.categoryId);
              return { ...m, categoryName: cat?.name || '' };
            });
          }
          if (lowerSql.includes('from tables')) {
            return [...tablesStore.tables].sort((a,b) => a.id - b.id);
          }
          if (lowerSql.includes('from orders')) {
            if (lowerSql.includes("status = 'pending'")) {
              return tablesStore.orders.filter(o => o.status === 'PENDING');
            }
            return [...tablesStore.orders].reverse();
          }
          if (lowerSql.includes('from order_items where orderid =')) {
            return tablesStore.order_items.filter(i => i.orderId === Number(params[0]));
          }
          return [];
        },
        run: (...params) => {
          let lastInsertRowid = Date.now();
          if (lowerSql.includes('insert into users')) {
            const newUser = {
              id: tablesStore.users.length + 1,
              username: params[0],
              password: params[1],
              fullName: params[2],
              role: params[3],
              avatar: params[4],
              createdAt: new Date().toISOString()
            };
            tablesStore.users.push(newUser);
            lastInsertRowid = newUser.id;
          } else if (lowerSql.includes('insert into categories')) {
            const newCat = {
              id: tablesStore.categories.length + 1,
              name: params[0],
              icon: params[1] || '☕',
              sortOrder: params[2] || 0
            };
            tablesStore.categories.push(newCat);
            lastInsertRowid = newCat.id;
          } else if (lowerSql.includes('insert into menu_items')) {
            const newItem = {
              id: tablesStore.menu_items.length + 1,
              categoryId: params[0],
              name: params[1],
              price: params[2],
              description: params[3] || '',
              image: params[4] || '',
              isAvailable: params[5] ?? 1
            };
            tablesStore.menu_items.push(newItem);
            lastInsertRowid = newItem.id;
          } else if (lowerSql.includes('insert into tables')) {
            const newTbl = {
              id: tablesStore.tables.length + 1,
              name: params[0],
              area: params[1] || 'Tầng 1',
              seats: params[2] || 4,
              status: params[3] || 'EMPTY'
            };
            tablesStore.tables.push(newTbl);
            lastInsertRowid = newTbl.id;
          } else if (lowerSql.includes('insert into orders')) {
            const newOrd = {
              id: tablesStore.orders.length + 1,
              orderCode: params[0],
              tableId: params[1],
              tableName: params[2],
              userId: params[3],
              staffName: params[4],
              customerName: params[5] || 'Khách vãng lai',
              note: params[6] || '',
              status: 'PENDING',
              totalAmount: 0,
              finalAmount: 0,
              createdAt: new Date().toISOString()
            };
            tablesStore.orders.push(newOrd);
            lastInsertRowid = newOrd.id;
          } else if (lowerSql.includes('insert into order_items')) {
            const newOrdItem = {
              id: tablesStore.order_items.length + 1,
              orderId: params[0],
              menuItemId: params[1],
              itemName: params[2],
              price: params[3],
              quantity: params[4],
              note: params[5] || '',
              totalPrice: params[6]
            };
            tablesStore.order_items.push(newOrdItem);
            lastInsertRowid = newOrdItem.id;
          } else if (lowerSql.includes('delete from order_items where orderid =')) {
            tablesStore.order_items = tablesStore.order_items.filter(i => i.orderId !== Number(params[0]));
          } else if (lowerSql.includes('update orders')) {
            const orderId = params[params.length - 1];
            const ord = tablesStore.orders.find(o => o.id === Number(orderId));
            if (ord) {
              if (lowerSql.includes('status = \'paid\'')) {
                ord.status = 'PAID';
                ord.paymentMethod = params[0];
                ord.discountPercent = params[1];
                ord.finalAmount = params[2];
                ord.paidAt = new Date().toISOString();
              } else {
                ord.totalAmount = params[0];
                ord.finalAmount = params[1];
                ord.note = params[2];
                ord.customerName = params[3];
              }
            }
          } else if (lowerSql.includes('update tables set status =')) {
            const tblId = params[params.length - 1];
            const tbl = tablesStore.tables.find(t => t.id === Number(tblId));
            if (tbl) tbl.status = params[0];
          }

          return { lastInsertRowid, changes: 1 };
        }
      };
    }
  };
}

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
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

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
