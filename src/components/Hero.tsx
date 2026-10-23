import React from 'react';
import { ArrowDown, MessageCircle, ShieldCheck, Zap, Truck } from 'lucide-react';
import { WHATSAPP_INTL } from '../data/products';
import heroImage from '../assets/images/hero_gadget_showcase_1792754252457.jpg';

export const Hero: React.FC = () => {
  return (
    <section id="hero" className="relative overflow-hidden bg-[#070707] border-b border-[#292929]">
      {/* Background ambient lighting - strictly restrained deep gold tone */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#FFC928]/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#B88718]/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Copy (Approx 45% = 5 cols or 6 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            
            {/* Brand Signature / Eyebrow */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-[1.5px] bg-[#FFC928]" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#FFC928] font-display">
                SMART GADGETS • BETTER LIFE
              </span>
            </div>

            {/* Authoritative Bengali Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#FAFAFA] tracking-tight leading-[1.25] text-balance">
              প্রযুক্তি হোক আপনার{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC928] via-[#F7D77B] to-[#B88718]">
                স্টাইলের অংশ
              </span>
              ।
            </h1>

            {/* Persuasive Supporting Text */}
            <p className="text-base sm:text-lg text-[#A7A7A7] leading-relaxed max-w-xl">
              আপনার দৈনন্দিন জীবনের স্মার্ট গ্যাজেট ও প্রয়োজনীয় ইলেকট্রনিক্স—সহজ শপিং, সরাসরি অর্ডার।
            </p>

            {/* Call to Actions (Primary & Secondary) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a
                href="#products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-lg transition-all duration-150 shadow-md shadow-[#FFC928]/20 group"
              >
                <span>প্রোডাক্ট এক্সপ্লোর করুন</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </a>

              <a
                href={`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি Muaz Electronic থেকে স্মার্ট গ্যাজেট অর্ডার করতে আগ্রহী।')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#FAFAFA] bg-[#111111] hover:bg-[#171717] border border-[#292929] hover:border-[#FFC928]/50 rounded-lg transition-all duration-150"
              >
                <MessageCircle className="w-4 h-4 text-[#FFC928]" />
                <span>WhatsApp-এ অর্ডার করুন</span>
              </a>
            </div>

            {/* Trust Markers Strip (Adhering to anti-slop: clean text with dividers, no pills) */}
            <div className="pt-6 border-t border-[#292929]/80 grid grid-cols-3 gap-3 text-xs text-[#A7A7A7]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FFC928] shrink-0" />
                <span className="leading-tight">কোয়ালিটি চেকড প্রোডাক্ট</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#FFC928] shrink-0" />
                <span className="leading-tight">সারা দেশে ডেলিভারি</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFC928] shrink-0" />
                <span className="leading-tight">দ্রুততম প্রসেসিং</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual (Approx 55% = 7 cols) */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#292929] bg-[#111111] shadow-2xl group">
              {/* Subtle gold accent frame line */}
              <div className="absolute inset-0 border border-[#FFC928]/20 rounded-2xl pointer-events-none" />
              
              <img
                src={heroImage}
                alt="MUAZ ELECTRONIC Signature Gadget Showcase"
                className="w-full h-auto max-h-[460px] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />

              {/* Bottom Scrim with Signature Tagline */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#070707] via-[#070707]/70 to-transparent p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#FFC928] font-bold font-display">
                    SIGNATURE CURATION
                  </p>
                  <p className="text-sm font-semibold text-[#FAFAFA]">
                    Selected Premium Audio & Smart Devices
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#A7A7A7] block">Official Contact</span>
                  <span className="text-xs font-mono font-medium text-[#F7D77B] tracking-wider">
                    +880 1822 486585
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
