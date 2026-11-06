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
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id, is_active')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .maybeSingle();

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

      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id, is_active')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .maybeSingle();

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
// DYNAMIC CATEGORY HELPERS & SERVICE (Supabase Integration)
// -----------------------------------------------------------------------------
export function generateCategorySlug(name: string, fallbackId?: string): string {
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (clean.length > 0) {
    return clean;
  }
  return `cat-${fallbackId || Date.now()}`;
}

export function getLocalDetailedCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEYS.CATEGORIES,
        JSON.stringify(INITIAL_DETAILED_CATEGORIES)
      );
      return INITIAL_DETAILED_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      return parsed as Category[];
    }
    if (Array.isArray(parsed)) {
      const converted: Category[] = parsed.map((name: string, i: number) => ({
        id: `cat-${i + 1}`,
        name,
        slug: generateCategorySlug(name, String(i + 1)),
        icon: 'Layers',
        isActive: true,
        displayOrder: i + 1,
      }));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(converted));
      return converted;
    }
    return INITIAL_DETAILED_CATEGORIES;
  } catch (error) {
    console.error('Error reading local categories:', error);
    return INITIAL_DETAILED_CATEGORIES;
  }
}

export function saveLocalDetailedCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving local categories:', error);
  }
}

// -----------------------------------------------------------------------------
// DYNAMIC CATEGORY HELPERS & SCHEMA-ADAPTIVE ENGINE
// -----------------------------------------------------------------------------
let detectedCategoryColumns: Set<string> | null = null;
const unsupportedCategoryColumns = new Set<string>();

export function extractMissingColumnName(errorMessage?: string): string | null {
  if (!errorMessage) return null;

  // PostgREST: Could not find the 'xyz' column of 'categories' in the schema cache
  const match1 = errorMessage.match(/Could not find the '([^']+)' column/i);
  if (match1 && match1[1]) return match1[1].trim();

  // PostgreSQL: column "xyz" of relation "categories" does not exist
  const match2 = errorMessage.match(/column ["']?([a-zA-Z0-9_]+)["']? of relation/i);
  if (match2 && match2[1]) return match2[1].trim();

  // PostgreSQL: column categories.xyz does not exist
  const match3 = errorMessage.match(/column [a-zA-Z0-9_]+\.([a-zA-Z0-9_]+) does not exist/i);
  if (match3 && match3[1]) return match3[1].trim();

  return null;
}

function updateDetectedColumns(rows: any[]) {
  if (rows && rows.length > 0 && !detectedCategoryColumns) {
    const cols = Object.keys(rows[0]);
    detectedCategoryColumns = new Set(cols);
    console.log('[Supabase Category Schema Auto-Detected]: Present columns in DB:', cols);
  }
}

function buildSafeCategoryDbPayload(
  desiredPayload: Record<string, unknown>
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(desiredPayload)) {
    // If dynamically found to be unsupported, skip sending
    if (unsupportedCategoryColumns.has(key)) continue;

    // If we have verified the exact column set from DB and this column is absent, skip sending
    if (detectedCategoryColumns && !detectedCategoryColumns.has(key)) continue;

    safe[key] = value;
  }
  return safe;
}

async function fetchSupabaseCategories(onlyActive = false): Promise<any[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    let query = supabase.from('categories').select('*');

    if (onlyActive && !unsupportedCategoryColumns.has('is_active')) {
      query = query.eq('is_active', true);
    }

    if (!unsupportedCategoryColumns.has('display_order')) {
      query = query.order('display_order', { ascending: true });
    }

    const res = await query;

    if (res.error) {
      console.warn('[Supabase Category Query Warning]:', res.error.message);
      const missingCol = extractMissingColumnName(res.error.message);
      if (missingCol) {
        unsupportedCategoryColumns.add(missingCol);
      }

      // Safe fallback: standard select without filters or ordering that may fail
      const fallbackRes = await supabase.from('categories').select('*');
      if (!fallbackRes.error && fallbackRes.data) {
        updateDetectedColumns(fallbackRes.data);
        return fallbackRes.data;
      }
      return [];
    }

    if (res.data && Array.isArray(res.data)) {
      updateDetectedColumns(res.data);
      return res.data;
    }
  } catch (err) {
    console.error('[Supabase Category Fetch Exception]:', err);
  }

  return [];
}

