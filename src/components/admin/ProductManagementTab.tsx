import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  SlidersHorizontal,
  Edit2,
  Trash2,
  CheckCircle,
  Eye,
  Star,
  X,
  Package,
} from 'lucide-react';
import { Product, ProductStatus } from '../../types';

interface ProductManagementTabProps {
  products: Product[];
  categories: string[];
  onAddNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onToggleStatus: (product: Product) => Promise<void>;
  onToggleFeatured: (product: Product) => Promise<void>;
}

export const ProductManagementTab: React.FC<ProductManagementTabProps> = ({
  products,
  categories,
  onAddNewProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleStatus,
  onToggleFeatured,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'lowstock' | 'outofstock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('newest');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
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

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchBengali = p.bengaliName?.includes(query);
        const matchCat = p.category.toLowerCase().includes(query);
        const matchBrand = p.brand?.toLowerCase().includes(query);
        if (!matchName && !matchBengali && !matchCat && !matchBrand) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'stock-asc') return a.stock - b.stock;
      if (sortBy === 'stock-desc') return b.stock - a.stock;
      // Default: newest
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [products, search, selectedCategory, statusFilter, stockFilter, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] font-display">
            প্রোডাক্ট ম্যানেজমেন্ট
          </h2>
          <p className="text-xs text-[#A7A7A7] mt-0.5">
            মোট {products.length} টি প্রোডাক্ট | বর্তমান ফিল্টারে {filteredProducts.length} টি প্রদর্শিত
          </p>
        </div>

        <button
          onClick={onAddNewProduct}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-xl transition-all shadow-md shadow-[#FFC928]/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন প্রোডাক্ট যোগ করুন</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111111] border border-[#292929] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7A7A7]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, ব্র্যান্ড বা ক্যাটাগরি দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A7A7A7] hover:text-[#FAFAFA]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFC928] cursor-pointer"
            >
              <option value="All">সকল ক্যাটাগরি</option>
              {categories.filter((c) => c !== 'All Products').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFC928] cursor-pointer"
            >
              <option value="all">সকল স্ট্যাটাস (সব)</option>
              <option value="published">কেবল প্রকাশিত (Published)</option>
              <option value="draft">ড্রাফট (Draft)</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div className="relative">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFC928] cursor-pointer"
            >
              <option value="all">সকল স্টক অবস্থা</option>
              <option value="instock">ইন স্টক (&gt; 0)</option>
              <option value="lowstock">লো-স্টক সতর্কতা (&lt; 10)</option>
              <option value="outofstock">আউট অব স্টক (0)</option>
            </select>
          </div>

        </div>

        {/* Sorting and reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#292929]/80 text-xs text-[#A7A7A7]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>সাজান:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[#FFC928] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#111111] text-[#FAFAFA]">সর্বশেষ যুক্ত</option>
              <option value="price-asc" className="bg-[#111111] text-[#FAFAFA]">মূল্য: কম থেকে বেশি</option>
              <option value="price-desc" className="bg-[#111111] text-[#FAFAFA]">মূল্য: বেশি থেকে কম</option>
              <option value="stock-asc" className="bg-[#111111] text-[#FAFAFA]">স্টক: কম থেকে বেশি</option>
              <option value="stock-desc" className="bg-[#111111] text-[#FAFAFA]">স্টক: বেশি থেকে কম</option>
            </select>
          </div>

          {(search || selectedCategory !== 'All' || statusFilter !== 'all' || stockFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setStatusFilter('all');
                setStockFilter('all');
              }}
              className="text-[#FFC928] hover:underline"
            >
              সকল ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      </div>

      {/* Products Table (Desktop) & Card List (Mobile) */}
      <div className="bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-xl">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-[#292929] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#FAFAFA]">কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি</p>
            <p className="text-xs text-[#A7A7A7] mt-1">
              ফিল্টার পরিবর্তন করুন অথবা নতুন প্রোডাক্ট তৈরি করুন
            </p>
            <button
              onClick={onAddNewProduct}
              className="mt-4 px-4 py-2 text-xs font-semibold text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-lg transition-colors"
            >
              নতুন প্রোডাক্ট যোগ করুন
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0c0c] text-[#A7A7A7] border-b border-[#292929]">
                <tr>
                  <th className="py-4 px-4 font-semibold">প্রোডাক্ট</th>
                  <th className="py-4 px-4 font-semibold">ক্যাটাগরি ও ব্র্যান্ড</th>
                  <th className="py-4 px-4 font-semibold">মূল্য (BDT)</th>
                  <th className="py-4 px-4 font-semibold">মজুদ স্টক</th>
                  <th className="py-4 px-4 font-semibold">স্ট্যাটাস</th>
                  <th className="py-4 px-4 font-semibold">ফিচার্ড</th>
                  <th className="py-4 px-4 font-semibold text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292929]">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#141414] transition-colors">
                    
                    {/* Image & Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-[#070707] border border-[#292929] shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <span className="font-semibold text-[#FAFAFA] block truncate">
                            {product.name}
                          </span>
                          {product.bengaliName && (
                            <span className="text-[11px] text-[#A7A7A7] block truncate">
                              {product.bengaliName}
                            </span>
                          )}
                          <span className="text-[10px] text-[#A7A7A7]/70 font-mono block">
                            ID: {product.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category & Brand */}
                    <td className="py-4 px-4">
                      <span className="font-medium text-[#FAFAFA] block">{product.category}</span>
                      <span className="text-[11px] text-[#A7A7A7] block">{product.brand || 'MUAZ'}</span>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#FFC928] font-display tabular-nums text-[13px]">
                        ৳{product.price.toLocaleString()}
                      </div>
                      {product.salePrice && (
                        <div className="text-[11px] text-[#A7A7A7] line-through font-mono">
                          ৳{product.salePrice.toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold tabular-nums text-xs ${
                            product.stock === 0
                              ? 'text-rose-400'
                              : product.stock < 10
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {product.stock} Units
                        </span>
                        {product.stock < 10 && product.stock > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                            Low
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/10 text-rose-400 rounded border border-rose-500/20">
                            Out
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Toggle Button */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => onToggleStatus(product)}
                        title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          product.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{product.status === 'published' ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => onToggleFeatured(product)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          product.isFeatured
                            ? 'bg-[#FFC928]/10 text-[#FFC928] border-[#FFC928]/30'
                            : 'text-[#292929] border-transparent hover:text-[#A7A7A7]'
                        }`}
                        title={product.isFeatured ? 'ফিচার্ড প্রোডাক্ট হিসেবে চিহ্নিত' : 'ফিচার্ড করুন'}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="p-2 bg-[#171717] hover:bg-[#222222] text-[#A7A7A7] hover:text-[#FFC928] border border-[#292929] rounded-lg transition-colors"
                          title="প্রোডাক্ট এডিট করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteProduct(product)}
                          className="p-2 bg-[#171717] hover:bg-rose-900/30 text-[#A7A7A7] hover:text-rose-400 border border-[#292929] hover:border-rose-500/30 rounded-lg transition-colors"
                          title="প্রোডাক্ট ডিলিট করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
