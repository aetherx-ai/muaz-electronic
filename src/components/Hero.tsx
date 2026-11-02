import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-[#F3FBF5] via-[#F8FAF9] to-[#F8FAF9] py-8 sm:py-11 md:py-12 border-b border-gray-200/50"
    >
      {/* Subtle organic light accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[460px] h-[180px] bg-[#16A34A]/[0.05] blur-[70px] rounded-full"
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Main Bengali Headline */}
        <h1 className="text-[25px] sm:text-[32px] md:text-[38px] font-extrabold text-[#111827] tracking-tight leading-[1.28] text-balance font-bengali">
          <span>আপনার পছন্দের গ্যাজেট</span>
          <br />
          <span>খুঁজে নিন </span>
          <span className="text-[#16A34A] relative inline-block whitespace-nowrap">
            MUAZ ELECTRONIC
            {/* Elegant curved green underline accent */}
            <svg
              className="absolute -bottom-1.5 left-0 w-full h-[8px] text-[#16A34A]"
              viewBox="0 0 240 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2 7C65 2.5 175 2.5 238 7.5"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* Refined Supporting Subtitle */}
        <p className="mt-2.5 sm:mt-3 text-xs sm:text-[13.5px] text-[#6B7280] max-w-md mx-auto leading-relaxed">
          স্মার্টফোন গ্যাজেট ও প্রিমিয়াম এক্সেসরিজ—অনলাইন সিলেকশন ও দ্রুত ক্যাশ অন ডেলিভারি।
        </p>

        {/* Action Buttons with 14-16px radius (Premium Ecommerce system) */}
        <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          
          {/* Primary CTA: Solid Green */}
          <a
            href="#products"
            className="inline-flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-semibold text-[13px] sm:text-[14px] rounded-[14px] sm:rounded-[16px] shadow-[0_2px_12px_rgba(22,163,74,0.25)] transition-all duration-200"
          >
            <span>এখনই শপ করুন</span>
            <ArrowRight className="w-4 h-4 stroke-[2]" />
          </a>

          {/* Secondary CTA: White with subtle green border */}
          <a
            href="#featured"
            className="inline-flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-[#F3FBF5] active:scale-[0.98] text-gray-800 border border-emerald-200/90 font-semibold text-[13px] sm:text-[14px] rounded-[14px] sm:rounded-[16px] shadow-2xs hover:border-[#16A34A] hover:text-[#16A34A] transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 text-[#16A34A] stroke-[2]" />
            <span>নতুন পণ্য</span>
          </a>

        </div>

      </div>
    </section>
  );
};
