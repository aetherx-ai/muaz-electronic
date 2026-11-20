import React from 'react';
import { STORE_NAME, WHATSAPP_INTL } from '../data/products';

export const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      className="bg-gray-50 border-b border-gray-200 py-8 sm:py-12"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight text-balance">
          {STORE_NAME}
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          স্মার্টফোন গ্যাজেট ও প্রয়োজনীয় এক্সেসরিজ—সহজ অনলাইন অর্ডার এবং দ্রুত ক্যাশ অন ডেলিভারি।
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#products"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-sm rounded-md transition-colors"
          >
            পণ্য দেখুন
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_INTL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-semibold text-sm rounded-md transition-colors"
          >
            WhatsApp-এ যোগাযোগ
          </a>
        </div>
      </div>
    </section>
  );
};
