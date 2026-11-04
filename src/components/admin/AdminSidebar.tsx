import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Boxes,
  Settings,
  Store,
  LogOut,
  Database,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';
import { OFFICIAL_LOGO_PATH, STORE_NAME, STORE_TAGLINE } from '../../data/products';
import { useAuth } from '../../context/AuthContext';

export type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'inventory'
  | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  setCurrentTab: (tab: AdminTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  categoryCount?: number;
  productCount?: number;
  pendingOrderCount?: number;
  lowStockCount?: number;
  customerCount?: number;
  onBackToStore?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen,
  isCollapsed = false,
  setIsCollapsed,
  categoryCount,
  productCount,
  pendingOrderCount,
  lowStockCount,
  customerCount,
  onBackToStore,
}) => {
  const { user, logout, isSupabaseConnected } = useAuth();

  const mainNavItems: {
    id: AdminTab;
    label: string;
    bengaliLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeStyle?: 'primary' | 'warning' | 'danger' | 'neutral';
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      bengaliLabel: 'ড্যাশবোর্ড ওভারভিউ',
      icon: LayoutDashboard,
    },
    {
      id: 'orders',
      label: 'Orders',
      bengaliLabel: 'অর্ডারসমূহ',
      icon: ShoppingBag,
      badge: pendingOrderCount,
      badgeStyle: pendingOrderCount && pendingOrderCount > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'products',
      label: 'Products',
      bengaliLabel: 'প্রোডাক্টস',
      icon: Package,
      badge: productCount,
      badgeStyle: 'neutral',
    },
    {
      id: 'categories',
      label: 'Categories',
      bengaliLabel: 'ক্যাটাগরি',
      icon: Layers,
      badge: categoryCount,
      badgeStyle: 'neutral',
    },
    {
      id: 'customers',
      label: 'Customers',
      bengaliLabel: 'গ্রাহক তালিকা',
      icon: Users,
      badge: customerCount,
      badgeStyle: 'neutral',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      bengaliLabel: 'ইনভেন্টরি ও স্টক',
      icon: Boxes,
      badge: lowStockCount,
      badgeStyle: lowStockCount && lowStockCount > 0 ? 'danger' : 'neutral',
    },
  ];

  const secondaryNavItems: {
    id: AdminTab;
    label: string;
    bengaliLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'settings',
      label: 'Settings',
      bengaliLabel: 'স্টোর ও সেটিংস',
      icon: Settings,
    },
  ];

  const handleSelectTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-[76px]' : 'lg:w-[264px]'} w-[264px] shadow-xl lg:shadow-none select-none`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          
          {/* Brand Header */}
          <div className={`px-4 py-4 border-b border-slate-100 flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden shadow-xs border border-slate-800 p-1 group">
                <img
                  src={OFFICIAL_LOGO_PATH}
                  alt={`${STORE_NAME} Logo`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-slate-900 tracking-tight block font-display">
                      MUAZ <span className="text-blue-600 font-bold">COMMERCE</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium truncate block font-sans">
                    স্মার্ট বিজনেস ড্যাশবোর্ড
                  </span>
                </div>
              )}
            </div>

            {/* Collapse toggle button on desktop */}
            {setIsCollapsed && !isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="সাইডবার সংকুচিত করুন"
                aria-label="সাইডবার সংকুচিত করুন"
              >
                <PanelLeftClose className="w-4 h-4 stroke-[1.8]" />
              </button>
            )}
          </div>

          {/* Database connection badge */}
          {!isCollapsed ? (
            <div className="px-3.5 pt-3 pb-1">
              <div className="px-2.5 py-1.5 bg-slate-50/90 border border-slate-200/80 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium truncate">
                  <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">সিস্টেম স্টোরেজ</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-800 text-[10px] font-mono">
                    {isSupabaseConnected ? 'Supabase' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex justify-center pt-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50"
                title={isSupabaseConnected ? 'Supabase Live Connected' : 'Persistent Storage Active'}
              />
            </div>
          )}

          {/* Section: Main Menu */}
          {!isCollapsed && (
            <div className="px-4 pt-3.5 pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-display">
                ব্যবস্থাপনা
              </span>
            </div>
          )}

          {/* Navigation list */}
          <nav className="px-2.5 py-1 space-y-1">
            {mainNavItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  title={isCollapsed ? `${item.bengaliLabel} (${item.label})` : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'lg:justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                  } rounded-xl text-xs font-semibold transition-all relative group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-medium'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 stroke-[1.9] ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
                    {!isCollapsed && (
                      <span className="truncate text-left font-sans">{item.bengaliLabel}</span>
                    )}
                  </div>

                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums font-mono shrink-0 ml-1.5 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeStyle === 'warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200/80'
                          : item.badgeStyle === 'danger'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200/80'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Dot indicator when collapsed */}
                  {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Section: Secondary Menu */}
          {!isCollapsed && (
            <div className="px-4 pt-3.5 pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-display">
                কনফিগারেশন
              </span>
            </div>
          )}

          <nav className="px-2.5 py-1 space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  title={isCollapsed ? `${item.bengaliLabel} (${item.label})` : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'lg:justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                  } rounded-xl text-xs font-semibold transition-all relative group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-medium'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 stroke-[1.9] ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
                    {!isCollapsed && (
                      <span className="truncate text-left font-sans">{item.bengaliLabel}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Storefront Link */}
          <div className={`p-2.5 pt-2 mt-auto border-t border-slate-100 ${isCollapsed ? 'lg:p-1.5' : ''}`}>
            <button
              onClick={() => {
                if (onBackToStore) onBackToStore();
                else window.location.href = '/';
              }}
              title={isCollapsed ? 'স্টোরফ্রন্ট দেখুন' : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'lg:justify-center p-2' : 'justify-between px-3 py-2'
              } rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 border border-slate-200/90 transition-colors`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Store className="w-4 h-4 text-slate-500 shrink-0" />
                {!isCollapsed && <span className="truncate">স্টোরফ্রন্ট ভিউ</span>}
              </div>
              {!isCollapsed && <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>
          </div>

        </div>

        {/* Footer Admin User & Logout */}
        <div className={`p-3 border-t border-slate-100 bg-slate-50/70 ${isCollapsed ? 'lg:p-2' : ''}`}>
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="p-2 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 font-display">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="min-w-0 leading-none">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {user?.name || 'Administrator'}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      {user?.email || 'admin@muaz.com'}
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold text-blue-700 bg-blue-50 rounded border border-blue-200 shrink-0">
                  Admin
                </span>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl border border-rose-200 hover:border-rose-600 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 font-display"
                title={`${user?.name || 'Admin'} (${user?.email || ''})`}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <button
                onClick={logout}
                title="লগআউট"
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                aria-label="লগআউট"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

