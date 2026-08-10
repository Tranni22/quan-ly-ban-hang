import fs from 'node:fs';

async function searchUnsplash(query) {
  try {
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=5`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map(r => ({
      id: r.id,
      alt: r.alt_description,
      rawUrl: r.urls.raw,
      regularUrl: r.urls.regular
    }));
  } catch(e) {
    console.error(e.message);
    return [];
  }
}

const queries = {
  'iced_black_coffee': 'iced black coffee glass',
  'iced_americano': 'iced americano glass',
  'salted_cream_coffee': 'coffee salted cream foam',
  'vietnamese_iced_coffee': 'vietnamese iced coffee layered',
  'egg_coffee': 'egg coffee yellow foam',
  'cappuccino_cinnamon': 'cappuccino cinnamon powder',
  'caramel_latte': 'caramel latte drizzle',
  'peach_iced_tea': 'peach iced tea slice peach',
  'soursop_fruit_tea': 'fruit tea iced slice',
  'cheese_foam_tea': 'tea cheese foam layer',
  'avocado_smoothie': 'avocado smoothie green',
  'matcha_frappuccino': 'matcha frappuccino whipped cream',
  'passion_fruit_cheesecake': 'passion fruit cheesecake yellow'
};

async function main() {
  const results = {};
  for (const [key, q] of Object.entries(queries)) {
    console.log('Searching:', key, '->', q);
    const photos = await searchUnsplash(q);
    results[key] = photos;
  }
  fs.writeFileSync('unsplash_search.json', JSON.stringify(results, null, 2));
  console.log('Done searching!');
}

main();
