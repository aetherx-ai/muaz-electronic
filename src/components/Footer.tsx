import React from 'react';
import { MessageCircle, ExternalLink, ArrowUp, ShieldCheck } from 'lucide-react';
import {
  OFFICIAL_LOGO_PATH,
  STORE_NAME,
  STORE_TAGLINE,
  WHATSAPP_INTL,
  WHATSAPP_NUMBER,
  FACEBOOK_URL,
  INITIAL_CATEGORIES,
} from '../data/products';
import { Category } from '../types';

interface FooterProps {
  onNavigateToAdmin?: () => void;
  categories?: (string | Category)[];
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToAdmin, categories = INITIAL_CATEGORIES }) => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="bg-white text-[#6B7280] border-t border-gray-200/60 pt-10 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-8 border-b border-gray-100">
          
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <img
                  src={OFFICIAL_LOGO_PATH}
                  alt={`${STORE_NAME} Logo`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-[15px] font-bold text-[#111827] tracking-tight block">
                  MUAZ <span className="text-[#16A34A]">ELECTRONIC</span>
                </span>
                <span className="text-[10px] text-gray-400">
                  {STORE_TAGLINE}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-[13px] text-[#6B7280] leading-relaxed max-w-sm">
              আপনার বিশ্বস্ত গ্যাজেট পার্টনার। শীর্ষ মানের মোবাইল অ্যাক্সেসরিজ, অডিও ডিভাইস এবং গেমিং গ্যাজেটের সমৃদ্ধ কালেকশন।
            </p>

            <div className="flex items-center gap-2 pt-0.5">
              <a
                href={`https://wa.me/${WHATSAPP_INTL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#F8FAF9] hover:bg-[#ECFDF3] text-gray-600 hover:text-[#16A34A] border border-gray-200/80 rounded-full transition-colors"
                title="WhatsApp-এ যোগাযোগ"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#F8FAF9] hover:bg-[#ECFDF3] text-gray-600 hover:text-[#16A34A] border border-gray-200/80 rounded-full transition-colors"
                title="Facebook পেজ"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-2.5">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              নেভিগেশন
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="#hero" className="hover:text-[#16A34A] transition-colors">
                  হোম পেজ
                </a>
              </li>
              <li>
                <a href="#featured" className="hover:text-[#16A34A] transition-colors">
                  ফিচার্ড পণ্য
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#16A34A] transition-colors">
                  সকল পণ্য
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#16A34A] transition-colors">
                  আমাদের সম্পর্কে
                </a>
              </li>
              {onNavigateToAdmin && (
                <li>
                  <button
                    onClick={onNavigateToAdmin}
                    className="hover:text-[#16A34A] transition-colors flex items-center gap-1.5 text-left text-gray-500"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>অ্যাডমিন পোর্টাল</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Categories */}
          <div className="lg:col-span-2 space-y-2.5">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              ক্যাটাগরি
            </h4>
            <ul className="space-y-1.5 text-xs">
              {categories
                .filter((c) => (typeof c === 'string' ? c : c.name) !== 'All Products')
                .map((cat) => {
                  const name = typeof cat === 'string' ? cat : cat.name;
                  const bengali = typeof cat === 'string' ? undefined : cat.bengaliName;
                  return (
                    <li key={name}>
                      <a href="#all-products-section" className="hover:text-[#16A34A] transition-colors">
                        {bengali || name}
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Contact Box */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              সরাসরি যোগাযোগ
            </h4>
            <div className="space-y-2 text-xs">
              <div className="bg-[#F8FAF9] p-2.5 rounded-[14px] border border-gray-100">
                <span className="block text-gray-400 text-[10.5px]">WhatsApp হটলাইন:</span>
                <a
                  href={`https://wa.me/${WHATSAPP_INTL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#111827] hover:text-[#16A34A] text-sm font-mono mt-0.5 inline-block"
                >
                  {WHATSAPP_NUMBER}
                </a>
              </div>

              <div className="bg-[#F8FAF9] p-2.5 rounded-[14px] border border-gray-100">
                <span className="block text-gray-400 text-[10.5px]">ফেসবুক পেজ:</span>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[#16A34A] hover:underline mt-0.5 inline-block truncate max-w-full"
                >
                  fb.com/share/1KwJp3ZvBy/
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div>
            © {currentYear} {STORE_NAME}. সর্বস্বত্ব সংরক্ষিত। ({STORE_TAGLINE})
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-gray-500 hover:text-[#16A34A] transition-colors"
          >
            <span>উপরে যান</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
