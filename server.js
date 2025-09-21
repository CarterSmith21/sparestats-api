import express from 'express';
import cors from 'cors';
import PLimit from 'p-limit';

import { site1 } from './adapters/site1.js';
import { site2 } from './adapters/site2.js';
import { site3 } from './adapters/site3.js';
import { site4 } from './adapters/site4.js';

const app = express();
app.use(cors()); // allow your Hostinger site to fetch from this API
const limit = PLimit(4);

const ADAPTERS = [site1, site2, site3, site4];

// simple cache (5 minutes)
const cache = new Map();
const TTL = 5 * 60 * 1000;

app.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing q' });

  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL) {
    return res.json(cached.data);
  }

  try {
    const results = (await Promise.allSettled(
      ADAPTERS.map(a => limit(() => a(q)))
    )).flatMap(r => r.status === 'fulfilled' ? r.value : []);

    const normalized = results.map(x => ({
      title: (x.title || 'Untitled').trim(),
      price: toNumber(x.price),
      url: x.url,
      image: x.image || null,
      source: x.source || 'Unknown'
    }))
    .filter(x => x.url && !Number.isNaN(x.price))
    .sort((a, b) => a.price - b.price);

    const payload = { query: q, count: normalized.length, results: normalized };
    cache.set(key, { ts: Date.now(), data: payload });

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

function toNumber(v) {
  if (typeof v === 'number') return v;
  if (!v) return NaN;
  const n = String(v).replace(/[^\d.,-]/g, '').replace(',', '');
  return parseFloat(n);
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('API running on port ' + PORT));
