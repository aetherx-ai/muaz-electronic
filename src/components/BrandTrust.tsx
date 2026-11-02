import React from 'react';
import { MessageCircle, ExternalLink, ShieldCheck, Truck, Headphones, CheckCircle2 } from 'lucide-react';
import { OFFICIAL_LOGO_PATH, STORE_NAME, STORE_TAGLINE, WHATSAPP_INTL, WHATSAPP_NUMBER, FACEBOOK_URL } from '../data/products';

export const BrandTrust: React.FC = () => {
  const trustFeatures = [
    {
      icon: <Truck className="w-5 h-5 text-[#16A34A] stroke-[1.8]" />,
      title: 'দ্রুত হোম ডেলিভারি',
      description: 'ঢাকা ও সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-[#16A34A] stroke-[1.8]" />,
      title: 'সহজ পেমেন্ট',
      description: 'পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#16A34A] stroke-[1.8]" />,
      title: 'নিরাপদ অর্ডার',
      description: '১০০% কোয়ালিটি নিশ্চিত অরিজিনাল গ্যাজেট',
    },
    {
      icon: <Headphones className="w-5 h-5 text-[#16A34A] stroke-[1.8]" />,
      title: 'কাস্টমার সাপোর্ট',
      description: 'সরাসরি WhatsApp-এ দ্রুত যেকোনো তথ্য ও সহায়তা',
    },
  ];

  return (
    <section id="about" className="py-9 sm:py-12 bg-white border-t border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Compact Premium Service Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-9 sm:mb-12">
          {trustFeatures.map((item, index) => (
            <div
              key={index}
              className="p-3.5 sm:p-4 rounded-[18px] bg-[#F8FAF9] border border-[#111827]/[0.05] flex flex-col items-center text-center transition-all duration-150 hover:border-emerald-200 shadow-2xs"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ECFDF3] flex items-center justify-center mb-2">
                {item.icon}
              </div>
              <h4 className="text-[12.5px] sm:text-[13.5px] font-bold text-[#111827] leading-snug">
                {item.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#6B7280] mt-0.5 leading-snug">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Brand Information & Direct Contact */}
        <div className="bg-gradient-to-r from-[#F3FBF5] via-white to-[#F3FBF5] border border-emerald-100/80 rounded-[22px] p-5 sm:p-8 flex flex-col md:flex-row items-center gap-5 sm:gap-7 text-center md:text-left shadow-2xs">
          
          {/* Logo */}
          <div className="shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black p-0.5 border-2 border-[#16A34A]/30 flex items-center justify-center shadow-xs">
              <img
                src={OFFICIAL_LOGO_PATH}
                alt={`${STORE_NAME} Logo`}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Copy */}
          <div className="flex-1 space-y-1.5">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-[#16A34A]">
              {STORE_TAGLINE}
            </span>
            <h3 className="text-lg sm:text-2xl font-extrabold text-[#111827]">
              MUAZ ELECTRONIC
            </h3>
            <p className="text-xs sm:text-[13px] text-[#4B5563] leading-relaxed max-w-xl">
              আপনার পছন্দের গ্যাজেট খুঁজে নিন সহজে। Muaz Electronic থেকে সরাসরি প্রোডাক্ট পছন্দ করে WhatsApp-এর মাধ্যমে অর্ডার করুন এবং ঘরে বসেই চেক করে গ্রহণ করুন।
            </p>

            <div className="pt-2.5 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <a
                href={`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('আসসালামু আলাইকুম, Muaz Electronic এ যোগাযোগ করছি।')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-xs font-semibold bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white shadow-2xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>WhatsApp: {WHATSAPP_NUMBER}</span>
              </a>

              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-xs font-semibold bg-white hover:bg-gray-50 active:scale-[0.98] text-[#374151] border border-gray-200 transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>অফিসিয়াল ফেসবুক পেজ</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
