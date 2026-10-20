import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';

/** Settings the storefront and admin rely on. Missing keys are inserted on boot; existing values are never overwritten. */
export const DEFAULT_SETTINGS: Array<{ key: string; value: string; group: string }> = [
  // general
  { key: 'store_name', value: 'TelloraShop', group: 'general' },
  { key: 'store_tagline', value: 'Bold Shopping. Raw Style.', group: 'general' },
  { key: 'store_email', value: 'hello@tellorashop.com', group: 'general' },
  { key: 'store_phone', value: '+1 (555) 123-4567', group: 'general' },
  { key: 'store_address', value: '', group: 'general' },
  { key: 'currency', value: 'USD', group: 'general' },
  { key: 'currency_symbol', value: '$', group: 'general' },
  { key: 'maintenance_mode', value: 'false', group: 'general' },
  // announcement bar (messages separated by |)
  { key: 'announcement_enabled', value: 'true', group: 'announcement' },
  { key: 'announcement_text', value: 'FREE SHIPPING ON ORDERS OVER $75|PREMIUM RAW QUALITY|CODE WELCOME10 FOR 10% OFF', group: 'announcement' },
  // shipping, tax, inventory
  { key: 'tax_rate', value: '8.5', group: 'tax' },
  { key: 'shipping_flat_rate', value: '9.99', group: 'shipping' },
  { key: 'express_shipping_rate', value: '19.99', group: 'shipping' },
  { key: 'free_shipping_threshold', value: '75', group: 'shipping' },
  { key: 'shipping_estimate_days', value: '3-5', group: 'shipping' },
  { key: 'low_stock_threshold', value: '5', group: 'inventory' },
  { key: 'return_days', value: '30', group: 'shipping' },
  // payments
  { key: 'cod_enabled', value: 'true', group: 'payments' },
  { key: 'card_enabled', value: 'true', group: 'payments' },
  // social + analytics + seo
  { key: 'social_instagram', value: '', group: 'social' },
  { key: 'social_x', value: '', group: 'social' },
  { key: 'social_facebook', value: '', group: 'social' },
  { key: 'social_youtube', value: '', group: 'social' },
  { key: 'analytics_id', value: '', group: 'seo' },
  { key: 'seo_title', value: 'TelloraShop — Bold Shopping. Raw Style.', group: 'seo' },
  { key: 'seo_description', value: 'Discover unique products with a bold, neo-brutalist shopping experience. Premium quality, raw aesthetics.', group: 'seo' },
];

/** Keys the public storefront may read. Anything not listed stays admin-only. */
export const PUBLIC_SETTING_KEYS = new Set(DEFAULT_SETTINGS.map(s => s.key));

const DEFAULT_PAGES = [
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: '<h2>Privacy Policy</h2><p>We collect the information you give us when you create an account, place an order, contact us or subscribe to our newsletter: your name, email address, shipping address and order history. We use it to process and deliver orders, provide support and, if you opt in, send marketing emails.</p><p>We never sell your personal data. Payment card details are handled by our payment provider and are never stored on our servers. You can request a copy or deletion of your data at any time by contacting us.</p><p><em>This is a template. Have it reviewed for your jurisdiction before launch.</em></p>',
  },
  {
    title: 'Terms of Service',
    slug: 'terms-of-service',
    content: '<h2>Terms of Service</h2><p>By using this store you agree to these terms. Prices and availability can change without notice. An order is confirmed once we send you an order confirmation. We may cancel orders affected by pricing or stock errors and will refund any payment taken.</p><p>Returns are governed by our Return Policy. Our liability is limited to the value of the goods ordered, to the extent permitted by law.</p><p><em>This is a template. Have it reviewed for your jurisdiction before launch.</em></p>',
  },
];

const DEFAULT_FAQS: Array<[string, string]> = [
  ['How long does shipping take?', 'Standard shipping takes 3–5 business days. Orders over the free-shipping threshold ship free; otherwise a flat rate applies at checkout. Express shipping is also available.'],
  ['Can I track my order?', 'Yes. Use the Track Order page with your order number and the email you used at checkout, or check your account if you ordered while signed in.'],
  ['What is your return policy?', 'We accept returns on items in their original condition within the return window shown on our Return Policy page.'],
  ['How do I use a discount code?', 'Enter your code in the coupon field in your cart or at checkout and press apply. The discount shows in your order summary before you pay.'],
  ['Do I need an account to order?', 'No, you can check out as a guest. An account lets you save a wishlist and addresses, view order history and leave reviews.'],
  ['What payment methods do you accept?', 'Credit and debit cards through our secure payment provider, and cash on delivery where available.'],
  ['An item is sold out. Will it come back?', 'Popular items are restocked regularly. Subscribe to our newsletter to hear about restocks and new drops.'],
  ['How can I contact support?', 'Use the Contact page and we will get back to you as soon as we can.'],
];

function addColumnIfMissing(db: Database.Database, table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some(c => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
}

/** Tables and columns added after the first release. Safe to run on every boot. */
export function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_password_resets_hash ON password_resets(token_hash);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
  `);

  addColumnIfMissing(db, 'orders', 'payment_ref', 'TEXT');
  addColumnIfMissing(db, 'orders', 'shipping_method', "TEXT DEFAULT 'standard'");
  addColumnIfMissing(db, 'orders', 'guest_email', 'TEXT');
  addColumnIfMissing(db, 'orders', 'stock_restored', 'INTEGER DEFAULT 0');
}

/** Insert anything the live site expects but is missing, without touching existing rows. */
export function ensureDefaults(db: Database.Database) {
  const addSetting = db.prepare('INSERT OR IGNORE INTO settings (id, key, value, group_name) VALUES (?, ?, ?, ?)');
  for (const s of DEFAULT_SETTINGS) addSetting.run(uuid(), s.key, s.value, s.group);

  const addPage = db.prepare('INSERT OR IGNORE INTO pages (id, title, slug, content, is_published) VALUES (?, ?, ?, ?, 1)');
  for (const p of DEFAULT_PAGES) addPage.run(uuid(), p.title, p.slug, p.content);

  const faqCount = (db.prepare('SELECT COUNT(*) AS n FROM faqs').get() as { n: number }).n;
  if (faqCount === 0) {
    const addFaq = db.prepare('INSERT INTO faqs (id, question, answer, sort_order) VALUES (?, ?, ?, ?)');
    DEFAULT_FAQS.forEach(([q, a], i) => addFaq.run(uuid(), q, a, i));
  }
}
