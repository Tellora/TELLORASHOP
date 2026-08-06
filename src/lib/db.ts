import Database from 'better-sqlite3';
import path from 'path';
import { hashSync } from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'tellorashop.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      phone TEXT,
      avatar TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      label TEXT DEFAULT 'Home',
      first_name TEXT,
      last_name TEXT,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT NOT NULL,
      country TEXT DEFAULT 'US',
      phone TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      short_description TEXT,
      price REAL NOT NULL,
      compare_at_price REAL,
      cost REAL,
      sku TEXT,
      barcode TEXT,
      quantity INTEGER DEFAULT 0,
      track_inventory INTEGER DEFAULT 1,
      category_id TEXT,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      weight REAL,
      images TEXT DEFAULT '[]',
      tags TEXT DEFAULT '',
      seo_title TEXT,
      seo_description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sku TEXT,
      price REAL,
      quantity INTEGER DEFAULT 0,
      options TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
      subtotal REAL NOT NULL,
      tax REAL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      shipping_address TEXT,
      billing_address TEXT,
      payment_method TEXT DEFAULT 'card',
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
      tracking_number TEXT,
      notes TEXT,
      coupon_code TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT,
      variant_id TEXT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total REAL NOT NULL,
      image TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'percentage' CHECK(type IN ('percentage', 'fixed')),
      value REAL NOT NULL,
      min_purchase REAL DEFAULT 0,
      max_uses INTEGER,
      used_count INTEGER DEFAULT 0,
      starts_at TEXT,
      expires_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT,
      comment TEXT,
      is_approved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      is_published INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      group_name TEXT DEFAULT 'general'
    );

    CREATE TABLE IF NOT EXISTS newsletter (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      image TEXT,
      link TEXT,
      button_text TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default admin if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    seedDatabase(db);
  }
}

