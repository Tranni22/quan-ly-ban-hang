import fs from 'node:fs';
import path from 'node:path';

const testUrls = {
  // Candidate Cà phê đen đá
  'iced_black_1': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
  'iced_black_2': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
  'iced_black_3': 'https://images.unsplash.com/photo-1512568400610-6212b5320002?w=400',
  'iced_black_4': 'https://images.unsplash.com/photo-1559496417-d77227443834?w=400',

  // Candidate Bạc Xỉu / Cà phê sữa đá phân lớp
  'bac_xiu_1': 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400',
  'bac_xiu_2': 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400',

  // Candidate Cà phê muối / Cà phê bọt kem
  'salt_coffee_1': 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=400',

  // Candidate Cà phê trứng
  'egg_coffee_1': 'https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?w=400',
  'egg_coffee_2': 'https://images.unsplash.com/photo-1579888926999-29177110190a?w=400',

  // Candidate Trà đào cam sả
  'peach_tea_1': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400',
  'peach_tea_2': 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400',

  // Candidate Trà trái cây / mãng cầu
  'fruit_tea_1': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
  'fruit_tea_2': 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400',

  // Candidate Trà kem cheese
  'cheese_tea_1': 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',

  // Candidate Sinh tố bơ
  'avocado_1': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
  'avocado_2': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400',
  'avocado_3': 'https://images.unsplash.com/photo-1601039641847-7857b994d704?w=400',

  // Candidate Matcha đá xay
  'matcha_ice_1': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400',
  'matcha_ice_2': 'https://images.unsplash.com/photo-1530376239212-d58634267e75?w=400',

  // Candidate Cheesecake chanh dây
  'passion_cheesecake_1': 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400',
  'passion_cheesecake_2': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
  'passion_cheesecake_3': 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=400'
};

const outDir = './test_more';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function downloadAll() {
  for (const [key, url] of Object.entries(testUrls)) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log('FAIL', key, res.status);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(outDir, `${key}.jpg`), buffer);
      console.log('OK', key);
    } catch(e) {
      console.log('ERR', key, e.message);
    }
  }
}

await downloadAll();
