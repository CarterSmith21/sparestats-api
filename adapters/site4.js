import axios from 'axios';
import cheerio from 'cheerio';

// Change BASE to the fourth website you want to scrape
const BASE = 'https://www.sparesbox.com.au/';

export async function site4(query) {
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

  // 👇 Update selectors for the fourth site’s product listing
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
        source: 'Sparesbox' // change this to the real store name
      });
    }
  });

  return items;
}
