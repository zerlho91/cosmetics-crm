import express from 'express';
import cors from 'cors';
import { query, get, withTransaction } from './db.js';
import * as ai from './ai.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// 라우트 핸들러를 감싸 에러를 일괄 처리
const wrap = (fn) => (req, res) => fn(req, res).catch((err) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// =============== Auth ===============
app.post('/api/auth/login', wrap(async (req, res) => {
  const { username, password, adminCode } = req.body;

  if (adminCode) {
    if (adminCode === '0000') {
      return res.json({ success: true, user: { username: 'Admin', brand_name: 'AmorePacific' }, token: 'dummy-jwt-token' });
    }
    return res.status(401).json({ success: false, message: 'Invalid Admin Code' });
  }

  const row = await get('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
  if (row) {
    res.json({ success: true, user: { username: row.username, brand_name: row.brand_name }, token: 'dummy-jwt-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid ID or Password' });
  }
}));

// =============== Users ===============
app.get('/api/users', wrap(async (req, res) => {
  res.json(await query('SELECT id, username, brand_name FROM users ORDER BY id'));
}));
app.post('/api/users', wrap(async (req, res) => {
  const r = await get(
    'INSERT INTO users (username, password, brand_name) VALUES ($1, $2, $3) RETURNING id',
    [req.body.username, req.body.password, req.body.brand_name || 'AmorePacific']
  );
  res.json({ success: true, id: r.id });
}));
app.delete('/api/users/:id', wrap(async (req, res) => {
  await query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
}));
app.put('/api/users/:id/brand', wrap(async (req, res) => {
  await query('UPDATE users SET brand_name = $1 WHERE id = $2', [req.body.brand_name, req.params.id]);
  res.json({ success: true });
}));

// =============== Dashboard ===============
app.get('/api/dashboard', wrap(async (req, res) => {
  const { year, month } = req.query;
  const targetMonthStr = year && month ? `${year}-${String(month).padStart(2, '0')}` : '2026-05';
  const y = parseInt(targetMonthStr.split('-')[0]);
  const m = parseInt(targetMonthStr.split('-')[1]);

  const monthsArray = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    monthsArray.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const monthlySalesHistory = [];
  for (const mStr of monthsArray) {
    const row = await get('SELECT SUM(total_amount) AS total FROM sales WHERE date LIKE $1', [`${mStr}-%`]);
    monthlySalesHistory.push({ name: `${parseInt(mStr.split('-')[1])}월`, sales: row && row.total ? parseInt(row.total) : 0 });
  }

  const topCustomers = await query(
    `SELECT c.id, c.name, SUM(s.total_amount)::int AS total_spent
     FROM customers c JOIN sales s ON c.id = s.customer_id
     WHERE s.date LIKE $1 GROUP BY c.id, c.name ORDER BY total_spent DESC LIMIT 3`,
    [`${targetMonthStr}-%`]
  );
  const topProducts = await query(
    `SELECT p.id, p.name, SUM(si.quantity)::int AS total_sold
     FROM products p JOIN sale_items si ON p.id = si.product_id JOIN sales s ON si.sale_id = s.id
     WHERE s.date LIKE $1 GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 5`,
    [`${targetMonthStr}-%`]
  );
  const salesByDate = await query(
    `SELECT s.id AS sale_id, s.date, c.name, c.customer_no, s.total_amount
     FROM sales s JOIN customers c ON s.customer_id = c.id
     WHERE s.date LIKE $1 ORDER BY s.date ASC, s.id ASC`,
    [`${targetMonthStr}-%`]
  );

  res.json({ monthlySalesHistory, topCustomers, topProducts, salesByDate });
}));

app.get('/api/dashboard/yearly', wrap(async (req, res) => {
  const targetYear = req.query.year || '2026';
  const yearHistory = [];
  for (let i = 1; i <= 12; i++) {
    const mStr = `${targetYear}-${String(i).padStart(2, '0')}`;
    const row = await get('SELECT SUM(total_amount) AS total FROM sales WHERE date LIKE $1', [`${mStr}-%`]);
    yearHistory.push({ name: `${i}월`, sales: row && row.total ? parseInt(row.total) : 0 });
  }
  res.json(yearHistory);
}));

// =============== Calendar ===============
app.get('/api/calendar', wrap(async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: 'Year and month required' });
  const mm = String(month).padStart(2, '0');
  const targetMonthStr = `${year}-${mm}`;

  const rows = await query(
    `SELECT s.id AS sale_id, s.date, c.name, c.customer_no, s.total_amount, p.name AS product_name, si.quantity
     FROM sales s
     JOIN customers c ON s.customer_id = c.id
     JOIN sale_items si ON s.id = si.sale_id
     JOIN products p ON si.product_id = p.id
     WHERE s.date LIKE $1 ORDER BY s.date ASC`,
    [`${targetMonthStr}-%`]
  );

  const salesMap = {};
  rows.forEach((row) => {
    if (!salesMap[row.sale_id]) {
      salesMap[row.sale_id] = { sale_id: row.sale_id, date: row.date, name: row.name, customer_no: row.customer_no, total_amount: row.total_amount, items: [] };
    }
    salesMap[row.sale_id].items.push({ name: row.product_name, quantity: row.quantity });
  });

  const birthdays = await query('SELECT id, name, birth_date FROM customers WHERE birth_date LIKE $1', [`%-${mm}-%`]);
  res.json({ sales: Object.values(salesMap), birthdays });
}));

