import fs from 'node:fs';

const urls = {
  'iced_1': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400',
  'iced_2': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
  'iced_3': 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400',
  'iced_4': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400',
  'iced_5': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
  'iced_6': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
  'iced_7': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
  'iced_8': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400'
};

async function testFetch() {
  for (const [k, u] of Object.entries(urls)) {
    try {
      const res = await fetch(u);
      console.log(k, res.status);
    } catch(e) { console.log(k, e.message); }
  }
}
testFetch();
