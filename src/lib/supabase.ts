import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Product,
  StoreSettings,
  AdminUser,
  Category,
  CustomerOrder,
  OrderStatus,
  PaymentStatus,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_DETAILED_CATEGORIES,
  DEFAULT_STORE_SETTINGS,
  INITIAL_ORDERS,
} from '../data/products';

// -----------------------------------------------------------------------------
// SUPABASE CONFIGURATION
// -----------------------------------------------------------------------------
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  typeof rawUrl === 'string' &&
  rawUrl.startsWith('https://') &&
  !rawUrl.includes('your-project-ref') &&
  typeof rawKey === 'string' &&
  rawKey.length > 20 &&
  !rawKey.includes('your-anon-public-key');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl, rawKey)
  : null;

const STORAGE_KEYS = {
  PRODUCTS: 'muaz_db_products_v2',
  CATEGORIES: 'muaz_db_categories_v2',
  SETTINGS: 'muaz_db_settings_v2',
  ORDERS: 'muaz_db_orders_v2',
  AUTH_SESSION: 'muaz_admin_session_v2',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// -----------------------------------------------------------------------------
// LOCAL STORAGE HELPERS
// -----------------------------------------------------------------------------
function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);

    if (!raw) {
      localStorage.setItem(
        STORAGE_KEYS.PRODUCTS,
        JSON.stringify(INITIAL_PRODUCTS),
      );
      return INITIAL_PRODUCTS;
    }

    return JSON.parse(raw) as Product[];
  } catch (error) {
    console.error('Error reading local products:', error);
    return INITIAL_PRODUCTS;
  }
}

function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.PRODUCTS,
      JSON.stringify(products),
    );
  } catch (error) {
    console.error('Error saving local products:', error);
  }
}

function getLocalCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);

    if (!raw) {
      localStorage.setItem(
        STORAGE_KEYS.CATEGORIES,
        JSON.stringify(INITIAL_CATEGORIES),
      );
      return INITIAL_CATEGORIES;
    }

    return JSON.parse(raw) as string[];
  } catch {
    return INITIAL_CATEGORIES;
  }
}

function saveLocalCategories(categories: string[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify(categories),
    );
  } catch (error) {
    console.error('Error saving local categories:', error);
  }
}

function getLocalSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (!raw) {
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(DEFAULT_STORE_SETTINGS),
      );
      return DEFAULT_STORE_SETTINGS;
    }

    return JSON.parse(raw) as StoreSettings;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

function saveLocalSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify(settings),
    );
  } catch (error) {
    console.error('Error saving local settings:', error);
  }
}

function getLocalOrders(): CustomerOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw) as CustomerOrder[];
  } catch (error) {
    console.error('Error reading local orders:', error);
    return INITIAL_ORDERS;
  }
}

function saveLocalOrders(orders: CustomerOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (error) {
    console.error('Error saving local orders:', error);
  }
}

