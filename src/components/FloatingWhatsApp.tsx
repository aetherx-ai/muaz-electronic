import React from 'react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_INTL, WHATSAPP_NUMBER } from '../data/products';

export const FloatingWhatsApp: React.FC = () => {
  return (
    <aside aria-label="WhatsApp সাপোর্ট" className="fixed bottom-16 right-3.5 sm:bottom-5 sm:right-5 z-30">
      <a
        href={`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('আসসালামু আলাইকুম, Muaz Electronic এ অর্ডার সংক্রান্ত তথ্য জানতে চাই।')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 sm:px-4 sm:py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-full shadow-[0_4px_16px_rgba(37,211,102,0.4)] transition-all duration-200 hover:scale-105 group border-2 border-white"
        title={`WhatsApp চ্যাট: ${WHATSAPP_NUMBER}`}
        aria-label="WhatsApp সাপোর্ট"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="hidden sm:inline text-xs font-semibold">
          WhatsApp অর্ডার
        </span>
      </a>
    </aside>
  );
};
