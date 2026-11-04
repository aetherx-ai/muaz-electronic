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
  TrendingDown,
  Plus,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Phone,
  Truck,
  CheckCheck,
  XCircle,
  Copy,
  Check,
  Sparkles,
  ArrowUpRight,
  Boxes,
  Activity,
  BarChart3,
  Filter,
} from 'lucide-react';
import { Product, CustomerOrder, OrderStatus, PaymentStatus } from '../../types';

interface OverviewTabProps {
  products: Product[];
  orders: CustomerOrder[];
  onAddNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewAllProducts: () => void;
  onViewAllOrders: (statusFilter?: string) => void;
  onViewAllCategories: () => void;
  onUpdateOrderStatus?: (
    id: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ) => Promise<{ success: boolean; error?: string }>;
}

type TimeRange = 'daily' | 'weekly' | 'monthly';

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
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [hoveredDataIndex, setHoveredDataIndex] = useState<number | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);

  const copyOrder = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedOrderNumber(num);
    setTimeout(() => setCopiedOrderNumber(null), 2000);
  };

  // ---------------------------------------------------------------------------
  // 1. BUSINESS OVERVIEW: 6 CORE METRICS (STRICTLY FROM ACTUAL DATA)
  // ---------------------------------------------------------------------------
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.status === 'published').length;
  const totalOrders = orders.length;

  const validOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);

  const totalRevenue = useMemo(() => {
    return validOrders.reduce((acc, o) => acc + o.total, 0);
  }, [validOrders]);

  const totalUnitsSold = useMemo(() => {
    return validOrders.reduce((sum, o) => {
      return sum + o.items.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0);
    }, 0);
  }, [validOrders]);

  const averageOrderValue = useMemo(() => {
    if (validOrders.length === 0) return 0;
    return Math.round(totalRevenue / validOrders.length);
  }, [totalRevenue, validOrders.length]);

  const uniqueCustomersCount = useMemo(() => {
    const phones = new Set(orders.map((o) => o.phoneNumber.replace(/[\s-]/g, '')));
    return phones.size;
  }, [orders]);

  const repeatCustomersCount = useMemo(() => {
    const phoneCountMap: Record<string, number> = {};
    orders.forEach((o) => {
      const p = o.phoneNumber.replace(/[\s-]/g, '');
      phoneCountMap[p] = (phoneCountMap[p] || 0) + 1;
    });
    return Object.values(phoneCountMap).filter((c) => c > 1).length;
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter((o) => (o.status || 'pending') === 'pending');
  }, [orders]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock < 10);
  }, [products]);

  const totalInventoryCapital = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.salePrice || p.price) * (p.stock || 0), 0);
  }, [products]);

  // ---------------------------------------------------------------------------
  // 2. SALES ANALYTICS: INTERACTIVE CHART & TREND COMPARISON
  // ---------------------------------------------------------------------------
  const chartAnalytics = useMemo(() => {
    const now = new Date();

    if (timeRange === 'daily') {
      const days = 7;
      const points: { label: string; dateStr: string; revenue: number; ordersCount: number }[] = [];
      let currentPeriodRevenue = 0;
      let previousPeriodRevenue = 0;

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);

        const dayOrders = validOrders.filter((o) => {
          const ordDate = new Date(o.orderDate).toISOString().slice(0, 10);
          return ordDate === dateKey;
        });

        const dayRev = dayOrders.reduce((sum, o) => sum + o.total, 0);
        currentPeriodRevenue += dayRev;

        const weekday = d.toLocaleDateString('bn-BD', { weekday: 'short' });
        const dayNumber = d.getDate();

        points.push({
          label: `${weekday} ${dayNumber}`,
          dateStr: dateKey,
          revenue: dayRev,
          ordersCount: dayOrders.length,
        });
      }

      // Calculate previous 7 days (days - 14 to days - 7)
      for (let i = days * 2 - 1; i >= days; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        const dayOrders = validOrders.filter((o) => {
          const ordDate = new Date(o.orderDate).toISOString().slice(0, 10);
          return ordDate === dateKey;
        });
        previousPeriodRevenue += dayOrders.reduce((sum, o) => sum + o.total, 0);
      }

      let diffPercent: number | null = null;
      if (previousPeriodRevenue > 0) {
        diffPercent = Math.round(((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100);
      }

      return {
        points,
        currentPeriodRevenue,
        previousPeriodRevenue,
        diffPercent,
        periodName: 'গত ৭ দিন',
        comparisonText: previousPeriodRevenue > 0 ? `আগের ৭ দিনের তুলনায়` : 'রেকর্ডকৃত ডাটা',
      };
    }

    if (timeRange === 'weekly') {
      const weeks = 6;
      const points: { label: string; dateStr: string; revenue: number; ordersCount: number }[] = [];
      let currentPeriodRevenue = 0;

      for (let w = weeks - 1; w >= 0; w--) {
        const endDay = new Date(now);
        endDay.setDate(endDay.getDate() - w * 7);
        const startDay = new Date(endDay);
        startDay.setDate(startDay.getDate() - 6);

        const startTime = startDay.getTime();
        const endTime = endDay.getTime();

        const weekOrders = validOrders.filter((o) => {
          const t = new Date(o.orderDate).getTime();
          return t >= startTime && t <= endTime;
        });

        const weekRev = weekOrders.reduce((sum, o) => sum + o.total, 0);
        currentPeriodRevenue += weekRev;

        points.push({
          label: `সপ্তাহ ${weeks - w}`,
          dateStr: `${startDay.getDate()}/${startDay.getMonth() + 1} - ${endDay.getDate()}/${endDay.getMonth() + 1}`,
          revenue: weekRev,
          ordersCount: weekOrders.length,
        });
      }

      return {
        points,
        currentPeriodRevenue,
        previousPeriodRevenue: 0,
        diffPercent: null,
        periodName: 'গত ৬ সপ্তাহ',
        comparisonText: 'ধারাবাহিক বিক্রয় বিশ্লেষণ',
      };
    }

    // Monthly Range (Last 6 Months)
    const months = 6;
    const points: { label: string; dateStr: string; revenue: number; ordersCount: number }[] = [];
    let currentPeriodRevenue = 0;

    for (let m = months - 1; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = d.getFullYear();
      const month = d.getMonth();

      const monthOrders = validOrders.filter((o) => {
        const od = new Date(o.orderDate);
        return od.getFullYear() === year && od.getMonth() === month;
      });

      const monthRev = monthOrders.reduce((sum, o) => sum + o.total, 0);
      currentPeriodRevenue += monthRev;

      const monthName = d.toLocaleDateString('bn-BD', { month: 'short' });

      points.push({
        label: monthName,
        dateStr: `${monthName} ${year}`,
        revenue: monthRev,
        ordersCount: monthOrders.length,
      });
    }

    return {
      points,
      currentPeriodRevenue,
      previousPeriodRevenue: 0,
      diffPercent: null,
      periodName: 'গত ৬ মাস',
      comparisonText: 'মাসিক রেভিনিউ ট্রেন্ড',
    };
  }, [validOrders, timeRange]);

  const maxPointRevenue = Math.max(...chartAnalytics.points.map((p) => p.revenue), 1200);

  // ---------------------------------------------------------------------------
  // 3. BEST PERFORMING CATEGORIES (CALCULATED FROM ACTUAL ORDERS)
  // ---------------------------------------------------------------------------
  const categoryPerformance = useMemo(() => {
    const stats: Record<string, { name: string; revenue: number; orderCount: number; unitsSold: number }> = {};

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.product.category || 'Other';
        const price = item.product.salePrice || item.product.price;
        const qty = item.quantity || 1;

        if (!stats[cat]) {
          stats[cat] = { name: cat, revenue: 0, orderCount: 0, unitsSold: 0 };
        }
        stats[cat].revenue += price * qty;
        stats[cat].unitsSold += qty;
        stats[cat].orderCount += 1;
      });
    });

    const list = Object.values(stats).sort((a, b) => b.revenue - a.revenue);
    const overallRev = list.reduce((sum, c) => sum + c.revenue, 0) || 1;

    return list.map((item) => ({
      ...item,
      percentage: Math.min(100, Math.round((item.revenue / overallRev) * 100)),
    }));
  }, [validOrders]);

  // ---------------------------------------------------------------------------
  // 4. TOP SELLING PRODUCTS
  // ---------------------------------------------------------------------------
  const topSellingProducts = useMemo(() => {
    const productMap: Record<string, { product: Product; unitsSold: number; totalRevenue: number }> = {};

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const id = item.product.id;
        const price = item.product.salePrice || item.product.price;
        const qty = item.quantity || 1;

        if (!productMap[id]) {
          productMap[id] = {
            product: item.product,
            unitsSold: qty,
            totalRevenue: price * qty,
          };
        } else {
          productMap[id].unitsSold += qty;
          productMap[id].totalRevenue += price * qty;
        }
      });
    });

    const ranked = Object.values(productMap).sort((a, b) => b.unitsSold - a.unitsSold);

    // If fewer than 5 orders exist, supplement with featured products
    if (ranked.length < 5) {
      products.forEach((p) => {
        if (!ranked.some((r) => r.product.id === p.id) && ranked.length < 5) {
          ranked.push({
            product: p,
            unitsSold: 0,
            totalRevenue: 0,
          });
        }
      });
    }

    return ranked.slice(0, 5);
  }, [validOrders, products]);

  // ---------------------------------------------------------------------------
  // 5. RECENT ACTIVITY STREAM
  // ---------------------------------------------------------------------------
  const recentActivities = useMemo(() => {
    return orders.slice(0, 6).map((o) => {
      const orderTime = new Date(o.orderDate);
      const diffHours = Math.round((Date.now() - orderTime.getTime()) / (1000 * 60 * 60));
      let timeText = 'কিছুক্ষণ আগে';
      if (diffHours >= 24) {
        timeText = `${Math.floor(diffHours / 24)} দিন আগে`;
      } else if (diffHours > 0) {
        timeText = `${diffHours} ঘণ্টা আগে`;
      }

      return {
        id: o.id || o.orderNumber,
        customerName: o.customerName,
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status || 'pending',
        area: o.deliveryArea,
        timeAgo: timeText,
        itemCount: o.items.reduce((s, i) => s + (i.quantity || 1), 0),
      };
    });
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-7 pb-10">
      
      {/* -------------------------------------------------------------------- */}
      {/* 1. EXECUTIVE ACTION BANNER */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-display">
              MUAZ EXECUTIVE CONTROL
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-slate-400">সিস্টেম রিয়েল-টাইম সিঙ্কড</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-white">
            বিজনেস পারফরম্যান্স ও ইন্টেলিজেন্স
          </h2>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            লাইভ অর্ডার ট্র্যাকিং, পণ্যের মজুদ, গ্রাহক ডেটাবেজ এবং রেভিনিউ প্রবৃদ্ধি পর্যবেক্ষণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
          <button
            onClick={onAddNewProduct}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>নতুন প্রোডাক্ট যোগ করুন</span>
          </button>

          <button
            onClick={onViewAllCategories}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>ক্যাটাগরি নিয়ন্ত্রণ</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. TOP BUSINESS OVERVIEW: 6 ATTRACTIVE STATISTIC CARDS */}
      {/* -------------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">
            ব্যবসায়িক সার্বিক সূচক (Key Metrics)
          </h3>
          <span className="text-[11px] text-slate-400 font-sans">
            লাইভ ডাটাবেজ থেকে সংগৃহীত
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          
          {/* 1. Total Sales / Volume */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group">
            <div className="flex items-center justify-between text-slate-500 mb-2.5">
              <span className="text-xs font-semibold text-slate-600">মোট বিক্রয় (আইটেম)</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/70 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900 font-display tabular-nums tracking-tight">
                  {totalUnitsSold}
                </span>
                <span className="text-xs font-medium text-slate-400">পিস</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-sans">
                <span>গড় অর্ডার:</span>
                <span className="font-semibold text-slate-700 font-mono tabular-nums">৳{averageOrderValue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 2. Total Revenue */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group">
            <div className="flex items-center justify-between text-slate-500 mb-2.5">
              <span className="text-xs font-semibold text-slate-600">মোট রেভিনিউ</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/70 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums tracking-tight block truncate">
                ৳{totalRevenue.toLocaleString()}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>নেট গ্রস ক্যাশফ্লো</span>
              </div>
            </div>
          </div>

          {/* 3. Total Orders */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group">
            <div className="flex items-center justify-between text-slate-500 mb-2.5">
              <span className="text-xs font-semibold text-slate-600">মোট অর্ডার</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100/70 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums tracking-tight block">
                {totalOrders}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-sans">
                <span className="text-emerald-600 font-semibold">{orders.filter((o) => o.status === 'delivered').length} সম্পন্ন</span>
                <span>·</span>
                <span>{orders.filter((o) => o.status === 'shipped').length} ডেলিভারিতে</span>
              </div>
            </div>
          </div>

          {/* 4. Total Products */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group">
            <div className="flex items-center justify-between text-slate-500 mb-2.5">
              <span className="text-xs font-semibold text-slate-600">মোট প্রোডাক্ট</span>
              <div className="p-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200/80 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums tracking-tight block">
                {totalProducts}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-sans">
                <span className="text-blue-600 font-semibold">{publishedProducts} লাইভ</span>
                <span>·</span>
                <span>{totalProducts - publishedProducts} ড্রাফট</span>
              </div>
            </div>
          </div>

          {/* 5. Total Customers */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group">
            <div className="flex items-center justify-between text-slate-500 mb-2.5">
              <span className="text-xs font-semibold text-slate-600">মোট ক্রেতা</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/70 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums tracking-tight block">
                {uniqueCustomersCount}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-sans">
                <span>{repeatCustomersCount} জন নিয়মিত ক্রেতা</span>
              </div>
            </div>
          </div>

          {/* 6. Pending Orders */}
          <div
            onClick={() => onViewAllOrders('pending')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all cursor-pointer group hover:bg-amber-50/20"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2.5">
              <span className="text-xs font-semibold text-slate-600">পেন্ডিং অর্ডার</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/70 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold text-amber-600 font-display tabular-nums tracking-tight block">
                {pendingOrders.length}
              </span>
              <div className="flex items-center justify-between text-[11px] text-amber-700 font-medium mt-1 font-sans">
                <span>অ্যাকশন প্রয়োজন</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. SALES ANALYTICS: INTERACTIVE REVENUE CHART */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-display">
                সেলস ও রেভিনিউ অ্যানালিটিক্স
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                ইন্টারেক্টিভ গ্রাফ
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              অর্ডার ডেটানুযায়ী সংগৃহীত রেভিনিউ প্রবৃদ্ধি এবং লেনদেনের তুলনামূলক পরিমাপ
            </p>
          </div>

          {/* Time Filter Segments */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto border border-slate-200/60">
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                timeRange === 'daily'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              দৈনিক (৭ দিন)
            </button>
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                timeRange === 'weekly'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              সাপ্তাহিক (৬ সপ্তাহ)
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                timeRange === 'monthly'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              মাসিক (৬ মাস)
            </button>
          </div>
        </div>

        {/* Chart Period Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">নির্বাচিত পিরিয়ডের রেভিনিউ</span>
            <span className="text-lg font-bold text-slate-900 font-display tabular-nums">
              ৳{chartAnalytics.currentPeriodRevenue.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">অর্ডারের পরিমাণ</span>
            <span className="text-lg font-bold text-slate-900 font-display tabular-nums">
              {chartAnalytics.points.reduce((s, p) => s + p.ordersCount, 0)} টি
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">পূর্ববর্তী পিরিয়ডের তুলনা</span>
            <div className="flex items-center gap-1 mt-0.5">
              {chartAnalytics.diffPercent !== null ? (
                chartAnalytics.diffPercent >= 0 ? (
                  <span className="flex items-center gap-0.5 text-emerald-600 font-bold tabular-nums">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{chartAnalytics.diffPercent}%
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-rose-600 font-bold tabular-nums">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {chartAnalytics.diffPercent}%
                  </span>
                )
              ) : (
                <span className="text-slate-600 font-medium">{chartAnalytics.comparisonText}</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">সর্বোচ্চ একদিনের পিক সেল</span>
            <span className="text-lg font-bold text-blue-600 font-display tabular-nums">
              ৳{Math.max(...chartAnalytics.points.map((p) => p.revenue)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Interactive Chart Visuals */}
        <div className="pt-6 pb-2">
          <div className="h-64 w-full flex items-end gap-2 sm:gap-4 px-2">
            {chartAnalytics.points.map((point, index) => {
              const heightPercent = Math.max(10, Math.round((point.revenue / maxPointRevenue) * 100));
              const isHovered = hoveredDataIndex === index;

              return (
                <div
                  key={point.label}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredDataIndex(index)}
                  onMouseLeave={() => setHoveredDataIndex(null)}
                >
                  {/* Floating Detailed Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-16 z-30 px-3 py-2 bg-slate-950 text-white text-xs rounded-xl shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 font-sans border border-slate-800">
                      <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 mb-0.5">
                        <span>{point.dateStr}</span>
                        <span className="text-blue-400 font-semibold">{point.ordersCount} টি অর্ডার</span>
                      </div>
                      <div className="text-sm font-bold text-white font-mono tabular-nums">
                        ৳{point.revenue.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Top value indicator when hovered or active */}
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 tabular-nums">
                    ৳{point.revenue > 0 ? `${Math.round(point.revenue / 1000)}k` : '০'}
                  </div>

                  {/* Primary Data Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[48px] rounded-t-xl transition-all duration-200 relative overflow-hidden ${
                      isHovered
                        ? 'bg-blue-600 shadow-md shadow-blue-500/20'
                        : point.revenue > 0
                        ? 'bg-blue-500/85 hover:bg-blue-600'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {/* Inner highlight */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-white/30" />
                  </div>

                  {/* Label on X-Axis */}
                  <span className="text-[11px] text-slate-500 font-medium mt-2.5 truncate w-full text-center">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
            <span className="font-medium text-slate-700">বিক্রয় রেভিনিউ বার (টাকা)</span>
          </div>
          <span className="text-[11px] text-slate-400">
            কার্সার রেখে প্রতিটি তারিখের বিশদ বিবরণ দেখুন
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. BUSINESS ACTIVITY: RECENT ORDERS & TOP PRODUCTS & CATEGORIES */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  সাম্প্রতিক গ্রাহক অর্ডারসমূহ (Recent Orders)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  সরাসরি স্টোরফ্রন্ট ও হোয়াটসঅ্যাপ অর্ডারের বিবরণ
                </p>
              </div>

              <button
                onClick={() => onViewAllOrders()}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>সবগুলো দেখুন ({totalOrders})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-semibold">
                    <th className="py-2.5 px-4">অর্ডার নং</th>
                    <th className="py-2.5 px-4">গ্রাহকের নাম ও ফোন</th>
                    <th className="py-2.5 px-4">পণ্য ও পরিমাণ</th>
                    <th className="py-2.5 px-4">মোট টাকা</th>
                    <th className="py-2.5 px-4">স্ট্যাটাস</th>
                    <th className="py-2.5 px-4 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => {
                    const totalQty = ord.items.reduce((s, i) => s + (i.quantity || 1), 0);
                    const isCopied = copiedOrderNumber === ord.orderNumber;

                    return (
                      <tr key={ord.id || ord.orderNumber} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => copyOrder(ord.orderNumber)}
                            className="flex items-center gap-1 font-mono font-bold text-slate-900 hover:text-blue-600 transition-colors"
                            title="অর্ডার নম্বর কপি করুন"
                          >
                            <span>#{ord.orderNumber}</span>
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block truncate max-w-[140px]">
                            {ord.customerName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {ord.phoneNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-800 font-medium block truncate max-w-[150px]">
                            {ord.items[0]?.product?.name || 'পণ্য'}
                          </span>
                          {ord.items.length > 1 && (
                            <span className="text-[10px] text-slate-500 block">
                              + আরও {ord.items.length - 1} টি পণ্য ({totalQty} পিস)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono tabular-nums">
                          ৳{ord.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
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
                            {ord.status === 'delivered'
                              ? 'ডেলিভার্ড'
                              : ord.status === 'shipped'
                              ? 'শিপড'
                              : ord.status === 'confirmed'
                              ? 'কনফার্মড'
                              : ord.status === 'cancelled'
                              ? 'বাতিল'
                              : 'পেন্ডিং'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onViewAllOrders()}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                          >
                            ভিউ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-4">
            <span>সর্বশেষ ৫ টি অর্ডারের তাৎক্ষণিক রূপরেখা</span>
            <button
              onClick={() => onViewAllOrders()}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              সব অর্ডার ম্যানেজ করুন →
            </button>
          </div>
        </div>

        {/* Right Column (1 Col): Top Selling Products */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  শীর্ষ বিক্রিত প্রোডাক্টসমূহ (Top Sellers)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">অর্ডার ভলিউম অনুযায়ী র্যাংক</p>
              </div>

              <button
                onClick={onViewAllProducts}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                সব পণ্য
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {topSellingProducts.map(({ product, unitsSold, totalRevenue: prodRev }, index) => (
                <div key={product.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-center text-xs font-mono font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 text-xs block truncate max-w-[150px]">
                        {product.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {product.category} • স্টক: {product.stock}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 font-mono tabular-nums block">
                      ৳{(product.salePrice || product.price).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium block">
                      {unitsSold > 0 ? `${unitsSold} পিস বিক্রিত` : 'জনপ্রিয়'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 mt-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>মোট গুদাম ক্যাপিটাল:</span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">
                ৳{totalInventoryCapital.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 5. CATEGORY PERFORMANCE, LOW STOCK ALERTS & CUSTOMER ACTIVITY */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Best Performing Categories */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  ক্যাটাগরি পারফরম্যান্স
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">কোন ক্যাটাগরি থেকে বেশি আয় হচ্ছে</p>
              </div>

              <button
                onClick={onViewAllCategories}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                ক্যাটাগরি
              </button>
            </div>

            <div className="space-y-3.5 mt-4">
              {categoryPerformance.length > 0 ? (
                categoryPerformance.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono tabular-nums shrink-0">
                        <span className="font-bold text-slate-900">৳{cat.revenue.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">({cat.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(8, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">এখনো কোনো ক্যাটাগরি সেলস রেকর্ড হয়নি</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-400 text-center">
            গ্রাহকদের অর্ডারের আইটেম বিশ্লেষণ থেকে সংগৃহীত
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    লো-স্টক অ্যালার্ট ({lowStockProducts.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">&lt; ১০ পিস মজুদ অবশিষ্ট</p>
                </div>
              </div>

              <button
                onClick={onViewAllProducts}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                ইনভেন্টরি
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 text-xs block truncate max-w-[140px]">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">{p.category}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {p.stock} পিস বাকি
                      </span>
                      <button
                        onClick={() => onEditProduct(p)}
                        className="text-[10px] text-blue-600 font-semibold block mt-1 hover:underline"
                      >
                        স্টক আপডেট
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-emerald-600 font-medium">
                  সব প্রোডাক্ট পর্যাপ্ত পরিমাণে স্টকে রয়েছে!
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <span className="text-[11px] text-slate-400 block text-center">
              গ্রাহক অর্ডার নিশ্চিতকরণে স্টক শেষ হওয়ার পূর্বেই রিস্টক করুন
            </span>
          </div>
        </div>

        {/* Recent Customer Activity */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    সাম্প্রতিক কাস্টমার অ্যাক্টিভিটি
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">সর্বশেষ অর্ডার ও ট্র্যাকিং ইভেন্ট</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {recentActivities.map((act) => (
                <div key={act.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 mt-0.5 font-display text-[11px]">
                      {act.customerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 block truncate">
                        {act.customerName}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        অর্ডার #{act.orderNumber} ({act.itemCount} পণ্য)
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 font-mono tabular-nums block">
                      ৳{act.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{act.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <button
              onClick={() => onViewAllOrders()}
              className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              সম্পূর্ণ অ্যাক্টিভিটি হিস্ট্রি দেখুন →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
