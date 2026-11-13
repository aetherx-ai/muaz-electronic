import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Store,
  ChevronRight,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Search,
  X,
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

const TAB_TITLES: Record<AdminTab, { breadcrumb: string; title: string }> = {
  overview: {
    breadcrumb: 'Overview',
    title: 'ড্যাশবোর্ড ওভারভিউ',
  },
  products: {
    breadcrumb: 'Products',
    title: 'প্রোডাক্ট ক্যাটালগ',
  },
  categories: {
    breadcrumb: 'Categories',
    title: 'ক্যাটাগরি ম্যানেজমেন্ট',
  },
  orders: {
    breadcrumb: 'Orders',
    title: 'অর্ডার ম্যানেজমেন্ট',
  },
  customers: {
    breadcrumb: 'Customers',
    title: 'গ্রাহক ডিরেক্টরি',
  },
  inventory: {
    breadcrumb: 'Inventory',
    title: 'ইনভেন্টরি ও স্টক',
  },
  'clothing-sizes': {
    breadcrumb: 'Clothing Sizes',
    title: 'ক্লোথিং সাইজ ইনভেন্টরি (S–XXL)',
  },
  discounts: {
    breadcrumb: 'Discounts',
    title: 'ডিসকাউন্ট ও কুপন',
  },
  reviews: {
    breadcrumb: 'Reviews',
    title: 'কাস্টমার রিভিউ',
  },
  analytics: {
    breadcrumb: 'Analytics',
    title: 'সেলস রিপোর্ট ও অ্যানালিটিক্স',
  },
  settings: {
    breadcrumb: 'Settings',
    title: 'স্টোর ও সিস্টেম সেটিংস',
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !searchFocused) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
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

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { products: [], orders: [] };

    const matchedProducts = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.bengaliName && p.bengaliName.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      )
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
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
      {/* Left: Mobile drawer, Sidebar collapse & Breadcrumb/Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={openMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-[10px] transition-colors shrink-0"
          aria-label="মেনু খুলুন"
        >
          <Menu className="w-5 h-5 stroke-[1.8]" />
        </button>

        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[8px] transition-colors shrink-0"
          title={isSidebarCollapsed ? 'সাইডবার প্রসারিত করুন' : 'সাইডবার সংকুচিত করুন'}
          aria-label="সাইডবার টগল"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 stroke-[1.8]" />
          ) : (
            <PanelLeftClose className="w-4 h-4 stroke-[1.8]" />
          )}
        </button>

        <div className="h-4 w-px bg-slate-200 hidden lg:block shrink-0" />

        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <span className="font-semibold text-slate-700 truncate">MUAZ ELECTRONIC</span>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[#16A34A] font-semibold truncate">
              {tabInfo.breadcrumb}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate font-display tracking-tight leading-tight">
            {tabInfo.title}
          </h1>
        </div>
      </div>

      {/* Center: Quick Global Search */}
      <div
        className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-md mx-2 relative"
        ref={searchContainerRef}
      >
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
            placeholder="পণ্য বা অর্ডার খুঁজুন (নাম, ফোন, #আইডি)..."
            className="w-full pl-8 pr-12 py-1.5 text-xs bg-[#F8FAF9] hover:bg-slate-100/70 focus:bg-white text-slate-900 rounded-[10px] border border-slate-200 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 transition-all outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white rounded-[6px] border border-slate-200">
                /
              </kbd>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchFocused && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-[12px] shadow-xl overflow-hidden z-50 animate-in fade-in duration-100">
            {hasSearchResults ? (
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
                {searchResults.products.length > 0 && (
                  <div className="pb-2">
                    <span className="text-[11px] font-semibold text-slate-400 px-2 py-1 block">
                      প্রোডাক্ট ({searchResults.products.length})
                    </span>
                    {searchResults.products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          setSearchQuery('');
                          if (onSelectProduct) onSelectProduct(p);
                          else setCurrentTab('products');
                        }}
                        className="w-full text-left p-2 rounded-[10px] hover:bg-[#F8FAF9] flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-8 h-8 rounded-[8px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate">{p.name}</span>
                            <span className="text-[11px] text-slate-500 block">
                              {p.category} · স্টক: {p.stock}
                            </span>
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
                    <span className="text-[11px] font-semibold text-slate-400 px-2 py-1 block">
                      অর্ডার ({searchResults.orders.length})
                    </span>
                    {searchResults.orders.map((o) => (
                      <button
                        key={o.id || o.orderNumber}
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          setSearchQuery('');
                          if (onSelectOrder) onSelectOrder(o);
                          else setCurrentTab('orders');
                        }}
                        className="w-full text-left p-2 rounded-[10px] hover:bg-[#F8FAF9] flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-[#15803D] block">
                            #{o.orderNumber}
                          </span>
                          <span className="text-slate-900 font-medium block truncate">
                            {o.customerName} · {o.phoneNumber}
                          </span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-bold text-slate-900 font-mono tabular-nums block">
                            ৳{o.total.toLocaleString()}
                          </span>
                          <span className="text-[11px] capitalize text-slate-500 font-medium block">
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

      {/* Right: Sync, Add Product, Storefront, Profile */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-[#16A34A] hover:bg-[#ECFDF3] rounded-[10px] transition-colors border border-transparent hover:border-emerald-200/80 shrink-0"
          title="ডাটাবেজ সিঙ্ক করুন"
          aria-label="তথ্য রিফ্রেশ করুন"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#16A34A]' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onAddNewProduct}
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[10px] transition-colors shadow-xs whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">নতুন প্রোডাক্ট</span>
          <span className="sm:hidden">যোগ করুন</span>
        </button>

        <button
          type="button"
          onClick={onBackToStore}
          className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#15803D] bg-[#F8FAF9] hover:bg-[#ECFDF3] border border-slate-200/90 rounded-[10px] transition-colors whitespace-nowrap shrink-0"
          title="লাইভ স্টোর দেখুন"
        >
          <Store className="w-3.5 h-3.5 text-slate-500" />
          <span>স্টোরফ্রন্ট</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block shrink-0" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 sm:p-1.5 rounded-[10px] hover:bg-slate-100 border border-transparent hover:border-slate-200/80 transition-colors"
            aria-expanded={profileOpen}
            aria-label="অ্যাডমিন প্রোফাইল মেনু"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0 font-display">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <span className="font-semibold text-slate-900 block truncate max-w-[100px]">
                {user?.name || 'Admin'}
              </span>
              <span className="text-[11px] text-slate-500 block">অ্যাডমিন</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-[12px] shadow-xl py-2 z-50 animate-in fade-in duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#15803D] mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>সুপার অ্যাডমিন</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email || 'admin@muazelectronic.online'}
                </p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('settings');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-[#F8FAF9] flex items-center gap-2.5 font-medium"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>স্টোর ও সিস্টেম সেটিংস</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onBackToStore();
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-[#F8FAF9] flex items-center gap-2.5 font-medium"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>পাবলিক স্টোরফ্রন্টে যান</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
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
