import React from 'react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_INTL, WHATSAPP_NUMBER } from '../data/products';

export const FloatingWhatsApp: React.FC = () => {
  return (
    <aside aria-label="WhatsApp সাপোর্ট" className="fixed bottom-5 right-5 z-40">
      <a
        href={`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('আসসালামু আলাইকুম, Muaz Electronic এ অর্ডার সংক্রান্ত তথ্য জানতে চাই।')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 p-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold rounded-full shadow-2xl transition-all duration-200 hover:scale-105 group border-2 border-black"
        title={`WhatsApp চ্যাট: ${WHATSAPP_NUMBER}`}
        aria-label="WhatsApp সাপোর্ট"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="hidden sm:inline text-xs uppercase tracking-wider font-display pr-1">
          WhatsApp অর্ডার
        </span>
      </a>
    </aside>
  );
};
