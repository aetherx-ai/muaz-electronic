import React, { useState } from 'react';
import { Search, User, ShoppingCart, Menu, X } from 'lucide-react';
import { STORE_NAME, WHATSAPP_INTL } from '../data/products';
import { useCart } from '../context/CartContext';
import { Category } from '../types';

interface HeaderProps {
  onSearchClick: () => void;
  onNavigateToAdmin?: () => void;
  categories?: (Category | string)[];
  onSelectCategory?: (categoryName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchClick,
  onNavigateToAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();

  const navLinks = [
    { label: 'হোম', href: '#hero' },
    { label: 'পণ্যসমূহ', href: '#products' },
    { label: 'আমাদের সম্পর্কে', href: '#about' },
    { label: 'যোগাযোগ', href: '#contact' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 h-14 sm:h-16">
            {/* Brand Title */}
            <a
              href="#hero"
              className="text-base sm:text-lg font-bold tracking-tight text-gray-900 whitespace-nowrap shrink-0"
            >
              {STORE_NAME}
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-gray-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={onSearchClick}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                title="প্রোডাক্ট খুঁজুন"
                aria-label="প্রোডাক্ট খুঁজুন"
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {onNavigateToAdmin && (
                <button
                  type="button"
                  onClick={onNavigateToAdmin}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                  title="অ্যাডমিন পোর্টাল"
                  aria-label="অ্যাডমিন পোর্টাল"
                >
                  <User className="w-4.5 h-4.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-md whitespace-nowrap shrink-0"
                title="শপিং ব্যাগ"
                aria-label="শপিং ব্যাগ"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>ব্যাগ ({totalItems})</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 md:hidden"
                aria-label="মেনু"
                title="মেনু"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Simple Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  {link.label}
                </a>
              ))}
              {onNavigateToAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateToAdmin();
                  }}
                  className="w-full text-left px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  অ্যাডমিন ড্যাশবোর্ড
                </button>
              )}
              <a
                href={`https://wa.me/${WHATSAPP_INTL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-2 py-2 text-sm font-medium text-[#16A34A] hover:bg-gray-50 rounded-md"
              >
                WhatsApp যোগাযোগ
              </a>
            </div>
          )}
        </div>
      </header>
    </>
  );
};
