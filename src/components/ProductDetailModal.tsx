import React, { useState } from 'react';
import { X, ShoppingBag, MessageCircle, ShieldCheck, Check, Truck, AlertCircle, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { WHATSAPP_INTL } from '../data/products';

export const ProductDetailModal: React.FC = () => {
  const { selectedProductForDetail, setSelectedProductForDetail, addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!selectedProductForDetail) return null;

  const product = selectedProductForDetail;
  const isOutOfStock = product.stock <= 0;
  const effectivePrice = product.salePrice || product.price;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleWhatsAppOrder = () => {
    const text = `আসসালামু আলাইকুম, আমি Muaz Electronic থেকে সরাসরি "${product.name}" (পরিমাণ: ${quantity} টি, একক মূল্য: ৳${effectivePrice.toLocaleString()}, মোট: ৳${(effectivePrice * quantity).toLocaleString()}) অর্ডার করতে চাই।`;
    window.open(`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-2xl my-8 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedProductForDetail(null)}
          className="absolute top-4 right-4 z-10 p-2 text-[#A7A7A7] hover:text-[#FAFAFA] bg-[#070707]/70 hover:bg-[#070707] rounded-full border border-[#292929] transition-colors"
          aria-label="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Left: Product Image */}
          <div className="relative bg-[#0d0d0d] flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-[#292929]">
            <img
              src={product.image}
              alt={product.name}
              className="w-full max-h-[380px] object-cover rounded-xl shadow-lg"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-4 left-4">
              {isOutOfStock ? (
                <div className="text-xs font-semibold bg-rose-950/90 text-rose-300 px-3 py-1 rounded-md border border-rose-500/40">
                  আউট অব স্টক
                </div>
              ) : (
                <div className="text-xs font-semibold bg-[#070707]/90 text-[#FFC928] px-3 py-1 rounded-md border border-[#FFC928]/40">
                  মজুদ স্টক: {product.stock} টি
                </div>
              )}
            </div>
            {product.isFeatured && (
              <div className="absolute top-4 left-4 text-xs font-bold bg-[#070707]/90 text-[#FFC928] px-2.5 py-1 rounded-md border border-[#FFC928]/40 flex items-center gap-1 font-display">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>FEATURED</span>
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Category & Brand */}
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FFC928] font-bold font-display mb-1.5">
                <span>{product.category}</span>
                {product.brand && (
                  <>
                    <span className="text-[#292929]">•</span>
                    <span className="text-[#A7A7A7]">{product.brand}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] leading-snug">
                {product.name}
              </h2>
              {product.bengaliName && (
                <p className="text-xs text-[#A7A7A7] mt-1 font-bengali">
                  {product.bengaliName}
                </p>
              )}

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#FFC928] font-display tabular-nums">
                  ৳{effectivePrice.toLocaleString()}
                </span>
                {product.salePrice && product.salePrice < product.price && (
                  <span className="text-sm text-[#A7A7A7] line-through font-mono">
                    ৳{product.price.toLocaleString()}
                  </span>
                )}
                <span className="text-xs text-[#A7A7A7]">ভ্যাট অন্তর্ভুক্ত</span>
              </div>

              {/* Description */}
              <p className="mt-4 text-sm text-[#A7A7A7] leading-relaxed">
                {product.description}
              </p>

              {/* Key Features */}
              {product.features && product.features.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-semibold text-[#FAFAFA] uppercase tracking-wider">
                    প্রধান বৈশিষ্ট্যসমূহ:
                  </p>
                  <ul className="text-xs text-[#A7A7A7] space-y-1.5">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#FFC928] text-sm leading-none">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specs List if any */}
              {product.specs && product.specs.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#292929] grid grid-cols-2 gap-2 text-[11px]">
                  {product.specs.map((spec, i) => (
                    <div key={i} className="bg-[#171717] p-2 rounded border border-[#292929]">
                      <span className="text-[#A7A7A7] block">{spec.label}</span>
                      <span className="font-semibold text-[#FAFAFA]">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-5 border-t border-[#292929] space-y-3">
              
              {/* Quantity Stepper */}
              {!isOutOfStock && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#A7A7A7]">পরিমাণ নির্বাচন:</span>
                  <div className="flex items-center bg-[#171717] border border-[#292929] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 text-sm text-[#FAFAFA] hover:bg-[#202020] transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-xs font-bold text-[#FFC928] font-display tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3 py-1 text-sm text-[#FAFAFA] hover:bg-[#202020] transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold transition-all ${
                    isOutOfStock
                      ? 'bg-[#171717] text-[#A7A7A7] border border-[#292929] cursor-not-allowed opacity-60'
                      : addedAnimation
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#FFC928] hover:bg-[#F7D77B] text-[#070707] shadow-md shadow-[#FFC928]/20'
                  }`}
                >
                  {isOutOfStock ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>স্টক শেষ</span>
                    </>
                  ) : addedAnimation ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>কার্টে যোগ হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>কার্টে যোগ করুন</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleWhatsAppOrder}
                  disabled={isOutOfStock}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold transition-colors ${
                    isOutOfStock
                      ? 'bg-[#171717] text-[#A7A7A7] border border-[#292929] cursor-not-allowed opacity-60'
                      : 'bg-[#171717] hover:bg-[#202020] text-[#FAFAFA] border border-[#25D366]/40 hover:border-[#25D366]'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp অর্ডার</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-[#A7A7A7] pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FFC928]" />
                  ১০০% অরিজিনাল কোয়ালিটি
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#FFC928]" />
                  ক্যাশ অন ডেলিভারি
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
