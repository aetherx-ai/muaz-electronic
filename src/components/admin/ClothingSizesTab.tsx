import React, { useState, useMemo } from 'react';
import {
  Ruler,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Edit2,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { CLOTHING_SIZES, ClothingSize, Product, SizeInventoryMap, Category } from '../../types';
import {
  getEnabledSizes,
  hasEnabledSizes,
  sanitizeWholeStock,
} from '../../lib/sizeInventory';
import { getCategoryDisplayLabel } from '../../lib/categoryUtils';
import {
  ClothingSizeStockManager,
  SizeDraftMap,
} from './ClothingSizeStockManager';

interface ClothingSizesTabProps {
  products: Product[];
  categories?: (string | Category)[];
  onUpdateSizeStock: (
    productId: string,
    sizeInventory: SizeInventoryMap | null,
    fallbackStock?: number
  ) => Promise<{ success: boolean; error: string | null }>;
  onEditProduct: (product: Product) => void;
  onAddNewProduct: () => void;
  onRefreshData?: () => void;
}

export const ClothingSizesTab: React.FC<ClothingSizesTabProps> = ({
  products,
  categories = [],
  onUpdateSizeStock,
  onEditProduct,
  onAddNewProduct,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'sized' | 'unsized' | 'attention'>('all');
  const [editingDrafts, setEditingDrafts] = useState<Record<string, SizeDraftMap>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const buildInitialSizeDraft = (product: Product): SizeDraftMap => ({
    S: {
      enabled: Boolean(product.sizeInventory?.S?.enabled),
      stock: product.sizeInventory?.S?.enabled
        ? sanitizeWholeStock(product.sizeInventory.S.stock)
        : 0,
    },
    M: {
      enabled: Boolean(product.sizeInventory?.M?.enabled),
      stock: product.sizeInventory?.M?.enabled
        ? sanitizeWholeStock(product.sizeInventory.M.stock)
        : 0,
    },
    L: {
      enabled: Boolean(product.sizeInventory?.L?.enabled),
      stock: product.sizeInventory?.L?.enabled
        ? sanitizeWholeStock(product.sizeInventory.L.stock)
        : 0,
    },
    XL: {
      enabled: Boolean(product.sizeInventory?.XL?.enabled),
      stock: product.sizeInventory?.XL?.enabled
        ? sanitizeWholeStock(product.sizeInventory.XL.stock)
        : 0,
    },
    XXL: {
      enabled: Boolean(product.sizeInventory?.XXL?.enabled),
      stock: product.sizeInventory?.XXL?.enabled
        ? sanitizeWholeStock(product.sizeInventory.XXL.stock)
        : 0,
    },
  });

  // Aggregate metrics across clothing size products
  const sizeMetrics = useMemo(() => {
    let sizedProductsCount = 0;
    let totalEnabledSlots = 0;
    let totalSizedUnits = 0;
    let lowStockSizesCount = 0;
    let outOfStockSizesCount = 0;

    for (const p of products) {
      const enabled = getEnabledSizes(p);
      if (enabled.length > 0) {
        sizedProductsCount++;
        totalEnabledSlots += enabled.length;
        for (const sz of enabled) {
          totalSizedUnits += sz.stock;
          if (sz.stock <= 0) outOfStockSizesCount++;
          else if (sz.stock <= 5) lowStockSizesCount++;
        }
      }
    }

    return {
      sizedProductsCount,
      totalEnabledSlots,
      totalSizedUnits,
      lowStockSizesCount,
      outOfStockSizesCount,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const isSized = hasEnabledSizes(p);
        const enabled = getEnabledSizes(p);
        const needsAttention = enabled.some((e) => e.stock <= 5);

        if (filterMode === 'sized' && !isSized) return false;
        if (filterMode === 'unsized' && isSized) return false;
        if (filterMode === 'attention' && !needsAttention) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBengali = p.bengaliName?.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          if (!matchName && !matchBengali && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Show sized products first, then alphabetical
        const aSized = hasEnabledSizes(a) ? 0 : 1;
        const bSized = hasEnabledSizes(b) ? 0 : 1;
        if (aSized !== bSized) return aSized - bSized;
        return a.name.localeCompare(b.name);
      });
  }, [products, filterMode, search]);

  const handleToggleExpand = (product: Product) => {
    setExpandedIds((prev) => {
      const next = !prev[product.id];
      if (next && !editingDrafts[product.id]) {
        setEditingDrafts((drafts) => ({
          ...drafts,
          [product.id]: buildInitialSizeDraft(product),
        }));
      }
      return { ...prev, [product.id]: next };
    });
  };

  const handleSaveProductSizes = async (
    product: Product
  ): Promise<{ success: boolean; error?: string | null; message?: string }> => {
    const draft = editingDrafts[product.id] || buildInitialSizeDraft(product);
    const updatedInventory: SizeInventoryMap = {};
    let hasAnyEnabled = false;
    for (const sz of CLOTHING_SIZES) {
      const entry = draft[sz];
      const enabled = Boolean(entry?.enabled);
      updatedInventory[sz] = {
        enabled,
        stock: enabled ? sanitizeWholeStock(entry?.stock) : 0,
      };
      if (enabled) hasAnyEnabled = true;
    }

    const res = await onUpdateSizeStock(
      product.id,
      hasAnyEnabled ? updatedInventory : null,
      product.stock
    );

    if (res.success) {
      setEditingDrafts((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      return {
        success: true,
        message: hasAnyEnabled
          ? 'Size inventory updated and saved to database.'
          : 'Clothing sizes disabled; standard stock preserved.',
      };
    }

    return { success: false, error: res.error || 'Failed to save size inventory.' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
            ক্লোথিং সাইজ ও ইনভেন্টরি (S – XXL)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            প্রতিটি পোশাকের জন্য S, M, L, XL এবং XXL সাইজ সক্রিয়/নিষ্ক্রিয় করুন এবং আলাদাভাবে স্টক নিয়ন্ত্রণ করুন
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefreshData && (
            <button
              type="button"
              onClick={onRefreshData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-[10px] transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>সিঙ্ক করুন</span>
            </button>
          )}
          <button
            type="button"
            onClick={onAddNewProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[10px] transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>নতুন প্রোডাক্ট যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">সাইজযুক্ত প্রোডাক্ট</span>
            <div className="text-2xl font-bold text-slate-900 font-display tabular-nums mt-1">
              {sizeMetrics.sizedProductsCount}
              <span className="text-xs font-normal text-slate-400 ml-1">/ {products.length}</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">মোট {sizeMetrics.totalSizedUnits} পিস সাইজ স্টক</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#ECFDF3] border border-emerald-200/80 text-[#16A34A] flex items-center justify-center shrink-0">
            <Ruler className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">সক্রিয় সাইজ ভ্যারিয়েন্ট</span>
            <div className="text-2xl font-bold text-[#15803D] font-display tabular-nums mt-1">
              {sizeMetrics.totalEnabledSlots}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">সক্রিয় S–XXL স্লট সংখ্যা</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-200/80 text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">লো-স্টক সাইজ</span>
            <div className="text-2xl font-bold text-amber-600 font-display tabular-nums mt-1">
              {sizeMetrics.lowStockSizesCount}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">১–৫ পিস বাকি রয়েছে</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">আউট অব স্টক সাইজ</span>
            <div className="text-2xl font-bold text-rose-600 font-display tabular-nums mt-1">
              {sizeMetrics.outOfStockSizesCount}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">স্টোরফ্রন্টে অনুপলব্ধ</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="প্রোডাক্টের নাম বা ক্যাটাগরি দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1 rounded-[10px] border border-slate-200/80 text-xs">
          {[
            { id: 'all', label: `সব পণ্য (${products.length})` },
            { id: 'sized', label: `সাইজ সক্রিয় (${sizeMetrics.sizedProductsCount})` },
            { id: 'attention', label: 'লো / শেষ স্টক' },
            { id: 'unsized', label: `স্ট্যান্ডার্ড (${products.length - sizeMetrics.sizedProductsCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id as any)}
              className={`px-3 py-1.5 rounded-[8px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                filterMode === tab.id
                  ? 'bg-white text-[#15803D] shadow-2xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Size Matrix Table */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] overflow-hidden shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-800">কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              অন্য ফিল্টার বা সার্চ কি-ওয়ার্ড ব্যবহার করুন অথবা নতুন পোশাক পণ্য যুক্ত করুন।
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80">
            {filteredProducts.map((p) => {
              const sized = hasEnabledSizes(p);
              const isExpanded = Boolean(expandedIds[p.id]);
              const sizeDraft = editingDrafts[p.id] || buildInitialSizeDraft(p);
              const isSizeDirty =
                Boolean(editingDrafts[p.id]) &&
                CLOTHING_SIZES.some((sz) => {
                  const orig = p.sizeInventory?.[sz];
                  const origEnabled = Boolean(orig?.enabled);
                  const origStock = origEnabled ? sanitizeWholeStock(orig?.stock) : 0;
                  const draftEntry = sizeDraft[sz];
                  const draftStock = draftEntry.enabled
                    ? sanitizeWholeStock(draftEntry.stock)
                    : 0;
                  return draftEntry.enabled !== origEnabled || draftStock !== origStock;
                });

              return (
                <div key={p.id} className="transition-colors">
                  {/* Product Summary Row */}
                  <div className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 rounded-[10px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                            {p.name}
                          </h3>
                          {sized ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[#ECFDF3] text-[#15803D] border border-emerald-200/80 shrink-0">
                              সাইজ সক্রিয়
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              স্ট্যান্ডার্ড স্টক
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{getCategoryDisplayLabel(p.category, categories)}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono font-semibold text-slate-700 tabular-nums">
                            ৳{(p.salePrice || p.price).toLocaleString()}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono font-semibold text-slate-800 tabular-nums">
                            মোট স্টক: {p.stock} পিস
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Five Size Quick Matrix Badges (S, M, L, XL, XXL) */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-between lg:justify-end shrink-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {CLOTHING_SIZES.map((sz: ClothingSize) => {
                          const entry = p.sizeInventory?.[sz];
                          const enabled = Boolean(entry?.enabled);
                          const qty = enabled ? sanitizeWholeStock(entry?.stock) : 0;

                          return (
                            <div
                              key={sz}
                              className={`px-2 py-1 rounded-[8px] border text-[11px] font-mono tabular-nums flex items-center gap-1 ${
                                !enabled
                                  ? 'bg-slate-50 text-slate-400 border-slate-200/80'
                                  : qty <= 0
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : qty <= 5
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-[#ECFDF3] text-[#15803D] border-emerald-200'
                              }`}
                              title={enabled ? `Size ${sz}: ${qty} pcs` : `Size ${sz}: Disabled`}
                            >
                              <span className="font-bold">{sz}</span>
                              <span className="text-slate-300">/</span>
                              <span>{enabled ? qty : '—'}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditProduct(p)}
                          className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-[10px] transition-colors"
                          title="পূর্ণ এডিট ফর্ম খুলুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleExpand(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            isExpanded
                              ? 'bg-[#16A34A] text-white border-[#16A34A]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-[#16A34A] hover:text-[#15803D]'
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'বন্ধ করুন' : sized ? 'স্টক এডিট' : 'সাইজ যুক্ত করুন'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Size Editor */}
                  {isExpanded && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 bg-[#F8FAF9] border-t border-slate-100">
                      <ClothingSizeStockManager
                        compact
                        value={sizeDraft}
                        onChange={(next) =>
                          setEditingDrafts((prev) => ({
                            ...prev,
                            [p.id]: next,
                          }))
                        }
                        onSaveChanges={() => handleSaveProductSizes(p)}
                        saveButtonLabel="সাইজ স্টক সেভ করুন"
                        isDirty={isSizeDirty}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
