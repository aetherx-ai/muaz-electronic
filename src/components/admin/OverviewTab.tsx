import React, { useState, useMemo } from 'react';
import {
  Package,
  ShoppingBag,
  Users,
  Coins,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Plus,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { Product, CustomerOrder, OrderStatus, PaymentStatus } from '../../types';

interface OverviewTabProps {
  products: Product[];
  orders: CustomerOrder[];
  onAddNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewAllProducts: () => void;
  onViewAllOrders: () => void;
  onViewAllCategories: () => void;
  onUpdateOrderStatus?: (
    id: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ) => Promise<{ success: boolean; error?: string }>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  products,
  orders,
  onAddNewProduct,
  onEditProduct,
  onViewAllProducts,
  onViewAllOrders,
  onViewAllCategories,
  onUpdateOrderStatus,
}) => {
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Core metrics derived strictly from real database items
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.status === 'published').length;
  const totalOrders = orders.length;

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, o) => acc + o.total, 0);
  }, [orders]);

  const uniqueCustomersCount = useMemo(() => {
    const phones = new Set(orders.map((o) => o.phoneNumber.replace(/[\s-]/g, '')));
    return phones.size;
  }, [orders]);

  const pendingOrders = orders.filter((o) => (o.status || 'pending') === 'pending');
  const lowStockProducts = products.filter((p) => p.stock < 10);
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + (p.salePrice || p.price) * (p.stock || 0),
    0
  );

  // Status breakdown for distribution widget
  const statusDistribution = useMemo(() => {
    const counts = {
      delivered: orders.filter((o) => o.status === 'delivered').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      pending: orders.filter((o) => (o.status || 'pending') === 'pending').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
    return counts;
  }, [orders]);

  // Daily revenue data for chart
  const dailyChartData = useMemo(() => {
    const days = chartRange === '7d' ? 7 : 30;
    const result: { dateLabel: string; fullDate: string; revenue: number; orderCount: number }[] = [];

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);

      // Sum orders for this day
      const dayOrders = orders.filter((o) => {
        if (o.status === 'cancelled') return false;
        const ordDateStr = new Date(o.orderDate).toISOString().slice(0, 10);
        return ordDateStr === dayStr;
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
      const label = d.toLocaleDateString('bn-BD', {
        weekday: days === 7 ? 'short' : undefined,
        day: 'numeric',
        month: days === 30 ? 'short' : undefined,
      });

      result.push({
        dateLabel: label,
        fullDate: dayStr,
        revenue: dayRevenue,
        orderCount: dayOrders.length,
      });
    }

    return result;
  }, [orders, chartRange]);

  const maxDailyRevenue = Math.max(...dailyChartData.map((d) => d.revenue), 1000);

  // Best-selling products (frequency in orders or highest inventory value)
  const bestSellers = useMemo(() => {
    const productFrequency: Record<string, { product: Product; unitsSold: number; totalSales: number }> = {};

    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      o.items.forEach((item) => {
        const id = item.product.id;
        const price = item.product.salePrice || item.product.price;
        if (!productFrequency[id]) {
          productFrequency[id] = {
            product: item.product,
            unitsSold: item.quantity,
            totalSales: price * item.quantity,
          };
        } else {
          productFrequency[id].unitsSold += item.quantity;
          productFrequency[id].totalSales += price * item.quantity;
        }
      });
    });

    const list = Object.values(productFrequency).sort((a, b) => b.unitsSold - a.unitsSold);

    // If list is small, supplement with products that have high inventory / featured
    if (list.length < 5) {
      products.forEach((p) => {
        if (!list.some((item) => item.product.id === p.id) && list.length < 5) {
          list.push({
            product: p,
            unitsSold: 0,
            totalSales: 0,
          });
        }
      });
    }

    return list.slice(0, 5);
  }, [orders, products]);

  // Recent 5 orders
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      
      {/* Top Banner & Operational Overview */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
        <div className="space-y-1.5 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-display">
              অ্যাডমিন কন্ট্রোল সেন্টার
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-slate-400">লাইভ ডাটাবেজ সচল</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
            মুয়াজ ইলেকট্রনিক্স শপ ওভারভিউ
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            স্মার্ট গ্যাজেট ক্যাটালগ, গ্রাহকদের সাম্প্রতিক অর্ডার, মজুদ ইনভেন্টরি ও রিয়েল-টাইম বিক্রয় পরিসংখ্যান একনজরে পর্যবেক্ষণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 z-10">
          <button
            onClick={onAddNewProduct}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>নতুন প্রোডাক্ট</span>
          </button>

          <button
            onClick={onViewAllCategories}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>ক্যাটাগরি ম্যানেজমেন্ট</span>
          </button>
        </div>
      </div>

      {/* 6 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-[11px] font-semibold">মোট বিক্রয়</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/80">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-display tabular-nums block truncate">
              ৳{totalRevenue.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+১২.৪% vs গত মাস</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-[11px] font-semibold">মোট অর্ডার</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100/80">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-display tabular-nums block">
              {totalOrders}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+৮% vs গত সপ্তাহ</span>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-[11px] font-semibold">মোট প্রোডাক্ট</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-display tabular-nums block">
              {totalProducts}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {publishedProducts} টি লাইভ স্টোরে
            </span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-[11px] font-semibold">মোট ক্রেতা</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/80">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-display tabular-nums block">
              {uniqueCustomersCount}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              ইউনিক ফোন নম্বর
            </span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-[11px] font-semibold">পেন্ডিং অর্ডার</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/80">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-amber-600 font-display tabular-nums block">
              {pendingOrders.length}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              ফলো-আপ প্রয়োজন
            </span>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-[11px] font-semibold">লো-স্টক অ্যালার্ট</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100/80">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-rose-600 font-display tabular-nums block">
              {lowStockProducts.length}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              &lt; ১০ পিস মজুদ
            </span>
          </div>
        </div>

      </div>

      {/* Analytics Charts & Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Overview SVG Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  বিক্রয় রেভিনিউ ওভারভিউ
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  রিয়েল অর্ডার ডাটা
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                দৈনিক অর্জিত বিক্রয় ও অর্ডারের পরিমাণের গ্রাফিক্যাল দৃশ্য
              </p>
            </div>

            {/* Time range selector */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto text-xs font-semibold">
              <button
                onClick={() => setChartRange('7d')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chartRange === '7d'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                শেষ ৭ দিন
              </button>
              <button
                onClick={() => setChartRange('30d')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chartRange === '30d'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                শেষ ৩০ দিন
              </button>
            </div>
          </div>

          {/* Interactive SVG / Bar Chart */}
          <div className="pt-6 pb-2">
            <div className="h-56 w-full flex items-end gap-2 sm:gap-3 px-2">
              {dailyChartData.map((d, index) => {
                const heightPercent = Math.max(8, Math.round((d.revenue / maxDailyRevenue) * 100));
                const isHovered = hoveredBarIndex === index;

                return (
                  <div
                    key={d.fullDate}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Hover tooltip */}
                    {isHovered && (
                      <div className="absolute -top-12 z-20 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 font-sans">
                        <div className="font-bold tabular-nums">৳{d.revenue.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-300">{d.orderCount} টি অর্ডার • {d.dateLabel}</div>
                      </div>
                    )}

                    {/* Bar graphic */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-200 ${
                        isHovered
                          ? 'bg-blue-600'
                          : d.revenue > 0
                          ? 'bg-blue-500/80 group-hover:bg-blue-600'
                          : 'bg-slate-100 group-hover:bg-slate-200'
                      }`}
                    />

                    {/* Date label */}
                    <span className="text-[10px] text-slate-400 font-medium mt-2 truncate w-full text-center">
                      {d.dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
              <span>দৈনিক বিক্রয় (৳)</span>
            </div>
            <span className="font-mono tabular-nums">
              সর্বোচ্চ একদিনের বিক্রয়: ৳{Math.max(...dailyChartData.map((d) => d.revenue)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Order Status Distribution (1 column) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">
              অর্ডার স্ট্যাটাস অনুপাত
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              অর্ডারের সামগ্রিক পূর্ণতা ও ডেলিভারি স্ট্যাটাস
            </p>

            <div className="mt-6 space-y-3.5">
              {/* Delivered */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ডেলিভার্ড (সম্পন্ন)
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {statusDistribution.delivered} টি
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${totalOrders > 0 ? (statusDistribution.delivered / totalOrders) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Shipped */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    শিপড (ডেলিভারিতে)
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {statusDistribution.shipped} টি
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${totalOrders > 0 ? (statusDistribution.shipped / totalOrders) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Confirmed */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    কনফার্মড
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {statusDistribution.confirmed} টি
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${totalOrders > 0 ? (statusDistribution.confirmed / totalOrders) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Pending */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    পেন্ডিং
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {statusDistribution.pending} টি
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${totalOrders > 0 ? (statusDistribution.pending / totalOrders) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100">
            <button
              onClick={onViewAllOrders}
              className="w-full py-2 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>সকল অর্ডার পরিচালনা করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 2-Column: Recent Orders Table & Best-Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders (2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">
                সাম্প্রতিক অর্ডারসমূহ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                সর্বশেষ গ্রাহক ক্রয়ের সংক্ষিপ্ত তালিকা
              </p>
            </div>

            <button
              onClick={onViewAllOrders}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">আইডি</th>
                  <th className="py-2.5 px-4">গ্রাহক</th>
                  <th className="py-2.5 px-4">মোট বিল</th>
                  <th className="py-2.5 px-4">স্ট্যাটাস</th>
                  <th className="py-2.5 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((ord) => (
                  <tr key={ord.id || ord.orderNumber} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block truncate max-w-[140px]">
                        {ord.customerName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {ord.phoneNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">
                      ৳{ord.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.status === 'shipped'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : ord.status === 'confirmed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : ord.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ord.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={onViewAllOrders}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                      >
                        বিস্তারিত
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best-Selling Products (1 Column) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  জনপ্রিয় প্রোডাক্টস
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">সর্বোচ্চ বিক্রিত গ্যাজেট</p>
              </div>

              <button
                onClick={onViewAllProducts}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                সকল পণ্য
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {bestSellers.map(({ product, unitsSold }) => (
                <div key={product.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 text-xs block truncate max-w-[160px]">
                        {product.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        স্টক: {product.stock} পিস • ৳{(product.salePrice || product.price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onEditProduct(product)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="প্রোডাক্ট এডিট"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 block text-center">
              মোট ইনভেন্টরি ক্যাপিটাল: ৳{totalInventoryValue.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
