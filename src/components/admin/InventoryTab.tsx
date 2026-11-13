import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Save,
  Check,
  RefreshCw,
  Coins,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import { CLOTHING_SIZES, Product, SizeInventoryMap } from '../../types';
import {
  getEnabledSizes,
  hasEnabledSizes,
  sanitizeWholeStock,
} from '../../lib/sizeInventory';
import {
  ClothingSizeStockManager,
  SizeDraftMap,
} from './ClothingSizeStockManager';

interface InventoryTabProps {
  products: Product[];
  onUpdateStock: (productId: string, newStock: number) => Promise<{ success: boolean; error: string | null }>;
  onUpdateSizeStock?: (
    productId: string,
    sizeInventory: SizeInventoryMap | null,
    fallbackStock?: number
  ) => Promise<{ success: boolean; error: string | null }>;
  onRefreshData?: () => void;
  initialStockFilter?: 'all' | 'healthy' | 'low' | 'out';
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  products,
  onUpdateStock,
  onUpdateSizeStock,
  onRefreshData,
  initialStockFilter,
}) => {
  const [search, setSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'healthy' | 'low' | 'out'>(
    initialStockFilter || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingStocks, setEditingStocks] = useState<Record<string, number>>({});
  const [editingSizeDrafts, setEditingSizeDrafts] = useState<Record<string, SizeDraftMap>>({});
  const [expandedSizeIds, setExpandedSizeIds] = useState<Record<string, boolean>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [savedSuccessIds, setSavedSuccessIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialStockFilter) {
      setStockStatusFilter(initialStockFilter);
    }
  }, [initialStockFilter]);

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

  // Unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  }, [products]);

  // Aggregate metrics
  const totalUnits = useMemo(() => products.reduce((acc, p) => acc + (p.stock || 0), 0), [products]);
  const totalValuation = useMemo(
    () => products.reduce((acc, p) => acc + (p.salePrice || p.price) * (p.stock || 0), 0),
    [products]
  );
  const lowStockProducts = useMemo(() => products.filter((p) => p.stock > 0 && p.stock < 10), [products]);
  const outOfStockProducts = useMemo(() => products.filter((p) => p.stock === 0), [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (categoryFilter !== 'all' && p.category !== categoryFilter) {
          return false;
        }

        if (stockStatusFilter === 'healthy' && p.stock < 10) return false;
        if (stockStatusFilter === 'low' && (p.stock < 1 || p.stock >= 10)) return false;
        if (stockStatusFilter === 'out' && p.stock > 0) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBengali = p.bengaliName?.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q);
          if (!matchName && !matchBengali && !matchBrand) return false;
        }

        return true;
      })
      .sort((a, b) => a.stock - b.stock);
  }, [products, search, stockStatusFilter, categoryFilter]);

  const handleStockChange = (productId: string, val: number) => {
    const safeVal = sanitizeWholeStock(val);
    setEditingStocks((prev) => ({ ...prev, [productId]: safeVal }));
  };

  const handleToggleExpandSizes = (product: Product) => {
    setExpandedSizeIds((prev) => {
      const nextOpen = !prev[product.id];
      if (nextOpen && !editingSizeDrafts[product.id]) {
        setEditingSizeDrafts((drafts) => ({
          ...drafts,
          [product.id]: buildInitialSizeDraft(product),
        }));
      }
      return { ...prev, [product.id]: nextOpen };
    });
  };

  const handleSaveStock = async (productId: string) => {
    const newStock = editingStocks[productId];
    if (newStock === undefined) return;

    setSavingIds((prev) => ({ ...prev, [productId]: true }));
    const res = await onUpdateStock(productId, newStock);
    setSavingIds((prev) => ({ ...prev, [productId]: false }));

    if (res.success) {
      setSavedSuccessIds((prev) => ({ ...prev, [productId]: true }));
      setTimeout(() => {
        setSavedSuccessIds((prev) => ({ ...prev, [productId]: false }));
      }, 2000);
      setEditingStocks((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
    }
  };

  const handleSaveSizeDraft = async (
    product: Product
  ): Promise<{ success: boolean; error?: string | null; message?: string }> => {
    if (!onUpdateSizeStock) {
      return { success: false, error: 'Size update handler unavailable.' };
    }
    const draft = editingSizeDrafts[product.id] || buildInitialSizeDraft(product);
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
      setEditingSizeDrafts((prev) => {
        const updated = { ...prev };
        delete updated[product.id];
        return updated;
      });
      return { success: true, message: 'Size stock saved to database.' };
    }
    return { success: false, error: res.error || 'Failed to save size stock.' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
            ইনভেন্টরি ও স্টক কন্ট্রোল
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মোট {products.length} টি পণ্যের মজুদ নিয়ন্ত্রণ ও সরাসরি রিস্টক আপডেট
          </p>
        </div>

        {onRefreshData && (
          <button
            type="button"
            onClick={onRefreshData}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-[10px] transition-colors shadow-2xs whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>ইনভেন্টরি সিঙ্ক</span>
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">মোট মজুদ পণ্য</span>
            <div className="text-2xl font-extrabold text-slate-900 font-display tabular-nums mt-1">
              {totalUnits} <span className="text-xs font-normal text-slate-400">পিস</span>
            </div>
            <span className="text-[11px] text-slate-400">{products.length} টি পণ্যের সমষ্টি</span>
          </div>
          <div className="p-3 bg-[#ECFDF3] text-[#16A34A] rounded-[10px] border border-emerald-200/70">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">ইনভেন্টরি ক্যাপিটাল</span>
            <div className="text-2xl font-extrabold text-[#16A34A] font-display tabular-nums mt-1">
              ৳{totalValuation.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">বর্তমান পণ্যের বাজারমূল্য</span>
          </div>
          <div className="p-3 bg-[#ECFDF3] text-[#15803D] rounded-[10px] border border-emerald-200/70">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
          className={`text-left bg-white border rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between transition-colors ${
            stockStatusFilter === 'low'
              ? 'border-amber-300 ring-2 ring-amber-500/15'
              : 'border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-500">লো-স্টক সতর্কতা</span>
            <div className="text-2xl font-extrabold text-amber-600 font-display tabular-nums mt-1">
              {lowStockProducts.length} <span className="text-xs font-normal text-slate-400">আইটেম</span>
            </div>
            <span className="text-[11px] text-slate-400">&lt; ১০ পিস অবশিষ্ট রয়েছে</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-[10px] border border-amber-200/70">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStockStatusFilter(stockStatusFilter === 'out' ? 'all' : 'out')}
          className={`text-left bg-white border rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between transition-colors ${
            stockStatusFilter === 'out'
              ? 'border-rose-300 ring-2 ring-rose-500/15'
              : 'border-slate-200/80 hover:border-rose-200'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-500">স্টক শেষ (আউট অব স্টক)</span>
            <div className="text-2xl font-extrabold text-rose-600 font-display tabular-nums mt-1">
              {outOfStockProducts.length} <span className="text-xs font-normal text-slate-400">আইটেম</span>
            </div>
            <span className="text-[11px] text-slate-400">অবিলম্বে রিস্টক প্রয়োজন</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-[10px] border border-rose-200/70">
            <XCircle className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="পণ্যের নাম বা মডেল দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) =>
                setStockStatusFilter(e.target.value as 'all' | 'healthy' | 'low' | 'out')
              }
              className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
            >
              <option value="all">সকল স্টক অবস্থা ({products.length})</option>
              <option value="healthy">পর্যাপ্ত স্টক (&gt;= ১০)</option>
              <option value="low">লো-স্টক (&lt; ১০)</option>
              <option value="out">আউট অব স্টক (০)</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] overflow-hidden shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#F8FAF9] border border-slate-200/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">কোনো পণ্য পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1">
              ফিল্টার বা সার্চ পরিবর্তন করে আবার চেষ্টা করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">পণ্য</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">একক মূল্য</th>
                  <th className="py-3 px-4">স্টক স্ট্যাটাস</th>
                  <th className="py-3 px-4">বর্তমান মজুদ</th>
                  <th className="py-3 px-4 text-center">ইনলাইন রিস্টক কন্ট্রোল</th>
                  <th className="py-3 px-4 text-right">স্টক ভ্যালু</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const currentVal = editingStocks[p.id] !== undefined ? editingStocks[p.id] : p.stock;
                  const hasChanged = editingStocks[p.id] !== undefined && editingStocks[p.id] !== p.stock;
                  const isSaving = savingIds[p.id] || false;
                  const isSaved = savedSuccessIds[p.id] || false;
                  const price = p.salePrice || p.price;
                  const totalItemVal = price * (p.stock || 0);

                  const sized = hasEnabledSizes(p);
                  const isSizeExpanded = Boolean(expandedSizeIds[p.id]);
                  const sizeDraft = editingSizeDrafts[p.id] || buildInitialSizeDraft(p);
                  const isSizeDirty =
                    Boolean(editingSizeDrafts[p.id]) &&
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
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-[#F8FAF9] transition-colors">
                        {/* Product */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-[8px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 max-w-xs">
                              <span className="font-semibold text-slate-900 block truncate">
                                {p.name}
                              </span>
                              {p.bengaliName && (
                                <span className="text-[11px] text-slate-500 block truncate">
                                  {p.bengaliName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/70 rounded-[6px] text-[11px] whitespace-nowrap">
                            {p.category}
                          </span>
                        </td>

                        {/* Unit Price */}
                        <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          ৳{price.toLocaleString()}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.stock === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              <span>আউট অব স্টক</span>
                            </span>
                          ) : p.stock < 10 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>লো-স্টক ({p.stock})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#ECFDF3] text-[#15803D] border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              <span>মজুদ রয়েছে ({p.stock})</span>
                            </span>
                          )}
                        </td>

                        {/* Current Stock */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                          <div>{p.stock} পিস</div>
                          {sized && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {getEnabledSizes(p).map((sz) => (
                                <span
                                  key={sz.size}
                                  className={`px-1.5 py-0.5 rounded-[6px] text-[9px] font-mono border ${
                                    sz.stock <= 0
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : sz.stock <= 5
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {sz.size}:{sz.stock}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Inline Restock Adjuster */}
                        <td className="py-3 px-4">
                          {sized && onUpdateSizeStock ? (
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleToggleExpandSizes(p)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border text-xs font-semibold transition-colors whitespace-nowrap ${
                                  isSizeExpanded
                                    ? 'bg-[#16A34A] text-white border-[#16A34A]'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>
                                  {isSizeExpanded ? 'Hide Size Stock' : 'Manage Sizes (S–XXL)'}
                                </span>
                                {isSizeExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStockChange(p.id, currentVal - 1)}
                                disabled={currentVal <= 0 || isSaving}
                                className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] transition-colors disabled:opacity-40"
                                title="১ টি কমান"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={currentVal}
                                onChange={(e) =>
                                  handleStockChange(p.id, parseInt(e.target.value, 10) || 0)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && hasChanged) {
                                    handleSaveStock(p.id);
                                  }
                                }}
                                className={`w-16 text-center py-1 text-xs font-mono font-semibold rounded-[8px] border focus:outline-none transition-colors tabular-nums ${
                                  hasChanged
                                    ? 'border-[#16A34A] bg-[#ECFDF3] text-[#15803D] ring-2 ring-[#16A34A]/15'
                                    : 'border-slate-200 bg-white text-slate-900 focus:border-[#16A34A]'
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() => handleStockChange(p.id, currentVal + 1)}
                                disabled={isSaving}
                                className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] transition-colors"
                                title="১ টি বাড়ান"
                              >
                                <Plus className="w-3 h-3" />
                              </button>

                              {hasChanged && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveStock(p.id)}
                                  disabled={isSaving}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[8px] transition-colors flex items-center gap-1 shadow-2xs whitespace-nowrap"
                                  title="সংরক্ষণ করুন"
                                >
                                  {isSaving ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                  <span>সেভ</span>
                                </button>
                              )}

                              {isSaved && (
                                <span className="text-[#16A34A] flex items-center gap-0.5 text-[11px] font-semibold animate-in fade-in">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Stock Value */}
                        <td className="py-3 px-4 text-right font-display font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          ৳{totalItemVal.toLocaleString()}
                        </td>
                      </tr>

                      {sized && isSizeExpanded && (
                        <tr className="bg-[#F8FAF9]">
                          <td colSpan={7} className="p-4 sm:px-6">
                            <ClothingSizeStockManager
                              compact
                              value={sizeDraft}
                              onChange={(next) =>
                                setEditingSizeDrafts((prev) => ({
                                  ...prev,
                                  [p.id]: next,
                                }))
                              }
                              onSaveChanges={() => handleSaveSizeDraft(p)}
                              isDirty={isSizeDirty}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