// -----------------------------------------------------------------------------
// AUTHENTICATION SERVICE
// -----------------------------------------------------------------------------
export const authService = {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: AdminUser | null; error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      if (!email.trim() || !password) {
        return {
          user: null,
          error: 'ইমেইল এবং পাসওয়ার্ড উভয়ই প্রদান করুন।',
        };
      }
      const localUser: AdminUser = {
        id: 'local-admin',
        email: email.trim(),
        role: 'admin',
        name: email.trim().split('@')[0] || 'Admin',
      };
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(localUser));
      } catch (err) {
        console.error('Error saving local session:', err);
      }
      return { user: localUser, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        return {
          user: null,
          error: error?.message || 'Login ব্যর্থ হয়েছে।',
        };
      }

      // Verify the authenticated user against the admin allowlist.
      let { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id, is_active, email')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .maybeSingle();

      // If not yet mapped by user_id, check by verified email and link user_id
      if (!admin && data.user.email) {
        const { data: adminByEmail } = await supabase
          .from('admin_users')
          .select('id, user_id, is_active, email')
          .ilike('email', data.user.email.trim())
          .eq('is_active', true)
          .maybeSingle();

        if (adminByEmail) {
          await supabase
            .from('admin_users')
            .update({ user_id: data.user.id, updated_at: new Date().toISOString() })
            .eq('id', adminByEmail.id);
          admin = { user_id: data.user.id, is_active: true, email: data.user.email };
          adminError = null;
        }
      }

      if (adminError || !admin) {
        await supabase.auth.signOut();

        return {
          user: null,
          error: adminError
            ? `Admin access যাচাই করা যায়নি: ${adminError.message}`
            : 'এই account-কে Admin হিসেবে অনুমোদন দেওয়া হয়নি।',
        };
      }

      const user: AdminUser = {
        id: data.user.id,
        email: data.user.email || email.trim(),
        role: 'admin',
        name: data.user.user_metadata?.full_name || 'Admin',
      };

      try {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
      } catch (err) {
        console.error('Error saving session:', err);
      }

      return { user, error: null };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'অজানা সমস্যা';

      return { user: null, error: message };
    }
  },

  async logout(): Promise<void> {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error('Supabase logout error:', error.message);
        }
      }
    } finally {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  },

  async getCurrentUser(): Promise<AdminUser | null> {
    if (!isSupabaseConfigured || !supabase) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
        if (raw) {
          return JSON.parse(raw) as AdminUser;
        }
      } catch (error) {
        console.error('Unable to verify local session:', error);
      }
      return null;
    }

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.user) {
        return null;
      }

      const authUser = data.session.user;

      let { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id, is_active, email')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!admin && authUser.email) {
        const { data: adminByEmail } = await supabase
          .from('admin_users')
          .select('id, user_id, is_active, email')
          .ilike('email', authUser.email.trim())
          .eq('is_active', true)
          .maybeSingle();

        if (adminByEmail) {
          await supabase
            .from('admin_users')
            .update({ user_id: authUser.id, updated_at: new Date().toISOString() })
            .eq('id', adminByEmail.id);
          admin = { user_id: authUser.id, is_active: true, email: authUser.email };
          adminError = null;
        }
      }

      if (adminError || !admin) {
        await supabase.auth.signOut();
        return null;
      }

      return {
        id: authUser.id,
        email: authUser.email || '',
        role: 'admin',
        name: authUser.user_metadata?.full_name || 'Admin',
      };
    } catch (error) {
      console.error('Unable to verify current admin:', error);
      return null;
    }
  },
};

