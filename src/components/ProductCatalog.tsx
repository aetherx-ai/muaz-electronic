import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';

interface ProductCatalogProps {
  products: Product[];
  categories: string[];
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
    return products.filter((product) => {
      // Category match:
      const matchesCategory =
        selectedCategory === 'All Products' ||
        product.category === selectedCategory ||
        (selectedCategory === 'Audio & Earbuds' &&
          (product.category === 'Audio & Earbuds' ||
            product.category === 'Audio & Microphones' ||
            product.category === 'Audio & Neckbands'));

      // Search match:
      const matchesSearch =
        !searchQuery.trim() ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.bengaliName && product.bengaliName.includes(searchQuery)) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      const priceA = a.salePrice || a.price;
      const priceB = b.salePrice || b.price;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      // Put featured items higher
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <section id="products" className="py-16 sm:py-24 bg-[#070707]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#292929]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-[1.5px] bg-[#FFC928]" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#FFC928] font-display">
                CURATED GADGETS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FAFAFA] tracking-tight">
              আপনার পছন্দের প্রযুক্তি
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#A7A7A7] max-w-xl">
              কাজ, বিনোদন ও দৈনন্দিন ব্যবহারের জন্য প্রয়োজনীয় গ্যাজেট খুঁজে নিন।
            </p>
          </div>

          {/* Search bar & Sorting bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Input Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7A7A7]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="প্রোডাক্ট খুঁজুন..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-[#111111] border border-[#292929] rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/60 focus:outline-none focus:border-[#FFC928] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A7A7A7] hover:text-[#FAFAFA]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="relative flex items-center">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A7A7A7] pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto pl-8 pr-8 py-2 text-xs font-medium bg-[#111111] border border-[#292929] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFC928] cursor-pointer appearance-none"
              >
                <option value="default">প্রাইস ফিল্টার (সব)</option>
                <option value="price-asc">দাম: কম থেকে বেশি</option>
                <option value="price-desc">দাম: বেশি থেকে কম</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clean Segmented Category Tabs */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#FFC928] text-[#070707] shadow-sm'
                    : 'bg-[#111111] hover:bg-[#171717] text-[#A7A7A7] hover:text-[#FAFAFA] border border-[#292929]'
                }`}
              >
                {cat === 'All Products' ? 'সকল প্রোডাক্ট' : cat}
              </button>
            );
          })}
        </div>

        {/* Active Search/Filter summary if filtered */}
        {(searchQuery || selectedCategory !== 'All Products') && (
          <div className="mt-4 flex items-center justify-between text-xs text-[#A7A7A7]">
            <span>
              ফিল্টার অনুযায়ী মোট <strong>{filteredProducts.length}</strong> টি প্রোডাক্ট পাওয়া গেছে
            </span>
            {(searchQuery || selectedCategory !== 'All Products') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Products');
                }}
                className="text-[#FFC928] hover:underline"
              >
                ফিল্টার রিসেট করুন
              </button>
            )}
          </div>
        )}

        {/* Product Cards Grid: 3 columns desktop, 2 columns tablet, 1 or 2 mobile */}
        {filteredProducts.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-16 py-16 text-center border border-dashed border-[#292929] rounded-2xl bg-[#111111]/40">
            <p className="text-base font-semibold text-[#FAFAFA]">
              আপনার খোঁজার সাথে কোনো প্রোডাক্ট মিল পাওয়া যায়নি
            </p>
            <p className="mt-1 text-xs text-[#A7A7A7]">
              দয়া করে সঠিক বানান দিয়ে চেষ্টা করুন অথবা অন্য ক্যাটাগরি নির্বাচন করুন
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Products');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-lg transition-colors"
            >
              সকল প্রোডাক্ট প্রদর্শন করুন
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
