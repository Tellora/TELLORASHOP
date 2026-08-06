-- ==========================================
-- TELLORASHOP COMPLETE SUPABASE DATABASE SCHEMA
-- ==========================================

-- Enable pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
  phone TEXT,
  avatar TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  compare_at_price NUMERIC(10, 2),
  cost NUMERIC(10, 2),
  sku TEXT,
  barcode TEXT,
  quantity INTEGER DEFAULT 0,
  track_inventory INTEGER DEFAULT 1,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  weight NUMERIC(10, 2),
  images JSONB DEFAULT '[]'::jsonb,
  tags TEXT DEFAULT '',
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(10, 2),
  quantity INTEGER DEFAULT 0,
  options JSONB DEFAULT '{}'::jsonb,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal NUMERIC(10, 2) NOT NULL,
  tax NUMERIC(10, 2) DEFAULT 0,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  payment_method TEXT DEFAULT 'card',
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  tracking_number TEXT,
  notes TEXT,
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  image TEXT
);

-- 8. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'percentage' CHECK(type IN ('percentage', 'fixed')),
  value NUMERIC(10, 2) NOT NULL,
  min_purchase NUMERIC(10, 2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_approved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 11. PAGES TABLE
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  is_published INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  group_name TEXT DEFAULT 'general'
);

-- 13. NEWSLETTER TABLE
CREATE TABLE IF NOT EXISTS public.newsletter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT,
  link TEXT,
  button_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
-- ==========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Variants" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Pages" ON public.pages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Settings" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Banners" ON public.banners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (true);

-- Allow All Operations for App APIs
CREATE POLICY "Allow All Users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Addresses" ON public.addresses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Categories" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Products" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Variants" ON public.product_variants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Orders" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Order Items" ON public.order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Coupons" ON public.coupons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Reviews" ON public.reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Wishlists" ON public.wishlists FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Pages" ON public.pages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Settings" ON public.settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Newsletter" ON public.newsletter FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Banners" ON public.banners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- INITIAL SEED DATA
-- ==========================================

-- Admin User: admin@tellorashop.com / password: admin123
INSERT INTO public.users (id, email, password_hash, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@tellorashop.com',
  '$2a$10$2.dM6L.0l43vG293c/J29.S0u9J7dM6L0l43vG293c/J29.S0u9J7',
  'Admin User',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Demo Customer: customer@demo.com / password: customer123
INSERT INTO public.users (id, email, password_hash, name, role, phone)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'customer@demo.com',
  '$2a$10$2.dM6L.0l43vG293c/J29.S0u9J7dM6L0l43vG293c/J29.S0u9J7',
  'Jane Cooper',
  'customer',
  '+1 234 567 890'
) ON CONFLICT (email) DO NOTHING;

-- Categories
INSERT INTO public.categories (id, name, slug, description, image, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'Electronics', 'electronics', 'Latest gadgets and tech', '/images/categories/electronics.svg', 1),
('10000000-0000-0000-0000-000000000002', 'Clothing', 'clothing', 'Trendy fashion apparel', '/images/categories/clothing.svg', 1),
('10000000-0000-0000-0000-000000000003', 'Home & Living', 'home-living', 'Furniture and decor', '/images/categories/home.svg', 1),
('10000000-0000-0000-0000-000000000004', 'Sports', 'sports', 'Equipment and gear', '/images/categories/sports.svg', 1),
('10000000-0000-0000-0000-000000000005', 'Books', 'books', 'Fiction, non-fiction and more', '/images/categories/books.svg', 1),
('10000000-0000-0000-0000-000000000006', 'Accessories', 'accessories', 'Bags, watches, jewelry', '/images/categories/accessories.svg', 1)
ON CONFLICT (slug) DO NOTHING;

