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
    { id: 'overview', label: 'ড্যাশবোর্ড ওভারভিউ', icon: <LayoutDashboard className="w-4 h-4 stroke-[1.8]" /> },
    { id: 'products', label: 'প্রোডাক্ট ম্যানেজমেন্ট', icon: <Package className="w-4 h-4 stroke-[1.8]" /> },
    { id: 'categories', label: 'ক্যাটাগরি ম্যানেজমেন্ট', icon: <Layers className="w-4 h-4 stroke-[1.8]" /> },
    { id: 'settings', label: 'স্টোর ও ডাটাবেজ সেটিংস', icon: <Settings className="w-4 h-4 stroke-[1.8]" /> },
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
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-2xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-gray-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black border border-gray-200 p-0.5 flex items-center justify-center shrink-0">
                <img
                  src={OFFICIAL_LOGO_PATH}
                  alt={`${STORE_NAME} Logo`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-[15px] font-bold text-gray-900 tracking-tight block">
                  MUAZ <span className="text-[#16A34A]">ADMIN</span>
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                  {STORE_TAGLINE}
                </span>
              </div>
            </div>

            {/* Database connection badge */}
            <div className="mt-3 px-3 py-1.5 bg-[#F8FAF9] border border-gray-200/70 rounded-xl flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#16A34A]" />
                <span className="text-gray-500">ডাটাবেজ:</span>
              </div>
              <span
                className={`font-semibold ${
                  isSupabaseConnected ? 'text-[#16A34A]' : 'text-emerald-700'
                }`}
              >
                {isSupabaseConnected ? 'Supabase Live' : 'Persistent Storage'}
              </span>
            </div>
          </div>

          {/* Navigation list */}
          <nav className="p-3.5 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#16A34A] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-[#ECFDF3]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-3 mt-3 border-t border-gray-100">
              <a
                href="/"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-[#16A34A] hover:bg-[#ECFDF3] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 stroke-[1.8]" />
                  <span>পাবলিক স্টোরফ্রন্ট দেখুন</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </a>
            </div>
          </nav>
        </div>

        {/* Footer Admin User & Logout */}
        <div className="p-4 border-t border-gray-100 bg-[#F8FAF9]">
          <div className="p-2.5 bg-white border border-gray-200/80 rounded-xl flex items-center justify-between mb-2.5 shadow-2xs">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-bold text-gray-900 block truncate">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[11px] text-gray-500 block truncate">
                {user?.email || 'admin@muazelectronic.com'}
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold text-[#16A34A] bg-[#ECFDF3] rounded-md border border-emerald-200">
              Admin
            </span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট করুন</span>
          </button>
        </div>
      </aside>
    </>
  );
};