// =============== Analytics Compare ===============
app.post('/api/analytics/compare', wrap(async (req, res) => {
  const { productIds } = req.body;
  if (!productIds || productIds.length === 0) return res.json({ error: 'No products selected' });

  const inClause = productIds.map((_, i) => `$${i + 1}`).join(',');
  const rows = await query(
    `SELECT p.name AS product_name, s.date, c.birth_date, c.skin_type, si.quantity
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     JOIN products p ON si.product_id = p.id
     JOIN customers c ON s.customer_id = c.id
     WHERE p.id IN (${inClause})`,
    productIds
  );

  const monthly = {};
  const ageGrp = {};
  const skinGrp = {};
  for (let i = 1; i <= 12; i++) monthly[`${i}월`] = { month: `${i}월` };
  ['20대 이하', '30대', '40대', '50대 이상'].forEach((a) => (ageGrp[a] = { ageGroup: a }));
  ['건성', '지성', '복합성', '민감성'].forEach((s) => (skinGrp[s] = { skinType: s }));

  rows.forEach((row) => {
    const pName = row.product_name;
    const q = row.quantity;
    const m = parseInt(row.date.split('-')[1]);
    monthly[`${m}월`][pName] = (monthly[`${m}월`][pName] || 0) + q;

    let ageGroup = '20대 이하';
    if (row.birth_date) {
      const age = 2026 - parseInt(row.birth_date.split('-')[0]);
      if (age >= 50) ageGroup = '50대 이상';
      else if (age >= 40) ageGroup = '40대';
      else if (age >= 30) ageGroup = '30대';
    }
    ageGrp[ageGroup][pName] = (ageGrp[ageGroup][pName] || 0) + q;

    if (row.skin_type) {
      row.skin_type.split(',').forEach((s) => {
        const st = s.trim();
        if (!skinGrp[st]) skinGrp[st] = { skinType: st };
        skinGrp[st][pName] = (skinGrp[st][pName] || 0) + q;
      });
    }
  });

  res.json({ monthly: Object.values(monthly), age: Object.values(ageGrp), skin: Object.values(skinGrp) });
}));

// =============== Customers ===============
app.get('/api/customers', wrap(async (req, res) => {
  const { search } = req.query;
  if (search) {
    res.json(await query(
      'SELECT * FROM customers WHERE name LIKE $1 OR customer_no LIKE $1 ORDER BY id DESC',
      [`%${search}%`]
    ));
  } else {
    res.json(await query('SELECT * FROM customers ORDER BY id DESC'));
  }
}));

app.post('/api/customers', wrap(async (req, res) => {
  const { customer_no, name, birth_date, join_date, skin_type, region, memo } = req.body;
  const r = await get(
    'INSERT INTO customers (customer_no, name, birth_date, join_date, skin_type, region, memo) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [customer_no, name, birth_date, join_date, skin_type, region, memo]
  );
  res.json({ id: r.id });
}));

app.put('/api/customers/:id', wrap(async (req, res) => {
  const { name, birth_date, skin_type, region, memo } = req.body;
  await query(
    'UPDATE customers SET name=$1, birth_date=$2, skin_type=$3, region=$4, memo=$5 WHERE id=$6',
    [name, birth_date, skin_type, region, memo, req.params.id]
  );
  res.json({ success: true });
}));