-- Products
INSERT INTO public.products (id, name, slug, description, short_description, price, compare_at_price, cost, sku, quantity, category_id, is_active, is_featured, weight, tags, images) VALUES
('20000000-0000-0000-0000-000000000001', 'Wireless Noise-Cancelling Headphones', 'wireless-nc-headphones', 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio.', 'Premium ANC headphones with 30hr battery', 299.99, 399.99, 150.00, 'ELEC-HP-001', 45, '10000000-0000-0000-0000-000000000001', 1, 1, 0.35, 'headphones,wireless,audio,noise-cancelling', '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"]'::jsonb),
('20000000-0000-0000-0000-000000000002', 'Minimalist Leather Backpack', 'minimalist-leather-backpack', 'Handcrafted from genuine full-grain leather with a water-resistant lining. Fits up to 15" laptop.', 'Genuine leather laptop backpack', 189.99, 249.99, 80.00, 'ACC-BP-001', 30, '10000000-0000-0000-0000-000000000006', 1, 1, 1.20, 'backpack,leather,laptop,travel', '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"]'::jsonb),
('20000000-0000-0000-0000-000000000003', 'Smart Fitness Watch Pro', 'smart-fitness-watch-pro', 'Advanced fitness tracking with GPS, heart rate monitor, SpO2 sensor, and sleep analysis.', 'Advanced fitness smartwatch with GPS', 249.99, 329.99, 120.00, 'ELEC-SW-001', 60, '10000000-0000-0000-0000-000000000001', 1, 1, 0.05, 'smartwatch,fitness,gps,health', '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"]'::jsonb),
('20000000-0000-0000-0000-000000000004', 'Organic Cotton Oversized Hoodie', 'organic-cotton-hoodie', 'Ultra-soft 100% organic cotton hoodie with an oversized relaxed fit.', 'Sustainable oversized cotton hoodie', 79.99, 99.99, 25.00, 'CLT-HD-001', 120, '10000000-0000-0000-0000-000000000002', 1, 1, 0.50, 'hoodie,organic,cotton,sustainable', '["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"]'::jsonb),
('20000000-0000-0000-0000-000000000005', 'Scandinavian Desk Lamp', 'scandinavian-desk-lamp', 'Modern minimalist desk lamp with adjustable arm and warm LED lighting.', 'Oak and steel adjustable desk lamp', 129.99, 169.99, 45.00, 'HOM-LP-001', 35, '10000000-0000-0000-0000-000000000003', 1, 1, 1.80, 'lamp,desk,scandinavian,led', '["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"]'::jsonb),
('20000000-0000-0000-0000-000000000006', 'Titanium Water Bottle 750ml', 'titanium-water-bottle', 'Ultra-lightweight double-wall titanium bottle keeps drinks cold for 24 hours.', 'Double-wall insulated titanium bottle', 59.99, 79.99, 20.00, 'SPT-WB-001', 200, '10000000-0000-0000-0000-000000000004', 1, 0, 0.20, 'water-bottle,titanium,insulated,sports', '["https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Coupons
INSERT INTO public.coupons (id, code, type, value, min_purchase, max_uses, is_active) VALUES
('30000000-0000-0000-0000-000000000001', 'WELCOME10', 'percentage', 10.00, 50.00, 1000, 1),
('30000000-0000-0000-0000-000000000002', 'SAVE20', 'fixed', 20.00, 100.00, 500, 1),
('30000000-0000-0000-0000-000000000003', 'SUMMER25', 'percentage', 25.00, 75.00, 200, 1)
ON CONFLICT (code) DO NOTHING;

-- Settings
INSERT INTO public.settings (id, key, value, group_name) VALUES
('40000000-0000-0000-0000-000000000001', 'store_name', 'TelloraShop', 'general'),
('40000000-0000-0000-0000-000000000002', 'store_tagline', 'Bold Shopping. Raw Style.', 'general'),
('40000000-0000-0000-0000-000000000003', 'store_email', 'hello@tellorashop.com', 'general'),
('40000000-0000-0000-0000-000000000004', 'store_phone', '+1 (555) 123-4567', 'general'),
('40000000-0000-0000-0000-000000000005', 'currency', 'USD', 'general'),
('40000000-0000-0000-0000-000000000006', 'currency_symbol', '$', 'general'),
('40000000-0000-0000-0000-000000000007', 'tax_rate', '8.5', 'tax'),
('40000000-0000-0000-0000-000000000008', 'shipping_flat_rate', '9.99', 'shipping'),
('40000000-0000-0000-0000-000000000009', 'free_shipping_threshold', '75', 'shipping'),
('40000000-0000-0000-0000-000000000010', 'seo_title', 'TelloraShop — Bold Shopping. Raw Style.', 'seo'),
('40000000-0000-0000-0000-000000000011', 'seo_description', 'Discover unique products with a bold, neo-brutalist shopping experience. Premium quality, raw aesthetics.', 'seo')
ON CONFLICT (key) DO NOTHING;

-- Pages
INSERT INTO public.pages (id, title, slug, content, is_published) VALUES
('50000000-0000-0000-0000-000000000001', 'About Us', 'about', '<h2>About TelloraShop</h2><p>We believe shopping should be bold, direct, and unapologetic. TelloraShop brings you carefully curated products with a raw, neo-brutalist aesthetic that cuts through the noise.</p>', 1),
('50000000-0000-0000-0000-000000000002', 'Contact', 'contact', '<h2>Get in Touch</h2><p>Email: hello@tellorashop.com</p><p>Phone: +1 (555) 123-4567</p>', 1),
('50000000-0000-0000-0000-000000000003', 'Shipping Policy', 'shipping-policy', '<h2>Shipping Policy</h2><p>Free shipping on orders over $75. Standard shipping: $9.99.</p>', 1),
('50000000-0000-0000-0000-000000000004', 'Return Policy', 'return-policy', '<h2>Return Policy</h2><p>30-day hassle-free returns on all items.</p>', 1)
ON CONFLICT (slug) DO NOTHING;

-- Banners
INSERT INTO public.banners (id, title, subtitle, button_text, link, sort_order, is_active) VALUES
('60000000-0000-0000-0000-000000000001', 'SUMMER COLLECTION', 'Bold designs for bold people. Up to 40% off.', 'SHOP NOW', '/shop', 1, 1),
('60000000-0000-0000-0000-000000000002', 'NEW ARRIVALS', 'Fresh drops every week. Stay raw, stay real.', 'EXPLORE', '/shop?sort=newest', 2, 1),
('60000000-0000-0000-0000-000000000003', 'FREE SHIPPING', 'On all orders over $75. No excuses needed.', 'START SHOPPING', '/shop', 3, 1)
ON CONFLICT (id) DO NOTHING;