// -----------------------------------------------------------------------------
// PRODUCT SERVICE
// -----------------------------------------------------------------------------
export const productService = {
  async getPublicProducts(): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(mapDbProductToProduct);
      }

      console.error('Unable to load public products:', error?.message);
    }

    return getLocalProducts().filter(
      (product) => product.status === 'published',
    );
  },

  async getAllProductsAdmin(): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(mapDbProductToProduct);
      }

      console.error('Unable to load admin products:', error?.message);
    }

    return getLocalProducts();
  },

  async getProductById(id: string): Promise<Product | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapDbProductToProduct(data);
      }
    }

    return getLocalProducts().find((product) => product.id === id) || null;
  },

  async createProduct(
    productData: Omit<Product, 'id'>,
    imageFile?: File,
  ): Promise<{ product: Product | null; error: string | null; success: boolean }> {
    try {
      let imageUrl = productData.image;

      if (imageFile) {
        const upload = await this.uploadProductImage(imageFile);

        if (upload.error || !upload.url) {
          return {
            product: null,
            error: upload.error || 'ছবির URL পাওয়া যায়নি।',
            success: false,
          };
        }

        imageUrl = upload.url;
      } else if (isBase64Image(imageUrl)) {
        return {
          product: null,
          error: 'Base64 ছবি সরাসরি সংরক্ষণ করা যাবে না। ছবিটি আবার upload করুন।',
          success: false,
        };
      }

      const now = new Date().toISOString();

      const newProduct: Product = {
        ...productData,
        id: `product-${Date.now()}`,
        image: imageUrl,
        createdAt: now,
        updatedAt: now,
      };

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('products')
          .insert([mapProductToDbPayload(newProduct)])
          .select()
          .single();

        if (error) {
          return {
            product: null,
            error: error.message,
            success: false,
          };
        }

        return {
          product: mapDbProductToProduct(data),
          error: null,
          success: true,
        };
      }

      // Local fallback is retained for non-authenticated demo/storefront data.
      const products = getLocalProducts();
      saveLocalProducts([newProduct, ...products]);

      return { product: newProduct, error: null, success: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'প্রোডাক্ট তৈরিতে সমস্যা হয়েছে';

      return { product: null, error: message, success: false };
    }
  },

  async updateProduct(
    id: string,
    productData: Partial<Product>,
    imageFile?: File,
  ): Promise<{ product: Product | null; error: string | null; success: boolean }> {
    try {
      let imageUrl = productData.image;

      if (imageFile) {
        const upload = await this.uploadProductImage(imageFile);

        if (upload.error || !upload.url) {
          return {
            product: null,
            error: upload.error || 'ছবির URL পাওয়া যায়নি।',
            success: false,
          };
        }

        imageUrl = upload.url;
      }

      const now = new Date().toISOString();

      if (isSupabaseConfigured && supabase) {
        const payload: Record<string, unknown> = {
          ...mapPartialProductToDbPayload(productData),
          updated_at: now,
        };

        // Do not re-submit an old Base64 image while editing other fields.
        if (imageFile && imageUrl) {
          payload.image = imageUrl;
        } else if (imageUrl && !isBase64Image(imageUrl)) {
          payload.image = imageUrl;
        } else {
          delete payload.image;
        }

        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return { product: null, error: error.message, success: false };
        }

        return {
          product: mapDbProductToProduct(data),
          error: null,
          success: true,
        };
      }

      const products = getLocalProducts();
      const index = products.findIndex((product) => product.id === id);

      if (index === -1) {
        return {
          product: null,
          error: 'প্রোডাক্টটি খুঁজে পাওয়া যায়নি',
          success: false,
        };
      }

      const updatedProduct: Product = {
        ...products[index],
        ...productData,
        ...(imageUrl && !isBase64Image(imageUrl) ? { image: imageUrl } : {}),
        updatedAt: now,
      };

      products[index] = updatedProduct;
      saveLocalProducts(products);

      return { product: updatedProduct, error: null, success: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'প্রোডাক্ট আপডেটে সমস্যা হয়েছে';

      return { product: null, error: message, success: false };
    }
  },

  async deleteProduct(
    id: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, error: null };
      }

      const products = getLocalProducts().filter(
        (product) => product.id !== id,
      );

      saveLocalProducts(products);

      return { success: true, error: null };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'প্রোডাক্ট ডিলিট করা যায়নি';

      return { success: false, error: message };
    }
  },

  async uploadProductImage(
    file: File,
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return {
          url: null,
          error: 'Supabase সংযোগ নেই। ছবি upload করতে Supabase configure করুন।',
        };
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
          url: null,
          error: 'শুধু JPG, PNG, WebP অথবা GIF ছবি আপলোড করুন।',
        };
      }

      if (file.size > MAX_IMAGE_SIZE) {
        return {
          url: null,
          error: 'ছবির সাইজ সর্বোচ্চ 5 MB হতে পারবে।',
        };
      }

      const extension = IMAGE_EXTENSIONS[file.type];

      const fileName =
        `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Product image upload failed:', uploadError.message);

        return {
          url: null,
          error: `ছবি Storage-এ আপলোড হয়নি: ${uploadError.message}`,
        };
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        return {
          url: null,
          error: 'ছবি আপলোড হয়েছে, কিন্তু public URL পাওয়া যায়নি।',
        };
      }

      return { url: data.publicUrl, error: null };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'অজানা সমস্যা';

      return {
        url: null,
        error: `ছবি আপলোডে সমস্যা: ${message}`,
      };
    }
  },
};

function isBase64Image(value: string | undefined): boolean {
  return typeof value === 'string' && value.startsWith('data:image/');
}

// -----------------------------------------------------------------------------
// DYNAMIC CATEGORY SERVICE (Permanent Database & Supabase Integration)
// -----------------------------------------------------------------------------
export const categoryService = {
  // Public active categories (ordered by displayOrder)
  async getActiveCategories(): Promise<Category[]> {
    // 1. Try Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map(mapDbCategoryToCategory);
        }
      } catch (err) {
        console.error('Supabase getActiveCategories error:', err);
      }
    }

    // 2. Try server permanent database
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Fall through to initial
    }

    return INITIAL_DETAILED_CATEGORIES.filter((c) => c.isActive !== false);
  },

  // Backward compatible string list: ['All Products', ...active category names]
  async getCategories(): Promise<string[]> {
    const active = await this.getActiveCategories();
    return ['All Products', ...active.map((c) => c.name)];
  },

  // Admin: Get all categories (including inactive, with product counts)
  async getAllCategoriesAdmin(): Promise<Category[]> {
    // 1. Try Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          supabase.from('categories').select('*').order('display_order', { ascending: true }),
          supabase.from('products').select('category'),
        ]);

        if (!catsRes.error && catsRes.data && catsRes.data.length > 0) {
          const prods = prodsRes.data || [];
          return catsRes.data.map((row) => {
            const cat = mapDbCategoryToCategory(row);
            cat.productCount = prods.filter((p) => p.category === cat.name).length;
            return cat;
          });
        }
      } catch (err) {
        console.error('Supabase getAllCategoriesAdmin error:', err);
      }
    }

    // 2. Try server permanent database
    try {
      const res = await fetch('/api/categories/admin');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Fall through
    }

    return INITIAL_DETAILED_CATEGORIES;
  },

  // Create new category (simple by name or full payload)
  async addCategory(
    categoryInput: string | Partial<Category>
  ): Promise<{ success: boolean; category?: Category; error: string | null }> {
    const payload = typeof categoryInput === 'string'
      ? { name: categoryInput.trim() }
      : categoryInput;

    const trimmedName = (payload.name || '').trim();
    if (!trimmedName) {
      return { success: false, error: 'ক্যাটাগরির নাম দিন' };
    }

    const slug = (
      payload.slug?.trim() ||
      trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    ) || `cat-${Date.now()}`;

    // 1. When Supabase is configured, execute on Supabase first
    if (isSupabaseConfigured && supabase) {
      try {
        const insertPayload = {
          name: trimmedName,
          bengali_name: payload.bengaliName?.trim() || null,
          slug,
          icon: payload.icon || 'Layers',
          image: payload.image || null,
          description: payload.description || null,
          is_active: payload.isActive !== undefined ? payload.isActive : true,
          display_order: payload.displayOrder || 99,
        };

        const { data, error } = await supabase
          .from('categories')
          .insert([insertPayload])
          .select()
          .single();

        if (error) {
          console.error('Supabase category insert error:', error);
          if (error.code === '42501') {
            return {
              success: false,
              error: 'ডাটাবেজে ক্যাটাগরি যুক্ত করার অনুমতি মেলেনি (RLS Policy: 42501)। আপনার অ্যাকাউন্ট (kl6544340@gmail.com) Supabase-এর \'admin_users\' টেবিলে সক্রিয় অ্যাডমিন হিসেবে অনুমোদিত কিনা এবং RLS Policy কার্যকর হয়েছে কিনা যাচাই করুন।',
            };
          }
          if (error.code === '23505') {
            return { success: false, error: 'এই নামের ক্যাটাগরি ইতিমধ্যে বিদ্যমান' };
          }
          return { success: false, error: error.message };
        }

        // Also sync to local backend for cache / offline resilience
        try {
          await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payload,
              id: data.id,
              slug: data.slug,
            }),
          });
        } catch {
          // Local sync failure ignored when Supabase succeeds
        }

        return { success: true, category: mapDbCategoryToCategory(data), error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'ডাটাবেজ সংযোগে সমস্যা';
        return { success: false, error: msg };
      }
    }

    // 2. Local server permanent database fallback
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, category: data.category, error: null };
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'ক্যাটাগরি তৈরি ব্যর্থ হয়েছে' };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'সার্ভারে সংযোগ করা সম্ভব হয়নি';
      return { success: false, error: msg };
    }
  },

  // Edit category (cascading rename)
  async updateCategory(
    id: string,
    categoryData: Partial<Category>,
    oldName?: string
  ): Promise<{ success: boolean; category?: Category; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload: Record<string, unknown> = {};
        if (categoryData.name !== undefined) dbPayload.name = categoryData.name.trim();
        if (categoryData.bengaliName !== undefined) dbPayload.bengali_name = categoryData.bengaliName.trim() || null;
        if (categoryData.slug !== undefined) dbPayload.slug = categoryData.slug.trim();
        if (categoryData.icon !== undefined) dbPayload.icon = categoryData.icon;
        if (categoryData.image !== undefined) dbPayload.image = categoryData.image;
        if (categoryData.description !== undefined) dbPayload.description = categoryData.description;
        if (categoryData.isActive !== undefined) dbPayload.is_active = categoryData.isActive;
        if (categoryData.displayOrder !== undefined) dbPayload.display_order = categoryData.displayOrder;
        dbPayload.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('categories')
          .update(dbPayload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Supabase category update error:', error);
          if (error.code === '42501') {
            return {
              success: false,
              error: 'ডাটাবেজে ক্যাটাগরি আপডেট করার অনুমতি মেলেনি (RLS Policy: 42501)।',
            };
          }
          if (error.code === '23505') {
            return { success: false, error: 'এই নামের অন্য একটি ক্যাটাগরি ইতিমধ্যে বিদ্যমান' };
          }
          return { success: false, error: error.message };
        }

        // If category name was renamed, cascade update to associated products in Supabase
        if (oldName && categoryData.name && oldName !== categoryData.name.trim()) {
          await supabase
            .from('products')
            .update({ category: categoryData.name.trim(), updated_at: new Date().toISOString() })
            .eq('category', oldName);
        }

        // Sync to local server
        try {
          await fetch(`/api/categories/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData),
          });
        } catch {}

        return { success: true, category: mapDbCategoryToCategory(data), error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'ক্যাটাগরি আপডেট ব্যর্থ হয়েছে';
        return { success: false, error: msg };
      }
    }

    // Local server API fallback
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, category: data.category, error: null };
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'আপডেট ব্যর্থ হয়েছে' };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'অজানা সমস্যা';
      return { success: false, error: msg };
    }
  },

  // Toggle category active/inactive status
  async toggleCategoryStatus(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('categories')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          if (error.code === '42501') {
            return {
              success: false,
              error: 'ক্যাটাগরি স্ট্যাটাস পরিবর্তনের অনুমতি মেলেনি (RLS Policy: 42501)।',
            };
          }
          return { success: false, error: error.message };
        }

        try {
          await fetch(`/api/categories/${encodeURIComponent(id)}/toggle`, {
            method: 'PATCH',
          });
        } catch {}

        return { success: true, error: null };
      } catch {
        return { success: false, error: 'ডাটাবেজ স্ট্যাটাস আপডেট ব্যর্থ হয়েছে' };
      }
    }

    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        return { success: true, error: null };
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে' };
    } catch {
      return { success: false, error: 'সার্ভার সমস্যা' };
    }
  },

  // Reorder categories
  async reorderCategories(
    orderedIds: string[]
  ): Promise<{ success: boolean; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all(
          orderedIds.map((id, index) =>
            supabase
              .from('categories')
              .update({ display_order: index + 1, updated_at: new Date().toISOString() })
              .eq('id', id)
          )
        );
      } catch (err) {
        console.error('Supabase reorder error:', err);
      }

      try {
        await fetch('/api/categories/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        });
      } catch {}

      return { success: true, error: null };
    }

    try {
      const res = await fetch('/api/categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) {
        return { success: true, error: null };
      }
      return { success: false, error: 'পুনর্বিন্যাস সেভ করা যায়নি' };
    } catch {
      return { success: false, error: 'সার্ভার সমস্যা' };
    }
  },

  // Delete category with accidental deletion prevention & reassignment
  async deleteCategory(
    id: string,
    reassignToCategoryName?: string
  ): Promise<{ success: boolean; error: string | null; reassignedCount?: number }> {
    if (isSupabaseConfigured && supabase) {
      try {
        let reassignedCount = 0;
        if (reassignToCategoryName) {
          const { data: cat } = await supabase.from('categories').select('name').eq('id', id).single();
          if (cat?.name) {
            const { data: updatedProds } = await supabase
              .from('products')
              .update({ category: reassignToCategoryName, updated_at: new Date().toISOString() })
              .eq('category', cat.name)
              .select('id');
            reassignedCount = updatedProds?.length || 0;
          }
        }

        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
          console.error('Supabase category delete error:', error);
          if (error.code === '42501') {
            return {
              success: false,
              error: 'ডাটাবেজ থেকে ক্যাটাগরি মুছে ফেলার অনুমতি মেলেনি (RLS Policy: 42501)।',
            };
          }
          return { success: false, error: error.message };
        }

        // Sync to local server
        try {
          const url = `/api/categories/${encodeURIComponent(id)}${
            reassignToCategoryName ? `?reassignTo=${encodeURIComponent(reassignToCategoryName)}` : ''
          }`;
          await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reassignTo: reassignToCategoryName }),
          });
        } catch {}

        return { success: true, error: null, reassignedCount };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'ক্যাটাগরি ডিলিট ব্যর্থ হয়েছে';
        return { success: false, error: msg };
      }
    }

    // Local server API fallback
    try {
      const url = `/api/categories/${encodeURIComponent(id)}${
        reassignToCategoryName ? `?reassignTo=${encodeURIComponent(reassignToCategoryName)}` : ''
      }`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reassignTo: reassignToCategoryName }),
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true, error: null, reassignedCount: data.reassignedCount };
      }
      return { success: false, error: data.error || 'ডিলিট ব্যর্থ হয়েছে' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ডিলিট করা যায়নি';
      return { success: false, error: msg };
    }
  },
};