function seedDatabase(db: Database.Database) {
  const { v4: uuid } = require('uuid');

  // Create admin user
  const adminId = uuid();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)
  `).run(adminId, 'admin@tellorashop.com', hashSync('admin123', 10), 'Admin User', 'admin');

  // Create demo customer
  const customerId = uuid();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?, ?)
  `).run(customerId, 'customer@demo.com', hashSync('customer123', 10), 'Jane Cooper', 'customer', '+1 234 567 890');

  // Create categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', desc: 'Latest gadgets and tech', image: '/images/categories/electronics.svg' },
    { name: 'Clothing', slug: 'clothing', desc: 'Trendy fashion apparel', image: '/images/categories/clothing.svg' },
    { name: 'Home & Living', slug: 'home-living', desc: 'Furniture and decor', image: '/images/categories/home.svg' },
    { name: 'Sports', slug: 'sports', desc: 'Equipment and gear', image: '/images/categories/sports.svg' },
    { name: 'Books', slug: 'books', desc: 'Fiction, non-fiction and more', image: '/images/categories/books.svg' },
    { name: 'Accessories', slug: 'accessories', desc: 'Bags, watches, jewelry', image: '/images/categories/accessories.svg' },
  ];

  const catIds: Record<string, string> = {};
  for (const cat of categories) {
    const id = uuid();
    catIds[cat.slug] = id;
    db.prepare(`
      INSERT INTO categories (id, name, slug, description, image, is_active) VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, cat.name, cat.slug, cat.desc, cat.image);
  }

  // Create products
  const productImages: Record<string, string[]> = {
    'wireless-nc-headphones': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
    'minimalist-leather-backpack': ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'],
    'smart-fitness-watch-pro': ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
    'organic-cotton-hoodie': ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'],
    'scandinavian-desk-lamp': ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'],
    'titanium-water-bottle': ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80'],
    'art-minimal-living': ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
    'ceramic-pour-over-set': ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'],
    'vintage-denim-jacket': ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80'],
    'mechanical-keyboard-cherry': ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'],
    'yoga-mat-premium': ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80'],
    'wireless-charging-pad': ['https://images.unsplash.com/photo-1622445268465-840246e904b6?auto=format&fit=crop&w=800&q=80'],
  };

  const products = [
    { name: 'Wireless Noise-Cancelling Headphones', slug: 'wireless-nc-headphones', desc: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio. Features Bluetooth 5.2, built-in microphone, and comfortable memory foam ear cushions.', shortDesc: 'Premium ANC headphones with 30hr battery', price: 299.99, comparePrice: 399.99, cost: 150, sku: 'ELEC-HP-001', quantity: 45, category: 'electronics', featured: 1, weight: 0.35, tags: 'headphones,wireless,audio,noise-cancelling' },
    { name: 'Minimalist Leather Backpack', slug: 'minimalist-leather-backpack', desc: 'Handcrafted from genuine full-grain leather with a water-resistant lining. Features padded laptop compartment (fits up to 15"), multiple organizer pockets, and adjustable straps for all-day comfort.', shortDesc: 'Genuine leather laptop backpack', price: 189.99, comparePrice: 249.99, cost: 80, sku: 'ACC-BP-001', quantity: 30, category: 'accessories', featured: 1, weight: 1.2, tags: 'backpack,leather,laptop,travel' },
    { name: 'Smart Fitness Watch Pro', slug: 'smart-fitness-watch-pro', desc: 'Advanced fitness tracking with GPS, heart rate monitor, SpO2 sensor, and sleep analysis. Water-resistant to 50m, 7-day battery life, and AMOLED display.', shortDesc: 'Advanced fitness smartwatch with GPS', price: 249.99, comparePrice: 329.99, cost: 120, sku: 'ELEC-SW-001', quantity: 60, category: 'electronics', featured: 1, weight: 0.05, tags: 'smartwatch,fitness,gps,health' },
    { name: 'Organic Cotton Oversized Hoodie', slug: 'organic-cotton-hoodie', desc: 'Ultra-soft 100% organic cotton hoodie with an oversized relaxed fit. Features double-lined hood, kangaroo pocket, and ribbed cuffs. Pre-shrunk and sustainably made.', shortDesc: 'Sustainable oversized cotton hoodie', price: 79.99, comparePrice: 99.99, cost: 25, sku: 'CLT-HD-001', quantity: 120, category: 'clothing', featured: 1, weight: 0.5, tags: 'hoodie,organic,cotton,sustainable' },
    { name: 'Scandinavian Desk Lamp', slug: 'scandinavian-desk-lamp', desc: 'Modern minimalist desk lamp with adjustable arm and warm LED lighting. Made from solid oak wood base and powder-coated steel. Three brightness levels with touch control.', shortDesc: 'Oak and steel adjustable desk lamp', price: 129.99, comparePrice: 169.99, cost: 45, sku: 'HOM-LP-001', quantity: 35, category: 'home-living', featured: 1, weight: 1.8, tags: 'lamp,desk,scandinavian,led' },
    { name: 'Titanium Water Bottle 750ml', slug: 'titanium-water-bottle', desc: 'Ultra-lightweight double-wall titanium bottle keeps drinks cold for 24 hours or hot for 12 hours. BPA-free, leak-proof cap, and includes a carrying loop.', shortDesc: 'Double-wall insulated titanium bottle', price: 59.99, comparePrice: 79.99, cost: 20, sku: 'SPT-WB-001', quantity: 200, category: 'sports', featured: 0, weight: 0.2, tags: 'water-bottle,titanium,insulated,sports' },
    { name: 'The Art of Minimal Living', slug: 'art-minimal-living', desc: 'A beautifully illustrated guide to embracing minimalism in your everyday life. Covers decluttering, mindful consumption, and creating spaces that spark joy. Hardcover, 280 pages.', shortDesc: 'Illustrated minimalism guide - hardcover', price: 34.99, comparePrice: 44.99, cost: 12, sku: 'BK-ML-001', quantity: 80, category: 'books', featured: 0, weight: 0.6, tags: 'book,minimalism,lifestyle,hardcover' },
    { name: 'Ceramic Pour-Over Coffee Set', slug: 'ceramic-pour-over-set', desc: 'Artisan-crafted ceramic dripper and carafe set for the perfect pour-over coffee. Includes reusable stainless steel filter, measuring scoop, and brewing guide.', shortDesc: 'Handcrafted ceramic coffee brewing set', price: 89.99, comparePrice: 119.99, cost: 30, sku: 'HOM-CF-001', quantity: 50, category: 'home-living', featured: 1, weight: 1.5, tags: 'coffee,ceramic,pour-over,kitchen' },
    { name: 'Vintage Denim Jacket', slug: 'vintage-denim-jacket', desc: 'Classic American vintage-style denim jacket with a modern fit. Made from heavyweight selvedge denim, copper buttons, and two chest pockets. Pre-washed for a broken-in feel.', shortDesc: 'Selvedge denim vintage-style jacket', price: 149.99, comparePrice: 199.99, cost: 55, sku: 'CLT-DJ-001', quantity: 40, category: 'clothing', featured: 0, weight: 0.9, tags: 'denim,jacket,vintage,selvedge' },
    { name: 'Mechanical Keyboard — Cherry MX', slug: 'mechanical-keyboard-cherry', desc: 'Professional-grade mechanical keyboard with Cherry MX Brown switches, PBT keycaps, and per-key RGB lighting. Aluminum frame, USB-C connection, and programmable macros.', shortDesc: 'Cherry MX Brown mechanical keyboard', price: 179.99, comparePrice: 229.99, cost: 85, sku: 'ELEC-KB-001', quantity: 25, category: 'electronics', featured: 1, weight: 0.95, tags: 'keyboard,mechanical,cherry-mx,rgb' },
    { name: 'Yoga Mat Premium — 6mm', slug: 'yoga-mat-premium', desc: 'Eco-friendly natural rubber yoga mat with alignment lines. Non-slip surface on both sides, 6mm thickness for joint protection. Comes with carrying strap.', shortDesc: 'Eco-friendly natural rubber yoga mat', price: 69.99, comparePrice: 89.99, cost: 22, sku: 'SPT-YM-001', quantity: 90, category: 'sports', featured: 0, weight: 2.5, tags: 'yoga,mat,eco-friendly,fitness' },
    { name: 'Wireless Charging Pad — 15W', slug: 'wireless-charging-pad', desc: 'Slim Qi wireless charging pad with 15W fast charging support. Compatible with all Qi-enabled devices. LED indicator, anti-slip surface, and overcharge protection.', shortDesc: '15W fast wireless Qi charger', price: 39.99, comparePrice: 54.99, cost: 12, sku: 'ELEC-CH-001', quantity: 150, category: 'electronics', featured: 0, weight: 0.1, tags: 'charger,wireless,qi,fast-charging' },
  ];

  for (const p of products) {
    const id = uuid();
    const imgs = JSON.stringify(productImages[p.slug] || []);
    db.prepare(`
      INSERT INTO products (id, name, slug, description, short_description, price, compare_at_price, cost, sku, quantity, category_id, is_active, is_featured, weight, tags, images) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(id, p.name, p.slug, p.desc, p.shortDesc, p.price, p.comparePrice, p.cost, p.sku, p.quantity, catIds[p.category], p.featured, p.weight, p.tags, imgs);
  }

  // Create some coupons
  const coupons = [
    { code: 'WELCOME10', type: 'percentage', value: 10, minPurchase: 50, maxUses: 1000 },
    { code: 'SAVE20', type: 'fixed', value: 20, minPurchase: 100, maxUses: 500 },
    { code: 'SUMMER25', type: 'percentage', value: 25, minPurchase: 75, maxUses: 200 },
  ];

  for (const c of coupons) {
    db.prepare(`
      INSERT INTO coupons (id, code, type, value, min_purchase, max_uses, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(uuid(), c.code, c.type, c.value, c.minPurchase, c.maxUses);
  }

  // Create default settings
  const settings = [
    { key: 'store_name', value: 'TelloraShop', group: 'general' },
    { key: 'store_tagline', value: 'Bold Shopping. Raw Style.', group: 'general' },
    { key: 'store_email', value: 'hello@tellorashop.com', group: 'general' },
    { key: 'store_phone', value: '+1 (555) 123-4567', group: 'general' },
    { key: 'currency', value: 'USD', group: 'general' },
    { key: 'currency_symbol', value: '$', group: 'general' },
    { key: 'tax_rate', value: '8.5', group: 'tax' },
    { key: 'shipping_flat_rate', value: '9.99', group: 'shipping' },
    { key: 'free_shipping_threshold', value: '75', group: 'shipping' },
    { key: 'seo_title', value: 'TelloraShop — Bold Shopping. Raw Style.', group: 'seo' },
    { key: 'seo_description', value: 'Discover unique products with a bold, neo-brutalist shopping experience. Premium quality, raw aesthetics.', group: 'seo' },
  ];

  for (const s of settings) {
    db.prepare(`
      INSERT INTO settings (id, key, value, group_name) VALUES (?, ?, ?, ?)
    `).run(uuid(), s.key, s.value, s.group);
  }

  // Create default pages
  const pages = [
    { title: 'About Us', slug: 'about', content: '<h2>About TelloraShop</h2><p>We believe shopping should be bold, direct, and unapologetic. TelloraShop brings you carefully curated products with a raw, neo-brutalist aesthetic that cuts through the noise.</p><p>Founded in 2024, we\'re on a mission to redefine online shopping with honest products, transparent pricing, and a design philosophy that refuses to be boring.</p>' },
    { title: 'Contact', slug: 'contact', content: '<h2>Get in Touch</h2><p>Have questions? We\'d love to hear from you.</p><p><strong>Email:</strong> hello@tellorashop.com</p><p><strong>Phone:</strong> +1 (555) 123-4567</p><p><strong>Hours:</strong> Mon-Fri, 9AM-6PM EST</p>' },
    { title: 'Shipping Policy', slug: 'shipping-policy', content: '<h2>Shipping Policy</h2><p>Free shipping on orders over $75. Standard shipping: $9.99 (3-5 business days). Express shipping: $19.99 (1-2 business days).</p>' },
    { title: 'Return Policy', slug: 'return-policy', content: '<h2>Return Policy</h2><p>30-day hassle-free returns on all items. Items must be in original condition with tags attached.</p>' },
  ];

  for (const p of pages) {
    db.prepare(`
      INSERT INTO pages (id, title, slug, content, is_published) VALUES (?, ?, ?, ?, 1)
    `).run(uuid(), p.title, p.slug, p.content);
  }

  // Create banners
  const banners = [
    { title: 'SUMMER COLLECTION', subtitle: 'Bold designs for bold people. Up to 40% off.', buttonText: 'SHOP NOW', link: '/shop', sortOrder: 1 },
    { title: 'NEW ARRIVALS', subtitle: 'Fresh drops every week. Stay raw, stay real.', buttonText: 'EXPLORE', link: '/shop?sort=newest', sortOrder: 2 },
    { title: 'FREE SHIPPING', subtitle: 'On all orders over $75. No excuses needed.', buttonText: 'START SHOPPING', link: '/shop', sortOrder: 3 },
  ];

  for (const b of banners) {
    db.prepare(`
      INSERT INTO banners (id, title, subtitle, button_text, link, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(uuid(), b.title, b.subtitle, b.buttonText, b.link, b.sortOrder);
  }

  // Add some reviews
  const productRows = db.prepare('SELECT id, name FROM products LIMIT 6').all() as Array<{id: string, name: string}>;
  const reviewData = [
    { rating: 5, title: 'Absolutely love it!', comment: 'Best purchase I\'ve made this year. Quality is incredible.' },
    { rating: 4, title: 'Great value', comment: 'Really good product for the price. Would recommend to anyone.' },
    { rating: 5, title: 'Exceeded expectations', comment: 'Arrived quickly and looks even better in person. Five stars!' },
    { rating: 3, title: 'Decent but could improve', comment: 'Good overall but the material could be a bit better for the price point.' },
  ];

  for (let i = 0; i < Math.min(productRows.length, 4); i++) {
    db.prepare(`
      INSERT INTO reviews (id, product_id, user_id, rating, title, comment, is_approved) VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(uuid(), productRows[i].id, customerId, reviewData[i].rating, reviewData[i].title, reviewData[i].comment);
  }

  // Create sample orders
  const orderStatuses = ['delivered', 'shipped', 'processing', 'pending'];
  for (let i = 0; i < 4; i++) {
    const orderId = uuid();
    const orderNum = `TS-${String(1000 + i).padStart(5, '0')}`;
    const product = productRows[i] as {id: string, name: string};
    const price = (products[i]?.price || 99.99);
    const qty = Math.floor(Math.random() * 3) + 1;
    const subtotal = price * qty;
    const tax = subtotal * 0.085;
    const shipping = subtotal > 75 ? 0 : 9.99;
    const total = subtotal + tax + shipping;

    db.prepare(`
      INSERT INTO orders (id, order_number, user_id, status, subtotal, tax, shipping_cost, discount, total, payment_status, shipping_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'paid', ?, datetime('now', '-' || ? || ' days'))
    `).run(orderId, orderNum, customerId, orderStatuses[i], subtotal, tax, shipping, total,
      JSON.stringify({ firstName: 'Jane', lastName: 'Cooper', street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'US' }),
      String(i * 3)
    );

    db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, name, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuid(), orderId, product?.id, product?.name || 'Product', price, qty, price * qty);
  }
}

export default getDb;
