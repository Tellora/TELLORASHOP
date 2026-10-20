import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjlghsrbdskzowbdybyv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_TGQMtyynKC_L7CFxT7hCVg_a1aM8EPK';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/** A row sent to Supabase. */
type Row = Record<string, unknown>;

export const supabaseDb = {
  // Users
  users: {
    async findByEmail(email: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async findById(id: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(user: Row) {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async listAll() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async update(id: string, updates: Row) {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Categories
  categories: {
    async listAll() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async findBySlug(slug: string) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(category: Row) {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: Row) {
      const { data, error } = await supabase
        .from('categories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Products
  products: {
    async listAll(options: { categoryId?: string; featuredOnly?: boolean; limit?: number } = {}) {
      let query = supabase.from('products').select('*, categories(name, slug)');
      
      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }
      if (options.featuredOnly) {
        query = query.eq('is_featured', 1);
      }
      query = query.order('created_at', { ascending: false });
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    async findBySlug(slug: string) {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async findById(id: string) {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(product: Row) {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: Row) {
      const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Orders
  orders: {
    async listAll() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, users(name, email), order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async findByUserId(userId: string) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async findById(id: string) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, users(name, email), order_items(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(order: Row, items: Row[]) {
      const { data: createdOrder, error: orderErr } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single();
      if (orderErr) throw orderErr;

      const formattedItems = items.map((item) => ({
        ...item,
        order_id: createdOrder.id,
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(formattedItems);
      if (itemsErr) throw itemsErr;

      return createdOrder;
    },
    async updateStatus(id: string, status: string, trackingNumber?: string) {
      const updates: Row = { status, updated_at: new Date().toISOString() };
      if (trackingNumber !== undefined) updates.tracking_number = trackingNumber;
      
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Settings
  settings: {
    async listAll() {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      if (error) throw error;
      return data || [];
    },
    async updateKey(key: string, value: string, group_name = 'general') {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ key, value, group_name }, { onConflict: 'key' })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Coupons
  coupons: {
    async findByCode(code: string) {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async listAll() {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  },

  // Banners
  banners: {
    async listActive() {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', 1)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  },

  // Pages
  pages: {
    async findBySlug(slug: string) {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async listAll() {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  }
};

export default supabaseDb;
