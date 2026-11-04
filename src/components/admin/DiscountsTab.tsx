import React, { useState, useMemo, useEffect } from 'react';
import {
  TicketPercent,
  Plus,
  Search,
  Copy,
  Check,
  Calendar,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Tag,
  Percent,
  Sparkles,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { Coupon } from '../../types';

interface DiscountsTabProps {
  onRefreshData?: () => void;
}

const STORAGE_KEY_COUPONS = 'muaz_admin_coupons_v1';

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-muaz10',
    code: 'MUAZ10',
    description: '১০% ওয়েলকাম ডিসকাউন্ট প্রথম অর্ডারে',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 1000,
    maxDiscount: 300,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 500,
    usedCount: 84,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coup-gadget20',
    code: 'GADGET20',
    description: 'স্মার্ট গ্যাজেটস ২০% মেগা সেভিংস অফার',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 2000,
    maxDiscount: 500,
    startDate: '2026-02-01',
    endDate: '2026-11-30',
    usageLimit: 200,
    usedCount: 142,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coup-save100',
    code: 'SAVE100',
    description: '৳১০০ ফ্ল্যাট ক্যাশব্যাক যেকোনো অর্ডারে',
    discountType: 'fixed',
    discountValue: 100,
    minOrderValue: 1200,
    startDate: '2026-03-01',
    endDate: '2026-12-31',
    usageLimit: 300,
    usedCount: 195,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coup-eidfest',
    code: 'EIDFEST',
    description: 'উৎসবের বিশেষ ডিসকাউন্ট ভাউচার',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 2500,
    maxDiscount: 600,
    startDate: '2026-01-01',
    endDate: '2026-05-01',
    usageLimit: 150,
    usedCount: 150,
    isActive: false,
    createdAt: new Date().toISOString(),
  },
];

