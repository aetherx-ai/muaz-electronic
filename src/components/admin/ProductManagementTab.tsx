import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Eye,
  Star,
  X,
  Package,
  Layers,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Tag,
  Percent,
} from 'lucide-react';
import { Product, ProductStatus, Category } from '../../types';

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categoryNames = useMemo(() => {
    return categories.map((c) => (typeof c === 'string' ? c : c.name));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'All' && p.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all' && p.status !== statusFilter) {
          return false;
        }

        // Stock filter
        if (stockFilter === 'instock' && p.stock <= 0) return false;
        if (stockFilter === 'lowstock' && (p.stock < 1 || p.stock >= 10)) return false;
        if (stockFilter === 'outofstock' && p.stock > 0) return false;

        // Search query
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
  }, [products, search, selectedCategory, statusFilter, stockFilter, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, statusFilter, stockFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            প্রোডাক্ট ক্যাটালগ ম্যানেজমেন্ট
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মোট {products.length} টি পণ্যের মধ্যে {filteredProducts.length} টি প্রদর্শিত
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onManageCategories && (
            <button
              onClick={onManageCategories}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>ক্যাটাগরি নিয়ন্ত্রণ</span>
            </button>
          )}

          <button
            onClick={onAddNewProduct}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>নতুন প্রোডাক্ট যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="পণ্যের নাম, বাংলা নাম বা ব্র্যান্ড..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
            />
            {search && (
              <button
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
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="All">সকল ক্যাটাগরি (All Categories)</option>
              {categoryNames.map((cat) => {
                const matchedCat = categories.find(
                  (c) =>
                    typeof c !== 'string' &&
                    c.name.trim().toLowerCase() === cat.trim().toLowerCase()
                ) as Category | undefined;
                return (
                  <option key={cat} value={cat}>
                    {cat} {matchedCat?.bengaliName ? `(${matchedCat.bengaliName})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="published">লাইভ প্রকাশিত ({products.filter((p) => p.status === 'published').length})</option>
              <option value="draft">ড্রাফট ({products.filter((p) => p.status === 'draft').length})</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">সকল স্টক অবস্থা</option>
              <option value="instock">পর্যাপ্ত স্টক (&gt;১০)</option>
              <option value="lowstock">লো স্টক (&lt;১০)</option>
              <option value="outofstock">আউট অব স্টক (০)</option>
            </select>
          </div>

        </div>

        {/* Sort Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            ফিল্টার ফলাফল: <span className="text-slate-900 font-bold font-mono">{filteredProducts.length}</span> টি পণ্য
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium hidden sm:inline">সর্টিং:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white cursor-pointer"
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

      {/* Modern Product Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              অনুসন্ধানের ফিল্টার পরিবর্তন করুন অথবা নতুন প্রোডাক্ট যুক্ত করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">প্রোডাক্ট ও ব্র্যান্ড</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">বিক্রয় মূল্য</th>
                  <th className="py-3 px-4">ডিসকাউন্ট</th>
                  <th className="py-3 px-4">স্টক স্ট্যাটাস</th>
                  <th className="py-3 px-4">ক্যাটালগ স্ট্যাটাস</th>
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
                    <tr key={p.id} className="hover:bg-slate-50/75 transition-colors group">
                      {/* Product Name & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0 shadow-2xs"
                          />
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <span className="font-bold text-slate-900 block truncate text-xs sm:text-[13px]">
                              {p.name}
                            </span>
                            {p.bengaliName && (
                              <span className="text-[11px] text-slate-500 block truncate font-bengali">
                                {p.bengaliName}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 block font-medium">
                              ব্র্যান্ড: {p.brand || 'MUAZ ELECTRONIC'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[11px] font-medium border border-slate-200/60 inline-block truncate max-w-[140px]">
                          {p.category}
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

                      {/* Attractive Discount Badge */}
                      <td className="py-3.5 px-4">
                        {hasDiscount ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                            -{discountPercentage}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-4 min-w-[120px]">
                        {p.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>আউট অব স্টক</span>
                          </span>
                        ) : p.stock < 10 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{p.stock} পিস (লো)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>{p.stock} পিস মজুদ</span>
                          </span>
                        )}
                      </td>

                      {/* Status Toggle Button */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onToggleStatus(p)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                            p.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                        >
                          {p.status === 'published' ? 'লাইভ (Live)' : 'ড্রাফট'}
                        </button>
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onToggleFeatured(p)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            p.isFeatured
                              ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                              : 'text-slate-300 hover:text-slate-600'
                          }`}
                          title={p.isFeatured ? 'ফিচার্ড থেকে সরান' : 'ফিচার্ড হিসেবে যুক্ত করুন'}
                        >
                          <Star className={`w-4 h-4 ${p.isFeatured ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="প্রোডাক্ট এডিট"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
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

        {/* Pagination Row */}
        {filteredProducts.length > itemsPerPage && (
          <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              পৃষ্ঠা <span className="font-bold font-mono text-slate-800">{currentPage}</span> / <span className="font-mono">{totalPages}</span> (মোট {filteredProducts.length} টি পণ্য)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
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
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        currentPage === pNum
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
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
