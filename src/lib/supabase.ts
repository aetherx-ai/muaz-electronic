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
import {
  CLOTHING_SIZES,
  computeTotalStockFromSizes,
  extractSizeInventoryFromSpecs,
  hasEnabledSizes,
  mergeSizeInventoryIntoSpecs,
  normalizeSizeInventory,
  sanitizeWholeStock,
  stripInternalSpecs,
} from './sizeInventory';

function isMissingSizeInventoryColumnError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    (msg.includes('size_inventory') && (msg.includes('schema cache') || msg.includes('column') || msg.includes('does not exist')))
  );
}

function normalizeProductRecord(prod: Product): Product {
  const normalizedSizes =
    normalizeSizeInventory(prod.sizeInventory) ||
    extractSizeInventoryFromSpecs(prod.specs);
  const hasSizes = Boolean(normalizedSizes);
  return {
    ...prod,
    hasSizes,
    sizeInventory: normalizedSizes,
    specs: stripInternalSpecs(prod.specs),
    stock: hasSizes
      ? computeTotalStockFromSizes(normalizedSizes)
      : sanitizeWholeStock(prod.stock),
  };
}

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

      // Verify the authenticated user against the admin allowlist using exact schema: user_id, is_active
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

    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = (await res.json()) as Product[];
        if (Array.isArray(data)) {
          return data
            .filter((product) => product.status === 'published')
            .map(normalizeProductRecord);
        }
      }
    } catch {
      // Fall back to localStorage only if server is unreachable
    }

    return getLocalProducts()
      .filter((product) => product.status === 'published')
      .map(normalizeProductRecord);
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

    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = (await res.json()) as Product[];
        if (Array.isArray(data)) {
          return data.map(normalizeProductRecord);
        }
      }
    } catch {
      // Fall back to localStorage only if server is unreachable
    }

    return getLocalProducts().map(normalizeProductRecord);
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

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = (await res.json()) as Product;
        return normalizeProductRecord(data);
      }
    } catch {
      // Fall back to localStorage only if server is unreachable
    }

    const local = getLocalProducts().find((product) => product.id === id);
    return local ? normalizeProductRecord(local) : null;
  },

  async createProduct(
    productData: Omit<Product, 'id'>,
    imageFile?: File,
  ): Promise<{ product: Product | null; error: string | null; success: boolean }> {
    try {
      let imageUrl = productData.image;

      if (isSupabaseConfigured && supabase) {
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
      }

      const normalizedSizes = normalizeSizeInventory(productData.sizeInventory);
      const hasSizes = Boolean(normalizedSizes);
      const computedStock = hasSizes
        ? computeTotalStockFromSizes(normalizedSizes)
        : sanitizeWholeStock(productData.stock);

      const now = new Date().toISOString();

      const newProduct: Product = {
        ...productData,
        id: `product-${Date.now()}`,
        stock: computedStock,
        hasSizes,
        sizeInventory: normalizedSizes,
        image: imageUrl,
        createdAt: now,
        updatedAt: now,
      };

      if (isSupabaseConfigured && supabase) {
        const dbPayload = mapProductToDbPayload(newProduct);
        let { data, error } = await supabase
          .from('products')
          .insert([dbPayload])
          .select()
          .single();

        if (error && isMissingSizeInventoryColumnError(error)) {
          const fallbackPayload = { ...dbPayload };
          delete fallbackPayload.size_inventory;
          fallbackPayload.specs = mergeSizeInventoryIntoSpecs(
            newProduct.specs,
            newProduct.sizeInventory
          );
          const retry = await supabase
            .from('products')
            .insert([fallbackPayload])
            .select()
            .single();
          data = retry.data;
          error = retry.error;
        }

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

      // Express filesystem persistence (/api/products -> data/db.json)
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct),
        });
        if (res.ok) {
          const data = await res.json();
          const savedProduct = normalizeProductRecord(data.product || newProduct);
          return { product: savedProduct, error: null, success: true };
        } else {
          const errData = await res.json().catch(() => ({}));
          return {
            product: null,
            error: errData.error || 'প্রোডাক্ট সংরক্ষণ ব্যর্থ হয়েছে',
            success: false,
          };
        }
      } catch {
        const products = getLocalProducts();
        saveLocalProducts([newProduct, ...products]);
        return { product: newProduct, error: null, success: true };
      }
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

      if (isSupabaseConfigured && supabase && imageFile) {
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

      const hasSizePayload = Object.prototype.hasOwnProperty.call(productData, 'sizeInventory');
      const normalizedSizes = hasSizePayload
        ? normalizeSizeInventory(productData.sizeInventory)
        : undefined;

      const normalizedUpdate: Partial<Product> = {
        ...productData,
      };

      if (hasSizePayload) {
        normalizedUpdate.sizeInventory = normalizedSizes;
        normalizedUpdate.hasSizes = Boolean(normalizedSizes);
        if (normalizedSizes) {
          normalizedUpdate.stock = computeTotalStockFromSizes(normalizedSizes);
        } else if (productData.stock !== undefined) {
          normalizedUpdate.stock = sanitizeWholeStock(productData.stock);
        }
      } else if (productData.stock !== undefined) {
        normalizedUpdate.stock = sanitizeWholeStock(productData.stock);
      }

      const now = new Date().toISOString();

      if (isSupabaseConfigured && supabase) {
        const payload: Record<string, unknown> = {
          ...mapPartialProductToDbPayload(normalizedUpdate),
          updated_at: now,
        };

        if (imageFile && imageUrl) {
          payload.image = imageUrl;
        } else if (imageUrl && !isBase64Image(imageUrl)) {
          payload.image = imageUrl;
        } else {
          delete payload.image;
        }

        let { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error && isMissingSizeInventoryColumnError(error)) {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.size_inventory;
          if (hasSizePayload) {
            let baseSpecs = Array.isArray(productData.specs) ? productData.specs : undefined;
            if (!baseSpecs) {
              const { data: existingRow } = await supabase
                .from('products')
                .select('specs')
                .eq('id', id)
                .maybeSingle();
              baseSpecs = Array.isArray(existingRow?.specs) ? existingRow.specs : [];
            }
            fallbackPayload.specs = mergeSizeInventoryIntoSpecs(baseSpecs, normalizedSizes);
          }
          const retry = await supabase
            .from('products')
            .update(fallbackPayload)
            .eq('id', id)
            .select()
            .single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          return { product: null, error: error.message, success: false };
        }

        return {
          product: mapDbProductToProduct(data),
          error: null,
          success: true,
        };
      }

      // Express filesystem persistence
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...normalizedUpdate,
            ...(hasSizePayload ? { sizeInventory: normalizedSizes ?? null } : {}),
            ...(imageUrl ? { image: imageUrl } : {}),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const savedProduct = normalizeProductRecord(data.product);
          return { product: savedProduct, error: null, success: true };
        } else {
          const errData = await res.json().catch(() => ({}));
          return {
            product: null,
            error: errData.error || 'প্রোডাক্ট আপডেট ব্যর্থ হয়েছে',
            success: false,
          };
        }
      } catch {
        const products = getLocalProducts();
        const index = products.findIndex((product) => product.id === id);

        if (index === -1) {
          return {
            product: null,
            error: 'প্রোডাক্টটি খুঁজে পাওয়া যায়নি',
            success: false,
          };
        }

        const updatedProduct = normalizeProductRecord({
          ...products[index],
          ...normalizedUpdate,
          ...(imageUrl && !isBase64Image(imageUrl) ? { image: imageUrl } : {}),
          updatedAt: now,
        });

        products[index] = updatedProduct;
        saveLocalProducts(products);

        return { product: updatedProduct, error: null, success: true };
      }
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

      try {
        const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          return { success: true, error: null };
        }
      } catch {
        // Fallback below
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
export function generateCategorySlug(name: string): string {
  if (!name) return `cat-${Date.now()}`;
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || `cat-${Date.now()}`;
}

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
            const catNameLower = cat.name.trim().toLowerCase();
            const catSlugLower = (cat.slug || '').trim().toLowerCase();
            const catBengaliLower = (cat.bengaliName || '').trim().toLowerCase();
            cat.productCount = prods.filter((p) => {
              const pCat = (p.category || '').trim().toLowerCase();
              return (
                pCat === catNameLower ||
                (catSlugLower && pCat === catSlugLower) ||
                (catBengaliLower && pCat === catBengaliLower) ||
                pCat === cat.id.toLowerCase()
              );
            }).length;
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

    const generatedSlug = generateCategorySlug(trimmedName);
    const rawSlug = (payload.slug && payload.slug.trim()) ? payload.slug.trim() : generatedSlug;
    const finalSlug = rawSlug
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || generatedSlug;

    // 1. When Supabase is configured, execute on Supabase first
    if (isSupabaseConfigured && supabase) {
      try {
        // Ensure active authenticated session before issuing protected mutation
        const { data: sessionData } = await supabase.auth.getSession();
        let activeUser = sessionData?.session?.user;

        if (!activeUser) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          activeUser = refreshed?.session?.user;
        }

        if (!activeUser) {
          return {
            success: false,
            error: 'সক্রিয় অ্যাডমিন সেশন পাওয়া যায়নি। দয়া করে আবার লগইন করুন।',
          };
        }

        // Do NOT pass a slug string to UUID column! Let Supabase gen_random_uuid() generate the UUID.
        const insertPayload: Record<string, unknown> = {
          name: trimmedName,
          bengali_name: payload.bengaliName?.trim() || null,
          slug: finalSlug,
          icon: payload.icon || 'Layers',
          image: payload.image || null,
          description: payload.description || null,
          is_active: payload.isActive !== undefined ? payload.isActive : true,
          display_order: payload.displayOrder !== undefined ? Number(payload.displayOrder) : 0,
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
              error: 'ডাটাবেজে ক্যাটাগরি যুক্ত করার অনুমতি মেলেনি (RLS Policy: 42501)। আপনার অ্যাকাউন্টটি Supabase-এর \'admin_users\' টেবিলে সক্রিয় অ্যাডমিন (is_active = true) হিসেবে অনুমোদিত কিনা এবং RLS Policy কার্যকর হয়েছে কিনা যাচাই করুন।',
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

        if (!error && Array.isArray(data)) {
          return data.map(mapDbOrderToOrder);
        }
      } catch (err) {
        console.warn('Supabase orders fetch fallback to API:', err);
      }
    }

    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = (await res.json()) as CustomerOrder[];
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch {
      // Fall back to localStorage only if server unreachable
    }

    return getLocalOrders();
  },

  async createOrder(
    payload: Omit<CustomerOrder, 'id' | 'orderNumber' | 'createdAt'> & { orderNumber?: string }
  ): Promise<{ success: boolean; order?: CustomerOrder; error?: string }> {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'অর্ডারে কোনো পণ্য নেই।' };
    }

    const orderNumber = payload.orderNumber || `ME-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const newOrder: CustomerOrder = {
      ...payload,
      id: `ord-${orderNumber.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`,
      orderNumber,
      status: payload.status || 'pending',
      paymentStatus: payload.paymentStatus || 'cod',
      stockDeducted: true,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured && supabase) {
      const dbOrderPayload = {
        id: newOrder.id,
        order_number: newOrder.orderNumber,
        customer_name: newOrder.customerName,
        phone_number: newOrder.phoneNumber,
        delivery_address: newOrder.deliveryAddress,
        delivery_area: newOrder.deliveryArea,
        notes: newOrder.notes || null,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        delivery_fee: newOrder.deliveryFee,
        total: newOrder.total,
        status: newOrder.status,
        payment_status: newOrder.paymentStatus,
        order_date: newOrder.orderDate || now,
      };

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'place_order_with_stock_deduction',
        { p_order: dbOrderPayload }
      );

      if (!rpcError && rpcData) {
        return { success: true, order: mapDbOrderToOrder(rpcData) };
      }

      // Check if RPC isn't deployed yet on this Supabase project
      const rpcMissing =
        rpcError?.code === '42883' ||
        rpcError?.code === 'PGRST202' ||
        rpcError?.message?.toLowerCase().includes('could not find the function');

      if (rpcError && !rpcMissing) {
        return {
          success: false,
          error: rpcError.message || 'অর্ডার সম্পন্ন করা যায়নি। পর্যাপ্ত স্টক আছে কিনা যাচাই করুন।',
        };
      }

      // Safe fallback when RPC is not installed yet: validate stock & deduct before inserting order
      const deductedSnapshots: Array<{ id: string; prevStock: number; prevSizes: any }> = [];
      try {
        for (const item of newOrder.items) {
          const { data: dbProd, error: fetchErr } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.product.id)
            .single();

          if (fetchErr || !dbProd) {
            throw new Error(`"${item.product.name}" স্টোরে পাওয়া যায়নি।`);
          }

          const mappedProd = mapDbProductToProduct(dbProd);
          const qty = sanitizeWholeStock(item.quantity);
          if (qty <= 0) throw new Error('অবৈধ পণ্যের পরিমাণ।');

          deductedSnapshots.push({
            id: mappedProd.id,
            prevStock: mappedProd.stock,
            prevSizes: mappedProd.sizeInventory || null,
          });

          if (hasEnabledSizes(mappedProd)) {
            if (!item.selectedSize || !mappedProd.sizeInventory?.[item.selectedSize]?.enabled) {
              throw new Error(`"${mappedProd.name}" এর জন্য অনুগ্রহ করে একটি বৈধ সাইজ নির্বাচন করুন।`);
            }
            const avail = sanitizeWholeStock(mappedProd.sizeInventory[item.selectedSize]!.stock);
            if (qty > avail) {
              throw new Error(
                `"${mappedProd.name}" (সাইজ: ${item.selectedSize}) পর্যাপ্ত স্টক নেই (উপলব্ধ: ${avail} টি)।`
              );
            }
            const nextSizes = {
              ...mappedProd.sizeInventory,
              [item.selectedSize]: { enabled: true, stock: avail - qty },
            };
            const nextTotal = computeTotalStockFromSizes(nextSizes);
            let { error: updErr } = await supabase
              .from('products')
              .update({ size_inventory: nextSizes, stock: nextTotal, updated_at: now })
              .eq('id', mappedProd.id);
            if (updErr && isMissingSizeInventoryColumnError(updErr)) {
              const retryUpd = await supabase
                .from('products')
                .update({
                  stock: nextTotal,
                  specs: mergeSizeInventoryIntoSpecs(dbProd.specs, nextSizes),
                  updated_at: now,
                })
                .eq('id', mappedProd.id);
              updErr = retryUpd.error;
            }
            if (updErr) throw new Error(updErr.message);
          } else {
            if (qty > mappedProd.stock) {
              throw new Error(
                `"${mappedProd.name}" পর্যাপ্ত স্টক নেই (উপলব্ধ: ${mappedProd.stock} টি)।`
              );
            }
            const { error: updErr } = await supabase
              .from('products')
              .update({ stock: mappedProd.stock - qty, updated_at: now })
              .eq('id', mappedProd.id);
            if (updErr) throw new Error(updErr.message);
          }
        }

        const { data: insertedOrder, error: insertErr } = await supabase
          .from('orders')
          .insert({ ...dbOrderPayload, stock_deducted: true })
          .select()
          .single();

        if (insertErr || !insertedOrder) {
          throw new Error(insertErr?.message || 'অর্ডার সেভ করা যায়নি');
        }

        return { success: true, order: mapDbOrderToOrder(insertedOrder) };
      } catch (err: unknown) {
        // Roll back any deducted stock on failure
        for (const snap of deductedSnapshots) {
          const { error: rbErr } = await supabase
            .from('products')
            .update({ stock: snap.prevStock, size_inventory: snap.prevSizes })
            .eq('id', snap.id);
          if (rbErr && isMissingSizeInventoryColumnError(rbErr)) {
            await supabase
              .from('products')
              .update({ stock: snap.prevStock })
              .eq('id', snap.id);
          }
        }
        return {
          success: false,
          error: err instanceof Error ? err.message : 'অর্ডার তৈরি ব্যর্থ হয়েছে',
        };
      }
    }

    // Express server atomic stock deduction & order creation (/api/orders -> data/db.json)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return { success: true, order: data.order };
      }
      // Explicitly fail on HTTP 4xx/5xx (never bypass server stock rejection!)
      return {
        success: false,
        error: data.error || 'অর্ডার সম্পন্ন করা যায়নি। স্টক যাচাই করে পুনরায় চেষ্টা করুন।',
      };
    } catch {
      // Offline / localStorage fallback only if server unreachable
      const products = getLocalProducts().map(normalizeProductRecord);
      for (const item of newOrder.items) {
        const prod = products.find((p) => p.id === item.product.id);
        if (!prod) {
          return { success: false, error: `"${item.product.name}" পাওয়া যায়নি।` };
        }
        if (hasEnabledSizes(prod)) {
          if (!item.selectedSize || !prod.sizeInventory?.[item.selectedSize]?.enabled) {
            return { success: false, error: `"${prod.name}" এর বৈধ সাইজ নির্বাচন করুন।` };
          }
          const avail = sanitizeWholeStock(prod.sizeInventory[item.selectedSize]!.stock);
          if (item.quantity > avail) {
            return {
              success: false,
              error: `"${prod.name}" (সাইজ: ${item.selectedSize}) পর্যাপ্ত স্টক নেই (উপলব্ধ: ${avail})।`,
            };
          }
        } else if (item.quantity > prod.stock) {
          return {
            success: false,
            error: `"${prod.name}" পর্যাপ্ত স্টক নেই (উপলব্ধ: ${prod.stock})।`,
          };
        }
      }

      const updatedProducts = products.map((prod) => {
        const matchingItems = newOrder.items.filter((i) => i.product.id === prod.id);
        if (matchingItems.length === 0) return prod;
        const cloned = { ...prod };
        if (hasEnabledSizes(cloned) && cloned.sizeInventory) {
          const nextInv = { ...cloned.sizeInventory };
          for (const mi of matchingItems) {
            if (mi.selectedSize && nextInv[mi.selectedSize]) {
              nextInv[mi.selectedSize] = {
                enabled: true,
                stock: Math.max(0, nextInv[mi.selectedSize]!.stock - mi.quantity),
              };
            }
          }
          cloned.sizeInventory = nextInv;
          cloned.stock = computeTotalStockFromSizes(nextInv);
        } else {
          const sumQty = matchingItems.reduce((s, i) => s + i.quantity, 0);
          cloned.stock = Math.max(0, cloned.stock - sumQty);
        }
        return cloned;
      });
      saveLocalProducts(updatedProducts);

      const currentOrders = getLocalOrders();
      saveLocalOrders([newOrder, ...currentOrders]);
      return { success: true, order: newOrder };
    }
  },

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      const { error: rpcError } = await supabase.rpc('update_order_status_with_stock', {
        p_order_id: id,
        p_status: status,
        p_payment_status: paymentStatus || null,
      });

      if (!rpcError) {
        return { success: true };
      }

      const rpcMissing =
        rpcError?.code === '42883' ||
        rpcError?.code === 'PGRST202' ||
        rpcError?.message?.toLowerCase().includes('could not find the function');

      if (!rpcMissing) {
        return { success: false, error: rpcError.message };
      }

      try {
        const { data: orderRow, error: fetchErr } = await supabase
          .from('orders')
          .select('*')
          .or(`id.eq.${id},order_number.eq.${id}`)
          .single();

        if (fetchErr || !orderRow) {
          return { success: false, error: 'অর্ডার পাওয়া যায়নি' };
        }

        const existingOrder = mapDbOrderToOrder(orderRow);
        const now = new Date().toISOString();
        let nextStockDeducted = existingOrder.stockDeducted !== false;

        if (status === 'cancelled' && existingOrder.stockDeducted === true) {
          for (const item of existingOrder.items) {
            const { data: prodRow } = await supabase
              .from('products')
              .select('*')
              .eq('id', item.product.id)
              .single();
            if (!prodRow) continue;
            const prod = mapDbProductToProduct(prodRow);
            const qty = sanitizeWholeStock(item.quantity);
            if (hasEnabledSizes(prod) && item.selectedSize && prod.sizeInventory?.[item.selectedSize]) {
              const nextSizes = {
                ...prod.sizeInventory,
                [item.selectedSize]: {
                  enabled: prod.sizeInventory[item.selectedSize]!.enabled,
                  stock: prod.sizeInventory[item.selectedSize]!.stock + qty,
                },
              };
              const { error: restoreErr } = await supabase
                .from('products')
                .update({
                  size_inventory: nextSizes,
                  stock: computeTotalStockFromSizes(nextSizes),
                  updated_at: now,
                })
                .eq('id', prod.id);
              if (restoreErr && isMissingSizeInventoryColumnError(restoreErr)) {
                await supabase
                  .from('products')
                  .update({
                    stock: computeTotalStockFromSizes(nextSizes),
                    specs: mergeSizeInventoryIntoSpecs(prodRow.specs, nextSizes),
                    updated_at: now,
                  })
                  .eq('id', prod.id);
              }
            } else {
              await supabase
                .from('products')
                .update({ stock: prod.stock + qty, updated_at: now })
                .eq('id', prod.id);
            }
          }
          nextStockDeducted = false;
        }

        const updateData: Record<string, unknown> = {
          status,
          stock_deducted: nextStockDeducted,
          updated_at: now,
        };
        if (paymentStatus) {
          updateData.payment_status = paymentStatus;
        }
        const { error } = await supabase.from('orders').update(updateData).eq('id', existingOrder.id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'অর্ডার স্ট্যাটাস আপডেট ব্যর্থ হয়েছে',
        };
      }
    }

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'অর্ডার স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে' };
    } catch {
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
    }
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

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) return { success: true };
    } catch {
      // Fallback
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
    stockDeducted: Boolean(row.stock_deducted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// -----------------------------------------------------------------------------
// DATABASE MAPPING HELPERS
// -----------------------------------------------------------------------------
function mapDbProductToProduct(row: any): Product {
  const normalizedSizes =
    normalizeSizeInventory(row.size_inventory) ||
    extractSizeInventoryFromSpecs(row.specs);
  const hasSizes = Boolean(normalizedSizes);
  return {
    id: row.id,
    name: row.name,
    bengaliName: row.bengali_name || '',
    price: Number(row.price),
    salePrice: row.sale_price ? Number(row.sale_price) : undefined,
    category: row.category,
    brand: row.brand || 'MUAZ ELECTRONIC',
    stock: hasSizes
      ? computeTotalStockFromSizes(normalizedSizes)
      : sanitizeWholeStock(row.stock || 0),
    hasSizes,
    sizeInventory: normalizedSizes,
    status: row.status || 'published',
    isFeatured: Boolean(row.is_featured),
    image: row.image,
    description: row.description || '',
    features: Array.isArray(row.features) ? row.features : [],
    specs: stripInternalSpecs(Array.isArray(row.specs) ? row.specs : []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProductToDbPayload(product: Product): Record<string, unknown> {
  const normalizedSizes = normalizeSizeInventory(product.sizeInventory);
  const hasSizes = Boolean(normalizedSizes);
  const payload: Record<string, unknown> = {
    id: product.id,
    name: product.name,
    bengali_name: product.bengaliName || null,
    price: product.price,
    sale_price: product.salePrice || null,
    category: product.category,
    brand: product.brand || 'MUAZ ELECTRONIC',
    stock: hasSizes
      ? computeTotalStockFromSizes(normalizedSizes)
      : sanitizeWholeStock(product.stock),
    size_inventory: normalizedSizes || null,
    status: product.status,
    is_featured: Boolean(product.isFeatured),
    image: product.image,
    description: product.description,
    features: product.features,
    specs: stripInternalSpecs(product.specs || []),
  };

  return payload;
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
  if (Object.prototype.hasOwnProperty.call(product, 'sizeInventory')) {
    const normalizedSizes = normalizeSizeInventory(product.sizeInventory);
    payload.size_inventory = normalizedSizes || null;
    if (normalizedSizes) {
      payload.stock = computeTotalStockFromSizes(normalizedSizes);
    }
  }
  if (product.stock !== undefined && payload.stock === undefined) {
    payload.stock = sanitizeWholeStock(product.stock);
  }
  if (product.status !== undefined) payload.status = product.status;
  if (product.isFeatured !== undefined) {
    payload.is_featured = product.isFeatured;
  }
  if (product.image !== undefined) payload.image = product.image;
  if (product.description !== undefined) payload.description = product.description;
  if (product.features !== undefined) payload.features = product.features;
  if (product.specs !== undefined) payload.specs = stripInternalSpecs(product.specs);

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