import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Product, Category } from '../types';
import { matchesCategoryFilter } from '../lib/categoryUtils';

interface ProductCatalogProps {
  products: Product[];
  categories: (string | Category)[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories,
  searchQuery,
  setSearchQuery,
  searchInputRef,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory = matchesCategoryFilter(
          product.category,
          selectedCategory,
          categories
        );

        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          (product.bengaliName && product.bengaliName.toLowerCase().includes(query)) ||
          product.category.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          (product.brand && product.brand.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const priceA = a.salePrice || a.price;
        const priceB = b.salePrice || b.price;
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        return 0;
      });
  }, [products, selectedCategory, categories, searchQuery, sortBy]);

  const dedupedCategories = useMemo(() => {
    const list: (string | Category)[] = ['All Products'];
    const seen = new Set<string>(['all products']);

    for (const cat of categories) {
      const name = (typeof cat === 'string' ? cat : cat.name).trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      list.push(cat);
    }

    return list;
  }, [categories]);

  return (
    <section id="all-products-section" className="bg-white py-8 sm:py-10">
      <div id="products" className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header + Search & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              সকল পণ্য ({filteredProducts.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#16A34A]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label="মুছে ফেলুন"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'default' | 'price-asc' | 'price-desc')}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:border-[#16A34A] cursor-pointer"
              aria-label="সাজান"
            >
              <option value="default">সাধারণ</option>
              <option value="price-asc">কম দাম আগে</option>
              <option value="price-desc">বেশি দাম আগে</option>
            </select>
          </div>
        </div>

        {/* Simple Category Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 border-b border-gray-200">
          {dedupedCategories.map((cat, idx) => {
            const catName = typeof cat === 'string' ? cat : cat.name;
            const catBengali = typeof cat === 'string' ? undefined : cat.bengaliName;
            const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();
            return (
              <button
                key={`chip-${catName}-${idx}`}
                type="button"
                onClick={() => setSelectedCategory(catName)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {catName === 'All Products' ? 'সকল পণ্য' : catBengali || catName}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border border-gray-200 rounded-md p-6">
            <p className="text-sm font-semibold text-gray-800">কোনো পণ্য পাওয়া যায়নি</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Products');
              }}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-md"
            >
              সকল পণ্য দেখুন
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
