import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, X, SlidersHorizontal } from 'lucide-react';
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

  // Featured Products slice (exact match to reference screenshot header "ফিচার্ড পণ্য" / "সব দেখুন →")
  const featuredProducts = useMemo(() => {
    const list = products.filter((p) => p.isFeatured && p.status === 'published');
    if (list.length < 4) {
      const rest = products.filter((p) => !p.isFeatured && p.status === 'published');
      return [...list, ...rest].slice(0, 4);
    }
    return list.slice(0, 4);
  }, [products]);

  // Catalog Products with category filter, search, and sorting
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category match
      const matchesCategory =
        selectedCategory === 'All Products' ||
        product.category === selectedCategory ||
        (selectedCategory === 'Audio & Earbuds' &&
          (product.category === 'Audio & Earbuds' ||
            product.category === 'Audio & Microphones' ||
            product.category === 'Audio & Neckbands'));

      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.bengaliName && product.bengaliName.toLowerCase().includes(query)) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        (product.brand && product.brand.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      const priceA = a.salePrice || a.price;
      const priceB = b.salePrice || b.price;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      return 0;
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleViewAllClick = () => {
    setSelectedCategory('All Products');
    setSearchQuery('');
    const element = document.getElementById('all-products-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F8FAF9] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* ========================================================= */}
        {/* 1. FEATURED PRODUCTS (EXACT MATCH TO REFERENCE SCREENSHOT) */}
        {/* ========================================================= */}
        <section id="featured" className="mb-10 sm:mb-14">
          
          {/* Section Header: "ফিচার্ড পণ্য" on Left, "সব দেখুন →" on Right */}
          <div className="flex items-center justify-between mb-3.5 sm:mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[19px] sm:text-[23px] font-extrabold text-[#111827] tracking-tight font-bengali">
                ফিচার্ড পণ্য
              </h2>
            </div>

            <button
              type="button"
              onClick={handleViewAllClick}
              className="text-[12.5px] sm:text-[13.5px] font-semibold text-[#16A34A] hover:text-[#15803D] flex items-center gap-1 transition-colors group"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* 2-COLUMN MOBILE PRODUCT GRID (CARD | CARD with 10-12px gap) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={`feat-${product.id}`} product={product} />
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. ALL PRODUCTS & CATEGORY DISCOVERY SECTION              */}
        {/* ========================================================= */}
        <section id="all-products-section" className="pt-6 border-t border-gray-200/60">
          
          {/* Section Header with Search & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 sm:mb-5">
            <div>
              <h2 className="text-[19px] sm:text-[23px] font-extrabold text-[#111827] tracking-tight font-bengali">
                সকল গ্যাজেট কালেকশন
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                আপনার প্রয়োজনীয় ইলেকট্রনিক্স সামগ্রী অন্বেষণ করুন
              </p>
            </div>

            {/* Search Input Box & Sort */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-68">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 stroke-[1.8]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="গ্যাজেট বা প্রোডাক্ট খুঁজুন..."
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-[13px] bg-white border border-gray-200/90 rounded-[12px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] shadow-2xs transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    aria-label="মুছে ফেলুন"
                  >
                    <X className="w-3.5 h-3.5 stroke-[1.8]" />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="pl-3 pr-7 py-2 text-xs font-medium bg-white border border-gray-200/90 rounded-[12px] text-gray-700 focus:outline-none focus:border-[#16A34A] cursor-pointer shadow-2xs appearance-none"
                >
                  <option value="default">ফিল্টার</option>
                  <option value="price-asc">দাম: কম</option>
                  <option value="price-desc">দাম: বেশি</option>
                </select>
                <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 stroke-[1.8] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Clean Rounded Category Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-3 scrollbar-none mb-5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs sm:text-[13px] font-medium rounded-full transition-all duration-150 whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#16A34A] text-white shadow-[0_2px_8px_rgba(22,163,74,0.22)]'
                      : 'bg-white hover:bg-emerald-50/50 text-[#4B5563] border border-gray-200/80 shadow-2xs'
                  }`}
                >
                  {cat === 'All Products' ? 'সকল পণ্য' : cat}
                </button>
              );
            })}
          </div>

          {/* Filter results count if active */}
          {(searchQuery || selectedCategory !== 'All Products') && (
            <div className="mb-4 flex items-center justify-between text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-200/70 shadow-2xs">
              <span>
                ফিল্টারে মোট <strong>{filteredProducts.length}</strong> টি প্রোডাক্ট পাওয়া গেছে
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Products');
                }}
                className="text-[#16A34A] font-semibold hover:underline"
              >
                রিসেট করুন
              </button>
            </div>
          )}

          {/* MAIN 2-COLUMN MOBILE PRODUCT GRID (CARD | CARD) */}
          {filteredProducts.length > 0 ? (
            <div id="products" className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-14 text-center bg-white rounded-2xl border border-gray-200/70 p-6 shadow-2xs">
              <p className="text-sm font-semibold text-gray-800">
                আপনার খোঁজার সাথে কোনো প্রোডাক্ট মিল পাওয়া যায়নি
              </p>
              <p className="mt-1 text-xs text-gray-500">
                দয়া করে সঠিক বানান দিয়ে চেষ্টা করুন অথবা অন্য ক্যাটাগরি বেছে নিন
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Products');
                }}
                className="mt-3 px-5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-full transition-colors shadow-xs"
              >
                সকল পণ্য দেখুন
              </button>
            </div>
          )}

        </section>

      </div>
    </div>
  );
};
