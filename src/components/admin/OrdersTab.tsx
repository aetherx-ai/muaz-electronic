import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  Truck,
  CheckCheck,
  XCircle,
  ExternalLink,
  MessageCircle,
  Eye,
  Filter,
  ArrowUpDown,
  X,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Coins,
  Copy,
  Check,
} from 'lucide-react';
import { CustomerOrder, OrderStatus, PaymentStatus } from '../../types';

interface OrdersTabProps {
  orders: CustomerOrder[];
  onUpdateOrderStatus: (
    id: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ) => Promise<{ success: boolean; error?: string }>;
  onRefreshData?: () => void;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'পেন্ডিং',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
  },
  confirmed: {
    label: 'কনফার্মড',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />,
  },
  shipped: {
    label: 'শিপড (ডেলিভারিতে)',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: <Truck className="w-3.5 h-3.5 text-purple-600" />,
  },
  delivered: {
    label: 'ডেলিভার্ড',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />,
  },
  cancelled: {
    label: 'বাতিল',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
  },
};

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  onUpdateOrderStatus,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Order Details Modal state
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (
    order: CustomerOrder,
    newStatus: OrderStatus,
    newPayment?: PaymentStatus
  ) => {
    const id = order.id || order.orderNumber;
    setUpdatingId(id);
    const res = await onUpdateOrderStatus(id, newStatus, newPayment);
    setUpdatingId(null);
    if (res.success && activeOrder && (activeOrder.id === id || activeOrder.orderNumber === id)) {
      setActiveOrder({
        ...activeOrder,
        status: newStatus,
        paymentStatus: newPayment || activeOrder.paymentStatus,
      });
    }
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status filter
        if (selectedStatus !== 'all' && (order.status || 'pending') !== selectedStatus) {
          return false;
        }

        // Area filter
        if (selectedArea !== 'all' && order.deliveryArea !== selectedArea) {
          return false;
        }

        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchNumber = order.orderNumber.toLowerCase().includes(q);
          const matchName = order.customerName.toLowerCase().includes(q);
          const matchPhone = order.phoneNumber.includes(q);
          const matchAddress = order.deliveryAddress.toLowerCase().includes(q);
          const matchItems = order.items.some((i) =>
            i.product.name.toLowerCase().includes(q)
          );
          if (!matchNumber && !matchName && !matchPhone && !matchAddress && !matchItems) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        }
        if (sortBy === 'highest') {
          return b.total - a.total;
        }
        if (sortBy === 'lowest') {
          return a.total - b.total;
        }
        // default newest
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      });
  }, [orders, search, selectedStatus, selectedArea, sortBy]);

  // Aggregate metrics
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, o) => acc + o.total, 0);
  }, [orders]);

  const pendingCount = orders.filter((o) => (o.status || 'pending') === 'pending').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            অর্ডার ম্যানেজমেন্ট
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মোট {orders.length} টি অর্ডারের মধ্যে {filteredOrders.length} টি প্রদর্শিত • অর্জিত বিক্রয়: ৳{totalRevenue.toLocaleString()}
          </p>
        </div>

        {/* Quick status counters */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-xl font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            পেন্ডিং: <span className="tabular-nums font-bold">{pendingCount}</span>
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ডেলিভার্ড: <span className="tabular-nums font-bold">{deliveredCount}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="অর্ডার আইডি, গ্রাহক, ফোন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="all">সকল স্ট্যাটাস ({orders.length})</option>
              <option value="pending">পেন্ডিং ({orders.filter((o) => (o.status || 'pending') === 'pending').length})</option>
              <option value="confirmed">কনফার্মড ({orders.filter((o) => o.status === 'confirmed').length})</option>
              <option value="shipped">শিপড ({orders.filter((o) => o.status === 'shipped').length})</option>
              <option value="delivered">ডেলিভার্ড ({orders.filter((o) => o.status === 'delivered').length})</option>
              <option value="cancelled">বাতিল ({orders.filter((o) => o.status === 'cancelled').length})</option>
            </select>
          </div>

          {/* Delivery area filter */}
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="all">সকল ডেলিভারি এলাকা</option>
              <option value="inside_dhaka">ঢাকার ভেতরে (৳৭০)</option>
              <option value="outside_dhaka">ঢাকার বাইরে (৳১৩০)</option>
            </select>
          </div>

          {/* Sort selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="newest">সর্বশেষ অর্ডার আগে</option>
              <option value="oldest">পুরাতন অর্ডার আগে</option>
              <option value="highest">সর্বোচ্চ টাকার অর্ডার</option>
              <option value="lowest">সর্বনিম্ন টাকার অর্ডার</option>
            </select>
          </div>

        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">কোনো অর্ডার পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              আপনার ফিল্টার মান পরিবর্তন করুন অথবা নতুন গ্রাহক অর্ডারের জন্য অপেক্ষা করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">অর্ডার আইডি</th>
                  <th className="py-3 px-4">গ্রাহকের বিবরণ</th>
                  <th className="py-3 px-4">পণ্যসমূহ</th>
                  <th className="py-3 px-4">মোট টাকা</th>
                  <th className="py-3 px-4">পেমেন্ট</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4">অর্ডারের সময়</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const statusKey = (order.status || 'pending') as OrderStatus;
                  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                  const orderDateFormatted = new Date(order.orderDate).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={order.id || order.orderNumber}
                      className="hover:bg-slate-50/75 transition-colors group"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>#{order.orderNumber}</span>
                          <button
                            onClick={() => copyToClipboard(order.orderNumber, order.orderNumber)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                            title="আইডি কপি করুন"
                          >
                            {copiedId === order.orderNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0 max-w-[200px]">
                          <span className="font-semibold text-slate-900 block truncate">
                            {order.customerName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {order.phoneNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {order.deliveryArea === 'inside_dhaka' ? 'ঢাকা সিটি' : 'ঢাকার বাইরে'}
                          </span>
                        </div>
                      </td>

                      {/* Products preview */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <img
                              key={idx}
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                              title={`${item.product.name} (${item.quantity}টি)`}
                            />
                          ))}
                          {order.items.length > 2 && (
                            <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                              +{order.items.length - 2}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 ml-1">
                            {order.items.reduce((s, i) => s + i.quantity, 0)} টি পণ্য
                          </span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 tabular-nums">
                          ৳{order.total.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          ডেলিভারি ৳{order.deliveryFee} সহ
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {order.paymentStatus === 'paid' ? 'Paid (অনলাইন)' : 'ক্যাশ অন ডেলিভারি'}
                        </span>
                      </td>

                      {/* Order Status inline dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={statusKey}
                          disabled={updatingId === (order.id || order.orderNumber)}
                          onChange={(e) =>
                            handleStatusChange(order, e.target.value as OrderStatus)
                          }
                          className={`text-[11px] font-semibold rounded-lg px-2 py-1 border transition-colors cursor-pointer ${config.bg} ${config.text} ${config.border}`}
                        >
                          <option value="pending">পেন্ডিং</option>
                          <option value="confirmed">কনফার্মড</option>
                          <option value="shipped">শিপড</option>
                          <option value="delivered">ডেলিভার্ড</option>
                          <option value="cancelled">বাতিল</option>
                        </select>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 tabular-nums font-sans">
                        {orderDateFormatted}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveOrder(order)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                            title="অর্ডারের বিস্তারিত দেখুন"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`https://wa.me/88${order.phoneNumber.replace(/[\s-]/g, '')}?text=${encodeURIComponent(
                              `আসসালামু আলাইকুম ${order.customerName}, Muaz Electronic থেকে আপনার অর্ডার #${order.orderNumber} এর বিষয়ে যোগাযোগ করা হচ্ছে।`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-200"
                            title="গ্রাহকের সাথে WhatsApp চ্যাট"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    অর্ডার বিবরণ #{activeOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    তারিখ: {new Date(activeOrder.orderDate).toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Customer & Delivery Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                    গ্রাহকের তথ্য
                  </span>
                  <div className="font-semibold text-slate-900 text-sm">{activeOrder.customerName}</div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeOrder.phoneNumber}</span>
                  </div>
                  <a
                    href={`https://wa.me/88${activeOrder.phoneNumber.replace(/[\s-]/g, '')}?text=${encodeURIComponent(
                      `আসসালামু আলাইকুম ${activeOrder.customerName}, Muaz Electronic থেকে আপনার অর্ডার #${activeOrder.orderNumber} এর ডেলিভারি আপডেট।`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 mt-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp-এ সরাসরি মেসেজ পাঠান</span>
                  </a>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                    ডেলিভারি ঠিকানা ও এলাকা
                  </span>
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{activeOrder.deliveryAddress}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    এরিয়া: {activeOrder.deliveryArea === 'inside_dhaka' ? 'ঢাকা সিটির ভেতরে (৳৭০)' : 'ঢাকার বাইরে (৳১৩০)'}
                  </div>
                  {activeOrder.notes && (
                    <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-[11px] mt-1.5">
                      <strong>গ্রাহকের নোট:</strong> {activeOrder.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Status Controller */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-500 text-xs block">
                  অর্ডার স্ট্যাটাস হালনাগাদ করুন
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(
                    (st) => {
                      const isCurrent = (activeOrder.status || 'pending') === st;
                      const cfg = STATUS_CONFIG[st];
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(activeOrder, st)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                            isCurrent
                              ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-blue-500/20 shadow-xs`
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {cfg.icon}
                          <span>{cfg.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Ordered Products Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  অর্ডারকৃত পণ্যসমূহ ({activeOrder.items.length})
                </div>
                <div className="divide-y divide-slate-100">
                  {activeOrder.items.map((item, index) => {
                    const price = item.product.salePrice || item.product.price;
                    const itemTotal = price * item.quantity;
                    return (
                      <div key={index} className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate">
                              {item.product.name}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              একক দাম: ৳{price.toLocaleString()} × {item.quantity} টি
                            </span>
                          </div>
                        </div>

                        <div className="font-bold text-slate-900 tabular-nums shrink-0">
                          ৳{itemTotal.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>সাবটোটাল</span>
                  <span className="font-semibold font-mono tabular-nums">৳{activeOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ডেলিভারি ফি</span>
                  <span className="font-semibold font-mono tabular-nums">৳{activeOrder.deliveryFee}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>সর্বমোট প্রদেয় বিল</span>
                  <span className="text-blue-600 font-display tabular-nums">৳{activeOrder.total.toLocaleString()}</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const receiptText = `MUAZ ELECTRONIC INVOICE\nOrder: #${activeOrder.orderNumber}\nCustomer: ${activeOrder.customerName} (${activeOrder.phoneNumber})\nAddress: ${activeOrder.deliveryAddress}\nTotal: ৳${activeOrder.total}`;
                  copyToClipboard(receiptText, 'receipt');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                {copiedId === 'receipt' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>চালান কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>চালান তথ্য কপি করুন</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
