import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

try {
  const db = new DatabaseSync('cafe.db');
  const items = db.prepare('SELECT id, categoryId, name, price, description, image FROM menu_items').all();
  console.log('Found items:', items.length);
  fs.writeFileSync('items_out.json', JSON.stringify(items, null, 2));
} catch (err) {
  console.error('Error:', err);
}
