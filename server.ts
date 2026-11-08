import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// -----------------------------------------------------------------------------
// PERMANENT DATABASE STORAGE (Stored on server filesystem, not browser-only)
// -----------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface CategoryRecord {
  id: string;
  name: string;
  bengaliName?: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductRecord {
  id: string;
  name: string;
  bengaliName?: string;
  price: number;
  salePrice?: number;
  category: string;
  brand?: string;
  stock: number;
  status: 'published' | 'draft';
  isFeatured?: boolean;
  image: string;
  description: string;
  features: string[];
  specs?: { label: string; value: string }[];
  createdAt?: string;
  updatedAt?: string;
}

interface StoreSettingsRecord {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  whatsappIntl: string;
  facebookUrl: string;
  deliveryFeeInsideDhaka: number;
  deliveryFeeOutsideDhaka: number;
}

interface DatabaseSchema {
  categories: CategoryRecord[];
  products: ProductRecord[];
  settings: StoreSettingsRecord;
}

const DEFAULT_CATEGORIES: CategoryRecord[] = [
  {
    id: 'cat-audio-earbuds',
    name: 'Audio & Earbuds',
    bengaliName: 'অডিও ও ইয়ারবাডস',
    slug: 'audio-earbuds',
    icon: 'Headphones',
    isActive: true,
    displayOrder: 1,
    description: 'প্রিমিয়াম কোয়ালিটির ট্রু ওয়্যারলেস স্টেরিও (TWS) এয়ারবাডস ও হেডফোন কালেকশন',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-power-banks',
    name: 'Power Banks',
    bengaliName: 'পাওয়ার ব্যাংকস',
    slug: 'power-banks',
    icon: 'BatteryCharging',
    isActive: true,
    displayOrder: 2,
    description: 'দ্রুত চার্জিং সক্ষমতার হাই-ক্যাপাসিটি পাওয়ার ব্যাংক',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-mobile-accessories',
    name: 'Mobile Accessories',
    bengaliName: 'মোবাইল এক্সেসরিজ',
    slug: 'mobile-accessories',
    icon: 'Smartphone',
    isActive: true,
    displayOrder: 3,
    description: 'ফোন কুলার, স্ট্যান্ড, গ্যাজেট এক্সেসরিজ ও প্রয়োজনীয় সামগ্রী',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-gaming-gadgets',
    name: 'Gaming Gadgets',
    bengaliName: 'গেমিং গ্যাজেটস',
    slug: 'gaming-gadgets',
    icon: 'Gamepad2',
    isActive: true,
    displayOrder: 4,
    description: 'পোর্টেবল কনসোল, গেমিং ট্রিগার ও এক্সেসরিজ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-audio-microphones',
    name: 'Audio & Microphones',
    bengaliName: 'অডিও ও মাইক্রোফোন',
    slug: 'audio-microphones',
    icon: 'Mic',
    isActive: true,
    displayOrder: 5,
    description: 'ওয়্যারলেস ল্যাপেল মাইক্রোফোন ও স্ট্রিমিং অডিও সরঞ্জাম',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-audio-neckbands',
    name: 'Audio & Neckbands',
    bengaliName: 'অডিও ও নেকব্যান্ড',
    slug: 'audio-neckbands',
    icon: 'Radio',
    isActive: true,
    displayOrder: 6,
    description: 'স্পোর্টস ব্লুটুথ নেকব্যান্ড ও ওয়্যারলেস ইয়ারফোন',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-watch',
    name: 'Watch',
    bengaliName: 'ঘড়ি',
    slug: 'watch',
    icon: 'Layers',
    isActive: true,
    displayOrder: 7,
    description: 'স্মার্টওয়াচ, ফিটনেস ব্যান্ড ও প্রিমিয়াম হাতঘড়ি কালেকশন',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS: StoreSettingsRecord = {
  storeName: 'MUAZ ELECTRONIC',
  tagline: 'Smart Gadgets • Better Life',
  whatsappNumber: '01822486585',
  whatsappIntl: '8801822486585',
  facebookUrl: 'https://www.facebook.com/share/1KwJp3ZvBy/',
  deliveryFeeInsideDhaka: 70,
  deliveryFeeOutsideDhaka: 130,
};

const DEFAULT_PRODUCTS: ProductRecord[] = [
  {
    id: 'hoco-ga6-cooler',
    name: 'Hoco GA6 Glacier AI Semiconductor Mobile Cooler',
    bengaliName: 'হোকো GA6 সেমিকন্ডাক্টর মোবাইল ফোন কুলার',
    price: 1500,
    salePrice: 1150,
    category: 'Mobile Accessories',
    brand: 'Hoco',
    stock: 133,
    status: 'published',
    isFeatured: true,
    image: '/src/assets/images/product_hoco_cooler_1792754252903.jpg',
    description: 'উচ্চক্ষমতাসম্পন্ন সেমিকন্ডাক্টর রেফ্রিজারেশন প্রযুক্তিসম্পন্ন মোবাইল ফোন কুলিং ফ্যান।',
    features: ['সেমিকন্ডাক্টর ইনস্ট্যান্ট কুলিং অ্যালয় প্লেট', 'নীরব কিন্তু শক্তিশালী টার্বো ফ্যান মোটর'],
  },
  {
    id: 'hollyland-lark-m2',
    name: 'Hollyland Lark M2 1:1 MasterCopy Wireless Microphone',
    bengaliName: 'হলিভ্যান্ড লার্ক এম২ ১:১ মাস্টারকপি মাইক্রোফোন',
    price: 1800,
    salePrice: 1400,
    category: 'Audio & Microphones',
    brand: 'MasterCopy',
    stock: 75,
    status: 'published',
    isFeatured: true,
    image: '/src/assets/images/product_hollyland_mic_1792754254527.jpg',
    description: 'কনটেন্ট ক্রিয়েটরদের জন্য আল্ট্রা-লাইটওয়েট বাটন সাইজ ওয়্যারলেস মাইক্রোফোন।',
    features: ['আল্ট্রা-কমপ্যাক্ট বাটন সাইজ ৯ গ্রাম ওজন', 'হাই-ফিডেলিটি নয়েজ ক্যান্সেলেশন'],
  },
  {
    id: 'vendens-10000mah-powerbank',
    name: 'VEN-DENS 10000mAh 22.5W Fast Charging Power Bank',
    bengaliName: 'ভেন-ডেনস ১০,০০০ এমএএইচ ফাস্ট চার্জিং পাওয়ার ব্যাংক',
    price: 1300,
    salePrice: 950,
    category: 'Power Banks',
    brand: 'VEN-DENS',
    stock: 58,
    status: 'published',
    isFeatured: true,
    image: '/src/assets/images/product_vendens_powerbank_1792754254403.jpg',
    description: '২২.৫ ওয়াট সুপার ফাস্ট চার্জিং সমর্থিত কমপ্যাক্ট পাওয়ার ব্যাংক।',
    features: ['২২.৫ ওয়াট পিডি ও কিউসি ফাস্ট চার্জিং সাপোর্ট', 'ডুয়াল ইনপুট ও ট্রিপল আউটপুট পোর্ট'],
  },
  {
    id: 'frb-wireless-neckband-pro',
    name: 'FRB Signature Wireless Sports Neckband',
    bengaliName: 'এফআরবি সিগনেচার ওয়্যারলেস স্পোর্টস নেকব্যান্ড',
    price: 900,
    salePrice: 650,
    category: 'Audio & Neckbands',
    brand: 'FRB',
    stock: 110,
    status: 'published',
    isFeatured: false,
    image: '/src/assets/images/product_frb_neckband_1792754255689.jpg',
    description: 'সারাদিন স্বাচ্ছন্দ্যে গান শোনার জন্য ডিজাইনকৃত ম্যাগনেটিক ব্লুটুথ নেকব্যান্ড।',
    features: ['হাই-রেজোলিউশন ডিপ বাস ড্রাইভার', 'ম্যাগনেটিক ইয়ারবাড লক সিস্টেম'],
  },
  {
    id: 'retro-x9-game-console-500in1',
    name: 'Retro Handheld Video Game Console 500-in-1',
    bengaliName: 'রেট্রো পোর্টেবল ভিডিও গেম কনসোল ৫০০ ইন ১',
    price: 1100,
    salePrice: 800,
    category: 'Gaming Gadgets',
    brand: 'RetroPlay',
    stock: 45,
    status: 'published',
    isFeatured: false,
    image: '/src/assets/images/product_x9_console_1792754256202.jpg',
    description: 'ক্লাসিক নস্টালজিক গেমের সমৃদ্ধ লাইব্রেরিসহ পোর্টেবল হ্যান্ডহেল্ড গেমিং কনসোল।',
    features: ['৫০০টি ক্লাসিক রেট্রো গেম প্রি-ইনস্টল্ড', 'টিভি-আউট কেবল সাপোর্ট'],
  },
  {
    id: 'apple-airpods-black-mastercopy',
    name: 'Apple AirPods Matte Black Edition MasterCopy TWS',
    bengaliName: 'অ্যাপল এয়ারপডস ব্ল্যাক স্পেশাল এডিশন মাস্টারকপি',
    price: 1200,
    salePrice: 850,
    category: 'Audio & Earbuds',
    brand: 'MasterCopy',
    stock: 90,
    status: 'published',
    isFeatured: false,
    image: '/src/assets/images/product_airpods_black_1792754256092.jpg',
    description: 'প্রিমিয়াম ম্যাট ব্ল্যাক ফিনিশের স্পেশাল এডিশন ওয়্যারলেস এয়ারপডস মাস্টারকপি।',
    features: ['এক্সক্লুসিভ স্টেলথ ম্যাট ব্ল্যাক ফিনিশ', 'স্মার্ট টাচ কন্ট্রোল'],
  },
];

function readDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DatabaseSchema = {
      categories: DEFAULT_CATEGORIES,
      products: DEFAULT_PRODUCTS,
      settings: DEFAULT_SETTINGS,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseSchema;
    let modified = false;

    if (!parsed.categories || parsed.categories.length === 0) {
      parsed.categories = DEFAULT_CATEGORIES;
      modified = true;
    }

    if (!parsed.products || parsed.products.length === 0) {
      parsed.products = DEFAULT_PRODUCTS;
      modified = true;
    }

    if (modified) {
      writeDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading database file:', err);
    return {
      categories: DEFAULT_CATEGORIES,
      products: DEFAULT_PRODUCTS,
      settings: DEFAULT_SETTINGS,
    };
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// -----------------------------------------------------------------------------
// DYNAMIC CATEGORY MANAGEMENT API ROUTES
// -----------------------------------------------------------------------------

// 1. Get active categories (for public storefront & filters)
app.get('/api/categories', (_req: Request, res: Response) => {
  const db = readDb();
  const activeCategories = db.categories
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  res.json(activeCategories);
});

// 2. Get all categories (for admin management with product counts)
app.get('/api/categories/admin', (_req: Request, res: Response) => {
  const db = readDb();
  const categoriesWithCounts = db.categories
    .map((cat) => {
      const count = db.products.filter((p) => p.category === cat.name).length;
      return {
        ...cat,
        productCount: count,
      };
    })
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  res.json(categoriesWithCounts);
});

// 3. Create a new category
app.post('/api/categories', (req: Request, res: Response) => {
  const { name, bengaliName, icon, image, description } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'ক্যাটাগরির নাম অবশ্যই দিতে হবে' });
  }

  const trimmedName = name.trim();
  const db = readDb();

  const existing = db.categories.find(
    (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ error: 'এই নামের ক্যাটাগরি ইতিমধ্যে বিদ্যমান' });
  }

  const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now()}`;
  const maxOrder = db.categories.reduce((max, c) => Math.max(max, c.displayOrder || 0), 0);
  const now = new Date().toISOString();

  const newCategory: CategoryRecord = {
    id: (typeof req.body.id === 'string' && req.body.id.trim())
      ? req.body.id.trim()
      : crypto.randomUUID(),
    name: trimmedName,
    bengaliName: bengaliName ? String(bengaliName).trim() : undefined,
    slug,
    icon: icon ? String(icon).trim() : 'Layers',
    image: image ? String(image).trim() : undefined,
    description: description ? String(description).trim() : undefined,
    isActive: true,
    displayOrder: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };

  db.categories.push(newCategory);
  writeDb(db);

  return res.status(201).json({
    category: {
      ...newCategory,
      productCount: 0,
    },
    success: true,
  });
});

// 4. Update an existing category (Requirement 8: cascading rename)
app.put('/api/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, bengaliName, slug, icon, image, description, isActive, displayOrder } = req.body;

  const db = readDb();
  const categoryIndex = db.categories.findIndex((c) => c.id === id);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: 'ক্যাটাগরি খুঁজে পাওয়া যায়নি' });
  }

  const oldCategory = db.categories[categoryIndex];
  const oldName = oldCategory.name;
  const newName = name && typeof name === 'string' ? name.trim() : oldName;

  // If name changed, check uniqueness
  if (newName.toLowerCase() !== oldName.toLowerCase()) {
    const conflict = db.categories.find(
      (c) => c.id !== id && c.name.toLowerCase() === newName.toLowerCase()
    );
    if (conflict) {
      return res.status(400).json({ error: 'এই নামের অন্য একটি ক্যাটাগরি ইতিমধ্যে বিদ্যমান' });
    }
  }

  const now = new Date().toISOString();
  const updatedCategory: CategoryRecord = {
    ...oldCategory,
    name: newName,
    bengaliName: bengaliName !== undefined ? (bengaliName ? String(bengaliName).trim() : '') : oldCategory.bengaliName,
    slug: slug ? String(slug).trim() : oldCategory.slug,
    icon: icon !== undefined ? String(icon).trim() : oldCategory.icon,
    image: image !== undefined ? (image ? String(image).trim() : '') : oldCategory.image,
    description: description !== undefined ? (description ? String(description).trim() : '') : oldCategory.description,
    isActive: typeof isActive === 'boolean' ? isActive : oldCategory.isActive,
    displayOrder: typeof displayOrder === 'number' ? displayOrder : oldCategory.displayOrder,
    updatedAt: now,
  };

  db.categories[categoryIndex] = updatedCategory;

  // Requirement 8: When a category is renamed, cascade update to all products linked to oldName
  let updatedProductsCount = 0;
  if (newName !== oldName) {
    db.products = db.products.map((p) => {
      if (p.category === oldName) {
        updatedProductsCount++;
        return {
          ...p,
          category: newName,
          updatedAt: now,
        };
      }
      return p;
    });
  }

  writeDb(db);

  const productCount = db.products.filter((p) => p.category === newName).length;

  return res.json({
    category: {
      ...updatedCategory,
      productCount,
    },
    updatedProductsCount,
    success: true,
  });
});

// 5. Reorder categories (Requirement 5: drag-and-drop or display order management)
app.patch('/api/categories/reorder', (req: Request, res: Response) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds array required' });
  }

  const db = readDb();
  const now = new Date().toISOString();

  orderedIds.forEach((id: string, index: number) => {
    const category = db.categories.find((c) => c.id === id);
    if (category) {
      category.displayOrder = index + 1;
      category.updatedAt = now;
    }
  });

  db.categories.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  writeDb(db);

  return res.json({ success: true, categories: db.categories });
});

// 6. Toggle category active/inactive status (Requirement 3)
app.patch('/api/categories/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const category = db.categories.find((c) => c.id === id);
  if (!category) {
    return res.status(404).json({ error: 'ক্যাটাগরি খুঁজে পাওয়া যায়নি' });
  }

  category.isActive = !category.isActive;
  category.updatedAt = new Date().toISOString();
  writeDb(db);

  return res.json({ success: true, category });
});

// 7. Delete category with accidental deletion prevention & reassignment (Requirement 9)
app.delete('/api/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const reassignTo = req.query.reassignTo as string | undefined || req.body?.reassignTo as string | undefined;

  const db = readDb();
  const category = db.categories.find((c) => c.id === id);
  if (!category) {
    return res.status(404).json({ error: 'ক্যাটাগরি পাওয়া যায়নি' });
  }

  const categoryName = category.name;
  const linkedProducts = db.products.filter((p) => p.category === categoryName);

  // If there are linked products and NO reassignment target provided:
  if (linkedProducts.length > 0 && !reassignTo) {
    return res.status(400).json({
      error: `এই ক্যাটাগরিতে ${linkedProducts.length} টি প্রোডাক্ট রয়েছে। দুর্ঘটনা রোধে প্রোডাক্টগুলো অন্য কোনো ক্যাটাগরিতে স্থানান্তর (reassign) করুন।`,
      productCount: linkedProducts.length,
      requiresReassignment: true,
    });
  }

  // If reassignment is provided, verify target category exists
  if (linkedProducts.length > 0 && reassignTo) {
    const targetCategory = db.categories.find(
      (c) => c.name.toLowerCase() === reassignTo.trim().toLowerCase() && c.id !== id
    );
    if (!targetCategory) {
      return res.status(400).json({ error: 'স্থানান্তরের জন্য নির্বাচিত ক্যাটাগরি বিদ্যমান নয়' });
    }

    const now = new Date().toISOString();
    db.products = db.products.map((p) => {
      if (p.category === categoryName) {
        return {
          ...p,
          category: targetCategory.name,
          updatedAt: now,
        };
      }
      return p;
    });
  }

  // Remove the category
  db.categories = db.categories.filter((c) => c.id !== id);
  writeDb(db);

  return res.json({
    success: true,
    reassignedCount: linkedProducts.length,
    reassignedTo: reassignTo || null,
  });
});

// -----------------------------------------------------------------------------
// PRODUCTS API ROUTES
// -----------------------------------------------------------------------------
app.get('/api/products', (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.products);
});

app.post('/api/products', (req: Request, res: Response) => {
  const productData = req.body;
  const db = readDb();
  const now = new Date().toISOString();

  const newProduct: ProductRecord = {
    ...productData,
    id: productData.id || `product-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
    updatedAt: now,
  };

  db.products.unshift(newProduct);
  writeDb(db);

  res.status(201).json({ product: newProduct, success: true });
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const db = readDb();

  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'প্রোডাক্ট পাওয়া যায়নি' });
  }

  const updated: ProductRecord = {
    ...db.products[index],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };

  db.products[index] = updated;
  writeDb(db);

  res.json({ product: updated, success: true });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();

  db.products = db.products.filter((p) => p.id !== id);
  writeDb(db);

  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// SETTINGS API ROUTES
// -----------------------------------------------------------------------------
app.get('/api/settings', (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.settings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  const newSettings = req.body;
  const db = readDb();

  db.settings = {
    ...db.settings,
    ...newSettings,
  };
  writeDb(db);

  res.json({ settings: db.settings, success: true });
});

// -----------------------------------------------------------------------------
// GOOGLE SEARCH CONSOLE HTML VERIFICATION HANDLER
// -----------------------------------------------------------------------------
app.get('/google:hash.html', (req: Request, res: Response, next) => {
  const fileName = `google${req.params.hash}.html`;
  const publicFile = path.join(__dirname, 'public', fileName);
  const distFile = path.join(__dirname, 'dist', fileName);

  if (fs.existsSync(publicFile)) {
    return res.type('text/html').sendFile(publicFile);
  }
  if (fs.existsSync(distFile)) {
    return res.type('text/html').sendFile(distFile);
  }
  next();
});

// -----------------------------------------------------------------------------
// DEV VITE MIDDLEWARE OR PRODUCTION STATIC SERVING
// -----------------------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MUAZ Electronic server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
