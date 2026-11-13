import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Boxes,
  Ruler,
  TicketPercent,
  Star,
  BarChart3,
  Settings,
  Store,
  LogOut,
  Database,
  ExternalLink,
  PanelLeftClose,
} from 'lucide-react';
import { OFFICIAL_LOGO_PATH, STORE_NAME } from '../../data/products';
import { useAuth } from '../../context/AuthContext';

export type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'inventory'
  | 'clothing-sizes'
  | 'discounts'
  | 'reviews'
  | 'analytics'
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
  sizedProductCount?: number;
  activeCouponsCount?: number;
  pendingReviewsCount?: number;
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
  sizedProductCount,
  activeCouponsCount,
  pendingReviewsCount,
  onBackToStore,
}) => {
  const { user, logout, isSupabaseConnected } = useAuth();

  const coreNavItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeStyle?: 'primary' | 'warning' | 'danger' | 'neutral';
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      badge: productCount,
      badgeStyle: 'neutral',
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Layers,
      badge: categoryCount,
      badgeStyle: 'neutral',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: pendingOrderCount,
      badgeStyle: pendingOrderCount && pendingOrderCount > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      badge: customerCount,
      badgeStyle: 'neutral',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      badge: lowStockCount,
      badgeStyle: lowStockCount && lowStockCount > 0 ? 'danger' : 'neutral',
    },
    {
      id: 'clothing-sizes',
      label: 'Clothing Sizes',
      icon: Ruler,
      badge: sizedProductCount,
      badgeStyle: 'primary',
    },
  ];

  const growthNavItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeStyle?: 'primary' | 'warning' | 'danger' | 'neutral';
  }[] = [
    {
      id: 'discounts',
      label: 'Discounts',
      icon: TicketPercent,
      badge: activeCouponsCount,
      badgeStyle: 'primary',
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: Star,
      badge: pendingReviewsCount,
      badgeStyle: pendingReviewsCount && pendingReviewsCount > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
  ];

  const systemNavItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleSelectTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    setIsOpen(false);
  };

  const renderNavButton = (item: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeStyle?: 'primary' | 'warning' | 'danger' | 'neutral';
  }) => {
    const isActive = currentTab === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleSelectTab(item.id)}
        title={isCollapsed ? item.label : undefined}
        className={`w-full flex items-center ${
          isCollapsed ? 'lg:justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
        } rounded-[10px] text-[13px] transition-all relative group cursor-pointer ${
          isActive
            ? 'bg-[#ECFDF3] text-[#15803D] font-semibold border border-emerald-200/80 shadow-2xs'
            : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 stroke-[1.9] ${
              isActive ? 'text-[#16A34A]' : 'text-slate-400 group-hover:text-slate-700'
            }`}
          />
          {!isCollapsed && (
            <span className="truncate text-left whitespace-nowrap">{item.label}</span>
          )}
        </div>

        {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-[6px] font-semibold tabular-nums font-mono shrink-0 ml-1.5 ${
              isActive
                ? 'bg-[#16A34A] text-white'
                : item.badgeStyle === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                : item.badgeStyle === 'danger'
                ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                : item.badgeStyle === 'primary'
                ? 'bg-[#ECFDF3] text-[#15803D] border border-emerald-200/80'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {item.badge}
          </span>
        )}

        {isCollapsed && item.badge !== undefined && item.badge > 0 && (
          <span className="hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#16A34A] ring-2 ring-white" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-[76px]' : 'lg:w-[256px]'} w-[256px] shadow-xl lg:shadow-none select-none`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          {/* MUAZ ELECTRONIC Branding Header */}
          <div
            className={`h-16 px-4 border-b border-slate-200/80 flex items-center shrink-0 ${
              isCollapsed ? 'lg:justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-[10px] bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden border border-slate-800 p-1">
                <img
                  src={OFFICIAL_LOGO_PATH}
                  alt={`${STORE_NAME} Logo`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 leading-tight">
                  <span className="text-[13px] font-bold text-slate-900 tracking-tight block font-display truncate">
                    MUAZ <span className="text-[#16A34A]">ELECTRONIC</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium truncate block">
                    Seller &amp; Admin Center
                  </span>
                </div>
              )}
            </div>

            {setIsCollapsed && !isCollapsed && (
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[8px] transition-colors cursor-pointer"
                title="সাইডবার সংকুচিত করুন"
                aria-label="সাইডবার সংকুচিত করুন"
              >
                <PanelLeftClose className="w-4 h-4 stroke-[1.8]" />
              </button>
            )}
          </div>

          {/* Database Status Row */}
          {!isCollapsed && (
            <div className="px-3 pt-3 pb-1">
              <div className="px-2.5 py-1.5 bg-[#F8FAF9] border border-slate-200/80 rounded-[10px] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium truncate">
                  <Database className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                  <span className="truncate">ডাটাবেজ</span>
                </div>
                <span className="font-semibold text-[#15803D] text-[11px] font-mono shrink-0">
                  {isSupabaseConnected ? 'Supabase' : 'Connected'}
                </span>
              </div>
            </div>
          )}

          {/* Group 1: Store Management */}
          {!isCollapsed && (
            <div className="px-4 pt-4 pb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block font-display">
                Commerce
              </span>
            </div>
          )}
          <nav className={`px-2.5 space-y-0.5 ${isCollapsed ? 'pt-3' : ''}`}>
            {coreNavItems.map(renderNavButton)}
          </nav>

          {/* Group 2: Growth & Insights */}
          {!isCollapsed && (
            <div className="px-4 pt-4 pb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block font-display">
                Growth &amp; Reports
              </span>
            </div>
          )}
          <nav className={`px-2.5 space-y-0.5 ${isCollapsed ? 'pt-2 border-t border-slate-100 mt-2' : ''}`}>
            {growthNavItems.map(renderNavButton)}
          </nav>

          {/* Group 3: Settings */}
          {!isCollapsed && (
            <div className="px-4 pt-4 pb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block font-display">
                System
              </span>
            </div>
          )}
          <nav className={`px-2.5 space-y-0.5 pb-3 ${isCollapsed ? 'pt-2 border-t border-slate-100 mt-2' : ''}`}>
            {systemNavItems.map(renderNavButton)}
          </nav>

          {/* Storefront Link */}
          <div className={`p-2.5 mt-auto border-t border-slate-100 ${isCollapsed ? 'lg:p-2' : ''}`}>
            <button
              type="button"
              onClick={() => {
                if (onBackToStore) onBackToStore();
                else window.location.href = '/';
              }}
              title={isCollapsed ? 'View Storefront' : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'lg:justify-center p-2' : 'justify-between px-3 py-2'
              } rounded-[10px] text-xs font-semibold text-slate-700 hover:text-[#15803D] hover:bg-[#ECFDF3] border border-slate-200/90 transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Store className="w-4 h-4 text-slate-500 shrink-0" />
                {!isCollapsed && <span className="truncate whitespace-nowrap">View Storefront</span>}
              </div>
              {!isCollapsed && <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>
          </div>
        </div>

        {/* Footer Admin User & Logout */}
        <div className={`p-3 border-t border-slate-200/80 bg-[#F8FAF9] ${isCollapsed ? 'lg:p-2' : ''}`}>
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="p-2.5 bg-white border border-slate-200/80 rounded-[10px] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className="w-7 h-7 rounded-[8px] bg-[#16A34A] text-white text-xs font-bold flex items-center justify-center shrink-0 font-display">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <span className="text-xs font-semibold text-slate-900 block truncate">
                      {user?.name || 'Administrator'}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {user?.email || 'admin@muazelectronic.online'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 rounded-[10px] border border-rose-200 hover:border-rose-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-[8px] bg-[#16A34A] text-white text-xs font-bold flex items-center justify-center shrink-0 font-display"
                title={`${user?.name || 'Admin'} (${user?.email || ''})`}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <button
                type="button"
                onClick={logout}
                title="লগআউট"
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors cursor-pointer"
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
