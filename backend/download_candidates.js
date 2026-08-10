import fs from 'node:fs';
import path from 'node:path';

const candidates = {
  // ID 1: Cà Phê Đen Đá (Iced Black Coffee)
  '1_black_iced_1': 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400',
  '1_black_iced_2': 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400',
  '1_black_iced_3': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400',

  // ID 3: Cà Phê Muối Huế (Salted Foam Coffee)
  '3_salt_1': 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=400',
  '3_salt_2': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
  '3_salt_3': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400',

  // ID 4: Bạc Xỉu Sài Gòn (Layered Iced Coffee)
  '4_bacxiu_1': 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400',
  '4_bacxiu_2': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400',
  '4_bacxiu_3': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',

  // ID 5: Cà Phê Trứng Hà Nội (Egg Coffee / Foam Coffee)
  '5_egg_1': 'https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?w=400',
  '5_egg_2': 'https://images.unsplash.com/photo-1579888926999-29177110190a?w=400',
  '5_egg_3': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',

  // ID 7: Americano Đá (Iced Americano)
  '7_americano_1': 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400',
  '7_americano_2': 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400',
  '7_americano_3': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400',

  // ID 8: Cappuccino Cinnamon
  '8_cap_cin_1': 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400',
  '8_cap_cin_2': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',

  // ID 9: Caramel Latte
  '9_caramel_1': 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=400',
  '9_caramel_2': 'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?w=400',

  // ID 10: Trà Đào Cam Sả
  '10_peach_1': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400',
  '10_peach_2': 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400',
  '10_peach_3': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400',

  // ID 11: Trà Mãng Cầu Đắk Lắk
  '11_soursop_1': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
  '11_soursop_2': 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400',
  '11_soursop_3': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400',

  // ID 12: Trà Sen Vàng Kem Cheese
  '12_cheese_1': 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
  '12_cheese_2': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400',

  // ID 14: Sinh Tố Bơ Đắk Lắk
  '14_avocado_1': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
  '14_avocado_2': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400',
  '14_avocado_3': 'https://images.unsplash.com/photo-1601039641847-7857b994d704?w=400',

  // ID 16: Matcha Ice Blended
  '16_matcha_ice_1': 'https://images.unsplash.com/photo-1530376239212-d58634267e75?w=400',
  '16_matcha_ice_2': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400',

  // ID 19: Cheesecake Chanh Dây
  '19_cheesecake_1': 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400',
  '19_cheesecake_2': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
  '19_cheesecake_3': 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=400'
};

const outDir = './candidates';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function downloadCandidates() {
  for (const [key, url] of Object.entries(candidates)) {
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

await downloadCandidates();
