import React from 'react';
import { Home, Layers, Search, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { WHATSAPP_INTL } from '../data/products';

interface MobileBottomNavProps {
  onSearchClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onSearchClick }) => {
  const { totalItems, setIsCartOpen } = useCart();

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="মোবাইল দ্রুত নেভিগেশন"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/70 py-1.5 px-3 lg:hidden shadow-[0_-2px_12px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Home */}
        <button
          type="button"
          onClick={() => handleScrollTo('hero')}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-gray-500 hover:text-[#16A34A] transition-colors focus-visible:outline-none"
        >
          <Home className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] font-medium mt-0.5">হোম</span>
        </button>

        {/* Categories */}
        <button
          type="button"
          onClick={() => handleScrollTo('all-products-section')}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-gray-500 hover:text-[#16A34A] transition-colors focus-visible:outline-none"
        >
          <Layers className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] font-medium mt-0.5">ক্যাটাগরি</span>
        </button>

        {/* Search */}
        <button
          type="button"
          onClick={onSearchClick}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-gray-500 hover:text-[#16A34A] transition-colors focus-visible:outline-none"
        >
          <Search className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] font-medium mt-0.5">অনুসন্ধান</span>
        </button>

        {/* Cart */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center justify-center py-1 px-2.5 text-gray-500 hover:text-[#16A34A] transition-colors focus-visible:outline-none"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#16A34A] text-white text-[9px] font-bold h-3.5 min-w-[14px] px-0.5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">ব্যাগ</span>
        </button>

        {/* WhatsApp Order */}
        <a
          href={`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('আসসালামু আলাইকুম, Muaz Electronic এ অর্ডার সংক্রান্ত তথ্য জানতে চাই।')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1 px-2.5 text-emerald-600 hover:text-emerald-700 transition-colors focus-visible:outline-none"
        >
          <MessageCircle className="w-5 h-5 stroke-[1.8] fill-emerald-100" />
          <span className="text-[10px] font-medium mt-0.5">WhatsApp</span>
        </a>

      </div>
    </nav>
  );
};
