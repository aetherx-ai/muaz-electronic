import React, { useState, useMemo } from 'react';
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
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Product } from '../../types';

interface InventoryTabProps {
  products: Product[];
  onUpdateStock: (productId: string, newStock: number) => Promise<{ success: boolean; error: string | null }>;
  onRefreshData?: () => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  products,
  onUpdateStock,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'healthy' | 'low' | 'out'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingStocks, setEditingStocks] = useState<Record<string, number>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [savedSuccessIds, setSavedSuccessIds] = useState<Record<string, boolean>>({});

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
    return products.filter((p) => {
      // Category filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }

      // Stock status filter
      if (stockStatusFilter === 'healthy' && p.stock < 10) return false;
      if (stockStatusFilter === 'low' && (p.stock < 1 || p.stock >= 10)) return false;
      if (stockStatusFilter === 'out' && p.stock > 0) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchBengali = p.bengaliName?.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        if (!matchName && !matchBengali && !matchBrand) return false;
      }

      return true;
    }).sort((a, b) => a.stock - b.stock); // Ascending stock (lowest stock first)
  }, [products, search, stockStatusFilter, categoryFilter]);

  const handleStockChange = (productId: string, val: number) => {
    const safeVal = Math.max(0, val);
    setEditingStocks((prev) => ({ ...prev, [productId]: safeVal }));
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

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            ইনভেন্টরি ও স্টক কন্ট্রোল
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মোট {products.length} টি পণ্যের মজুদ নিয়ন্ত্রণ ও সরাসরি রিস্টক আপডেট
          </p>
        </div>

        {onRefreshData && (
          <button
            onClick={onRefreshData}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>ইনভেন্টরি সিঙ্ক</span>
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">মোট মজুদ পণ্য</span>
            <div className="text-2xl font-extrabold text-slate-900 font-display tabular-nums mt-1">
              {totalUnits} <span className="text-xs font-normal text-slate-400">পিস</span>
            </div>
            <span className="text-[11px] text-slate-400">{products.length} টি পণ্যের সমষ্টি</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">ইনভেন্টরি ক্যাপিটাল</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-display tabular-nums mt-1">
              ৳{totalValuation.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">বর্তমান পণ্যের বাজারমূল্য</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">লো-স্টক সতর্কতা</span>
            <div className="text-2xl font-extrabold text-amber-600 font-display tabular-nums mt-1">
              {lowStockProducts.length} <span className="text-xs font-normal text-slate-400">আইটেম</span>
            </div>
            <span className="text-[11px] text-slate-400">&lt; ১০ পিস অবশিষ্ট রয়েছে</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">স্টক শেষ (আউট অব স্টক)</span>
            <div className="text-2xl font-extrabold text-rose-600 font-display tabular-nums mt-1">
              {outOfStockProducts.length} <span className="text-xs font-normal text-slate-400">আইটেম</span>
            </div>
            <span className="text-[11px] text-slate-400">অবিলম্বে রিস্টক প্রয়োজন</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="পণ্যের নাম বা মডেল দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
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
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
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

                return (
                  <tr key={p.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* Product */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <span className="font-semibold text-slate-900 block truncate">{p.name}</span>
                          {p.bengaliName && (
                            <span className="text-[11px] text-slate-500 block truncate">{p.bengaliName}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                        {p.category}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">
                      ৳{price.toLocaleString()}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {p.stock === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>আউট অব স্টক</span>
                        </span>
                      ) : p.stock < 10 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>লো-স্টক ({p.stock})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>মজুদ রয়েছে ({p.stock})</span>
                        </span>
                      )}
                    </td>

                    {/* Current Stock */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {p.stock} পিস
                    </td>

                    {/* Inline Restock Adjuster */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStockChange(p.id, currentVal - 1)}
                          disabled={currentVal <= 0 || isSaving}
                          className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-40"
                          title="১ টি কমান"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={currentVal}
                          onChange={(e) => handleStockChange(p.id, parseInt(e.target.value) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && hasChanged) {
                              handleSaveStock(p.id);
                            }
                          }}
                          className={`w-16 text-center py-1 text-xs font-mono font-semibold rounded-lg border focus:outline-none transition-colors ${
                            hasChanged
                              ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-white text-slate-900'
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() => handleStockChange(p.id, currentVal + 1)}
                          disabled={isSaving}
                          className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="১ টি বাড়ান"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        {hasChanged && (
                          <button
                            type="button"
                            onClick={() => handleSaveStock(p.id)}
                            disabled={isSaving}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
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
                          <span className="text-emerald-600 flex items-center gap-0.5 text-[11px] font-semibold animate-in fade-in">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock Value */}
                    <td className="py-3 px-4 text-right font-display font-semibold text-slate-900 tabular-nums">
                      ৳{totalItemVal.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
