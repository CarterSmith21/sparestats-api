import axios from 'axios';
import cheerio from 'cheerio';

// Change BASE to the third website you want to scrape
const BASE = 'https://www.carparts2u.com.au/?msclkid=d73423dec04e1e5460804b1163f04cb5';

export async function site3(query) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}`;
  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SpareStatsBot/1.0)',
      'Accept-Language': 'en-AU,en;q=0.9'
    },
    timeout: 15000
  });

  const $ = cheerio.load(html);
  const items = [];

  // 👇 Update selectors to match the third site’s HTML structure
  $('.product-card').each((_, el) => {
    const title = $(el).find('.product-title').text();
    const price = $(el).find('.price').text();
    const link  = $(el).find('a.product-link').attr('href');
    const img   = $(el).find('img.product-image').attr('src');

    const urlAbs = link?.startsWith('http') ? link : (link ? BASE + link : null);
    const imgAbs = img?.startsWith('http') ? img : (img ? BASE + img : null);

    if (title && price && urlAbs) {
      items.push({
        title,
        price,
        url: urlAbs,
        image: imgAbs,
        source: 'Carparts2u' // change this to store’s actual name
      });
    }
  });

  return items;
}
