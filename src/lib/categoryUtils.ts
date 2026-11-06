import { Category } from '../types';

/**
 * Normalizes a category string for case-insensitive and whitespace-tolerant matching.
 */
export function normalizeCategoryString(value: string | undefined | null): string {
  if (!value) return '';
  return value.trim().toLowerCase();
}

/**
 * Finds a matching Category record from a list of categories using:
 * 1. Category name (case-insensitive)
 * 2. Category slug (case-insensitive)
 * 3. Category id (exact match)
 * 4. Bengali name (case-insensitive)
 */
export function findCategoryMatch(
  categoryValue: string | undefined | null,
  categories: (string | Category)[]
): Category | undefined {
  if (!categoryValue) return undefined;
  const cleanVal = normalizeCategoryString(categoryValue);
  if (!cleanVal) return undefined;

  for (const cat of categories) {
    if (typeof cat === 'string') {
      if (normalizeCategoryString(cat) === cleanVal) {
        return {
          id: cat,
          name: cat,
          slug: normalizeCategoryString(cat).replace(/\s+/g, '-'),
          isActive: true,
          displayOrder: 0,
        };
      }
      continue;
    }

    if (
      normalizeCategoryString(cat.name) === cleanVal ||
      (cat.slug && normalizeCategoryString(cat.slug) === cleanVal) ||
      cat.id === categoryValue ||
      (cat.bengaliName && normalizeCategoryString(cat.bengaliName) === cleanVal)
    ) {
      return cat;
    }
  }

  return undefined;
}

/**
 * Resolves any category input (slug, UUID, name, or Bengali name) to the
 * canonical English Category Name for storing in products.category (TEXT).
 */
export function getCanonicalCategoryName(
  categoryValue: string | undefined | null,
  categories: (string | Category)[]
): string {
  if (!categoryValue) return '';
  const match = findCategoryMatch(categoryValue, categories);
  return match ? match.name : categoryValue.trim();
}

/**
 * Checks if a product's stored category matches a filter category.
 * Fully supports products saved with Name, Slug, or Bengali Name.
 */
export function matchesCategoryFilter(
  productCategory: string | undefined | null,
  filterCategory: string | undefined | null,
  categories: (string | Category)[]
): boolean {
  if (
    !filterCategory ||
    filterCategory === 'All' ||
    filterCategory === 'All Products' ||
    filterCategory === 'all'
  ) {
    return true;
  }

  if (!productCategory) return false;

  const cleanProd = normalizeCategoryString(productCategory);
  const cleanFilter = normalizeCategoryString(filterCategory);

  // 1. Direct string match
  if (cleanProd === cleanFilter) return true;

  // 2. Resolve filter category object
  const filterCatObj = findCategoryMatch(filterCategory, categories);
  if (filterCatObj) {
    if (
      cleanProd === normalizeCategoryString(filterCatObj.name) ||
      (filterCatObj.slug && cleanProd === normalizeCategoryString(filterCatObj.slug)) ||
      (filterCatObj.bengaliName && cleanProd === normalizeCategoryString(filterCatObj.bengaliName)) ||
      cleanProd === filterCatObj.id
    ) {
      return true;
    }
  }

  // 3. Resolve product category object
  const prodCatObj = findCategoryMatch(productCategory, categories);
  if (prodCatObj) {
    if (
      cleanFilter === normalizeCategoryString(prodCatObj.name) ||
      (prodCatObj.slug && cleanFilter === normalizeCategoryString(prodCatObj.slug)) ||
      (prodCatObj.bengaliName && cleanFilter === normalizeCategoryString(prodCatObj.bengaliName)) ||
      cleanFilter === prodCatObj.id
    ) {
      return true;
    }

    if (filterCatObj && filterCatObj.id === prodCatObj.id) {
      return true;
    }
  }

  return false;
}

/**
 * Returns a user-friendly category display label:
 * English Name (Bengali Name)
 */
export function getCategoryDisplayLabel(
  categoryValue: string | undefined | null,
  categories: (string | Category)[]
): string {
  if (!categoryValue) return '';
  const match = findCategoryMatch(categoryValue, categories);
  if (match) {
    return match.bengaliName ? `${match.name} (${match.bengaliName})` : match.name;
  }
  return categoryValue;
}

/**
 * Generates an array of unique category options for select dropdowns,
 * guaranteed to display English and Bengali names cleanly.
 */
export function getCategorySelectOptions(
  categories: (string | Category)[],
  currentValue?: string
): { value: string; label: string; name: string; bengaliName?: string; slug?: string }[] {
  const optionsMap = new Map<string, { value: string; label: string; name: string; bengaliName?: string; slug?: string }>();

  for (const cat of categories) {
    const isObj = typeof cat !== 'string';
    const name = (isObj ? cat.name : cat).trim();
    if (!name || name === 'All' || name === 'All Products') continue;

    const key = name.toLowerCase();
    if (!optionsMap.has(key)) {
      const bengaliName = isObj ? cat.bengaliName : undefined;
      const slug = isObj ? cat.slug : undefined;
      const label = bengaliName ? `${name} (${bengaliName})` : name;
      optionsMap.set(key, {
        value: name, // Canonical storage value
        label,
        name,
        bengaliName,
        slug,
      });
    }
  }

  // If current value isn't in categories yet, include it
  if (currentValue && currentValue.trim() && currentValue !== 'All' && currentValue !== 'All Products') {
    const key = currentValue.trim().toLowerCase();
    if (!optionsMap.has(key)) {
      const match = findCategoryMatch(currentValue, categories);
      const name = match ? match.name : currentValue.trim();
      const bengaliName = match?.bengaliName;
      const label = bengaliName ? `${name} (${bengaliName})` : name;
      optionsMap.set(key, {
        value: name,
        label,
        name,
        bengaliName,
        slug: match?.slug,
      });
    }
  }

  return Array.from(optionsMap.values());
}