app.post('/api/customers/bulk', wrap(async (req, res) => {
  const customers = req.body;
  if (!Array.isArray(customers) || customers.length === 0) return res.json({ success: true, inserted: 0 });

  const inserted = await withTransaction(async (client) => {
    let count = 0;
    for (const c of customers) {
      const r = await client.query(
        `INSERT INTO customers (customer_no, name, birth_date, join_date, skin_type, region, memo, mileage)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (customer_no) DO NOTHING RETURNING id`,
        [c.customer_no, c.name, c.birth_date || '', c.join_date || new Date().toISOString().split('T')[0],
         c.skin_type || '', c.region || '', c.memo || '', c.mileage || 0]
      );
      if (r.rows.length > 0) count++;
    }
    return count;
  });
  res.json({ success: true, inserted });
}));

app.put('/api/customers/:id/mileage', wrap(async (req, res) => {
  await query('UPDATE customers SET mileage = mileage + $1 WHERE id = $2', [req.body.amount, req.params.id]);
  res.json({ success: true });
}));

// =============== Products ===============
app.get('/api/products', wrap(async (req, res) => {
  res.json(await query('SELECT * FROM products ORDER BY id'));
}));

app.post('/api/products', wrap(async (req, res) => {
  const { name, price, description, stock, image_url, link } = req.body;
  const r = await get(
    'INSERT INTO products (name, price, description, stock, image_url, link) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [name, price, description, stock || 0, image_url || '', link || '']
  );
  res.json({ id: r.id });
}));

app.put('/api/products/:id', wrap(async (req, res) => {
  const { name, price, description, stock, image_url, link } = req.body;
  await query(
    'UPDATE products SET name=$1, price=$2, description=$3, stock=$4, image_url=$5, link=$6 WHERE id=$7',
    [name, price, description, stock || 0, image_url || '', link || '', req.params.id]
  );
  res.json({ success: true });
}));

app.post('/api/products/bulk', wrap(async (req, res) => {
  const products = req.body;
  if (!Array.isArray(products) || products.length === 0) return res.json({ success: true, inserted: 0 });

  const existing = await query('SELECT name FROM products');
  const existingNames = new Set(existing.map((r) => r.name));
  const newProducts = products.filter((p) => !existingNames.has(p.name));
  if (newProducts.length === 0) return res.json({ success: true, inserted: 0 });

  const inserted = await withTransaction(async (client) => {
    let count = 0;
    for (const p of newProducts) {
      await client.query(
        'INSERT INTO products (name, price, description, stock, image_url, link) VALUES ($1,$2,$3,$4,$5,$6)',
        [p.name, p.price || 0, p.description || '', p.stock || 0, p.image_url || '', p.link || '']
      );
      count++;
    }
    return count;
  });
  res.json({ success: true, inserted });
}));

