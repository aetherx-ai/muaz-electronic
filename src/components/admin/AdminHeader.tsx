import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminTab } from './AdminSidebar';

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
}

const TAB_TITLES: Record<AdminTab, { title: string; subtitle: string; icon: React.ReactNode }> = {
  overview: {
    title: 'ড্যাশবোর্ড ওভারভিউ',
    subtitle: 'বিক্রয়, অর্ডার ও ইনভেন্টরি পারফরম্যান্স মেট্রিক্স',
    icon: <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />,
  },
  products: {
    title: 'প্রোডাক্ট ম্যানেজমেন্ট',
    subtitle: 'পণ্যের মূল্য, বিবরণ, ইমেজ ও স্টক নিয়ন্ত্রণ',
    icon: <Package className="w-4 h-4 text-slate-700" />,
  },
  categories: {
    title: 'ক্যাটাগরি ম্যানেজমেন্ট',
    subtitle: 'ডাইনামিক ক্যাটাগরি তৈরি, ড্র্যাগ-সর্টিং ও নিরাপদ পরিচালনা',
    icon: <Layers className="w-4 h-4 text-slate-700" />,
  },
  orders: {
    title: 'অর্ডার ম্যানেজমেন্ট',
    subtitle: 'গ্রাহকদের অর্ডার ট্র্যাকিং, স্ট্যাটাস আপডেট ও চালান ব্যবস্থাপনা',
    icon: <ShoppingBag className="w-4 h-4 text-slate-700" />,
  },
  customers: {
    title: 'গ্রাহক ডিরেক্টরি',
    subtitle: 'রেজিস্টার্ড ও অর্ডারকারী গ্রাহকদের তথ্য ও ক্রয় ইতিহাস',
    icon: <User className="w-4 h-4 text-slate-700" />,
  },
  inventory: {
    title: 'ইনভেন্টরি ও স্টক',
    subtitle: 'লো-স্টক সতর্কতা, দ্রুত রিস্টক ও মজুদ পণ্যের মূল্যায়ন',
    icon: <div className="w-2 h-2 rounded-full bg-amber-500" />,
  },
  settings: {
    title: 'স্টোর ও ডাটাবেজ সেটিংস',
    subtitle: 'যোগাযোগ নম্বর, ডেলিভারি চার্জ ও ক্লাউড সিঙ্ক কনফিগারেশন',
    icon: <Settings className="w-4 h-4 text-slate-700" />,
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
}) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabInfo = TAB_TITLES[currentTab] || TAB_TITLES.overview;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
      
      {/* Left: Mobile trigger, Desktop collapse toggle & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
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
          className="hidden lg:flex p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
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
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
          <span className="text-slate-900 font-semibold tracking-tight hidden sm:inline">MUAZ Control</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-900 font-semibold truncate font-display">
              {tabInfo.title}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Refresh & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg transition-colors border border-transparent hover:border-blue-100"
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
