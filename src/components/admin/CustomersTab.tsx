import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  MapPin,
  MessageCircle,
  X,
  UserCheck,
  History,
  Phone,
  ShoppingBag,
  Package,
  Calendar,
} from 'lucide-react';
import { CustomerOrder, OrderStatus } from '../../types';

interface CustomersTabProps {
  orders: CustomerOrder[];
  onViewCustomerOrders?: (customerPhone: string) => void;
}

interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
  area: 'inside_dhaka' | 'outside_dhaka';
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orderNumbers: string[];
  orders: CustomerOrder[];
}

const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: 'অপেক্ষমান',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  confirmed: {
    label: 'নিশ্চিত',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  shipped: {
    label: 'পাঠানো হয়েছে',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  delivered: {
    label: 'ডেলিভারড',
    badgeClass: 'bg-[#ECFDF3] text-[#15803D] border-emerald-200',
  },
  cancelled: {
    label: 'বাতিল',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

export const CustomersTab: React.FC<CustomersTabProps> = ({ orders }) => {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<'all' | 'inside_dhaka' | 'outside_dhaka'>('all');
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);

  // Derive unique customers and their complete order history from orders
  const customers = useMemo(() => {
    const map = new Map<string, CustomerProfile>();

    orders.forEach((o) => {
      const cleanPhone = o.phoneNumber.replace(/[\s-]/g, '');
      const existing = map.get(cleanPhone);

      if (!existing) {
        map.set(cleanPhone, {
          name: o.customerName,
          phone: cleanPhone,
          address: o.deliveryAddress,
          area: o.deliveryArea,
          totalOrders: 1,
          totalSpent: o.status !== 'cancelled' ? o.total : 0,
          lastOrderDate: o.orderDate,
          orderNumbers: [o.orderNumber],
          orders: [o],
        });
      } else {
        existing.totalOrders += 1;
        if (o.status !== 'cancelled') {
          existing.totalSpent += o.total;
        }
        existing.orderNumbers.push(o.orderNumber);
        existing.orders.push(o);
        if (new Date(o.orderDate).getTime() > new Date(existing.lastOrderDate).getTime()) {
          existing.lastOrderDate = o.orderDate;
          existing.name = o.customerName;
          existing.address = o.deliveryAddress;
          existing.area = o.deliveryArea;
        }
      }
    });

    return Array.from(map.values())
      .map((cust) => ({
        ...cust,
        orders: [...cust.orders].sort(
          (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        ),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (areaFilter !== 'all' && c.area !== areaFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchAddress = c.address.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAddress) return false;
      }
      return true;
    });
  }, [customers, search, areaFilter]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.phone === selectedCustomerPhone) || null,
    [customers, selectedCustomerPhone]
  );

  const repeatCustomersCount = customers.filter((c) => c.totalOrders > 1).length;
  const dhakaCustomersCount = customers.filter((c) => c.area === 'inside_dhaka').length;
  const outsideDhakaCount = customers.filter((c) => c.area === 'outside_dhaka').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
            গ্রাহক ডিরেক্টরি (Customers)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মোট {customers.length} জন ক্রেতা • পুনরাবৃত্ত ক্রেতা: {repeatCustomersCount} জন • ক্লিক করে অর্ডার হিস্ট্রি দেখুন
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">মোট ক্রেতা</span>
            <div className="text-2xl font-extrabold text-slate-900 font-display tabular-nums mt-1">
              {customers.length}
            </div>
            <span className="text-[11px] text-slate-400">লাইভ ডাটাবেজ থেকে</span>
          </div>
          <div className="p-3 bg-[#ECFDF3] text-[#16A34A] rounded-[10px] border border-emerald-200/70">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">রিপিট কাস্টমার</span>
            <div className="text-2xl font-extrabold text-[#16A34A] font-display tabular-nums mt-1">
              {repeatCustomersCount}
            </div>
            <span className="text-[11px] text-slate-400">১ টির বেশি অর্ডার করেছেন</span>
          </div>
          <div className="p-3 bg-[#ECFDF3] text-[#15803D] rounded-[10px] border border-emerald-200/70">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">ঢাকা সিটির ক্রেতা</span>
            <div className="text-2xl font-extrabold text-slate-900 font-display tabular-nums mt-1">
              {dhakaCustomersCount}
            </div>
            <span className="text-[11px] text-slate-400">হোম ডেলিভারি জোন</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-[10px] border border-slate-200/70">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">ঢাকার বাইরের ক্রেতা</span>
            <div className="text-2xl font-extrabold text-slate-900 font-display tabular-nums mt-1">
              {outsideDhakaCount}
            </div>
            <span className="text-[11px] text-slate-400">কুরিয়ার ডেলিভারি জোন</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-[10px] border border-slate-200/70">
            <MapPin className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="গ্রাহকের নাম, মোবাইল নম্বর অথবা ঠিকানা দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-full sm:w-56">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value as 'all' | 'inside_dhaka' | 'outside_dhaka')}
            className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
          >
            <option value="all">সকল ডেলিভারি এলাকা</option>
            <option value="inside_dhaka">ঢাকা সিটির ভেতরে</option>
            <option value="outside_dhaka">ঢাকার বাইরে</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] overflow-hidden shadow-xs">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#F8FAF9] border border-slate-200/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">কোনো গ্রাহক পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1">
              {orders.length === 0
                ? 'ক্রেতারা স্টোর থেকে অর্ডার করলে তাদের প্রোফাইল ও অর্ডার হিস্ট্রি এখানে স্বয়ংক্রিয়ভাবে যুক্ত হবে।'
                : 'অনুসন্ধানের কি-ওয়ার্ড বা ফিল্টার পরিবর্তন করে দেখুন।'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">গ্রাহক</th>
                  <th className="py-3 px-4">মোবাইল নম্বর</th>
                  <th className="py-3 px-4">ঠিকানা ও এলাকা</th>
                  <th className="py-3 px-4">মোট অর্ডার</th>
                  <th className="py-3 px-4">মোট ক্রয়মূল্য</th>
                  <th className="py-3 px-4">সর্বশেষ অর্ডার</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const lastDateFormatted = new Date(cust.lastOrderDate).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={cust.phone}
                      onClick={() => setSelectedCustomerPhone(cust.phone)}
                      className="hover:bg-[#F8FAF9] transition-colors cursor-pointer"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[10px] bg-[#ECFDF3] border border-emerald-200/80 text-[#15803D] font-bold flex items-center justify-center shrink-0 text-xs font-display">
                            {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate">
                              {cust.name}
                            </span>
                            {cust.totalOrders > 1 && (
                              <span className="inline-block mt-0.5 text-[10px] text-[#15803D] font-semibold bg-[#ECFDF3] px-1.5 py-0.5 rounded-[6px] border border-emerald-200/80">
                                রিপিট ক্রেতা ({cust.totalOrders})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {cust.phone}
                      </td>

                      {/* Address & Area */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0 max-w-xs">
                          <span className="text-slate-700 block truncate">{cust.address}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {cust.area === 'inside_dhaka' ? 'ঢাকা সিটি' : 'ঢাকার বাইরে'}
                          </span>
                        </div>
                      </td>

                      {/* Total Orders */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                        {cust.totalOrders} টি
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 font-bold text-[#15803D] font-display tabular-nums whitespace-nowrap">
                        ৳{cust.totalSpent.toLocaleString()}
                      </td>

                      {/* Last Order Date */}
                      <td className="py-3.5 px-4 text-slate-500 tabular-nums whitespace-nowrap">
                        {lastDateFormatted}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerPhone(cust.phone)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-[8px] transition-colors whitespace-nowrap"
                          >
                            <History className="w-3.5 h-3.5 text-[#16A34A]" />
                            <span>অর্ডার হিস্ট্রি</span>
                          </button>
                          <a
                            href={`https://wa.me/88${cust.phone}?text=${encodeURIComponent(
                              `আসসালামু আলাইকুম ${cust.name}, Muaz Electronic থেকে যোগাযোগ করছি। কেমন আছেন?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#15803D] bg-[#ECFDF3] hover:bg-emerald-100 border border-emerald-200/80 rounded-[8px] transition-colors whitespace-nowrap"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
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

      {/* Customer Order History Slide-Over Drawer */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[2px] animate-in fade-in duration-150"
          onClick={() => setSelectedCustomerPhone(null)}
        >
          <div
            className="relative w-full max-w-xl bg-white h-full border-l border-slate-200/80 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-200/80 bg-[#F8FAF9] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-[#ECFDF3] border border-emerald-200/80 text-[#15803D] font-bold flex items-center justify-center shrink-0 text-sm font-display">
                  {selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-display truncate">
                      {selectedCustomer.name}
                    </h3>
                    {selectedCustomer.totalOrders > 1 && (
                      <span className="text-[10px] font-semibold text-[#15803D] bg-[#ECFDF3] border border-emerald-200/80 px-1.5 py-0.5 rounded-[6px] shrink-0">
                        রিপিট ক্রেতা
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedCustomer.phone}
                    </span>
                    <span className="truncate">
                      {selectedCustomer.area === 'inside_dhaka' ? 'ঢাকা সিটি' : 'ঢাকার বাইরে'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomerPhone(null)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-[8px] transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Customer Address & Summary Strip */}
              <div className="bg-[#F8FAF9] border border-slate-200/80 rounded-[12px] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 text-xs text-slate-700 min-w-0">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{selectedCustomer.address}</span>
                  </div>
                  <a
                    href={`https://wa.me/88${selectedCustomer.phone}?text=${encodeURIComponent(
                      `আসসালামু আলাইকুম ${selectedCustomer.name}, Muaz Electronic থেকে যোগাযোগ করছি।`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#15803D] bg-[#ECFDF3] hover:bg-emerald-100 border border-emerald-200/80 rounded-[8px] transition-colors shrink-0 whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      মোট অর্ডার
                    </span>
                    <span className="text-sm font-bold text-slate-900 font-display tabular-nums">
                      {selectedCustomer.totalOrders} টি
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      মোট ক্রয়মূল্য
                    </span>
                    <span className="text-sm font-bold text-[#15803D] font-display tabular-nums">
                      ৳{selectedCustomer.totalSpent.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      সর্বশেষ অর্ডার
                    </span>
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">
                      {new Date(selectedCustomer.lastOrderDate).toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order History Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>অর্ডার হিস্ট্রি ({selectedCustomer.orders.length})</span>
                  </h4>
                </div>

                <div className="space-y-3">
                  {selectedCustomer.orders.map((order) => {
                    const statusKey: OrderStatus = order.status || 'pending';
                    const statusMeta = ORDER_STATUS_META[statusKey] || ORDER_STATUS_META.pending;
                    return (
                      <div
                        key={order.id || order.orderNumber}
                        className="bg-white border border-slate-200/80 rounded-[12px] overflow-hidden shadow-2xs"
                      >
                        <div className="px-4 py-3 bg-[#F8FAF9] border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-900">
                              #{order.orderNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-[6px] border text-[10px] font-semibold ${statusMeta.badgeClass}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Calendar className="w-3 h-3" />
                              {new Date(order.orderDate).toLocaleDateString('bn-BD', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="font-bold text-slate-900 font-display tabular-nums">
                              ৳{order.total.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {order.items.map((item, idx) => {
                            const unitPrice = item.product?.salePrice || item.product?.price || 0;
                            return (
                              <div
                                key={`${order.orderNumber}-${idx}`}
                                className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {item.product?.image ? (
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name}
                                      className="w-9 h-9 rounded-[8px] object-cover border border-slate-200 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-[8px] bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 truncate">
                                      {item.product?.name || 'Product'}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                      <span className="tabular-nums">পরিমাণ: {item.quantity}</span>
                                      {item.selectedSize && (
                                        <span className="px-1.5 py-0.5 bg-[#ECFDF3] text-[#15803D] border border-emerald-200/80 rounded-[6px] font-semibold">
                                          সাইজ: {item.selectedSize}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="font-semibold text-slate-900 font-display tabular-nums shrink-0">
                                  ৳{(unitPrice * item.quantity).toLocaleString()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
