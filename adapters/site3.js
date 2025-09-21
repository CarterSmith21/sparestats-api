import axios from 'axios';
import { load } from 'cheerio';

const BASE = 'https://www.carparts2u.com.au';

export async function site3(query) {
  // WooCommerce search pattern
  const url = `${BASE}/?s=${encodeURIComponent(query)}&post_type=product`;

  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept-Language': 'en-AU,en;q=0.9'
    },
    timeout: 15000
  });

  const $ = load(html);
  const items = [];

  // Common WooCommerce product tiles
  const cards = $(
    [
      'ul.products li.product',
      '.products .product',
      '.woocommerce ul.products li.product',
      '.product-grid .product'
    ].join(', ')
  );

  cards.each((_, el) => {
    const $el = $(el);

    // Title
    const title =
      $el.find('.woocommerce-loop-product__title').text().trim() ||
      $el.find('h2, h3, .product-title').first().text().trim() ||
      $el.find('a.woocommerce-LoopProduct-link').attr('title') ||
      $el.find('a').first().text().trim();

    // Price
    const priceText =
      $el.find('.woocommerce-Price-amount').first().text().trim() ||
      $el.find('.price').first().text().trim();

    // Link
    let link =
      $el.find('a.woocommerce-LoopProduct-link').attr('href') ||
      $el.find('a[href*="/product/"]').attr('href') ||
      $el.find('a[href]').attr('href');

    // Image
    let img =
      $el.find('img').attr('data-src') ||
      $el.find('img').attr('src');

    // Normalize URLs
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
        source: 'Carparts2u'
      });
    }
  });

  return items;
}
