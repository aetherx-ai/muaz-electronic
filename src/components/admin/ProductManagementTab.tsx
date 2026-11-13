import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Star,
  X,
  Package,
  Layers,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Product, Category } from '../../types';
import {
  matchesCategoryFilter,
  getCategorySelectOptions,
  getCategoryDisplayLabel,
} from '../../lib/categoryUtils';
import { getEnabledSizes, hasEnabledSizes } from '../../lib/sizeInventory';

interface ProductManagementTabProps {
  products: Product[];
  categories: (string | Category)[];
  onAddNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onToggleStatus: (product: Product) => Promise<void>;
  onToggleFeatured: (product: Product) => Promise<void>;
  onManageCategories?: () => void;
}

export const ProductManagementTab: React.FC<ProductManagementTabProps> = ({
  products,
  categories,
  onAddNewProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleStatus,
  onToggleFeatured,
  onManageCategories,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'lowstock' | 'outofstock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategory !== 'All' && !matchesCategoryFilter(p.category, selectedCategory, categories)) {
          return false;
        }
        if (statusFilter !== 'all' && p.status !== statusFilter) {
          return false;
        }
        if (stockFilter === 'instock' && p.stock <= 0) return false;
        if (stockFilter === 'lowstock' && (p.stock < 1 || p.stock >= 10)) return false;
        if (stockFilter === 'outofstock' && p.stock > 0) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBengali = p.bengaliName?.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q);
          if (!matchName && !matchBengali && !matchCat && !matchBrand) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const priceA = a.salePrice || a.price;
        const priceB = b.salePrice || b.price;
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'stock-asc') return a.stock - b.stock;
        if (sortBy === 'stock-desc') return b.stock - a.stock;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [products, categories, search, selectedCategory, statusFilter, stockFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, statusFilter, stockFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
            প্রোডাক্ট ক্যাটালগ ম্যানেজমেন্ট
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            মোট {products.length} টি পণ্যের মধ্যে {filteredProducts.length} টি প্রদর্শিত হচ্ছে
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onManageCategories && (
            <button
              type="button"
              onClick={onManageCategories}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-[10px] transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>ক্যাটাগরি</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddNewProduct}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[10px] transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>নতুন প্রোডাক্ট যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="পণ্যের নাম, বাংলা নাম বা ব্র্যান্ড..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="All">সকল ক্যাটাগরি</option>
              {getCategorySelectOptions(categories).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="published">লাইভ ({products.filter((p) => p.status === 'published').length})</option>
              <option value="draft">ড্রাফট ({products.filter((p) => p.status === 'draft').length})</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">সকল স্টক অবস্থা</option>
              <option value="instock">স্টকে আছে (&gt;০)</option>
              <option value="lowstock">লো স্টক (&lt;১০)</option>
              <option value="outofstock">আউট অব স্টক (০)</option>
            </select>
          </div>
        </div>

        {/* Sort Row */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            ফলাফল: <span className="text-slate-900 font-bold font-mono tabular-nums">{filteredProducts.length}</span> টি পণ্য
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium hidden sm:inline">সর্টিং:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[8px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:bg-white cursor-pointer"
            >
              <option value="newest">সর্বশেষ যুক্ত আগে</option>
              <option value="price-asc">মূল্য: কম থেকে বেশি</option>
              <option value="price-desc">মূল্য: বেশি থেকে কম</option>
              <option value="stock-asc">স্টক: কম থেকে বেশি</option>
              <option value="stock-desc">স্টক: বেশি থেকে কম</option>
            </select>
          </div>
        </div>
      </div>

      {/* Daraz Seller Center–Inspired Product Table */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] overflow-hidden shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-800">কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              অনুসন্ধানের ফিল্টার পরিবর্তন করুন অথবা নতুন প্রোডাক্ট যুক্ত করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">প্রোডাক্ট ও ব্র্যান্ড</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">মূল্য</th>
                  <th className="py-3 px-4">ডিসকাউন্ট</th>
                  <th className="py-3 px-4">স্টক ও সাইজ</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-center">ফিচার্ড</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((p) => {
                  const regularPrice = p.price;
                  const salePrice = p.salePrice;
                  const hasDiscount = salePrice && salePrice < regularPrice;
                  const discountPercentage = hasDiscount
                    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
                    : 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAF9]/75 transition-colors group">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-11 rounded-[10px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <span className="font-semibold text-slate-900 block truncate text-xs sm:text-[13px]">
                              {p.name}
                            </span>
                            {p.bengaliName && (
                              <span className="text-[11px] text-slate-500 block truncate font-bengali">
                                {p.bengaliName}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 block">
                              {p.brand || 'MUAZ ELECTRONIC'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <span
                          className="truncate max-w-[160px] block"
                          title={getCategoryDisplayLabel(p.category, categories)}
                        >
                          {getCategoryDisplayLabel(p.category, categories)}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        {hasDiscount ? (
                          <div>
                            <span className="font-bold text-slate-900 font-display tabular-nums text-xs sm:text-[13px] block">
                              ৳{salePrice.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-400 line-through font-mono tabular-nums block">
                              ৳{regularPrice.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-900 font-display tabular-nums text-xs sm:text-[13px]">
                            ৳{regularPrice.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-4">
                        {hasDiscount ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-bold font-mono tabular-nums bg-rose-50 text-rose-700 border border-rose-200">
                            -{discountPercentage}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Stock & Sizes */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        {p.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>আউট অব স্টক</span>
                          </span>
                        ) : p.stock < 10 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 tabular-nums">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{p.stock} পিস (লো)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#ECFDF3] text-[#15803D] border border-emerald-200 tabular-nums">
                            <CheckCircle className="w-3 h-3" />
                            <span>{p.stock} পিস মজুদ</span>
                          </span>
                        )}
                        {hasEnabledSizes(p) && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {getEnabledSizes(p).map((sz) => (
                              <span
                                key={sz.size}
                                className={`px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-semibold border tabular-nums ${
                                  sz.stock <= 0
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {sz.size}:{sz.stock}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Published / Draft Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(p)}
                          className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            p.status === 'published'
                              ? 'bg-[#ECFDF3] text-[#15803D] border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                        >
                          {p.status === 'published' ? 'Published' : 'Draft'}
                        </button>
                      </td>

                      {/* Featured Star */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleFeatured(p)}
                          className={`p-1.5 rounded-[8px] transition-colors cursor-pointer ${
                            p.isFeatured
                              ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                              : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                          title={p.isFeatured ? 'ফিচার্ড থেকে সরান' : 'ফিচার্ড হিসেবে যুক্ত করুন'}
                        >
                          <Star className={`w-4 h-4 ${p.isFeatured ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Edit & Delete Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-slate-600 hover:text-[#15803D] hover:bg-[#ECFDF3] border border-slate-200 hover:border-emerald-200 rounded-[8px] transition-colors cursor-pointer"
                            title="প্রোডাক্ট এডিট"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-[8px] transition-colors cursor-pointer"
                            title="প্রোডাক্ট ডিলিট"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > itemsPerPage && (
          <div className="p-4 bg-[#F8FAF9] border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium tabular-nums">
              পৃষ্ঠা <span className="font-bold font-mono text-slate-800">{currentPage}</span> /{' '}
              <span className="font-mono">{totalPages}</span> (মোট {filteredProducts.length} টি পণ্য)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer whitespace-nowrap"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>পূর্ববর্তী</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-[8px] text-xs font-mono font-bold transition-all cursor-pointer tabular-nums ${
                        currentPage === pNum
                          ? 'bg-[#16A34A] text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer whitespace-nowrap"
              >
                <span>পরবর্তী</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
