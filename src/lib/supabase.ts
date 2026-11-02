import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, StoreSettings, AdminUser } from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  DEFAULT_STORE_SETTINGS,
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
// CATEGORY SERVICE
// -----------------------------------------------------------------------------
export const categoryService = {
  async getCategories(): Promise<string[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name');

      if (!error && data && data.length > 0) {
        return ['All Products', ...data.map((category) => category.name)];
      }
    }

    return getLocalCategories();
  },

  async addCategory(
    name: string,
  ): Promise<{ success: boolean; error: string | null }> {
    const trimmed = name.trim();

    if (!trimmed) {
      return { success: false, error: 'ক্যাটাগরির নাম দিন' };
    }

    if (isSupabaseConfigured && supabase) {
      const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const { error } = await supabase
        .from('categories')
        .insert([{ name: trimmed, slug }]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    }

    const current = getLocalCategories();

    if (current.includes(trimmed)) {
      return {
        success: false,
        error: 'এই ক্যাটাগরি ইতিমধ্যে বিদ্যমান',
      };
    }

    saveLocalCategories([...current, trimmed]);

    return { success: true, error: null };
  },

  async deleteCategory(
    name: string,
  ): Promise<{ success: boolean; error: string | null }> {
    if (name === 'All Products') {
      return {
        success: false,
        error: 'ডিফল্ট ক্যাটাগরি ডিলিট করা সম্ভব নয়',
      };
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', name);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    }

    saveLocalCategories(
      getLocalCategories().filter((category) => category !== name),
    );

    return { success: true, error: null };
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