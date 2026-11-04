import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Store,
  ChevronRight,
  User,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Package,
  Layers,
  ShoppingBag,
  Search,
  X,
  Boxes,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminTab } from './AdminSidebar';
import { Product, CustomerOrder } from '../../types';

interface AdminHeaderProps {
  currentTab: AdminTab;
  setCurrentTab: (tab: AdminTab) => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  openMobileSidebar: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onAddNewProduct: () => void;
  onBackToStore: () => void;
  products?: Product[];
  orders?: CustomerOrder[];
  onSelectProduct?: (product: Product) => void;
  onSelectOrder?: (order: CustomerOrder) => void;
}

const TAB_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'বিজনেস ড্যাশবোর্ড ওভারভিউ',
    subtitle: 'রিয়েল-টাইম বিক্রয় অ্যানালিটিক্স, অর্ডার ট্র্যাকিং ও সামগ্রিক প্রবৃদ্ধি',
  },
  products: {
    title: 'প্রোডাক্ট ক্যাটালগ ম্যানেজমেন্ট',
    subtitle: 'পণ্যের স্টক, মূল্য, স্পেসিফিকেশন ও স্ট্যাটাস নিয়ন্ত্রণ',
  },
  categories: {
    title: 'ক্যাটাগরি আর্কিটেকচার',
    subtitle: 'ডাইনামিক ক্যাটাগরি তৈরি, ড্র্যাগ রি-অর্ডারিং ও নিরাপদ ডাটা মাইগ্রেশন',
  },
  orders: {
    title: 'অর্ডার এক্সিকিউশন ও ট্র্যাকিং',
    subtitle: 'গ্রাহকদের ক্রয় চালান, ডেলিভারি স্ট্যাটাস ও পেমেন্ট আপডেট',
  },
  customers: {
    title: 'গ্রাহক ডিরেক্টরি ও হিস্ট্রি',
    subtitle: 'গ্রাহকদের যোগাযোগের তথ্য, ক্রয় প্রবণতা ও ভ্যালু অ্যানালাইসিস',
  },
  inventory: {
    title: 'ইনভেন্টরি ও রিস্টক মনিটর',
    subtitle: 'লো-স্টক সতর্কতা, দ্রুত গুদাম স্টক আপডেট ও ক্যাপিটাল পরিসংখ্যান',
  },
  settings: {
    title: 'স্টোর ও সিস্টেম কনফিগারেশন',
    subtitle: 'যোগাযোগের চ্যানেল, কুরিয়ার চার্জ ও ক্লাউড ডাটাবেজ সমন্বয়',
  },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTab,
  setCurrentTab,
  isSidebarCollapsed,
  toggleSidebarCollapse,
  openMobileSidebar,
  onRefresh,
  isLoading,
  onAddNewProduct,
  onBackToStore,
  products = [],
  orders = [],
  onSelectProduct,
  onSelectOrder,
}) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search keyboard shortcut ('/' or 'Cmd+K')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !searchFocused) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          const searchInput = document.getElementById('admin-global-search') as HTMLInputElement | null;
          searchInput?.focus();
          setSearchFocused(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchFocused]);

  // Search Results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { products: [], orders: [] };

    const matchedProducts = products
      .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 4);

    const matchedOrders = orders
      .filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.phoneNumber.includes(q)
      )
      .slice(0, 4);

    return { products: matchedProducts, orders: matchedOrders };
  }, [searchQuery, products, orders]);

  const hasSearchResults =
    searchQuery.trim().length > 0 &&
    (searchResults.products.length > 0 || searchResults.orders.length > 0);

  const tabInfo = TAB_TITLES[currentTab] || TAB_TITLES.overview;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
      
      {/* Left: Mobile trigger, Desktop collapse toggle & Page Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={openMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="মেনু খুলুন"
        >
          <Menu className="w-5 h-5 stroke-[1.8]" />
        </button>

        {/* Desktop collapse/expand button */}
        <button
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title={isSidebarCollapsed ? 'সাইডবার প্রসারিত করুন' : 'সাইডবার সংকুচিত করুন'}
          aria-label="সাইডবার টগল"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 stroke-[1.8]" />
          ) : (
            <PanelLeftClose className="w-4 h-4 stroke-[1.8]" />
          )}
        </button>

        <div className="h-4 w-px bg-slate-200 hidden lg:block" />

        {/* Breadcrumb & Tab Title */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="font-semibold text-slate-800">Muaz Admin</span>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-blue-600 font-semibold truncate capitalize">
              {currentTab}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate font-display tracking-tight leading-tight">
            {tabInfo.title}
          </h1>
        </div>
      </div>

      {/* Middle: Integrated Quick Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-md mx-4 relative" ref={searchContainerRef}>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="admin-global-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="পণ্য বা অর্ডার সার্চ করুন (নাম, ফোন, #আইডি)..."
            className="w-full pl-8 pr-14 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none font-sans"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/60 rounded border border-slate-300/60">
                /
              </kbd>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchFocused && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
            {hasSearchResults ? (
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
                {searchResults.products.length > 0 && (
                  <div className="pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                      প্রোডাক্টসমূহ ({searchResults.products.length})
                    </span>
                    {searchResults.products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSearchFocused(false);
                          setSearchQuery('');
                          if (onSelectProduct) {
                            onSelectProduct(p);
                          } else {
                            setCurrentTab('products');
                          }
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate">{p.name}</span>
                            <span className="text-[11px] text-slate-500 block">{p.category} • স্টক: {p.stock}</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 font-mono tabular-nums shrink-0 ml-2">
                          ৳{(p.salePrice || p.price).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.orders.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                      অর্ডারসমূহ ({searchResults.orders.length})
                    </span>
                    {searchResults.orders.map((o) => (
                      <button
                        key={o.id || o.orderNumber}
                        onClick={() => {
                          setSearchFocused(false);
                          setSearchQuery('');
                          if (onSelectOrder) {
                            onSelectOrder(o);
                          } else {
                            setCurrentTab('orders');
                          }
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-blue-600 block">#{o.orderNumber}</span>
                          <span className="text-slate-900 font-medium block truncate">
                            {o.customerName} • {o.phoneNumber}
                          </span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-bold text-slate-900 font-mono tabular-nums block">
                            ৳{o.total.toLocaleString()}
                          </span>
                          <span className="text-[10px] capitalize text-slate-500 font-medium block">
                            {o.status || 'pending'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                "{searchQuery}" এর সাথে কোনো প্রোডাক্ট বা অর্ডার মেলেনি
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions, Refresh & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/70 rounded-xl transition-colors border border-transparent hover:border-blue-100"
          title="ডাটাবেজ রিফ্রেশ করুন"
          aria-label="তথ্য রিফ্রেশ করুন"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Quick Add Product */}
        <button
          onClick={onAddNewProduct}
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">নতুন প্রোডাক্ট</span>
          <span className="sm:hidden">প্রোডাক্ট</span>
        </button>

        {/* Go to public store */}
        <button
          onClick={onBackToStore}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-colors"
          title="লাইভ স্টোর দেখুন"
        >
          <Store className="w-3.5 h-3.5 text-slate-500" />
          <span>স্টোরফ্রন্ট</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200/80 transition-colors"
            aria-expanded={profileOpen}
            aria-label="অ্যাডমিন প্রোফাইল মেনু"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs font-display">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <span className="font-semibold text-slate-900 block truncate max-w-[100px]">
                {user?.name || 'Admin'}
              </span>
              <span className="text-[10px] text-slate-400 block">ম্যানেজার</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>সুপার অ্যাডমিন</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email || 'admin@muazelectronic.com'}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setCurrentTab('settings');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>স্টোর ও সিস্টেম সেটিংস</span>
                </button>

                <button
                  onClick={() => {
                    onBackToStore();
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>পাবলিক স্টোরফ্রন্টে যান</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>লগআউট করুন</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

