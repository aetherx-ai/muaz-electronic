import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  CheckCheck,
  XCircle,
  MessageCircle,
  Eye,
  X,
  Phone,
  MapPin,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { CustomerOrder, OrderStatus, PaymentStatus } from '../../types';

interface OrdersTabProps {
  orders: CustomerOrder[];
  initialStatusFilter?: string;
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
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
  },
  confirmed: {
    label: 'কনফার্মড',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />,
  },
  shipped: {
    label: 'শিপড',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: <Truck className="w-3.5 h-3.5 text-purple-600" />,
  },
  delivered: {
    label: 'ডেলিভার্ড',
    bg: 'bg-[#ECFDF3]',
    text: 'text-[#15803D]',
    border: 'border-emerald-200',
    icon: <CheckCheck className="w-3.5 h-3.5 text-[#16A34A]" />,
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
  initialStatusFilter = 'all',
  onUpdateOrderStatus,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter || 'all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    if (initialStatusFilter) {
      setSelectedStatus(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Slide-over Order Details Drawer state
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
        if (selectedStatus !== 'all' && (order.status || 'pending') !== selectedStatus) {
          return false;
        }
        if (selectedArea !== 'all' && order.deliveryArea !== selectedArea) {
          return false;
        }
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
        if (sortBy === 'highest') return b.total - a.total;
        if (sortBy === 'lowest') return a.total - b.total;
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      });
  }, [orders, search, selectedStatus, selectedArea, sortBy]);

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0),
    [orders]
  );

  const pendingCount = orders.filter((o) => (o.status || 'pending') === 'pending').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
            অর্ডার ম্যানেজমেন্ট ও ট্র্যাকিং
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            মোট {orders.length} টি অর্ডারের মধ্যে {filteredOrders.length} টি প্রদর্শিত · নিট বিক্রয়: ৳{totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setSelectedStatus(selectedStatus === 'pending' ? 'all' : 'pending')}
            className={`px-3 py-1.5 rounded-[10px] font-semibold border transition-colors whitespace-nowrap ${
              selectedStatus === 'pending'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            পেন্ডিং: <span className="tabular-nums font-bold">{pendingCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus(selectedStatus === 'delivered' ? 'all' : 'delivered')}
            className={`px-3 py-1.5 rounded-[10px] font-semibold border transition-colors whitespace-nowrap ${
              selectedStatus === 'delivered'
                ? 'bg-emerald-100 text-[#15803D] border-emerald-300'
                : 'bg-[#ECFDF3] text-[#15803D] border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            ডেলিভার্ড: <span className="tabular-nums font-bold">{deliveredCount}</span>
          </button>

          {onRefreshData && (
            <button
              type="button"
              onClick={onRefreshData}
              className="p-2 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-[10px] transition-colors"
              title="অর্ডার তালিকা রিফ্রেশ করুন"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="অর্ডার আইডি, গ্রাহক, ফোন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
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

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="all">সকল স্ট্যাটাস ({orders.length})</option>
            <option value="pending">পেন্ডিং ({orders.filter((o) => (o.status || 'pending') === 'pending').length})</option>
            <option value="confirmed">কনফার্মড ({orders.filter((o) => o.status === 'confirmed').length})</option>
            <option value="shipped">শিপড ({orders.filter((o) => o.status === 'shipped').length})</option>
            <option value="delivered">ডেলিভার্ড ({orders.filter((o) => o.status === 'delivered').length})</option>
            <option value="cancelled">বাতিল ({orders.filter((o) => o.status === 'cancelled').length})</option>
          </select>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="all">সকল ডেলিভারি এলাকা</option>
            <option value="inside_dhaka">ঢাকার ভেতরে</option>
            <option value="outside_dhaka">ঢাকার বাইরে</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="newest">সর্বশেষ অর্ডার আগে</option>
            <option value="oldest">পুরাতন অর্ডার আগে</option>
            <option value="highest">সর্বোচ্চ টাকার অর্ডার</option>
            <option value="lowest">সর্বনিম্ন টাকার অর্ডার</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] overflow-hidden shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center px-4">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-800">কোনো অর্ডার পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              ফিল্টার পরিবর্তন করে দেখুন অথবা নতুন গ্রাহক অর্ডারের জন্য অপেক্ষা করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">অর্ডার আইডি</th>
                  <th className="py-3 px-4">গ্রাহকের বিবরণ</th>
                  <th className="py-3 px-4">পণ্য ও সাইজ</th>
                  <th className="py-3 px-4">মোট টাকা</th>
                  <th className="py-3 px-4">পেমেন্ট</th>
                  <th className="py-3 px-4">অর্ডার স্ট্যাটাস</th>
                  <th className="py-3 px-4">তারিখ</th>
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
                      className="hover:bg-[#F8FAF9]/75 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveOrder(order)}
                            className="hover:text-[#16A34A] transition-colors"
                          >
                            #{order.orderNumber}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.orderNumber, order.orderNumber)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-[6px] transition-colors"
                            title="আইডি কপি করুন"
                          >
                            {copiedId === order.orderNumber ? (
                              <Check className="w-3 h-3 text-[#16A34A]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="min-w-0 max-w-[200px]">
                          <span className="font-semibold text-slate-900 block truncate">
                            {order.customerName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {order.phoneNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {order.deliveryArea === 'inside_dhaka' ? 'ঢাকা সিটি' : 'ঢাকার বাইরে'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <img
                              key={idx}
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-8 h-8 rounded-[8px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                              title={`${item.product.name}${item.selectedSize ? ` [সাইজ: ${item.selectedSize}]` : ''} (${item.quantity}টি)`}
                            />
                          ))}
                          {order.items.length > 2 && (
                            <span className="w-7 h-7 rounded-[8px] bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                              +{order.items.length - 2}
                            </span>
                          )}
                          <div className="ml-1">
                            <span className="text-[11px] text-slate-700 font-medium block tabular-nums">
                              {order.items.reduce((s, i) => s + i.quantity, 0)} টি পণ্য
                            </span>
                            {order.items.some((i) => i.selectedSize) && (
                              <span className="text-[11px] font-mono font-semibold text-[#15803D] block">
                                সাইজ: {order.items.filter((i) => i.selectedSize).map((i) => i.selectedSize).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono tabular-nums">
                          ৳{order.total.toLocaleString()}
                        </div>
                        <span className="text-[11px] text-slate-400 block tabular-nums">
                          ডেলিভারি ৳{order.deliveryFee}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-[6px] text-[11px] font-semibold border ${
                            order.paymentStatus === 'paid'
                              ? 'bg-[#ECFDF3] text-[#15803D] border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {order.paymentStatus === 'paid' ? 'Paid' : 'COD'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={statusKey}
                          disabled={updatingId === (order.id || order.orderNumber)}
                          onChange={(e) =>
                            handleStatusChange(order, e.target.value as OrderStatus)
                          }
                          className={`text-[11px] font-semibold rounded-[8px] px-2.5 py-1 border transition-colors cursor-pointer focus:outline-none ${config.bg} ${config.text} ${config.border}`}
                        >
                          <option value="pending">পেন্ডিং</option>
                          <option value="confirmed">কনফার্মড</option>
                          <option value="shipped">শিপড</option>
                          <option value="delivered">ডেলিভার্ড</option>
                          <option value="cancelled">বাতিল</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                        {orderDateFormatted}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#15803D] hover:bg-[#ECFDF3] rounded-[8px] transition-colors border border-slate-200 hover:border-emerald-200 whitespace-nowrap"
                            title="অর্ডারের বিস্তারিত দেখুন"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>বিস্তারিত</span>
                          </button>

                          <a
                            href={`https://wa.me/88${order.phoneNumber.replace(/[\s-]/g, '')}?text=${encodeURIComponent(
                              `আসসালামু আলাইকুম ${order.customerName}, MUAZ ELECTRONIC থেকে আপনার অর্ডার #${order.orderNumber} এর বিষয়ে যোগাযোগ করা হচ্ছে।`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#15803D] hover:text-white hover:bg-[#16A34A] rounded-[8px] transition-colors border border-emerald-200"
                            title="WhatsApp মেসেজ"
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

      {/* Slide-Over Order Details Drawer */}
      {activeOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] flex justify-end animate-in fade-in duration-150"
          onClick={() => setActiveOrder(null)}
        >
          <aside
            className="w-full max-w-xl bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-[#F8FAF9] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-[#ECFDF3] text-[#16A34A] rounded-[10px] border border-emerald-200/80 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-display font-mono">
                      #{activeOrder.orderNumber}
                    </h3>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeOrder.orderNumber, 'drawer-id')}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-[6px]"
                      title="অর্ডার আইডি কপি করুন"
                    >
                      {copiedId === 'drawer-id' ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    তারিখ: {new Date(activeOrder.orderDate).toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-[8px] transition-colors"
                aria-label="ড্রয়ার বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Customer & Delivery Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F8FAF9] rounded-[12px] border border-slate-200/80 text-xs">
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-500 text-[11px] block">
                    গ্রাহকের তথ্য
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{activeOrder.customerName}</div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeOrder.phoneNumber}</span>
                  </div>
                  <a
                    href={`https://wa.me/88${activeOrder.phoneNumber.replace(/[\s-]/g, '')}?text=${encodeURIComponent(
                      `আসসালামু আলাইকুম ${activeOrder.customerName}, MUAZ ELECTRONIC থেকে আপনার অর্ডার #${activeOrder.orderNumber} এর ডেলিভারি আপডেট।`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#15803D] hover:underline mt-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp-এ মেসেজ দিন</span>
                  </a>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-500 text-[11px] block">
                    ডেলিভারি ঠিকানা
                  </span>
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{activeOrder.deliveryAddress}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    এরিয়া: {activeOrder.deliveryArea === 'inside_dhaka' ? 'ঢাকা সিটির ভেতরে (৳৭০)' : 'ঢাকার বাইরে (৳১৩০)'}
                  </div>
                  {activeOrder.notes && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-[8px] text-amber-900 text-[11px] mt-1">
                      <strong>নোট:</strong> {activeOrder.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Status & Order Status */}
              <div className="p-4 bg-white border border-slate-200/80 rounded-[12px] space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700">পেমেন্ট স্ট্যাটাস</span>
                  <div className="flex items-center gap-1.5">
                    {(['cod', 'paid'] as PaymentStatus[]).map((ps) => {
                      const active = (activeOrder.paymentStatus || 'cod') === ps;
                      return (
                        <button
                          key={ps}
                          type="button"
                          onClick={() =>
                            handleStatusChange(
                              activeOrder,
                              (activeOrder.status || 'pending') as OrderStatus,
                              ps
                            )
                          }
                          className={`px-3 py-1 rounded-[8px] text-xs font-semibold border transition-colors ${
                            active
                              ? 'bg-[#ECFDF3] text-[#15803D] border-emerald-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {ps === 'paid' ? 'Paid' : 'Cash on Delivery'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 text-xs block mb-2.5">
                    অর্ডার স্ট্যাটাস আপডেট করুন
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(
                      (st) => {
                        const isCurrent = (activeOrder.status || 'pending') === st;
                        const cfg = STATUS_CONFIG[st];
                        return (
                          <button
                            key={st}
                            type="button"
                            disabled={updatingId === (activeOrder.id || activeOrder.orderNumber)}
                            onClick={() => handleStatusChange(activeOrder, st)}
                            className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 border transition-all whitespace-nowrap ${
                              isCurrent
                                ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-[#16A34A]/20`
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
              </div>

              {/* Ordered Products */}
              <div className="border border-slate-200/80 rounded-[12px] overflow-hidden text-xs">
                <div className="px-4 py-3 bg-[#F8FAF9] border-b border-slate-200/80 font-semibold text-slate-700">
                  অর্ডারকৃত পণ্যসমূহ ({activeOrder.items.length})
                </div>
                <div className="divide-y divide-slate-100">
                  {activeOrder.items.map((item, index) => {
                    const price = item.product.salePrice || item.product.price;
                    const itemTotal = price * item.quantity;
                    return (
                      <div key={index} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-11 h-11 rounded-[8px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900 truncate max-w-[230px]">
                                {item.product.name}
                              </span>
                              {item.selectedSize && (
                                <span className="px-2 py-0.5 rounded-[6px] bg-[#ECFDF3] border border-emerald-200 text-[11px] font-mono font-bold text-[#15803D] shrink-0">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5 tabular-nums">
                              ৳{price.toLocaleString()} × {item.quantity} টি
                            </span>
                          </div>
                        </div>

                        <div className="font-bold text-slate-900 font-mono tabular-nums shrink-0">
                          ৳{itemTotal.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Totals */}
              <div className="p-4 bg-[#F8FAF9] rounded-[12px] border border-slate-200/80 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>সাবটোটাল</span>
                  <span className="font-semibold font-mono tabular-nums">
                    ৳{activeOrder.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ডেলিভারি ফি</span>
                  <span className="font-semibold font-mono tabular-nums">
                    ৳{activeOrder.deliveryFee}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>সর্বমোট বিল</span>
                  <span className="text-[#16A34A] font-display font-mono tabular-nums">
                    ৳{activeOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-5 py-3.5 bg-[#F8FAF9] border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const itemsSummary = activeOrder.items
                    .map(
                      (i) =>
                        `${i.product.name}${i.selectedSize ? ` (${i.selectedSize})` : ''} x${i.quantity}`
                    )
                    .join(', ');
                  const receiptText = `MUAZ ELECTRONIC INVOICE\nOrder: #${activeOrder.orderNumber}\nCustomer: ${activeOrder.customerName} (${activeOrder.phoneNumber})\nAddress: ${activeOrder.deliveryAddress}\nItems: ${itemsSummary}\nTotal: ৳${activeOrder.total}`;
                  copyToClipboard(receiptText, 'receipt');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-[10px] transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                {copiedId === 'receipt' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>চালান কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>চালান কপি করুন</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[10px] transition-colors whitespace-nowrap"
              >
                সম্পন্ন
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
