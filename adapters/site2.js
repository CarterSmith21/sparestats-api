import axios from 'axios';
import { load } from 'cheerio';

const BASE = 'https://www.repco.com.au';

export async function site2(query) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}`;

  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept-Language': 'en-AU,en;q=0.9'
    },
    timeout: 15000
  });

  const $ = load(html);
  const items = [];

  // Repco’s product tiles
  const cards = $(
    '.product-tile, .product-tile-container, li.product-item, .product-card'
  );

  cards.each((_, el) => {
    const $el = $(el);

    // Title
    const title =
      $el.find('.product-title').text().trim() ||
      $el.find('.product-name').text().trim() ||
      $el.find('a[title]').attr('title') ||
      $el.find('a').first().text().trim();

    // Price
    const priceText =
      $el.find('.price').text().trim() ||
      $el.find('.product-sales-price').text().trim() ||
      $el.find('.now').text().trim();

    // Link
    let link =
      $el.find('a.product-link').attr('href') ||
      $el.find('a[href*="/p/"]').attr('href') ||
      $el.find('a[href]').attr('href');

    // Image
    let img =
      $el.find('img.product-image').attr('src') ||
      $el.find('img').attr('data-src') ||
      $el.find('img').attr('src');

    // Normalize
    if (link && !/^https?:\/\//i.test(link)) {
      try { link = new URL(link, BASE).toString(); } catch {}
    }
    if (img && !/^https?:\/\//i.test(img)) {
      try { img = new URL(img, BASE).toString(); } catch {}
    }

    if (title && priceText && link) {
      items.push({
        title,
        price: priceText,
        url: link,
        image: img || null,
        source: 'Repco'
      });
    }
  });

  return items;
}

