import fs from 'node:fs';
import path from 'node:path';

const items = JSON.parse(fs.readFileSync('items_out.json'));
const outDir = './images_test';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function downloadImages() {
  for (const item of items) {
    try {
      const res = await fetch(item.image);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const fileName = `item_${item.id}_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      fs.writeFileSync(path.join(outDir, fileName), buffer);
      console.log('OK', item.id, item.name);
    } catch(e) {
      console.error('FAIL', item.id, item.name, e.message);
    }
  }
}
await downloadImages();
