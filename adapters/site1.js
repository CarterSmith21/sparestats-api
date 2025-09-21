import axios from 'axios';
import { load } from 'cheerio';

// No trailing slash (helps when joining relative URLs)
const BASE = 'https://www.supercheapauto.com.au';

export async function site1(query) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}`;

  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept-Language': 'en-AU,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Referer': BASE + '/'
    },
    timeout: 15000,
    // follow redirects automatically (axios default)
  });

  const $ = load(html);
  const items = [];

  // Try a few likely product card containers (be flexible)
  const cards = $(
    [
      '[data-qa="product-card"]',
      '.product-card',
      '.product-tile',
      '.product-grid__tile',
      'li.product-item',
      '.grid-item'
    ].join(', ')
  );

  cards.each((_, el) => {
    const $el = $(el);

    // Title: try several selectors
    const title =
      $el.find('[data-qa="product-name"]').text().trim() ||
      $el.find('.product-title').text().trim() ||
      $el.find('.product-tile__name').text().trim() ||
      $el.find('.name, h3, h2, a[title]').first().text().trim();

    // Price: try several selectors (strip whitespace)
    const priceText =
      $el.find('[data-qa="product-price"]').text().trim() ||
      $el.find('.price').text().trim() ||
      $el.find('.now, .sale, .product-sales-price').first().text().trim();

    // Link: any anchor that goes to PDP
    let link =
      $el.find('a.product-link').attr('href') ||
      $el.find('a[href*="/p/"]').attr('href') ||
      $el.find('a[href]').attr('href');

    // Image
    let img =
      $el.find('img.product-image').attr('src') ||
      $el.find('img').attr('src') ||
      $el.find('img').attr('data-src');

    // Normalize to absolute URLs
    if (link && !/^https?:\/\//i.test(link)) {
      try { link = new URL(link, BASE).toString(); } catch { /* ignore */ }
    }
    if (img && !/^https?:\/\//i.test(img)) {
      try { img = new URL(img, BASE).toString(); } catch { /* ignore */ }
    }

    if (title && priceText && link) {
      items.push({
        title,
        price: priceText,
        url: link,
        image: img || null,
        source: 'Supercheap Auto'
      });
    }
  });

  return items;
}
