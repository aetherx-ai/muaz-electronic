import React from 'react';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { OFFICIAL_LOGO_PATH, STORE_NAME, STORE_TAGLINE, WHATSAPP_INTL, WHATSAPP_NUMBER, FACEBOOK_URL } from '../data/products';

export const BrandTrust: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-20 bg-[#030303] border-t border-b border-[#292929]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0c0c0c] border border-[#292929] rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          
          {/* Subtle gold backlight */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#FFC928]/5 blur-3xl rounded-full pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-12 text-center md:text-left">
            
            {/* Authoritative Official Logo Display */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#030303] border-2 border-[#FFC928]/40 p-1 flex items-center justify-center shadow-xl">
                <img
                  src={OFFICIAL_LOGO_PATH}
                  alt={`${STORE_NAME} Official Brand Logo`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Brand Story & Trust Copy */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="w-4 h-[1.5px] bg-[#FFC928]" />
                <span className="text-xs uppercase tracking-widest font-bold text-[#FFC928] font-display">
                  {STORE_TAGLINE}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] font-display">
                MUAZ ELECTRONIC
              </h3>

              {/* Exact Bengali prompt copy */}
              <p className="text-base sm:text-lg text-[#A7A7A7] leading-relaxed">
                আপনার পছন্দের গ্যাজেট খুঁজে নিন সহজে। Muaz Electronic থেকে প্রোডাক্ট নির্বাচন করুন এবং WhatsApp-এর মাধ্যমে অর্ডার দিন।
              </p>

              {/* Verified Contact Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('আসসালামু আলাইকুম, Muaz Electronic এ যোগাযোগ করছি।')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-[#FFC928] hover:bg-[#F7D77B] text-[#070707] transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>WhatsApp: {WHATSAPP_NUMBER}</span>
                </a>

                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-[#171717] hover:bg-[#202020] text-[#FAFAFA] border border-[#292929] hover:border-[#3b5998] transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-[#FFC928]" />
                  <span>ফেসবুক পেজ ভিজিট করুন</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
