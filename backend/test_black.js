import fs from 'node:fs';
import path from 'node:path';

const urls = {
  'black_1': 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400',
  'black_2': 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400',
  'black_3': 'https://images.unsplash.com/photo-1522992319-0365e5f11656?w=400',
  'black_4': 'https://images.unsplash.com/photo-1518057111178-44a106bad636?w=400',
  'black_5': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400'
};

const outDir = './test_black';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  for (const [k, u] of Object.entries(urls)) {
    try {
      const res = await fetch(u);
      if (res.ok) {
        fs.writeFileSync(path.join(outDir, `${k}.jpg`), Buffer.from(await res.arrayBuffer()));
        console.log('OK', k);
      } else console.log('FAIL', k, res.status);
    } catch(e) { console.log('ERR', k, e.message); }
  }
}
await run();
