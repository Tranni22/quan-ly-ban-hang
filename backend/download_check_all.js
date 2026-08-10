import fs from 'node:fs';
import path from 'node:path';

const allCandidates = {
  'item1_iced_coffee_a': 'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=400',
  'item1_iced_coffee_b': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
  
  'item3_salt_coffee': 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=400',
  'item4_bac_xiu': 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400',
  'item5_egg_coffee': 'https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?w=400',
  'item7_americano_iced': 'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=400',
  
  'item8_cappuccino_cin': 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400',
  'item9_caramel_latte': 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=400',
  
  'item10_peach_tea_a': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400',
  'item10_peach_tea_b': 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400',
  
  'item11_soursop_tea': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
  'item12_cheese_tea': 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
  
  'item14_avocado_smoothie_a': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
  'item14_avocado_smoothie_b': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400',
  'item14_avocado_smoothie_c': 'https://images.unsplash.com/photo-1601039641847-7857b994d704?w=400',
  
  'item16_matcha_frappe': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400',
  
  'item19_passion_cheesecake_a': 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400',
  'item19_passion_cheesecake_b': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
  'item19_passion_cheesecake_c': 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=400'
};

const outDir = './check_all';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function download() {
  for (const [k, u] of Object.entries(allCandidates)) {
    try {
      const res = await fetch(u);
      if (res.ok) {
        fs.writeFileSync(path.join(outDir, `${k}.jpg`), Buffer.from(await res.arrayBuffer()));
        console.log('OK', k);
      } else console.log('FAIL', k, res.status);
    } catch(e) { console.log('ERR', k, e.message); }
  }
}
await download();