export const DiscountsTab: React.FC<DiscountsTabProps> = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COUPONS);
      return raw ? JSON.parse(raw) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newValue, setNewValue] = useState<number>(10);
  const [newMinOrder, setNewMinOrder] = useState<number>(1000);
  const [newMaxDiscount, setNewMaxDiscount] = useState<number>(300);
  const [newEndDate, setNewEndDate] = useState<string>('2026-12-31');
  const [newUsageLimit, setNewUsageLimit] = useState<number>(100);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(coupons));
    } catch (e) {
      console.error('Failed to save coupons:', e);
    }
  }, [coupons]);

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const handleDeleteCoupon = (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই কুপনটি ডিলিট করতে চান?')) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const cleanCode = newCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      setModalError('কুপন কোড সঠিকভাবে দিন');
      return;
    }

    if (coupons.some((c) => c.code === cleanCode)) {
      setModalError('এই কোডের কুপন ইতিমধ্যে বিদ্যমান');
      return;
    }

    if (newValue <= 0) {
      setModalError('ডিসকাউন্টের মান ০ এর চেয়ে বেশি হতে হবে');
      return;
    }

    const created: Coupon = {
      id: `coup-${Date.now()}`,
      code: cleanCode,
      description: newDescription.trim() || undefined,
      discountType: newType,
      discountValue: Number(newValue),
      minOrderValue: newMinOrder ? Number(newMinOrder) : undefined,
      maxDiscount: newType === 'percentage' && newMaxDiscount ? Number(newMaxDiscount) : undefined,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: newEndDate || '2026-12-31',
      usageLimit: newUsageLimit ? Number(newUsageLimit) : undefined,
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setCoupons([created, ...coupons]);
    setIsModalOpen(false);
    setNewCode('');
    setNewDescription('');
    setNewValue(10);
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (typeFilter !== 'all' && c.discountType !== typeFilter) return false;
      if (statusFilter === 'active' && !c.isActive) return false;
      if (statusFilter === 'inactive' && c.isActive) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.code.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [coupons, typeFilter, statusFilter, search]);

  // Aggregate Metrics
  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            ডিসকাউন্ট ও কুপন ম্যানেজমেন্ট
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            প্রমোশনাল অফার, ভাউচার কোড এবং ডিসকাউন্ট ক্যাম্পেইন পরিচালনা করুন
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-xl transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>নতুন কুপন তৈরি করুন</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">মোট কুপন</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 font-display tabular-nums block">
            {coupons.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">নিবন্ধিত কুপন কোড</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">সক্রিয় কুপন</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-emerald-600 font-display tabular-nums block">
            {activeCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">বর্তমানে ব্যবহারযোগ্য</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">মোট ব্যবহার সংখ্যা</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TicketPercent className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 font-display tabular-nums block">
            {totalRedemptions}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">গ্রাহক রিডেম্পশন</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">নিষ্ক্রিয় / মেয়াদের শেষ</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-600 font-display tabular-nums block">
            {coupons.length - activeCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">স্থগিত বা মেয়াদোত্তীর্ণ</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="কুপন কোড বা বিবরণ অনুসন্ধান..."
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="all">সকল ধরন</option>
            <option value="percentage">শতাংশ (%) ডিসকাউন্ট</option>
            <option value="fixed">নির্দিষ্ট টাকা (৳) ছাড়</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="active">সক্রিয় (Active)</option>
            <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {filteredCoupons.length === 0 ? (
          <div className="py-16 text-center">
            <TicketPercent className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">কোনো কুপন পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1">
              ফিল্টার পরিবর্তন করুন অথবা নতুন একটি কুপন কোড তৈরি করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">কুপন কোড</th>
                  <th className="py-3 px-4">ডিসকাউন্ট মান</th>
                  <th className="py-3 px-4">শর্ত / বিবরণ</th>
                  <th className="py-3 px-4">ব্যবহারের হার</th>
                  <th className="py-3 px-4">মেয়াদকাল</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => {
                  const isCopied = copiedCode === coupon.code;
                  const usagePct = coupon.usageLimit
                    ? Math.round((coupon.usedCount / coupon.usageLimit) * 100)
                    : 0;

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80 tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => copyCouponCode(coupon.code)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title="কপি করুন"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}% ছাড়`
                            : `৳${coupon.discountValue} ছাড়`}
                        </span>
                      </td>

                      {/* Description & Rules */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-medium text-slate-800 block truncate">
                          {coupon.description || 'বিশেষ প্রমোশনাল ডিসকাউন্ট'}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          নূন্যতম অর্ডার: ৳{(coupon.minOrderValue || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-700 font-semibold">{coupon.usedCount} বার</span>
                            <span className="text-slate-400">সীমা: {coupon.usageLimit || 'সীমাহীন'}</span>
                          </div>
                          {coupon.usageLimit && (
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-900 rounded-full"
                                style={{ width: `${Math.min(100, usagePct)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        <span>{coupon.endDate} পর্যন্ত</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(coupon.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                            coupon.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {coupon.isActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয়'}
                        </button>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="কুপন মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 text-slate-900 rounded-xl">
                  <TicketPercent className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  নতুন ডিসকাউন্ট কুপন তৈরি
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">কুপন কোড (যেমন: MUAZ20)</label>
                <input
                  type="text"
                  required
                  placeholder="CODE20"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">বিবরণ / ক্যাম্পেইনের নাম</label>
                <input
                  type="text"
                  placeholder="প্রথম অর্ডারে ২০% ছাড়"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ছাড়ের ধরন</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="percentage">শতাংশ (%)</option>
                    <option value="fixed">নির্দিষ্ট টাকা (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {newType === 'percentage' ? 'শতাংশ পরিমাণ (%)' : 'টাকার পরিমাণ (৳)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={newType === 'percentage' ? 100 : 10000}
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">নূন্যতম অর্ডার (৳)</label>
                  <input
                    type="number"
                    value={newMinOrder}
                    onChange={(e) => setNewMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">মেয়াদ শেষ তারিখ</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">সর্বোচ্চ ব্যবহার সীমা (Limit)</label>
                <input
                  type="number"
                  value={newUsageLimit}
                  onChange={(e) => setNewUsageLimit(Number(e.target.value))}
                  placeholder="100"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  কুপন সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
