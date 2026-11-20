import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Headphones,
  ShoppingBag,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { INITIAL_PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import {
  getEffectiveUnitPrice,
  hasEnabledSizes,
  isProductOutOfStock,
} from '../lib/sizeInventory';
import { Product } from '../types';

interface HeroProps {
  products?: Product[];
}

const SLIDE_DURATION_MS = 5500;
const EASE_SWISS: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const Hero: React.FC<HeroProps> = ({ products = INITIAL_PRODUCTS }) => {
  const { setSelectedProductForDetail, addToCart } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const spotlightProducts = useMemo(() => {
    const published = products.filter((p) => p.status === 'published');
    const featured = published.filter((p) => p.isFeatured);
    const source = featured.length > 0 ? featured : published;
    return (source.length > 0 ? source : INITIAL_PRODUCTS).slice(0, 4);
  }, [products]);

  useEffect(() => {
    if (activeIndex >= spotlightProducts.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, spotlightProducts.length]);

  useEffect(() => {
    if (isPaused || spotlightProducts.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % spotlightProducts.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, spotlightProducts.length, activeIndex]);

  const activeProduct = spotlightProducts[activeIndex] || spotlightProducts[0];
  const activePrice = activeProduct ? getEffectiveUnitPrice(activeProduct) : 0;
  const oldPrice =
    activeProduct && activeProduct.salePrice && activeProduct.salePrice < activeProduct.price
      ? activeProduct.price
      : null;
  const discountPercent = oldPrice
    ? Math.round(((oldPrice - activePrice) / oldPrice) * 100)
    : null;

  const handlePrev = () => {
    setActiveIndex(
      (prev) => (prev - 1 + spotlightProducts.length) % spotlightProducts.length
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % spotlightProducts.length);
  };

  const handleQuickAdd = (product: Product) => {
    if (isProductOutOfStock(product) || hasEnabledSizes(product)) {
      setSelectedProductForDetail(product);
      return;
    }
    const res = addToCart(product, 1);
    if (res.added) {
      setJustAddedId(product.id);
      window.setTimeout(() => {
        setJustAddedId((curr) => (curr === product.id ? null : curr));
      }, 1500);
    } else {
      setSelectedProductForDetail(product);
    }
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[#FCFEFD] border-b border-gray-200/75"
    >
      {/* Architectural Daylight Studio Grid + Soft Mint Ambient Wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_80%_75%_at_65%_30%,#000_25%,transparent_85%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 w-[640px] h-[440px] bg-[radial-gradient(ellipse_at_center,rgba(22,163,74,0.11)_0%,rgba(236,253,243,0.45)_45%,transparent_75%)]"
      />

      <div className="relative max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-7 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT: Editorial Swiss Typography & Storefront CTAs */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_SWISS }}
              className="flex items-center gap-3"
            >
              <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#15803D]">
                MUAZ ELECTRONIC
              </span>
              <span className="w-8 h-[1.5px] bg-[#16A34A]/40" aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                FLAGSHIP STORE
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06, ease: EASE_SWISS }}
              className="mt-3 sm:mt-4 text-[32px] sm:text-[44px] lg:text-[52px] font-extrabold text-[#0F172A] tracking-[-0.03em] leading-[1.12] text-balance font-bengali"
            >
              স্মার্ট গ্যাজেটের
              <br />
              আসল জগৎ{' '}
              <span className="text-[#16A34A]">হাতের মুঠোয়</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: EASE_SWISS }}
              className="mt-3.5 sm:mt-4 text-[14px] sm:text-[15.5px] text-[#475569] leading-relaxed max-w-lg"
            >
              গেমিং কুলার, স্টুডিও ওয়্যারলেস মাইক, ২০,০০০mAh পাওয়ার ব্যাংক ও প্রিমিয়াম
              অডিও গিয়ার—১০০% যাচাইকৃত মান এবং সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি।
            </motion.p>

            {/* Primary & Secondary CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18, ease: EASE_SWISS }}
              className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3"
            >
              <a
                href="#products"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-semibold text-sm rounded-[14px] shadow-[0_12px_28px_-6px_rgba(22,163,74,0.42)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>শপিং শুরু করুন</span>
                <ArrowRight className="w-4 h-4 stroke-[2] transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>

              <a
                href="#featured"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-900 border border-gray-200 hover:border-gray-300 font-semibold text-sm rounded-[14px] shadow-2xs transition-all duration-200"
              >
                <span>ফিচার্ড কালেকশন</span>
              </a>
            </motion.div>

            {/* Unboxed Architectural Proof Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.24, ease: EASE_SWISS }}
              className="mt-7 sm:mt-9 pt-5 border-t border-gray-200/80 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg"
            >
              <div>
                <p className="text-[14px] sm:text-[16px] font-extrabold text-[#0F172A] tabular-nums">
                  ২৪–৪৮ ঘণ্টা
                </p>
                <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5">
                  দ্রুত হোম ডেলিভারি
                </p>
              </div>
              <div className="border-l border-gray-200/80 pl-3 sm:pl-5">
                <p className="text-[14px] sm:text-[16px] font-extrabold text-[#0F172A] tabular-nums">
                  ১০০% আসল
                </p>
                <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5">
                  মান যাচাইকৃত পণ্য
                </p>
              </div>
              <div className="border-l border-gray-200/80 pl-3 sm:pl-5">
                <p className="text-[14px] sm:text-[16px] font-extrabold text-[#0F172A] tabular-nums">
                  ৳০ অগ্রিম
                </p>
                <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5">
                  ক্যাশ অন ডেলিভারি
                </p>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Gallery-Framed Hardware Showcase + Interactive Bento Selector */}
          {activeProduct && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE_SWISS }}
              className="lg:col-span-6"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Gallery Mat Outer Frame (Light White Card uniting Dark Studio Hardware Photos) */}
              <div className="bg-white rounded-[24px] p-2.5 sm:p-3 border border-gray-200/85 shadow-[0_24px_64px_-20px_rgba(15,23,42,0.16)]">
                {/* Inner Hardware Studio Viewport */}
                <div className="relative rounded-[18px] overflow-hidden bg-[#0D110E] h-[220px] sm:h-[275px] lg:h-[300px] w-full group">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeProduct.id}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.985 }}
                      transition={{ duration: 0.48, ease: EASE_SWISS }}
                      className="absolute inset-0"
                    >
                      {!failedImages[activeProduct.id] && activeProduct.image ? (
                        <img
                          src={activeProduct.image}
                          alt={activeProduct.bengaliName || activeProduct.name}
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [activeProduct.id]: true }))
                          }
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0D110E] text-zinc-300">
                          <Headphones className="w-12 h-12 text-[#22C55E] mb-2 stroke-[1.5]" />
                          <span className="text-xs font-medium">{activeProduct.name}</span>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Soft Top Scrim for Minimal Index & Nav Controls */}
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                  <div className="absolute inset-x-0 top-0 p-3.5 sm:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-display tabular-nums">
                      <span className="font-bold tracking-widest text-white/90">
                        0{activeIndex + 1} / 0{spotlightProducts.length}
                      </span>
                      {discountPercent && discountPercent > 0 && (
                        <>
                          <span className="text-white/35">&middot;</span>
                          <span className="font-semibold text-[#4ADE80] font-bengali">
                            {discountPercent}% ছাড়
                          </span>
                        </>
                      )}
                    </div>

                    {spotlightProducts.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handlePrev}
                          aria-label="পূর্ববর্তী পণ্য"
                          className="w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 stroke-[2]" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          aria-label="পরবর্তী পণ্য"
                          className="w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 stroke-[2]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Crisp White Pedestal Metadata & Action Bar */}
                <div className="pt-3 pb-1 px-1.5 sm:px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#16A34A]">
                        {activeProduct.brand || activeProduct.category}
                      </span>
                      <span className="text-gray-300">&middot;</span>
                      <span className="text-sm sm:text-base font-extrabold text-[#0F172A] tabular-nums">
                        ৳{activePrice.toLocaleString('en-US')}
                      </span>
                      {oldPrice && (
                        <span className="text-xs text-gray-400 line-through tabular-nums">
                          ৳{oldPrice.toLocaleString('en-US')}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-0.5 text-[14.5px] sm:text-[16px] font-bold text-[#111827] leading-snug truncate font-bengali">
                      {activeProduct.bengaliName || activeProduct.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(activeProduct)}
                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[11px] font-semibold text-xs transition-all cursor-pointer ${
                        justAddedId === activeProduct.id
                          ? 'bg-[#15803D] text-white'
                          : 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-2xs'
                      }`}
                    >
                      {justAddedId === activeProduct.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.4]" />
                          <span>যোগ হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 stroke-[2]" />
                          <span>ব্যাগে যোগ</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedProductForDetail(activeProduct)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-[11px] bg-gray-100 hover:bg-gray-200/80 text-gray-900 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <span>বিস্তারিত</span>
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4-Slot Interactive Product Switcher Strip */}
              {spotlightProducts.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-2.5">
                  {spotlightProducts.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    const price = getEffectiveUnitPrice(item);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={`relative overflow-hidden bg-white rounded-[14px] p-1.5 sm:p-2 border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'border-[#16A34A] shadow-[0_6px_18px_-6px_rgba(22,163,74,0.28)]'
                            : 'border-gray-200/80 hover:border-gray-300 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-full h-10 sm:w-9 sm:h-9 rounded-[9px] overflow-hidden bg-gray-100 shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0 hidden sm:block">
                            <p className="text-[11px] font-bold text-[#111827] truncate">
                              {item.brand || item.name}
                            </p>
                            <p className="text-[10.5px] font-bold text-[#16A34A] tabular-nums">
                              ৳{price.toLocaleString('en-US')}
                            </p>
                          </div>
                        </div>

                        {/* Active Slide Progress Indicator Bar */}
                        {isActive && (
                          <motion.div
                            key={`bar-${activeIndex}-${isPaused ? 'paused' : 'run'}`}
                            initial={{ scaleX: isPaused ? 1 : 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                              duration: isPaused ? 0 : SLIDE_DURATION_MS / 1000,
                              ease: 'linear',
                            }}
                            style={{ transformOrigin: '0% 50%' }}
                            className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#16A34A]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
