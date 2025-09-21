import axios from 'axios';
import { load } from 'cheerio';

const BASE = 'https://www.sparesbox.com.au';

export async function site4(query) {
  // Sparesbox search URL
  const url = `${BASE}/search?q=${encodeURIComponent(query)}`;

  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept-Language': 'en-AU,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Referer': BASE + '/'
    },
    timeout: 15000
  });

  const $ = load(html);
  const items = [];

  // Their grid often uses InstantSearch (Algolia) classes.
  // We search across a few likely patterns to be resilient.
  const cards = $(
    [
      '.ais-Hits-item',
      '.product-card',
      '.ProductCard',
      '.product-tile',
      'li.product-item'
    ].join(', ')
  );

  cards.each((_, el) => {
    const $el = $(el);

    // Title (try multiple possibilities)
    const title =
      $el.find('[data-qa="product-name"]').text().trim() ||
      $el.find('.product-title').text().trim() ||
      $el.find('.ProductCard__name, .product-name').first().text().trim() ||
      $el.find('a[title]').attr('title') ||
      $el.find('h3, h2, a').first().text().trim();

    // Price (sale/now/regular variants)
    const priceText =
      $el.find('.price, .product-sales-price, .now, .Price__value, .money').first().text().trim();

    // Link (prefer PDP links)
    let link =
      $el.find('a.product-link').attr('href') ||
      $el.find('a[href*="/products/"], a[href*="/p/"]').attr('href') ||
      $el.find('a[href]').attr('href');

    // Image
    let img =
      $el.find('img.product-image').attr('src') ||
      $el.find('img').attr('data-src') ||
      $el.find('img').attr('src');

    // Absolute URLs
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
        source: 'Sparesbox'
      });
    }
  });

  return items;
}