export const categoryService = {
  // Public active categories (ordered by displayOrder)
  async getActiveCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      const rawRows = await fetchSupabaseCategories(true);
      if (rawRows.length > 0) {
        return rawRows.map((r) => mapDbCategoryToCategory(r));
      }
    }

    return getLocalDetailedCategories().filter((c) => c.isActive !== false);
  },

  // Backward compatible string list: ['All Products', ...active category names]
  async getCategories(): Promise<string[]> {
    const active = await this.getActiveCategories();
    return ['All Products', ...active.map((c) => c.name)];
  },

  // Admin: Get all categories (including inactive, with product counts)
  async getAllCategoriesAdmin(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const [rawCats, prodsRes] = await Promise.all([
          fetchSupabaseCategories(false),
          supabase.from('products').select('category'),
        ]);

        if (rawCats.length > 0) {
          const prods = prodsRes.data || [];
          return rawCats.map((row) => {
            const cat = mapDbCategoryToCategory(row);
            cat.productCount = prods.filter((p) => p.category === cat.name).length;
            return cat;
          });
        }
      } catch (err) {
        console.error('[Supabase getAllCategoriesAdmin exception]:', err);
      }
    }

    const localCats = getLocalDetailedCategories();
    const localProds = getLocalProducts();
    return localCats.map((cat) => ({
      ...cat,
      productCount: localProds.filter((p) => p.category === cat.name).length,
    }));
  },

  // Create new category (simple by name or full payload) with Auto-Healing Schema Adaptation
  async addCategory(
    categoryInput: string | Partial<Category>
  ): Promise<{ success: boolean; category?: Category; error: string | null }> {
    const payload: Partial<Category> = typeof categoryInput === 'string'
      ? { name: categoryInput.trim() }
      : categoryInput;

    const rawName = (payload.name || '').trim();
    const bengaliName = (payload.bengaliName || '').trim() || undefined;

    // Validation
    if (!rawName) {
      return { success: false, error: 'ক্যাটাগরির নাম (English) দেওয়া আবশ্যক' };
    }

    const newId = (payload.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id))
      ? payload.id
      : (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : (payload.id || `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`));
    const slug = (payload.slug && payload.slug.trim())
      ? payload.slug.trim()
      : generateCategorySlug(rawName, newId);
    const icon = payload.icon || 'Layers';
    const image = payload.image || undefined;
    const description = payload.description || undefined;
    const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : true;
    const displayOrder = typeof payload.displayOrder === 'number' ? payload.displayOrder : 99;

    // 1. DIRECT SUPABASE STORAGE (When Supabase is configured)
    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase Category] Attempting to create category:', {
          name: rawName,
          bengali_name: bengaliName || null,
          slug,
          icon,
          description: description || null,
        });

        // Pre-check for duplicate name
        const { data: existingCat, error: checkError } = await supabase
          .from('categories')
          .select('id, name')
          .ilike('name', rawName)
          .maybeSingle();

        if (checkError) {
          console.warn('[Supabase Category Name Check]:', checkError.message);
        }

        if (existingCat) {
          return {
            success: false,
            error: `"${rawName}" নামের ক্যাটাগরি ইতিমধ্যে ডাটাবেজে রয়েছে। ভিন্ন নাম নির্বাচন করুন।`,
          };
        }

        const desiredPayload: Record<string, unknown> = {
          id: newId,
          name: rawName,
          bengali_name: bengaliName || null,
          slug,
          icon,
          image: image || null,
          description: description || null,
          is_active: isActive,
          display_order: displayOrder,
        };

        let insertData: any = null;
        let lastError: any = null;
        let attempts = 0;
        const maxAttempts = 8;

        while (attempts < maxAttempts) {
          attempts++;
          const dbPayload = buildSafeCategoryDbPayload(desiredPayload);

          console.log(`[Supabase Category Insert Attempt ${attempts}]: Sending columns:`, Object.keys(dbPayload));

          const res = await supabase
            .from('categories')
            .insert([dbPayload])
            .select()
            .single();

          if (!res.error && res.data) {
            insertData = res.data;
            lastError = null;
            break;
          }

          lastError = res.error;

          // Missing column error from PostgREST / PostgreSQL schema cache
          const missingCol = extractMissingColumnName(res.error?.message);
          if (missingCol && !unsupportedCategoryColumns.has(missingCol)) {
            console.warn(`[Supabase Category Auto-Healing] Column '${missingCol}' is not present in categories table. Omitting it and retrying immediately...`);
            unsupportedCategoryColumns.add(missingCol);
            continue;
          }

          // Unique slug collision (code 23505)
          if (res.error?.code === '23505' && (res.error.message.includes('slug') || res.error.details?.includes('slug'))) {
            const uniqueSlug = `${slug}-${Date.now().toString(36).slice(-4)}`;
            console.warn('[Supabase Category] Slug collision detected. Retrying with unique slug:', uniqueSlug);
            desiredPayload.slug = uniqueSlug;
            continue;
          }

          // ID type syntax issue (e.g. if table expects DB default)
          if (res.error?.message?.includes('uuid') && dbPayload.id) {
            console.warn('[Supabase Category] UUID issue with custom id. Removing id from payload...');
            delete desiredPayload.id;
            unsupportedCategoryColumns.add('id');
            continue;
          }

          // Unrecoverable error
          break;
        }

        if (lastError || !insertData) {
          console.error('[Supabase Category Insert Error]:', lastError);

          let userMessage = 'ক্যাটাগরি ডাটাবেজে সংরক্ষণ করা যায়নি।';
          if (lastError?.code === '23505') {
            userMessage = `"${rawName}" নামের ক্যাটাগরি বা স্লাগ ইতিমধ্যে ডাটাবেজে বিদ্যমান।`;
          } else if (lastError?.code === '42501' || lastError?.message?.includes('permission') || lastError?.message?.includes('policy')) {
            userMessage = 'ডাটাবেজে ক্যাটাগরি যুক্ত করার অনুমতি নেই (RLS Policy)। অনুগ্রহ করে নিশ্চিত করুন যে আপনি অ্যাডমিন হিসেবে লগইন করেছেন।';
          } else if (lastError?.message) {
            userMessage = `ডাটাবেজ ত্রুটি: ${lastError.message}`;
          }

          return { success: false, error: userMessage };
        }

        updateDetectedColumns([insertData]);

        const createdCategory = mapDbCategoryToCategory(insertData, {
          bengaliName,
          description,
          icon,
          image,
          isActive,
          displayOrder,
        });

        console.log('[Supabase Category Created Successfully]:', createdCategory);

        // Sync into local cache
        const localCats = getLocalDetailedCategories();
        saveLocalDetailedCategories([...localCats.filter((c) => c.name !== createdCategory.name), createdCategory]);

        return { success: true, category: createdCategory, error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'অজানা ডাটাবেজ ত্রুটি';
        console.error('[Supabase Category Exception]:', err);
        return { success: false, error: `ডাটাবেজ ত্রুটি: ${message}` };
      }
    }

    // 2. PERSISTENT LOCAL STORAGE (Fallback when Supabase credentials are not yet configured)
    try {
      const localCats = getLocalDetailedCategories();
      const duplicate = localCats.find(
        (c) => c.name.toLowerCase() === rawName.toLowerCase()
      );

      if (duplicate) {
        return {
          success: false,
          error: `"${rawName}" নামের ক্যাটাগরি ইতিমধ্যে বিদ্যমান রয়েছে।`,
        };
      }

      const newCategory: Category = {
        id: newId,
        name: rawName,
        bengaliName,
        slug,
        icon,
        image,
        description,
        isActive,
        displayOrder: displayOrder || localCats.length + 1,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [...localCats, newCategory];
      saveLocalDetailedCategories(updated);

      return { success: true, category: newCategory, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'অজানা ত্রুটি';
      return { success: false, error: `ক্যাটাগরি তৈরি ব্যর্থ হয়েছে: ${message}` };
    }
  },

  // Edit category (with cascading rename and Auto-Healing Schema Adaptation)
  async updateCategory(
    id: string,
    categoryData: Partial<Category>,
    oldName?: string
  ): Promise<{ success: boolean; category?: Category; error: string | null }> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const desiredPayload: Record<string, unknown> = {
          updated_at: now,
        };
        if (categoryData.name !== undefined) desiredPayload.name = categoryData.name.trim();
        if (categoryData.bengaliName !== undefined) desiredPayload.bengali_name = categoryData.bengaliName?.trim() || null;
        if (categoryData.slug !== undefined) desiredPayload.slug = categoryData.slug.trim();
        if (categoryData.icon !== undefined) desiredPayload.icon = categoryData.icon;
        if (categoryData.image !== undefined) desiredPayload.image = categoryData.image || null;
        if (categoryData.description !== undefined) desiredPayload.description = categoryData.description || null;
        if (categoryData.isActive !== undefined) desiredPayload.is_active = categoryData.isActive;
        if (categoryData.displayOrder !== undefined) desiredPayload.display_order = categoryData.displayOrder;

        let updateData: any = null;
        let lastError: any = null;
        let attempts = 0;

        while (attempts < 8) {
          attempts++;
          const dbPayload = buildSafeCategoryDbPayload(desiredPayload);

          const res = await supabase
            .from('categories')
            .update(dbPayload)
            .eq('id', id)
            .select()
            .single();

          if (!res.error && res.data) {
            updateData = res.data;
            lastError = null;
            break;
          }

          lastError = res.error;

          const missingCol = extractMissingColumnName(res.error?.message);
          if (missingCol && !unsupportedCategoryColumns.has(missingCol)) {
            console.warn(`[Supabase Category Update Auto-Healing] Column '${missingCol}' missing. Omitting and retrying...`);
            unsupportedCategoryColumns.add(missingCol);
            continue;
          }

          break;
        }

        if (lastError || !updateData) {
          console.error('[Supabase Category Update Error]:', lastError);
          return { success: false, error: `আপডেট ব্যর্থ হয়েছে: ${lastError?.message || 'অজানা ত্রুটি'}` };
        }

        // Cascading rename to products table
        if (oldName && categoryData.name && oldName !== categoryData.name) {
          console.log(`[Supabase Cascading Category Rename] from "${oldName}" to "${categoryData.name}"`);
          const { error: prodUpdateError } = await supabase
            .from('products')
            .update({ category: categoryData.name.trim() })
            .eq('category', oldName);

          if (prodUpdateError) {
            console.warn('[Supabase Cascading Category Rename Warning]:', prodUpdateError.message);
          }
        }

        updateDetectedColumns([updateData]);

        const updatedCat = mapDbCategoryToCategory(updateData, categoryData);

        // Sync local
        const localCats = getLocalDetailedCategories();
        const index = localCats.findIndex((c) => c.id === id);
        if (index !== -1) {
          localCats[index] = updatedCat;
          saveLocalDetailedCategories(localCats);
        }

        return { success: true, category: updatedCat, error: null };
      } catch (err: unknown) {
        console.error('[Supabase Category Update Exception]:', err);
        const msg = err instanceof Error ? err.message : 'অজানা সমস্যা';
        return { success: false, error: msg };
      }
    }

    // Local update
    const localCats = getLocalDetailedCategories();
    const index = localCats.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: 'ক্যাটাগরি খুঁজে পাওয়া যায়নি।' };
    }

    const updatedCat: Category = {
      ...localCats[index],
      ...categoryData,
      updatedAt: now,
    };
    localCats[index] = updatedCat;
    saveLocalDetailedCategories(localCats);

    // Cascade local products rename
    if (oldName && categoryData.name && oldName !== categoryData.name) {
      const localProds = getLocalProducts();
      const updatedProds = localProds.map((p) =>
        p.category === oldName ? { ...p, category: categoryData.name! } : p
      );
      saveLocalProducts(updatedProds);
    }

    return { success: true, category: updatedCat, error: null };
  },

  // Toggle category active/inactive status
  async toggleCategoryStatus(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      if (!unsupportedCategoryColumns.has('is_active')) {
        try {
          const { error } = await supabase
            .from('categories')
            .update({ is_active: isActive })
            .eq('id', id);

          if (error) {
            const missingCol = extractMissingColumnName(error.message);
            if (missingCol === 'is_active') {
              unsupportedCategoryColumns.add('is_active');
            } else {
              console.error('[Supabase Toggle Category Error]:', error);
              return { success: false, error: error.message };
            }
          }
        } catch (err: unknown) {
          console.warn('[Supabase Toggle Category Exception]:', err);
        }
      }
    }

    const localCats = getLocalDetailedCategories();
    const index = localCats.findIndex((c) => c.id === id);
    if (index !== -1) {
      localCats[index].isActive = isActive;
      saveLocalDetailedCategories(localCats);
    }
    return { success: true, error: null };
  },

  // Reorder categories (drag-and-drop or manual display order)
  async reorderCategories(
    orderedIds: string[]
  ): Promise<{ success: boolean; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      if (!unsupportedCategoryColumns.has('display_order')) {
        try {
          const updates = orderedIds.map((id, index) =>
            supabase
              .from('categories')
              .update({ display_order: index + 1 })
              .eq('id', id)
          );
          const results = await Promise.all(updates);
          for (const res of results) {
            if (res.error) {
              const missingCol = extractMissingColumnName(res.error.message);
              if (missingCol === 'display_order') {
                unsupportedCategoryColumns.add('display_order');
                break;
              }
            }
          }
        } catch (err: unknown) {
          console.error('[Supabase Reorder Categories Error]:', err);
        }
      }
    }

    const localCats = getLocalDetailedCategories();
    const ordered = orderedIds
      .map((id, idx) => {
        const item = localCats.find((c) => c.id === id);
        return item ? { ...item, displayOrder: idx + 1 } : null;
      })
      .filter(Boolean) as Category[];

    const remaining = localCats.filter((c) => !orderedIds.includes(c.id));
    saveLocalDetailedCategories([...ordered, ...remaining]);

    return { success: true, error: null };
  },

  // Delete category with accidental deletion prevention & reassignment
  async deleteCategory(
    id: string,
    reassignToCategoryName?: string
  ): Promise<{ success: boolean; error: string | null; reassignedCount?: number }> {
    let reassignedCount = 0;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: catToDelete, error: fetchErr } = await supabase
          .from('categories')
          .select('name')
          .eq('id', id)
          .single();

        if (fetchErr) {
          console.error('[Supabase Delete Category Fetch Error]:', fetchErr);
        }

        const catName = catToDelete?.name;

        // Reassign products if requested
        if (reassignToCategoryName && catName) {
          const { data: updatedProds, error: reassignErr } = await supabase
            .from('products')
            .update({ category: reassignToCategoryName })
            .eq('category', catName)
            .select('id');

          if (reassignErr) {
            console.error('[Supabase Reassign Products Error]:', reassignErr);
            return { success: false, error: `প্রোডাক্ট পুনঃবরাদ্দ করা যায়নি: ${reassignErr.message}` };
          }
          reassignedCount = updatedProds ? updatedProds.length : 0;
        }

        const { error: deleteErr } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);

        if (deleteErr) {
          console.error('[Supabase Delete Category Error]:', deleteErr);
          return { success: false, error: `ক্যাটাগরি ডিলিট ব্যর্থ হয়েছে: ${deleteErr.message}` };
        }

        // Local sync
        const localCats = getLocalDetailedCategories().filter((c) => c.id !== id);
        saveLocalDetailedCategories(localCats);

        return { success: true, error: null, reassignedCount };
      } catch (err: unknown) {
        console.error('[Supabase Delete Category Exception]:', err);
        const msg = err instanceof Error ? err.message : 'ক্যাটাগরি মুছে ফেলা যায়নি';
        return { success: false, error: msg };
      }
    }

    // Local path
    const localCats = getLocalDetailedCategories();
    const target = localCats.find((c) => c.id === id);
    if (target && reassignToCategoryName) {
      const localProds = getLocalProducts();
      const updatedProds = localProds.map((p) => {
        if (p.category === target.name) {
          reassignedCount++;
          return { ...p, category: reassignToCategoryName };
        }
        return p;
      });
      saveLocalProducts(updatedProds);
    }

    const filtered = localCats.filter((c) => c.id !== id);
    saveLocalDetailedCategories(filtered);

    return { success: true, error: null, reassignedCount };
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

function mapDbCategoryToCategory(row: any, overrides?: Partial<Category>): Category {
  return {
    id: String(row.id),
    name: row.name,
    bengaliName: row.bengali_name || overrides?.bengaliName || undefined,
    slug: row.slug || generateCategorySlug(row.name, row.id),
    icon: row.icon || overrides?.icon || 'Layers',
    image: row.image || overrides?.image || undefined,
    description: row.description || overrides?.description || undefined,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : (overrides?.isActive ?? true),
    displayOrder: row.display_order ? Number(row.display_order) : (overrides?.displayOrder ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategoryToDbPayload(category: Category): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
  if (category.bengaliName !== undefined) payload.bengali_name = category.bengaliName || null;
  if (category.icon !== undefined) payload.icon = category.icon;
  if (category.image !== undefined) payload.image = category.image || null;
  if (category.description !== undefined) payload.description = category.description || null;
  if (category.isActive !== undefined) payload.is_active = category.isActive;
  if (category.displayOrder !== undefined) payload.display_order = category.displayOrder;
  return payload;
}