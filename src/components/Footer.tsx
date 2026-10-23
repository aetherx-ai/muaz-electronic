import React from 'react';
import { MessageCircle, ExternalLink, ArrowUp, Shield } from 'lucide-react';
import {
  OFFICIAL_LOGO_PATH,
  STORE_NAME,
  STORE_TAGLINE,
  WHATSAPP_INTL,
  WHATSAPP_NUMBER,
  FACEBOOK_URL,
  INITIAL_CATEGORIES,
} from '../data/products';

interface FooterProps {
  onNavigateToAdmin?: () => void;
  categories?: string[];
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToAdmin, categories = INITIAL_CATEGORIES }) => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="bg-[#030303] text-[#A7A7A7] border-t border-[#292929] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-[#292929]">
          
          {/* Brand Info & Full Official Logo (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-[#070707] border border-[#292929] p-1 flex items-center justify-center shrink-0">
                <img
                  src={OFFICIAL_LOGO_PATH}
                  alt={`${STORE_NAME} Logo`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-[#FAFAFA] font-display tracking-tight block">
                  MUAZ <span className="text-[#FFC928]">ELECTRONIC</span>
                </span>
                <span className="text-xs text-[#A7A7A7] uppercase tracking-wider font-display">
                  {STORE_TAGLINE}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed max-w-sm pt-2">
              আপনার বিশ্বস্ত গ্যাজেট পার্টনার। শীর্ষ মানের মোবাইল অ্যাক্সেসরিজ, অডিও ডিভাইস এবং গেমিং গ্যাজেটের সমৃদ্ধ কালেকশন।
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={`https://wa.me/${WHATSAPP_INTL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-[#111111] hover:bg-[#1a1a1a] text-[#FAFAFA] hover:text-[#25D366] border border-[#292929] rounded-lg transition-colors"
                title="WhatsApp-এ যোগাযোগ"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-[#111111] hover:bg-[#1a1a1a] text-[#FAFAFA] hover:text-[#FFC928] border border-[#292929] rounded-lg transition-colors"
                title="Facebook পেজ"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Navigation (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider font-display">
              নেভিগেশন
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#hero" className="hover:text-[#FFC928] transition-colors">
                  হোম পেজ
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#FFC928] transition-colors">
                  সকল প্রোডাক্ট
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#FFC928] transition-colors">
                  আমাদের সম্পর্কে
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#FFC928] transition-colors">
                  যোগাযোগ
                </a>
              </li>
              <li>
                <button
                  onClick={onNavigateToAdmin}
                  className="hover:text-[#FFC928] transition-colors flex items-center gap-1.5 text-left text-[#A7A7A7]/80"
                >
                  <Shield className="w-3 h-3 text-[#FFC928]" />
                  <span>এডমিন ড্যাশবোর্ড</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Product Categories (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider font-display">
              ক্যাটাগরি
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.filter((c) => c !== 'All Products').map((cat) => (
                <li key={cat}>
                  <a href="#products" className="hover:text-[#FFC928] transition-colors">
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Direct Box (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider font-display">
              সরাসরি যোগাযোগ
            </h4>
            <div className="space-y-2 text-xs">
              <div className="bg-[#0e0e0e] p-3 rounded-lg border border-[#292929]">
                <span className="block text-[#A7A7A7] text-[11px]">WhatsApp হটলাইন:</span>
                <a
                  href={`https://wa.me/${WHATSAPP_INTL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#FAFAFA] hover:text-[#25D366] text-sm font-mono mt-0.5 inline-block"
                >
                  {WHATSAPP_NUMBER}
                </a>
              </div>

              <div className="bg-[#0e0e0e] p-3 rounded-lg border border-[#292929]">
                <span className="block text-[#A7A7A7] text-[11px]">অফিসিয়াল ফেসবুক:</span>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[#FFC928] hover:underline mt-0.5 inline-block truncate max-w-full"
                >
                  fb.com/share/1KwJp3ZvBy/
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A7A7A7]">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              © {currentYear} {STORE_NAME}. সর্বস্বত্ব সংরক্ষিত। ({STORE_TAGLINE})
            </span>
            <span className="text-[#292929]">|</span>
            <button
              onClick={onNavigateToAdmin}
              className="text-[#A7A7A7] hover:text-[#FFC928] transition-colors underline"
            >
              এডমিন পোর্টাল
            </button>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-xs text-[#A7A7A7] hover:text-[#FFC928] transition-colors"
          >
            <span>উপরে যান</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
