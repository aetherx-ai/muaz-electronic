import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, Menu, X, Search, Shield } from 'lucide-react';
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
    { label: 'সকল প্রোডাক্ট', href: '#products' },
    { label: 'ক্যাটাগরি', href: '#products' },
    { label: 'আমাদের সম্পর্কে', href: '#about' },
    { label: 'যোগাযোগ', href: '#contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070707]/95 backdrop-blur-md border-b border-[#292929]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-20">
          
          {/* Zone 1: Official Logo (Exact aspect ratio, contained, black background, legible) */}
          <a
            href="#hero"
            className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFC928]"
            title={`${STORE_NAME} - হোম`}
          >
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 bg-[#030303] rounded-full p-0.5 border border-[#292929] flex items-center justify-center overflow-hidden">
              <img
                src={OFFICIAL_LOGO_PATH}
                alt="MUAZ ELECTRONIC Official Logo"
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#FAFAFA] font-display">
                MUAZ <span className="text-[#FFC928]">ELECTRONIC</span>
              </span>
              <span className="text-[10px] tracking-wider text-[#A7A7A7] uppercase font-display hidden sm:inline-block">
                Smart Gadgets • Better Life
              </span>
            </div>
          </a>

          {/* Zone 2: Bengali Navigation Links (Single line, subtle gold hover state) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#A7A7A7]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="whitespace-nowrap shrink-0 hover:text-[#FFC928] transition-colors duration-150 relative py-1 text-[15px]"
              >
                {link.label}
              </a>
            ))}
            {onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="whitespace-nowrap shrink-0 hover:text-[#FFC928] transition-colors duration-150 relative py-1 text-xs text-[#A7A7A7]/70 flex items-center gap-1"
                title="অ্যাডমিন ড্যাশবোর্ড"
              >
                <Shield className="w-3.5 h-3.5 text-[#FFC928]" />
                <span>অ্যাডমিন</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions (Search, Cart live count, WhatsApp CTA) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={onSearchClick}
              className="p-2.5 text-[#A7A7A7] hover:text-[#FFC928] hover:bg-[#111111] rounded-lg transition-colors"
              title="প্রোডাক্ট খুঁজুন"
              aria-label="প্রোডাক্ট খুঁজুন"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Shopping Bag with live count badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-[#FAFAFA] hover:text-[#FFC928] hover:bg-[#111111] rounded-lg transition-colors flex items-center gap-2 group"
              title="শপিং ব্যাগ দেখুন"
              aria-label="শপিং ব্যাগ"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FFC928] text-[#070707] font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center font-display shadow-md">
                  {totalItems}
                </span>
              )}
            </button>

            {/* WhatsApp Quick Action (Primary Signature Button) */}
            <a
              href={`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('হ্যালো MUAZ ELECTRONIC, আমি গ্যাজেট অর্ডার সংক্রান্ত তথ্য জানতে চাই।')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-[#FFC928]/20"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp অর্ডার</span>
            </a>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#A7A7A7] hover:text-[#FAFAFA] rounded-lg hover:bg-[#111111]"
              aria-label="মেনু খুলুন"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#292929] bg-[#070707] animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col space-y-3 px-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-base font-medium text-[#FAFAFA] hover:text-[#FFC928] hover:bg-[#111111] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              {onNavigateToAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateToAdmin();
                  }}
                  className="px-3 py-2 rounded-md text-base font-medium text-[#FFC928] hover:bg-[#111111] transition-colors flex items-center gap-2 text-left"
                >
                  <Shield className="w-4 h-4" />
                  <span>এডমিন ড্যাশবোর্ড</span>
                </button>
              )}
              <div className="pt-2 border-t border-[#292929]">
                <a
                  href={`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('হ্যালো MUAZ ELECTRONIC, আমি গ্যাজেট অর্ডার সংক্রান্ত তথ্য জানতে চাই।')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>WhatsApp-এ সরাসরি যোগাযোগ</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
