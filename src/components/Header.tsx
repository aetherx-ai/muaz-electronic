import React, { useState } from 'react';
import {
  Search,
  User,
  ShoppingBag,
  Menu,
  X,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { OFFICIAL_LOGO_PATH, WHATSAPP_INTL, STORE_NAME } from '../data/products';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  onSearchClick: () => void;
  onNavigateToAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchClick, onNavigateToAdmin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();

  const navLinks = [
    { label: 'হোম', href: '#hero' },
    { label: 'ফিচার্ড পণ্য', href: '#featured' },
    { label: 'সকল গ্যাজেট', href: '#products' },
    { label: 'আমাদের সম্পর্কে', href: '#about' },
    { label: 'যোগাযোগ', href: '#contact' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[58px] sm:h-[64px]">
            
            {/* LEFT: Logo & Brand Name */}
            <a
              href="#hero"
              className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none group"
              title={`${STORE_NAME} - হোম`}
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black p-0.5 border border-gray-200/80 flex items-center justify-center overflow-hidden shadow-2xs group-hover:scale-105 transition-transform duration-200">
                <img
                  src={OFFICIAL_LOGO_PATH}
                  alt={`${STORE_NAME} Logo`}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] sm:text-[17px] font-bold tracking-tight text-gray-900 leading-none">
                  MUAZ <span className="text-[#16A34A]">ELECTRONIC</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium tracking-wider hidden sm:block mt-0.5">
                  Smart Gadgets • Better Life
                </span>
              </div>
            </a>

            {/* CENTER (Desktop only): Navigation links */}
            <nav className="hidden lg:flex items-center gap-7 text-[13.5px] font-medium text-gray-600">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="hover:text-[#16A34A] transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[1.5px] after:bg-[#16A34A] after:transition-all after:duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* RIGHT: Mobile & Desktop Action Icons */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              
              {/* 1. Search Icon */}
              <button
                type="button"
                onClick={onSearchClick}
                className="p-2 sm:p-2.5 text-gray-600 hover:text-[#16A34A] hover:bg-[#ECFDF3] rounded-full transition-colors active:scale-95"
                title="প্রোডাক্ট খুঁজুন"
                aria-label="প্রোডাক্ট খুঁজুন"
              >
                <Search className="w-5 h-5 stroke-[1.8]" />
              </button>

              {/* 2. Account / Admin Icon */}
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToAdmin) {
                    onNavigateToAdmin();
                  }
                }}
                className="p-2 sm:p-2.5 text-gray-600 hover:text-[#16A34A] hover:bg-[#ECFDF3] rounded-full transition-colors active:scale-95"
                title="অ্যাডমিন ও অ্যাকাউন্ট পোর্টাল"
                aria-label="অ্যাকাউন্ট / অ্যাডমিন"
              >
                <User className="w-5 h-5 stroke-[1.8]" />
              </button>

              {/* 3. Cart Icon with live badge */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 sm:p-2.5 text-gray-600 hover:text-[#16A34A] hover:bg-[#ECFDF3] rounded-full transition-colors active:scale-95 group"
                title="শপিং ব্যাগ"
                aria-label="শপিং ব্যাগ"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 bg-[#16A34A] text-white text-[10px] font-bold h-[17px] min-w-[17px] px-1 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* 4. Menu / Hamburger Icon */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 sm:p-2.5 text-gray-600 hover:text-[#16A34A] hover:bg-[#ECFDF3] rounded-full transition-colors active:scale-95 lg:hidden"
                aria-label="মেনু খুলুন"
                title="মেনু"
              >
                <Menu className="w-5 h-5 stroke-[1.8]" />
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Clean Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} />

          <aside className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col justify-between">
              
              {/* Drawer Header */}
              <div>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-black p-0.5 flex items-center justify-center">
                      <img
                        src={OFFICIAL_LOGO_PATH}
                        alt="Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      MUAZ <span className="text-[#16A34A]">ELECTRONIC</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="মেনু বন্ধ করুন"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="p-3.5 space-y-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] font-medium text-gray-700 hover:text-[#16A34A] hover:bg-[#ECFDF3] rounded-xl transition-colors"
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </a>
                  ))}

                  {/* Admin link */}
                  {onNavigateToAdmin && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigateToAdmin();
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-[13.5px] font-medium text-gray-700 hover:text-[#16A34A] hover:bg-[#ECFDF3] rounded-xl transition-colors mt-2"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                        <span>অ্যাডমিন ড্যাশবোর্ড</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </nav>
              </div>

              {/* Drawer Footer / WhatsApp Action */}
              <div className="p-4 border-t border-gray-100 bg-[#F8FAF9] space-y-3">
                <a
                  href={`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('আসসালামু আলাইকুম, Muaz Electronic এ অর্ডার সংক্রান্ত তথ্য জানতে চাই।')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>WhatsApp-এ সরাসরি যোগাযোগ</span>
                </a>
                <p className="text-center text-[11px] text-gray-500">
                  অফিসিয়াল হটলাইন: +880 1822 486585
                </p>
              </div>

            </div>
          </aside>
        </div>
      )}
    </>
  );
};