// -----------------------------------------------------------------------------
// STORE SETTINGS SERVICE
// -----------------------------------------------------------------------------
export const settingsService = {
  async getSettings(): Promise<StoreSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (!error && data) {
        return {
          storeName: data.store_name,
          tagline: data.tagline,
          whatsappNumber: data.whatsapp_number,
          whatsappIntl: data.whatsapp_intl,
          facebookUrl: data.facebook_url,
          deliveryFeeInsideDhaka: Number(data.delivery_fee_inside_dhaka),
          deliveryFeeOutsideDhaka: Number(data.delivery_fee_outside_dhaka),
        };
      }
    }

    return getLocalSettings();
  },

  async updateSettings(
    settings: StoreSettings,
  ): Promise<{ success: boolean; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('store_settings')
        .update({
          store_name: settings.storeName,
          tagline: settings.tagline,
          whatsapp_number: settings.whatsappNumber,
          whatsapp_intl: settings.whatsappIntl,
          facebook_url: settings.facebookUrl,
          delivery_fee_inside_dhaka: settings.deliveryFeeInsideDhaka,
          delivery_fee_outside_dhaka: settings.deliveryFeeOutsideDhaka,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    }

    saveLocalSettings(settings);

    return { success: true, error: null };
  },
};

// -----------------------------------------------------------------------------
// ORDERS SERVICE
// -----------------------------------------------------------------------------
export const orderService = {
  async getAllOrders(): Promise<CustomerOrder[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(mapDbOrderToOrder);
        }
      } catch (err) {
        console.warn('Supabase orders fetch fallback to persistent store:', err);
      }
    }

    return getLocalOrders();
  },

  async createOrder(
    payload: Omit<CustomerOrder, 'id' | 'orderNumber' | 'createdAt'> & { orderNumber?: string }
  ): Promise<{ success: boolean; order?: CustomerOrder; error?: string }> {
    const orderNumber = payload.orderNumber || `ME-${Date.now().toString().slice(-6)}`;
    const newOrder: CustomerOrder = {
      ...payload,
      id: `ord-${orderNumber.toLowerCase()}`,
      orderNumber,
      status: payload.status || 'pending',
      paymentStatus: payload.paymentStatus || 'cod',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert({
            id: newOrder.id,
            order_number: newOrder.orderNumber,
            customer_name: newOrder.customerName,
            phone_number: newOrder.phoneNumber,
            delivery_address: newOrder.deliveryAddress,
            delivery_area: newOrder.deliveryArea,
            notes: newOrder.notes,
            items: newOrder.items,
            subtotal: newOrder.subtotal,
            delivery_fee: newOrder.deliveryFee,
            total: newOrder.total,
            status: newOrder.status,
            payment_status: newOrder.paymentStatus,
            order_date: newOrder.orderDate,
          })
          .select()
          .single();

        if (!error && data) {
          return { success: true, order: mapDbOrderToOrder(data) };
        }
      } catch (err) {
        console.warn('Supabase order creation fallback:', err);
      }
    }

    const currentOrders = getLocalOrders();
    const updated = [newOrder, ...currentOrders];
    saveLocalOrders(updated);
    return { success: true, order: newOrder };
  },

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const updateData: Record<string, unknown> = {
          status,
          updated_at: new Date().toISOString(),
        };
        if (paymentStatus) {
          updateData.payment_status = paymentStatus;
        }
        const { error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', id);

        if (!error) {
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase update order status error:', err);
      }
    }

    const currentOrders = getLocalOrders();
    const index = currentOrders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (index === -1) {
      return { success: false, error: 'অর্ডার পাওয়া যায়নি' };
    }
    currentOrders[index] = {
      ...currentOrders[index],
      status,
      paymentStatus: paymentStatus || currentOrders[index].paymentStatus || 'cod',
      updatedAt: new Date().toISOString(),
    };
    saveLocalOrders(currentOrders);
    return { success: true };
  },

  async deleteOrder(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (!error) return { success: true };
      } catch (err) {
        console.warn('Supabase delete order error:', err);
      }
    }

    const currentOrders = getLocalOrders();
    const filtered = currentOrders.filter((o) => o.id !== id && o.orderNumber !== id);
    saveLocalOrders(filtered);
    return { success: true };
  },
};

