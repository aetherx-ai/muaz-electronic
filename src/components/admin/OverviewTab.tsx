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
  Layers,
  ChevronRight,
  Copy,
  Check,
  Activity,
  Ruler,
} from 'lucide-react';
import { Product, CustomerOrder, OrderStatus, PaymentStatus } from '../../types';
import { hasEnabledSizes } from '../../lib/sizeInventory';

interface OverviewTabProps {
  products: Product[];
  orders: CustomerOrder[];
  onAddNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewAllProducts: () => void;
  onViewAllOrders: (statusFilter?: string) => void;
  onViewAllCategories: () => void;
  onViewLowStock?: () => void;
  onViewClothingSizes?: () => void;
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
  onViewLowStock,
  onViewClothingSizes,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [hoveredDataIndex, setHoveredDataIndex] = useState<number | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);

  const copyOrder = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedOrderNumber(num);
    setTimeout(() => setCopiedOrderNumber(null), 2000);
  };

  // Core Business Metrics (Real DB Data)
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.status === 'published').length;
  const totalOrders = orders.length;
  const validOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);

  const totalRevenue = useMemo(
    () => validOrders.reduce((acc, o) => acc + o.total, 0),
    [validOrders]
  );

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

  const pendingOrders = useMemo(
    () => orders.filter((o) => (o.status || 'pending') === 'pending'),
    [orders]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock < 10),
    [products]
  );

  const totalInventoryCapital = useMemo(
    () => products.reduce((acc, p) => acc + (p.salePrice || p.price) * (p.stock || 0), 0),
    [products]
  );

  const sizedProductsCount = useMemo(
    () => products.filter((p) => hasEnabledSizes(p)).length,
    [products]
  );

  // Sales Chart Analytics (Real Orders)
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
        diffPercent = Math.round(
          ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
        );
      }

      return {
        points,
        currentPeriodRevenue,
        diffPercent,
        comparisonText: previousPeriodRevenue > 0 ? 'আগের ৭ দিনের তুলনায়' : 'রিয়েল-টাইম অর্ডার ডাটা',
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
        diffPercent: null,
        comparisonText: 'সাপ্তাহিক বিক্রয় ট্রেন্ড',
      };
    }

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
      diffPercent: null,
      comparisonText: 'মাসিক রেভিনিউ ট্রেন্ড',
    };
  }, [validOrders, timeRange]);

  const maxPointRevenue = Math.max(...chartAnalytics.points.map((p) => p.revenue), 1000);

  // Category Performance from Orders
  const categoryPerformance = useMemo(() => {
    const stats: Record<string, { name: string; revenue: number; unitsSold: number }> = {};

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.product.category || 'Other';
        const price = item.product.salePrice || item.product.price;
        const qty = item.quantity || 1;
        if (!stats[cat]) stats[cat] = { name: cat, revenue: 0, unitsSold: 0 };
        stats[cat].revenue += price * qty;
        stats[cat].unitsSold += qty;
      });
    });

    const list = Object.values(stats).sort((a, b) => b.revenue - a.revenue);
    const overallRev = list.reduce((sum, c) => sum + c.revenue, 0) || 1;

    return list.map((item) => ({
      ...item,
      percentage: Math.min(100, Math.round((item.revenue / overallRev) * 100)),
    }));
  }, [validOrders]);

  // Top Selling Products
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

    if (ranked.length < 5) {
      products.forEach((p) => {
        if (!ranked.some((r) => r.product.id === p.id) && ranked.length < 5) {
          ranked.push({ product: p, unitsSold: 0, totalRevenue: 0 });
        }
      });
    }

    return ranked.slice(0, 5);
  }, [validOrders, products]);

  // Recent Activity
  const recentActivities = useMemo(() => {
    return orders.slice(0, 5).map((o) => {
      const orderTime = new Date(o.orderDate);
      const diffHours = Math.round((Date.now() - orderTime.getTime()) / (1000 * 60 * 60));
      let timeText = 'কিছুক্ষণ আগে';
      if (diffHours >= 24) timeText = `${Math.floor(diffHours / 24)} দিন আগে`;
      else if (diffHours > 0) timeText = `${diffHours} ঘণ্টা আগে`;

      return {
        id: o.id || o.orderNumber,
        customerName: o.customerName,
        orderNumber: o.orderNumber,
        total: o.total,
        timeAgo: timeText,
        itemCount: o.items.reduce((s, i) => s + (i.quantity || 1), 0),
      };
    });
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-150">
      {/* 1. Clean Shopify-Style Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
            স্টোর ওভারভিউ ও সেলস ইন্টেলিজেন্স
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            MUAZ ELECTRONIC রিয়েল-টাইম বিক্রয়, অর্ডার প্রবাহ এবং ইনভেন্টরি স্ট্যাটাস
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onViewClothingSizes && (
            <button
              type="button"
              onClick={onViewClothingSizes}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-[10px] transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <Ruler className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>ক্লোথিং সাইজ ({sizedProductsCount})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onViewAllCategories}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-[10px] transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>ক্যাটাগরি</span>
          </button>
          <button
            type="button"
            onClick={onAddNewProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[10px] transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>নতুন প্রোডাক্ট</span>
          </button>
        </div>
      </div>

      {/* 2. 6 Core KPI Cards: Revenue, Orders, Products, Customers, Pending Orders, Low Stock Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Total Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300/80 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Revenue</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#ECFDF3] border border-emerald-200/70 text-[#16A34A] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-display tabular-nums tracking-tight block truncate">
              ৳{totalRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block tabular-nums">
              গড় অর্ডার: ৳{averageOrderValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 2. Total Orders */}
        <div
          onClick={() => onViewAllOrders()}
          className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Orders</span>
            <div className="w-8 h-8 rounded-[8px] bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-display tabular-nums tracking-tight block">
              {totalOrders}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block tabular-nums">
              {orders.filter((o) => o.status === 'delivered').length} সম্পন্ন ·{' '}
              {orders.filter((o) => o.status === 'shipped').length} শিপড
            </span>
          </div>
        </div>

        {/* 3. Total Products */}
        <div
          onClick={onViewAllProducts}
          className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Products</span>
            <div className="w-8 h-8 rounded-[8px] bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-display tabular-nums tracking-tight block">
              {totalProducts}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block tabular-nums">
              <span className="text-[#15803D] font-semibold">{publishedProducts} লাইভ</span> ·{' '}
              {totalProducts - publishedProducts} ড্রাফট
            </span>
          </div>
        </div>

        {/* 4. Total Customers */}
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300/80 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Customers</span>
            <div className="w-8 h-8 rounded-[8px] bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-display tabular-nums tracking-tight block">
              {uniqueCustomersCount}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {repeatCustomersCount} জন রিপিট ক্রেতা
            </span>
          </div>
        </div>

        {/* 5. Pending Orders */}
        <div
          onClick={() => onViewAllOrders('pending')}
          className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Pending Orders</span>
            <div className="w-8 h-8 rounded-[8px] bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-amber-600 font-display tabular-nums tracking-tight block">
              {pendingOrders.length}
            </span>
            <div className="flex items-center justify-between text-[11px] text-amber-700 font-medium mt-1">
              <span>প্রসেস করুন</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* 6. Low Stock Alerts */}
        <div
          onClick={() => (onViewLowStock ? onViewLowStock() : onViewAllProducts())}
          className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Low Stock Alerts</span>
            <div className="w-8 h-8 rounded-[8px] bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span
              className={`text-xl sm:text-2xl font-bold font-display tabular-nums tracking-tight block ${
                lowStockProducts.length > 0 ? 'text-rose-600' : 'text-[#15803D]'
              }`}
            >
              {lowStockProducts.length}
            </span>
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium mt-1">
              <span>{lowStockProducts.length > 0 ? '< ১০ পিস স্টক' : 'সব স্টক পর্যাপ্ত'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sales Analytics Chart */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              সেলস ও রেভিনিউ অ্যানালিটিক্স
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              অর্ডার ডাটাবেজ থেকে সরাসরি গণনাকৃত রেভিনিউ ও অর্ডার প্রবণতা
            </p>
          </div>

          <div className="flex items-center p-1 bg-slate-100 rounded-[10px] text-xs font-semibold self-start sm:self-auto border border-slate-200/60">
            <button
              type="button"
              onClick={() => setTimeRange('daily')}
              className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap ${
                timeRange === 'daily'
                  ? 'bg-white text-[#15803D] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              দৈনিক (৭ দিন)
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('weekly')}
              className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap ${
                timeRange === 'weekly'
                  ? 'bg-white text-[#15803D] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সাপ্তাহিক (৬ সপ্তাহ)
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('monthly')}
              className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap ${
                timeRange === 'monthly'
                  ? 'bg-white text-[#15803D] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              মাসিক (৬ মাস)
            </button>
          </div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">পিরিয়ড রেভিনিউ</span>
            <span className="text-lg font-bold text-slate-900 font-display tabular-nums">
              ৳{chartAnalytics.currentPeriodRevenue.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">মোট অর্ডার</span>
            <span className="text-lg font-bold text-slate-900 font-display tabular-nums">
              {chartAnalytics.points.reduce((s, p) => s + p.ordersCount, 0)} টি
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">পূর্ববর্তী তুলনা</span>
            <div className="flex items-center gap-1 mt-0.5">
              {chartAnalytics.diffPercent !== null ? (
                chartAnalytics.diffPercent >= 0 ? (
                  <span className="flex items-center gap-0.5 text-[#16A34A] font-bold tabular-nums">
                    <TrendingUp className="w-3.5 h-3.5" />+{chartAnalytics.diffPercent}%
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
            <span className="text-[11px] text-slate-500 block">সর্বোচ্চ পিক</span>
            <span className="text-lg font-bold text-[#16A34A] font-display tabular-nums">
              ৳{Math.max(...chartAnalytics.points.map((p) => p.revenue)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="pt-6 pb-2">
          <div className="h-60 w-full flex items-end gap-2 sm:gap-4 px-2">
            {chartAnalytics.points.map((point, index) => {
              const heightPercent =
                point.revenue > 0
                  ? Math.max(10, Math.round((point.revenue / maxPointRevenue) * 100))
                  : 6;
              const isHovered = hoveredDataIndex === index;

              return (
                <div
                  key={point.label}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredDataIndex(index)}
                  onMouseLeave={() => setHoveredDataIndex(null)}
                >
                  {isHovered && (
                    <div className="absolute -top-16 z-30 px-3 py-2 bg-slate-900 text-white text-xs rounded-[10px] shadow-xl whitespace-nowrap pointer-events-none border border-slate-800">
                      <div className="flex items-center justify-between gap-3 text-[11px] text-slate-300 mb-0.5">
                        <span>{point.dateStr}</span>
                        <span className="text-emerald-400 font-semibold">
                          {point.ordersCount} অর্ডার
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white font-mono tabular-nums">
                        ৳{point.revenue.toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 tabular-nums">
                    ৳{point.revenue > 0 ? `${Math.round(point.revenue / 1000)}k` : '0'}
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[44px] rounded-t-[8px] transition-all duration-200 ${
                      isHovered
                        ? 'bg-[#15803D]'
                        : point.revenue > 0
                        ? 'bg-[#16A34A] hover:bg-[#15803D]'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  />

                  <span className="text-[11px] text-slate-500 font-medium mt-2.5 truncate w-full text-center">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[12px] overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  সাম্প্রতিক অর্ডারসমূহ (Recent Orders)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">সর্বশেষ গ্রাহক অর্ডারের তালিকা</p>
              </div>

              <button
                type="button"
                onClick={() => onViewAllOrders()}
                className="flex items-center gap-1 text-xs font-semibold text-[#16A34A] hover:text-[#15803D] whitespace-nowrap shrink-0"
              >
                <span>সবগুলো ({totalOrders})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-14 px-4 text-center">
                <ShoppingBag className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">এখনো কোনো অর্ডার আসেনি</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  গ্রাহক স্টোরফ্রন্ট থেকে অর্ডার করলে এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAF9] border-b border-slate-200/80 text-slate-600 font-semibold">
                      <th className="py-2.5 px-4">অর্ডার নং</th>
                      <th className="py-2.5 px-4">গ্রাহক</th>
                      <th className="py-2.5 px-4">পণ্য</th>
                      <th className="py-2.5 px-4">মোট টাকা</th>
                      <th className="py-2.5 px-4">স্ট্যাটাস</th>
                      <th className="py-2.5 px-4 text-right">ভিউ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((ord) => {
                      const totalQty = ord.items.reduce((s, i) => s + (i.quantity || 1), 0);
                      const isCopied = copiedOrderNumber === ord.orderNumber;
                      const sizedLabels = ord.items
                        .filter((i) => i.selectedSize)
                        .map((i) => i.selectedSize);

                      return (
                        <tr key={ord.id || ord.orderNumber} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => copyOrder(ord.orderNumber)}
                              className="flex items-center gap-1 font-mono font-bold text-slate-900 hover:text-[#16A34A]"
                              title="অর্ডার নম্বর কপি করুন"
                            >
                              <span>#{ord.orderNumber}</span>
                              {isCopied ? (
                                <Check className="w-3 h-3 text-[#16A34A]" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block truncate max-w-[140px]">
                              {ord.customerName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {ord.phoneNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-medium block truncate max-w-[150px]">
                              {ord.items[0]?.product?.name || 'পণ্য'}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {totalQty} পিস
                              {sizedLabels.length > 0 ? ` · সাইজ: ${sizedLabels.join(', ')}` : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 font-mono tabular-nums">
                            ৳{ord.total.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-[6px] text-[11px] font-semibold border ${
                                ord.status === 'delivered'
                                  ? 'bg-[#ECFDF3] text-[#15803D] border-emerald-200'
                                  : ord.status === 'shipped'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : ord.status === 'confirmed'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : ord.status === 'cancelled'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
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
                              type="button"
                              onClick={() => onViewAllOrders()}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-[8px] transition-colors"
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
            )}
          </div>

          <div className="p-3 bg-[#F8FAF9] border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-4">
            <span>সর্বশেষ ৫টি অর্ডারের সারসংক্ষেপ</span>
            <button
              type="button"
              onClick={() => onViewAllOrders()}
              className="font-semibold text-[#16A34A] hover:text-[#15803D]"
            >
              সব অর্ডার দেখুন →
            </button>
          </div>
        </div>

        {/* Top Selling Products (1 Col) */}
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  শীর্ষ বিক্রিত পণ্য
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">অর্ডার ভলিউম অনুযায়ী তালিকা</p>
              </div>
              <button
                type="button"
                onClick={onViewAllProducts}
                className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D]"
              >
                সব পণ্য
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {topSellingProducts.map(({ product, unitsSold }, index) => (
                <div key={product.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center text-xs font-mono font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded-[8px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 text-xs block truncate max-w-[140px]">
                        {product.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {product.category} · স্টক: {product.stock}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 font-mono tabular-nums block">
                      ৳{(product.salePrice || product.price).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#15803D] font-medium block">
                      {unitsSold > 0 ? `${unitsSold} পিস বিক্রিত` : 'জনপ্রিয়'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>মোট ইনভেন্টরি মূল্য:</span>
            <span className="font-bold text-slate-900 font-mono tabular-nums">
              ৳{totalInventoryCapital.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Category Performance, Low Stock Alerts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Performance */}
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  ক্যাটাগরি পারফরম্যান্স
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">বিক্রয় অনুযায়ী ক্যাটাগরি</p>
              </div>
              <button
                type="button"
                onClick={onViewAllCategories}
                className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D]"
              >
                ক্যাটাগরি
              </button>
            </div>

            <div className="space-y-3.5 mt-4">
              {categoryPerformance.length > 0 ? (
                categoryPerformance.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono tabular-nums shrink-0">
                        <span className="font-bold text-slate-900">
                          ৳{cat.revenue.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400">({cat.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(8, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">
                  অর্ডার সম্পন্ন হলে ক্যাটাগরি বিশ্লেষণ দেখা যাবে
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-400 text-center">
            অর্ডার আইটেম ডাটা থেকে সংগৃহীত
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-[8px] border border-rose-200/70 flex items-center justify-center shrink-0">
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
                type="button"
                onClick={() => (onViewLowStock ? onViewLowStock() : onViewAllProducts())}
                className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D]"
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
                        className="w-9 h-9 rounded-[8px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 text-xs block truncate max-w-[140px]">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {p.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded-[6px] text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 tabular-nums">
                        {p.stock} পিস বাকি
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditProduct(p)}
                        className="text-[11px] text-[#16A34A] font-semibold block mt-1 hover:underline ml-auto"
                      >
                        রিস্টক করুন
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-[#15803D] font-medium">
                  সব প্রোডাক্ট পর্যাপ্ত পরিমাণে স্টকে রয়েছে
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 text-[11px] text-slate-400 text-center">
            স্টক শেষ হওয়ার আগে ইনভেন্টরি আপডেট করুন
          </div>
        </div>

        {/* Recent Customer Activity */}
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#ECFDF3] text-[#16A34A] rounded-[8px] border border-emerald-200/70 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    সাম্প্রতিক কাস্টমার অ্যাক্টিভিটি
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">সর্বশেষ অর্ডার ইভেন্ট</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="py-2.5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-[8px] bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 mt-0.5 font-display text-[11px]">
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
                      <span className="text-[11px] text-slate-400 block">{act.timeAgo}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-slate-400">
                  সাম্প্রতিক কোনো অর্ডার অ্যাক্টিভিটি নেই
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={() => onViewAllOrders()}
              className="w-full text-center text-xs font-semibold text-[#16A34A] hover:text-[#15803D]"
            >
              সব অর্ডার দেখুন →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
