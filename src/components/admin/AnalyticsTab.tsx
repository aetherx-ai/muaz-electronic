import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Coins,
  ShoppingBag,
  Users,
  Printer,
  Download,
  Layers,
  MapPin,
  CheckCircle2,
  Truck,
  CreditCard,
} from 'lucide-react';
import { Product, CustomerOrder } from '../../types';

interface AnalyticsTabProps {
  products: Product[];
  orders: CustomerOrder[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ orders }) => {
  const [periodFilter, setPeriodFilter] = useState<'30d' | '90d' | 'all'>('all');

  // Filter orders by chosen period
  const filteredOrders = useMemo(() => {
    if (periodFilter === 'all') return orders;
    const now = Date.now();
    const days = periodFilter === '30d' ? 30 : 90;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return orders.filter((o) => new Date(o.orderDate).getTime() >= cutoff);
  }, [orders, periodFilter]);

  const nonCancelledOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status !== 'cancelled');
  }, [filteredOrders]);

  // Aggregate Metrics
  const totalRevenue = useMemo(() => {
    return nonCancelledOrders.reduce((sum, o) => sum + o.total, 0);
  }, [nonCancelledOrders]);

  const totalItemsSold = useMemo(() => {
    return nonCancelledOrders.reduce((sum, o) => {
      return sum + o.items.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0);
    }, 0);
  }, [nonCancelledOrders]);

  const averageOrderValue = useMemo(() => {
    if (nonCancelledOrders.length === 0) return 0;
    return Math.round(totalRevenue / nonCancelledOrders.length);
  }, [totalRevenue, nonCancelledOrders.length]);

  const deliveryRevenue = useMemo(() => {
    return nonCancelledOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  }, [nonCancelledOrders]);

  const deliveredOrdersCount = useMemo(() => {
    return nonCancelledOrders.filter((o) => o.status === 'delivered').length;
  }, [nonCancelledOrders]);

  const deliverySuccessRate = useMemo(() => {
    if (nonCancelledOrders.length === 0) return 0;
    return Math.round((deliveredOrdersCount / nonCancelledOrders.length) * 100);
  }, [deliveredOrdersCount, nonCancelledOrders.length]);

  // Sales by Category
  const categorySales = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; units: number; orders: number }> = {};

    nonCancelledOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.product?.category || 'Other';
        const price = item.product?.salePrice || item.product?.price || 0;
        const qty = item.quantity || 1;

        if (!map[cat]) {
          map[cat] = { name: cat, revenue: 0, units: 0, orders: 0 };
        }
        map[cat].revenue += price * qty;
        map[cat].units += qty;
        map[cat].orders += 1;
      });
    });

    const list = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    const sumRev = list.reduce((s, c) => s + c.revenue, 0) || 1;

    return list.map((item) => ({
      ...item,
      percentage: Math.min(100, Math.round((item.revenue / sumRev) * 100)),
    }));
  }, [nonCancelledOrders]);

  // Area Split (Inside vs Outside Dhaka)
  const areaDistribution = useMemo(() => {
    const insideDhaka = nonCancelledOrders.filter((o) => o.deliveryArea === 'inside_dhaka');
    const outsideDhaka = nonCancelledOrders.filter((o) => o.deliveryArea === 'outside_dhaka');
    const total = nonCancelledOrders.length || 1;

    return {
      inside: {
        count: insideDhaka.length,
        revenue: insideDhaka.reduce((s, o) => s + o.total, 0),
        percentage: nonCancelledOrders.length ? Math.round((insideDhaka.length / total) * 100) : 0,
      },
      outside: {
        count: outsideDhaka.length,
        revenue: outsideDhaka.reduce((s, o) => s + o.total, 0),
        percentage: nonCancelledOrders.length ? Math.round((outsideDhaka.length / total) * 100) : 0,
      },
    };
  }, [nonCancelledOrders]);

  // Payment Status Split
  const paymentSplit = useMemo(() => {
    const cod = nonCancelledOrders.filter((o) => (o.paymentStatus || 'cod') === 'cod');
    const paid = nonCancelledOrders.filter((o) => o.paymentStatus === 'paid');
    const total = nonCancelledOrders.length || 1;

    return {
      codCount: cod.length,
      codRevenue: cod.reduce((s, o) => s + o.total, 0),
      codPercentage: nonCancelledOrders.length ? Math.round((cod.length / total) * 100) : 0,
      paidCount: paid.length,
      paidRevenue: paid.reduce((s, o) => s + o.total, 0),
      paidPercentage: nonCancelledOrders.length ? Math.round((paid.length / total) * 100) : 0,
    };
  }, [nonCancelledOrders]);

  // Top 10 Spending Customers
  const topCustomers = useMemo(() => {
    const map: Record<
      string,
      { name: string; phone: string; address: string; area: string; orderCount: number; totalSpent: number }
    > = {};

    nonCancelledOrders.forEach((o) => {
      const p = o.phoneNumber.replace(/[\s-]/g, '');
      if (!map[p]) {
        map[p] = {
          name: o.customerName,
          phone: p,
          address: o.deliveryAddress,
          area: o.deliveryArea,
          orderCount: 1,
          totalSpent: o.total,
        };
      } else {
        map[p].orderCount += 1;
        map[p].totalSpent += o.total;
        map[p].name = o.customerName;
      }
    });

    return Object.values(map)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }, [nonCancelledOrders]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Area', 'Total (BDT)', 'Status', 'Payment'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.orderDate.slice(0, 10),
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.phoneNumber,
      o.deliveryArea,
      o.total,
      o.status || 'pending',
      o.paymentStatus || 'cod',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `muaz_sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
            বিজনেস রিপোর্ট ও সেলস অ্যানালিটিক্স
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ব্যবসায়িক প্রবৃদ্ধি, গ্রাহক ব্যয় বিশ্লেষণ ও রেভিনিউ ব্রেকডাউন
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as '30d' | '90d' | 'all')}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-[10px] text-slate-800 font-semibold focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 shadow-2xs cursor-pointer"
          >
            <option value="all">সর্বমোট সময় (All Time)</option>
            <option value="90d">গত ৯০ দিন</option>
            <option value="30d">গত ৩০ দিন</option>
          </select>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-[10px] transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            title="CSV ডাটা ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">CSV এক্সপোর্ট</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[10px] transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            title="রিপোর্ট প্রিন্ট করুন"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">প্রিন্ট রিপোর্ট</span>
          </button>
        </div>
      </div>

      {/* 5 Core Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">গ্রস রেভিনিউ</span>
            <div className="p-2 bg-[#ECFDF3] text-[#16A34A] rounded-[8px] border border-emerald-200/70">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 font-display tabular-nums block truncate">
            ৳{totalRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">নিট বিক্রিত মূল্য</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">সফল অর্ডার</span>
            <div className="p-2 bg-[#ECFDF3] text-[#15803D] rounded-[8px] border border-emerald-200/70">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 font-display tabular-nums block">
            {nonCancelledOrders.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalItemsSold} টি মোট পণ্য
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">গড় অর্ডার ভ্যালু (AOV)</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-[8px] border border-slate-200/70">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 font-display tabular-nums block">
            ৳{averageOrderValue.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">প্রতি অর্ডারে গড় ব্যয়</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">ডেলিভারি কালেকশন</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-[8px] border border-amber-200/70">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-600 font-display tabular-nums block">
            ৳{deliveryRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">কুরিয়ার চার্জ বাবদ আয়</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">ডেলিভারি পূর্ণতার হার</span>
            <div className="p-2 bg-[#ECFDF3] text-[#16A34A] rounded-[8px] border border-emerald-200/70">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#16A34A] font-display tabular-nums block">
            {deliverySuccessRate}%
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {deliveredOrdersCount} টি সম্পন্ন অর্ডার
          </span>
        </div>
      </div>

      {/* Two Column Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Sales Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#ECFDF3] text-[#16A34A] rounded-[8px] border border-emerald-200/70">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    ক্যাটাগরি ভিত্তিক বিক্রয় বিশ্লেষণ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">কোন ক্যাটাগরি থেকে সর্বোচ্চ আয় অর্জিত হচ্ছে</p>
                </div>
              </div>
            </div>

            {categorySales.length === 0 ? (
              <div className="py-12 text-center">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">এখনো কোনো বিক্রয় ডেটা জমা হয়নি</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  কাস্টমার অর্ডার আসলে ক্যাটাগরি অনুযায়ী বিক্রয় বিশ্লেষণ দেখা যাবে।
                </p>
              </div>
            ) : (
              <div className="space-y-4 mt-5">
                {categorySales.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 block">{cat.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {cat.units} টি আইটেম • {cat.orders} টি অর্ডার
                        </span>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <span className="font-bold text-slate-900 block">৳{cat.revenue.toLocaleString()}</span>
                        <span className="text-[11px] text-slate-500">মোট বিক্রয়ের {cat.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(6, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-6 text-[11px] text-slate-400">
            রিয়েল অর্ডার ডাটাবেজের আইটেম সমন্বয় থেকে প্রস্তুতকৃত
          </div>
        </div>

        {/* Geographic & Payment Method Split */}
        <div className="space-y-6">
          {/* Delivery Area Breakdown */}
          <div className="bg-white border border-slate-200/80 rounded-[12px] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
              <div className="p-2 bg-[#ECFDF3] text-[#16A34A] rounded-[8px] border border-emerald-200/70">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  ভৌগোলিক ডেলিভারি এলাকা বন্টন
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">ঢাকার ভেতর ও বাইরের অর্ডারের অনুপাত</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-[#F8FAF9] rounded-[10px] border border-slate-200/70 space-y-1">
                <span className="text-xs font-semibold text-slate-700 block">ঢাকার ভেতরে</span>
                <span className="text-xl font-bold text-slate-900 font-display tabular-nums block">
                  {areaDistribution.inside.count} টি অর্ডার
                </span>
                <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                  রেভিনিউ: ৳{areaDistribution.inside.revenue.toLocaleString()} ({areaDistribution.inside.percentage}%)
                </div>
              </div>

              <div className="p-4 bg-[#F8FAF9] rounded-[10px] border border-slate-200/70 space-y-1">
                <span className="text-xs font-semibold text-slate-700 block">ঢাকার বাইরে</span>
                <span className="text-xl font-bold text-slate-900 font-display tabular-nums block">
                  {areaDistribution.outside.count} টি অর্ডার
                </span>
                <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                  রেভিনিউ: ৳{areaDistribution.outside.revenue.toLocaleString()} ({areaDistribution.outside.percentage}%)
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-white border border-slate-200/80 rounded-[12px] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
              <div className="p-2 bg-[#ECFDF3] text-[#15803D] rounded-[8px] border border-emerald-200/70">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">পেমেন্ট মেথড অনুপাত</h3>
                <p className="text-xs text-slate-500 mt-0.5">ক্যাশ অন ডেলিভারি বনাম পরিশোধিত অর্ডার</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-[#F8FAF9] rounded-[10px] border border-slate-200/70 space-y-1">
                <span className="text-xs font-semibold text-slate-700 block">ক্যাশ অন ডেলিভারি (COD)</span>
                <span className="text-xl font-bold text-slate-900 font-display tabular-nums block">
                  {paymentSplit.codCount} টি
                </span>
                <span className="text-[11px] text-slate-500 block font-mono tabular-nums">
                  ৳{paymentSplit.codRevenue.toLocaleString()} ({paymentSplit.codPercentage}%)
                </span>
              </div>

              <div className="p-4 bg-[#F8FAF9] rounded-[10px] border border-slate-200/70 space-y-1">
                <span className="text-xs font-semibold text-slate-700 block">অগ্রিম পরিশোধিত (Paid)</span>
                <span className="text-xl font-bold text-[#16A34A] font-display tabular-nums block">
                  {paymentSplit.paidCount} টি
                </span>
                <span className="text-[11px] text-slate-500 block font-mono tabular-nums">
                  ৳{paymentSplit.paidRevenue.toLocaleString()} ({paymentSplit.paidPercentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Spending Customers Leaderboard */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-[#F8FAF9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#ECFDF3] text-[#16A34A] rounded-[8px] border border-emerald-200/70">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">
                টপ স্পেন্ডিং গ্রাহক তালিকা
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">সর্বোচ্চ ক্রয়কারী বিশ্বস্ত গ্রাহকদের তালিকা</p>
            </div>
          </div>
        </div>

        {topCustomers.length === 0 ? (
          <div className="py-12 text-center px-4">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">কোনো অর্ডার ডেটা পাওয়া যায়নি</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              অর্ডার সম্পন্ন হলে শীর্ষ ক্রেতাদের তালিকা এখানে প্রদর্শিত হবে।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">র‌্যাংক</th>
                  <th className="py-3 px-4">গ্রাহকের নাম ও ফোন</th>
                  <th className="py-3 px-4">ডেলিভারি ঠিকানা ও এলাকা</th>
                  <th className="py-3 px-4 text-center">মোট অর্ডার</th>
                  <th className="py-3 px-4 text-right">লাইফটাইম ব্যয়</th>
                  <th className="py-3 px-4 text-right">গড় ব্যয়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topCustomers.map((cust, idx) => {
                  const avg = Math.round(cust.totalSpent / cust.orderCount);
                  return (
                    <tr key={cust.phone} className="hover:bg-[#F8FAF9] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400 tabular-nums">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block truncate max-w-[160px]">
                          {cust.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          {cust.phone}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-slate-600">
                        <span className="block truncate">{cust.address}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {cust.area === 'inside_dhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-[6px] text-xs font-mono font-bold bg-[#ECFDF3] text-[#15803D] border border-emerald-200/80 tabular-nums">
                          {cust.orderCount} টি
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono tabular-nums text-xs sm:text-sm">
                        ৳{cust.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                        ৳{avg.toLocaleString()}
                      </td>
                    </tr>
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
