import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  Coins,
  MessageCircle,
  Calendar,
  X,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { CustomerOrder } from '../../types';

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
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ orders }) => {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<'all' | 'inside_dhaka' | 'outside_dhaka'>('all');

  // Derive unique customers from orders
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
        });
      } else {
        existing.totalOrders += 1;
        if (o.status !== 'cancelled') {
          existing.totalSpent += o.total;
        }
        existing.orderNumbers.push(o.orderNumber);
        // keep latest date
        if (new Date(o.orderDate).getTime() > new Date(existing.lastOrderDate).getTime()) {
          existing.lastOrderDate = o.orderDate;
          existing.name = o.customerName; // update name to latest
          existing.address = o.deliveryAddress;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
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

  const repeatCustomersCount = customers.filter((c) => c.totalOrders > 1).length;
  const dhakaCustomersCount = customers.filter((c) => c.area === 'inside_dhaka').length;
  const outsideDhakaCount = customers.filter((c) => c.area === 'outside_dhaka').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            গ্রাহক ডিরেক্টরি
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মোট {customers.length} জন রেজিস্টার্ড ক্রেতা • পুনরাবৃত্ত ক্রেতা: {repeatCustomersCount} জন
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">মোট ক্রেতা</span>
            <div className="text-2xl font-extrabold text-slate-900 font-display tabular-nums mt-1">
              {customers.length}
            </div>
            <span className="text-[11px] text-slate-400">লাইভ ডাটাবেজ থেকে</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">রিপিট কাস্টমার</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-display tabular-nums mt-1">
              {repeatCustomersCount}
            </div>
            <span className="text-[11px] text-slate-400">১ টির বেশি অর্ডার করেছেন</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">ঢাকা সিটির ক্রেতা</span>
            <div className="text-2xl font-extrabold text-slate-900 font-display tabular-nums mt-1">
              {dhakaCustomersCount}
            </div>
            <span className="text-[11px] text-slate-400">হোম ডেলিভারি জোন</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">ঢাকার বাইরের ক্রেতা</span>
            <div className="text-2xl font-extrabold text-slate-900 font-display tabular-nums mt-1">
              {outsideDhakaCount}
            </div>
            <span className="text-[11px] text-slate-400">কুরিয়ার ডেলিভারি জোন</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="গ্রাহকের নাম, মোবাইল নম্বর অথবা ঠিকানা দিয়ে খুঁজুন..."
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

        <div className="w-full sm:w-56">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          >
            <option value="all">সকল ডেলিভারি এলাকা</option>
            <option value="inside_dhaka">ঢাকা সিটির ভেতরে</option>
            <option value="outside_dhaka">ঢাকার বাইরে</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">কোনো গ্রাহক পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1">অনুসন্ধানের কি-ওয়ার্ড পরিবর্তন করে দেখুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">গ্রাহক</th>
                  <th className="py-3 px-4">মোবাইল নম্বর</th>
                  <th className="py-3 px-4">ঠিকানা ও এলাকা</th>
                  <th className="py-3 px-4">মোট অর্ডার</th>
                  <th className="py-3 px-4">মোট ক্রয়মূল্য</th>
                  <th className="py-3 px-4">সর্বশেষ অর্ডার</th>
                  <th className="py-3 px-4 text-right">যোগাযোগ</th>
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
                    <tr key={cust.phone} className="hover:bg-slate-50/75 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs font-display">
                            {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block truncate">
                              {cust.name}
                            </span>
                            {cust.totalOrders > 1 && (
                              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                রিপিট ক্রেতা ({cust.totalOrders})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
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
                      <td className="py-3.5 px-4 font-semibold text-slate-800 tabular-nums">
                        {cust.totalOrders} টি
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 font-bold text-blue-600 font-display tabular-nums">
                        ৳{cust.totalSpent.toLocaleString()}
                      </td>

                      {/* Last Order Date */}
                      <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                        {lastDateFormatted}
                      </td>

                      {/* Contact Action */}
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`https://wa.me/88${cust.phone}?text=${encodeURIComponent(
                            `আসসালামু আলাইকুম ${cust.name}, Muaz Electronic থেকে যোগাযোগ করছি। কেমন আছেন?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
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
