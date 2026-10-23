import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Settings,
  Store,
  LogOut,
  Database,
  ExternalLink,
} from 'lucide-react';
import { OFFICIAL_LOGO_PATH, STORE_NAME, STORE_TAGLINE } from '../../data/products';
import { useAuth } from '../../context/AuthContext';

export type AdminTab = 'overview' | 'products' | 'categories' | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  setCurrentTab: (tab: AdminTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen,
}) => {
  const { user, logout, isSupabaseConnected } = useAuth();

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'ড্যাশবোর্ড ওভারভিউ', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'products', label: 'প্রোডাক্ট ম্যানেজমেন্ট', icon: <Package className="w-4 h-4" /> },
    { id: 'categories', label: 'ক্যাটাগরি ম্যানেজমেন্ট', icon: <Layers className="w-4 h-4" /> },
    { id: 'settings', label: 'স্টোর ও ডাটাবেজ সেটিংস', icon: <Settings className="w-4 h-4" /> },
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
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-[#292929] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#292929]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#030303] border border-[#292929] p-0.5 flex items-center justify-center shrink-0">
              <img
                src={OFFICIAL_LOGO_PATH}
                alt={`${STORE_NAME} Logo`}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-sm font-bold text-[#FAFAFA] font-display tracking-tight block">
                MUAZ <span className="text-[#FFC928]">ADMIN</span>
              </span>
              <span className="text-[10px] text-[#A7A7A7] uppercase tracking-wider font-display block">
                {STORE_TAGLINE}
              </span>
            </div>
          </div>

          {/* Database connection badge */}
          <div className="mt-4 px-3 py-1.5 bg-[#111111] border border-[#292929] rounded-lg flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#FFC928]" />
              <span className="text-[#A7A7A7]">ডাটাবেজ:</span>
            </div>
            <span
              className={`font-semibold ${
                isSupabaseConnected ? 'text-emerald-400' : 'text-[#FFC928]'
              }`}
            >
              {isSupabaseConnected ? 'Supabase Live' : 'Persistent Storage'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#FFC928] text-[#070707] shadow-sm shadow-[#FFC928]/20'
                    : 'text-[#A7A7A7] hover:text-[#FAFAFA] hover:bg-[#141414]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[#292929]/80 space-y-1.5">
            <a
              href="/"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#A7A7A7] hover:text-[#FFC928] hover:bg-[#141414] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4" />
                <span>পাবলিক স্টোরফ্রন্ট দেখুন</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </nav>

        {/* Footer Admin User & Logout */}
        <div className="p-4 border-t border-[#292929] bg-[#070707]">
          <div className="p-3 bg-[#111111] border border-[#292929] rounded-xl flex items-center justify-between mb-3">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-bold text-[#FAFAFA] block truncate">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[11px] text-[#A7A7A7] block truncate">
                {user?.email || 'admin@muazelectronic.com'}
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold text-[#FFC928] bg-[#FFC928]/10 rounded border border-[#FFC928]/30">
              Admin
            </span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600/20 rounded-lg border border-rose-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট করুন</span>
          </button>
        </div>
      </aside>
    </>
  );
};