function mapDbOrderToOrder(row: any): CustomerOrder {
  return {
    id: row.id,
    orderNumber: row.order_number || row.id,
    customerName: row.customer_name,
    phoneNumber: row.phone_number,
    deliveryAddress: row.delivery_address,
    deliveryArea: row.delivery_area || 'inside_dhaka',
    notes: row.notes,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal || 0),
    deliveryFee: Number(row.delivery_fee || 0),
    total: Number(row.total || 0),
    orderDate: row.order_date || row.created_at,
    status: row.status || 'pending',
    paymentStatus: row.payment_status || 'cod',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// -----------------------------------------------------------------------------
// DATABASE MAPPING HELPERS
// -----------------------------------------------------------------------------
function mapDbProductToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    bengaliName: row.bengali_name || '',
    price: Number(row.price),
    salePrice: row.sale_price ? Number(row.sale_price) : undefined,
    category: row.category,
    brand: row.brand || 'MUAZ ELECTRONIC',
    stock: Number(row.stock || 0),
    status: row.status || 'published',
    isFeatured: Boolean(row.is_featured),
    image: row.image,
    description: row.description || '',
    features: Array.isArray(row.features) ? row.features : [],
    specs: Array.isArray(row.specs) ? row.specs : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProductToDbPayload(product: Product): Record<string, unknown> {
  return {
    id: product.id,
    name: product.name,
    bengali_name: product.bengaliName || null,
    price: product.price,
    sale_price: product.salePrice || null,
    category: product.category,
    brand: product.brand || 'MUAZ ELECTRONIC',
    stock: product.stock,
    status: product.status,
    is_featured: Boolean(product.isFeatured),
    image: product.image,
    description: product.description,
    features: product.features,
    specs: product.specs || [],
  };
}

function mapPartialProductToDbPayload(
  product: Partial<Product>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (product.name !== undefined) payload.name = product.name;
  if (product.bengaliName !== undefined) {
    payload.bengali_name = product.bengaliName;
  }
  if (product.price !== undefined) payload.price = product.price;
  if (product.salePrice !== undefined) {
    payload.sale_price = product.salePrice || null;
  }
  if (product.category !== undefined) payload.category = product.category;
  if (product.brand !== undefined) payload.brand = product.brand;
  if (product.stock !== undefined) payload.stock = product.stock;
  if (product.status !== undefined) payload.status = product.status;
  if (product.isFeatured !== undefined) {
    payload.is_featured = product.isFeatured;
  }
  if (product.image !== undefined) payload.image = product.image;
  if (product.description !== undefined) payload.description = product.description;
  if (product.features !== undefined) payload.features = product.features;
  if (product.specs !== undefined) payload.specs = product.specs;

  return payload;
}

function mapDbCategoryToCategory(row: any): Category {
  return {
    id: String(row.id),
    name: row.name,
    bengaliName: row.bengali_name || undefined,
    slug: row.slug,
    icon: row.icon || 'Layers',
    image: row.image || undefined,
    description: row.description || undefined,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    displayOrder: row.display_order ? Number(row.display_order) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategoryToDbPayload(category: Category): Record<string, unknown> {
  return {
    id: category.id,
    name: category.name,
    bengali_name: category.bengaliName || null,
    slug: category.slug,
    icon: category.icon || 'Layers',
    image: category.image || null,
    description: category.description || null,
    is_active: category.isActive,
    display_order: category.displayOrder,
  };
}