// =============== Sales ===============
app.post('/api/sales', wrap(async (req, res) => {
  const { date, customer_id, total_amount, used_mileage, discount_type, discount_value, payment_method, memo, items } = req.body;

  const saleId = await withTransaction(async (client) => {
    const saleRes = await client.query(
      `INSERT INTO sales (date, customer_id, total_amount, used_mileage, discount_type, discount_value, payment_method, memo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [date, customer_id, total_amount, used_mileage || 0, discount_type, discount_value || 0, payment_method || '카드', memo]
    );
    const id = saleRes.rows[0].id;
    const earnedMileage = Math.floor(total_amount * 0.05);
    await client.query('UPDATE customers SET mileage = mileage - $1 + $2 WHERE id = $3', [used_mileage || 0, earnedMileage, customer_id]);
    for (const item of items || []) {
      await client.query('INSERT INTO sale_items (sale_id, product_id, quantity) VALUES ($1,$2,$3)', [id, item.product_id, item.quantity]);
    }
    return id;
  });
  res.json({ success: true, saleId });
}));

// =============== Customer History ===============
app.get('/api/customers/:id/history', wrap(async (req, res) => {
  const customerId = req.params.id;
  const customer = await get('SELECT * FROM customers WHERE id = $1', [customerId]);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const rows = await query(
    `SELECT s.id AS sale_id, s.date, s.total_amount, s.used_mileage, s.discount_type, s.discount_value, s.payment_method, s.memo,
            p.id AS product_id, p.name AS product_name, p.price AS product_price, si.quantity
     FROM sales s
     LEFT JOIN sale_items si ON s.id = si.sale_id
     LEFT JOIN products p ON si.product_id = p.id
     WHERE s.customer_id = $1
     ORDER BY s.date DESC, s.id DESC`,
    [customerId]
  );

  const salesMap = {};
  rows.forEach((row) => {
    if (!salesMap[row.sale_id]) {
      salesMap[row.sale_id] = {
        sale_id: row.sale_id, date: row.date, total_amount: row.total_amount, used_mileage: row.used_mileage,
        discount_type: row.discount_type, discount_value: row.discount_value, payment_method: row.payment_method || '카드',
        memo: row.memo, items: [],
      };
    }
    if (row.product_id) {
      salesMap[row.sale_id].items.push({ product_id: row.product_id, product_name: row.product_name, product_price: row.product_price, quantity: row.quantity });
    }
  });

  const sales = Object.values(salesMap);
  const totalSpent = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  res.json({ customer, sales, summary: { totalSpent, totalVisits: sales.length, currentMileage: customer.mileage } });
}));

// =============== Sales Point (재구매 예측) ===============
async function buildSalesPoint() {
  const customers = await query('SELECT * FROM customers ORDER BY id DESC');
  const results = [];
  for (const customer of customers) {
    const rows = await query(
      `SELECT s.date, s.total_amount, p.name AS product_name
       FROM sales s
       LEFT JOIN sale_items si ON s.id = si.sale_id
       LEFT JOIN products p ON si.product_id = p.id
       WHERE s.customer_id = $1 ORDER BY s.date ASC`,
      [customer.id]
    );

    const salesByDate = {};
    rows.forEach((row) => {
      if (!salesByDate[row.date]) salesByDate[row.date] = { date: row.date, amount: row.total_amount, products: [] };
      if (row.product_name) salesByDate[row.date].products.push(row.product_name);
    });
    const sales = Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date));

    let avgInterval = null;
    if (sales.length >= 2) {
      let totalDays = 0;
      for (let i = 1; i < sales.length; i++) {
        totalDays += (new Date(sales[i].date) - new Date(sales[i - 1].date)) / 86400000;
      }
      avgInterval = Math.round(totalDays / (sales.length - 1));
    }

    const lastSale = sales.length > 0 ? sales[sales.length - 1] : null;
    const lastSaleDate = lastSale ? lastSale.date : null;
    let daysSinceLast = null;
    let predictedNextDate = null;
    let status = 'no_data';
    const today = new Date('2026-05-14');

    if (lastSaleDate) {
      const last = new Date(lastSaleDate);
      daysSinceLast = Math.round((today - last) / 86400000);
      const cycle = avgInterval || (sales.length === 1 ? 60 : null);
      if (cycle) {
        const nextDate = new Date(last);
        nextDate.setDate(nextDate.getDate() + cycle);
        predictedNextDate = nextDate.toISOString().split('T')[0];
        const daysUntilNext = Math.round((nextDate - today) / 86400000);
        if (daysUntilNext < 0) status = 'overdue';
        else if (daysUntilNext <= 14) status = 'soon';
        else status = 'good';
      }
    }

    const productCount = {};
    rows.forEach((r) => { if (r.product_name) productCount[r.product_name] = (productCount[r.product_name] || 0) + 1; });
    const topProducts = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);

    results.push({
      ...customer, totalVisits: sales.length, lastSaleDate, daysSinceLast, avgInterval, predictedNextDate, status, topProducts,
      totalSpent: sales.reduce((s, x) => s + (x.amount || 0), 0),
    });
  }
  return results;
}

app.get('/api/sales-point', wrap(async (req, res) => {
  res.json(await buildSalesPoint());
}));

// =============== AI (Claude) ===============
app.post('/api/ai', wrap(async (req, res) => {
  const { type } = req.body;
  // 설정 화면에서 전달된 키/모델 (없으면 서버 환경변수 사용)
  const opts = {
    apiKey: req.headers['x-ai-key'] || undefined,
    model: req.headers['x-ai-model'] || undefined,
  };

  if (type === 'customer') {
    const { customerId } = req.body;
    const customer = await get('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const rows = await query(
      `SELECT s.id AS sale_id, s.date, s.total_amount, p.name AS product_name, si.quantity
       FROM sales s LEFT JOIN sale_items si ON s.id = si.sale_id LEFT JOIN products p ON si.product_id = p.id
       WHERE s.customer_id = $1 ORDER BY s.date DESC, s.id DESC`,
      [customerId]
    );
    const salesMap = {};
    rows.forEach((r) => {
      if (!salesMap[r.sale_id]) salesMap[r.sale_id] = { date: r.date, total_amount: r.total_amount, items: [] };
      if (r.product_name) salesMap[r.sale_id].items.push({ product_name: r.product_name, quantity: r.quantity });
    });
    const sales = Object.values(salesMap);
    const summary = { totalSpent: sales.reduce((s, x) => s + (x.total_amount || 0), 0), totalVisits: sales.length };
    const result = await ai.customerInsight({ customer, sales, summary }, opts);
    return res.json(result);
  }

  if (type === 'sales_point') {
    const customers = await buildSalesPoint();
    return res.json(await ai.salesPointSummary(customers, opts));
  }

  if (type === 'dashboard') {
    const { year, month } = req.body;
    const targetMonthStr = year && month ? `${year}-${String(month).padStart(2, '0')}` : '2026-05';
    const y = parseInt(targetMonthStr.split('-')[0]);
    const m = parseInt(targetMonthStr.split('-')[1]);
    const monthlySalesHistory = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const row = await get('SELECT SUM(total_amount) AS total FROM sales WHERE date LIKE $1', [`${mStr}-%`]);
      monthlySalesHistory.push({ name: `${parseInt(mStr.split('-')[1])}월`, sales: row && row.total ? parseInt(row.total) : 0 });
    }
    const topCustomers = await query(
      `SELECT c.name, SUM(s.total_amount)::int AS total_spent FROM customers c JOIN sales s ON c.id = s.customer_id
       WHERE s.date LIKE $1 GROUP BY c.name ORDER BY total_spent DESC LIMIT 3`, [`${targetMonthStr}-%`]);
    const topProducts = await query(
      `SELECT p.name, SUM(si.quantity)::int AS total_sold FROM products p JOIN sale_items si ON p.id = si.product_id
       JOIN sales s ON si.sale_id = s.id WHERE s.date LIKE $1 GROUP BY p.name ORDER BY total_sold DESC LIMIT 5`, [`${targetMonthStr}-%`]);
    const result = await ai.dashboardSummary({ month: targetMonthStr, monthlySalesHistory, topCustomers, topProducts }, opts);
    return res.json(result);
  }

  res.status(400).json({ error: 'Unknown AI type' });
}));

// =============== News (실시간 Google 뉴스 RSS) ===============
function decodeEntities(s) {
  return (s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, '&')
    .trim();
}

function parseRss(xml) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const pick = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(block);
      return r ? decodeEntities(r[1]) : '';
    };
    const rawTitle = pick('title');
    const source = pick('source');
    // Google 뉴스 제목은 "제목 - 언론사" 형식 → 언론사 부분 분리
    let title = rawTitle;
    let src = source;
    const dash = rawTitle.lastIndexOf(' - ');
    if (!src && dash > 0) { title = rawTitle.slice(0, dash); src = rawTitle.slice(dash + 3); }
    else if (src && rawTitle.endsWith(` - ${src}`)) { title = rawTitle.slice(0, rawTitle.length - src.length - 3); }

    const link = pick('link');
    const pub = pick('pubDate');
    let date = '';
    if (pub) { const d = new Date(pub); if (!isNaN(d)) date = d.toISOString().split('T')[0]; }

    if (title && link) items.push({ title, url: link, source: src, date });
  }
  return items;
}

app.get('/api/news', wrap(async (req, res) => {
  const q = (req.query.q || '뷰티 트렌드').toString().slice(0, 100);
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CRMNewsBot/1.0)' } });
    if (!r.ok) return res.status(502).json({ error: '뉴스 서버 응답 오류', articles: [] });
    const xml = await r.text();
    res.json({ query: q, articles: parseRss(xml).slice(0, 15) });
  } catch (e) {
    res.status(502).json({ error: '뉴스를 불러오지 못했습니다: ' + e.message, articles: [] });
  }
}));

// =============== System ===============
app.post('/api/system/reset', wrap(async (req, res) => {
  const { target, customerId } = req.body;
  if (target === 'all') {
    await query('TRUNCATE sale_items, sales, customers RESTART IDENTITY CASCADE');
    res.json({ success: true });
  } else if (target === 'customer' && customerId) {
    await query('DELETE FROM customers WHERE id = $1', [customerId]);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid reset target' });
  }
}));

app.get('/api/system/health', wrap(async (req, res) => {
  try {
    await get('SELECT 1 AS ok');
    res.json({ status: 'ok', db: 'up', timestamp: new Date().toISOString() });
  } catch (e) {
    res.json({ status: 'ok', db: 'down', timestamp: new Date().toISOString() });
  }
}));

export default app;
