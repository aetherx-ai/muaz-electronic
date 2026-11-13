import {
  CLOTHING_SIZES,
  ClothingSize,
  Product,
  SizeInventoryMap,
  SizeStockEntry,
} from '../types';

export { CLOTHING_SIZES };

export function isValidClothingSize(value: unknown): value is ClothingSize {
  return typeof value === 'string' && (CLOTHING_SIZES as readonly string[]).includes(value);
}

export function createDefaultSizeInventory(): Record<ClothingSize, SizeStockEntry> {
  return {
    S: { enabled: false, stock: 0 },
    M: { enabled: false, stock: 0 },
    L: { enabled: false, stock: 0 },
    XL: { enabled: false, stock: 0 },
    XXL: { enabled: false, stock: 0 },
  };
}

export function sanitizeWholeStock(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

export function normalizeSizeInventory(input: unknown): SizeInventoryMap | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined;
  }

  const raw = input as Record<string, unknown>;
  const normalized: SizeInventoryMap = {};
  let hasAnyEnabled = false;

  for (const size of CLOTHING_SIZES) {
    const entry = raw[size];
    if (entry && typeof entry === 'object') {
      const e = entry as Record<string, unknown>;
      const enabled = Boolean(e.enabled);
      const stock = enabled ? sanitizeWholeStock(e.stock) : 0;
      normalized[size] = { enabled, stock };
      if (enabled) hasAnyEnabled = true;
    } else if (typeof entry === 'number') {
      const stock = sanitizeWholeStock(entry);
      normalized[size] = { enabled: true, stock };
      hasAnyEnabled = true;
    }
  }

  return hasAnyEnabled ? normalized : undefined;
}

export function hasEnabledSizes(
  product?: Pick<Product, 'hasSizes' | 'sizeInventory'> | null
): boolean {
  if (!product?.sizeInventory) return false;
  return CLOTHING_SIZES.some((size) => Boolean(product.sizeInventory?.[size]?.enabled));
}

export function getEnabledSizes(
  product?: Pick<Product, 'hasSizes' | 'sizeInventory'> | null
): Array<{ size: ClothingSize; stock: number }> {
  if (!product?.sizeInventory) return [];
  return CLOTHING_SIZES.filter((size) => Boolean(product.sizeInventory?.[size]?.enabled)).map(
    (size) => ({
      size,
      stock: sanitizeWholeStock(product.sizeInventory?.[size]?.stock),
    })
  );
}

export function computeTotalStockFromSizes(sizeInventory?: SizeInventoryMap | null): number {
  if (!sizeInventory) return 0;
  return CLOTHING_SIZES.reduce((sum, size) => {
    const entry = sizeInventory[size];
    if (entry?.enabled) {
      return sum + sanitizeWholeStock(entry.stock);
    }
    return sum;
  }, 0);
}

export function getProductTotalStock(
  product?: Pick<Product, 'stock' | 'hasSizes' | 'sizeInventory'> | null
): number {
  if (!product) return 0;
  if (hasEnabledSizes(product)) {
    return computeTotalStockFromSizes(product.sizeInventory);
  }
  return sanitizeWholeStock(product.stock);
}

export function getAvailableStockForSize(
  product: Pick<Product, 'stock' | 'hasSizes' | 'sizeInventory'>,
  selectedSize?: ClothingSize
): number {
  if (hasEnabledSizes(product)) {
    if (!selectedSize || !isValidClothingSize(selectedSize)) return 0;
    const entry = product.sizeInventory?.[selectedSize];
    if (!entry?.enabled) return 0;
    return sanitizeWholeStock(entry.stock);
  }
  return sanitizeWholeStock(product.stock);
}

export function isProductOutOfStock(
  product: Pick<Product, 'stock' | 'hasSizes' | 'sizeInventory'>
): boolean {
  if (hasEnabledSizes(product)) {
    return getEnabledSizes(product).every((s) => s.stock <= 0);
  }
  return sanitizeWholeStock(product.stock) <= 0;
}

export function getEffectiveUnitPrice(product: Pick<Product, 'price' | 'salePrice'>): number {
  if (
    typeof product.salePrice === 'number' &&
    product.salePrice > 0 &&
    product.salePrice < product.price
  ) {
    return product.salePrice;
  }
  return product.price;
}

export const SIZE_INVENTORY_SPEC_KEY = '__size_inventory__';

export function extractSizeInventoryFromSpecs(
  specs?: Array<{ label?: string; value?: string }> | null
): SizeInventoryMap | undefined {
  if (!Array.isArray(specs)) return undefined;
  const entry = specs.find((s) => s?.label === SIZE_INVENTORY_SPEC_KEY && typeof s?.value === 'string');
  if (!entry || !entry.value) return undefined;
  try {
    const parsed = JSON.parse(entry.value);
    return normalizeSizeInventory(parsed);
  } catch {
    return undefined;
  }
}

export function stripInternalSpecs(
  specs?: Array<{ label: string; value: string }> | null
): Array<{ label: string; value: string }> {
  if (!Array.isArray(specs)) return [];
  return specs.filter((s) => s && s.label !== SIZE_INVENTORY_SPEC_KEY);
}

export function mergeSizeInventoryIntoSpecs(
  specs?: Array<{ label: string; value: string }> | null,
  sizeInventory?: SizeInventoryMap | null
): Array<{ label: string; value: string }> {
  const cleanSpecs = stripInternalSpecs(specs);
  const normalized = normalizeSizeInventory(sizeInventory);
  if (!normalized) return cleanSpecs;
  return [
    ...cleanSpecs,
    { label: SIZE_INVENTORY_SPEC_KEY, value: JSON.stringify(normalized) },
  ];
}

