import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, MessageCircle, ShieldCheck, Check, Truck, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { WHATSAPP_INTL } from '../data/products';
import { CLOTHING_SIZES, ClothingSize } from '../types';
import {
  hasEnabledSizes,
  getAvailableStockForSize,
  getProductTotalStock,
  isProductOutOfStock,
  getEffectiveUnitPrice,
  sanitizeWholeStock,
  stripInternalSpecs,
} from '../lib/sizeInventory';

export const ProductDetailModal: React.FC = () => {
  const { selectedProductForDetail, setSelectedProductForDetail, addToCart, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ClothingSize | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setSelectedSize(null);
    setSizeError(null);
    setAddedAnimation(false);
  }, [selectedProductForDetail?.id]);

  if (!selectedProductForDetail) return null;

  const product = selectedProductForDetail;
  const isSizedProduct = hasEnabledSizes(product);
  const visibleSpecs = stripInternalSpecs(product.specs);
  const totalAvailableStock = getProductTotalStock(product);
  const isOutOfStock = isProductOutOfStock(product);
  const currentPrice = getEffectiveUnitPrice(product);
  const oldPrice = product.salePrice && product.salePrice < product.price ? product.price : null;
  const discountPercent = oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : null;

  const selectedSizeStock = isSizedProduct
    ? selectedSize
      ? getAvailableStockForSize(product, selectedSize)
      : 0
    : totalAvailableStock;

  const inCartQty = items.find(
    (item) =>
      item.product.id === product.id &&
      (item.selectedSize || undefined) === (isSizedProduct ? selectedSize || undefined : undefined)
  )?.quantity || 0;

  const remainingAddableStock = Math.max(0, selectedSizeStock - inCartQty);
  const stepperMax = isSizedProduct
    ? selectedSize
      ? Math.max(1, remainingAddableStock || selectedSizeStock)
      : 1
    : Math.max(1, remainingAddableStock || totalAvailableStock);

  const handleSelectSize = (size: ClothingSize, stock: number) => {
    if (stock <= 0) return;
    setSelectedSize(size);
    setSizeError(null);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (isSizedProduct && !selectedSize) {
      setSizeError('দয়া করে আগে একটি সাইজ নির্বাচন করুন');
      return;
    }

    const res = addToCart(product, quantity, isSizedProduct ? selectedSize || undefined : undefined);
    if (!res.added) {
      setSizeError(res.error || 'কার্টে যোগ করা যায়নি');
      return;
    }

    setSizeError(null);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const sizeInfo = isSizedProduct && selectedSize ? `, সাইজ: ${selectedSize}` : '';
  const directWhatsappUrl = `https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি Muaz Electronic থেকে সরাসরি "${product.name}"${sizeInfo} (পরিমাণ: ${quantity} টি, একক মূল্য: ৳${currentPrice.toLocaleString()}, মোট: ৳${(currentPrice * quantity).toLocaleString()}) অর্ডার করতে চাই।`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-3 sm:p-6"
      onClick={() => setSelectedProductForDetail(null)}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-lg overflow-hidden my-6 text-left border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setSelectedProductForDetail(null)}
          className="absolute top-3 right-3 z-10 p-1.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-md transition-colors"
          aria-label="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Left: Product Image */}
          <div className="relative bg-gray-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-200">
            <img
              src={product.image}
              alt={product.name}
              className="w-full max-h-[280px] sm:max-h-[340px] object-contain"
              referrerPolicy="no-referrer"
            />
            {discountPercent !== null && discountPercent > 0 && (
              <div className="absolute top-3 left-3 bg-[#16A34A] text-white text-xs font-semibold px-2 py-0.5 rounded">
                -{discountPercent}%
              </div>
            )}
            <div className="absolute bottom-4 left-4">
              {isOutOfStock ? (
                <div className="text-xs font-semibold bg-rose-50 text-rose-600 px-3 py-1 rounded-full border border-rose-200">
                  আউট অব স্টক
                </div>
              ) : isSizedProduct ? (
                selectedSize ? (
                  <div className="text-xs font-medium bg-white text-gray-700 px-3 py-1 rounded-full shadow-xs border border-gray-200">
                    সাইজ {selectedSize} স্টক: {selectedSizeStock} টি উপলব্ধ
                  </div>
                ) : (
                  <div className="text-xs font-medium bg-white text-gray-700 px-3 py-1 rounded-full shadow-xs border border-gray-200">
                    মোট স্টক: {totalAvailableStock} টি উপলব্ধ
                  </div>
                )
              ) : (
                <div className="text-xs font-medium bg-white text-gray-700 px-3 py-1 rounded-full shadow-xs border border-gray-200">
                  স্টক: {totalAvailableStock} টি উপলব্ধ
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="p-5 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Category */}
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#16A34A] font-bold mb-1">
                <span>{product.category}</span>
                {product.brand && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">{product.brand}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                {product.name}
              </h2>
              {product.bengaliName && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {product.bengaliName}
                </p>
              )}

              {/* Price Row */}
              <div className="mt-3 flex items-baseline gap-2.5">
                <span className="text-2xl font-bold text-gray-900 font-display tabular-nums">
                  ৳{currentPrice.toLocaleString()}
                </span>
                {oldPrice && (
                  <span className="text-sm text-gray-400 line-through font-normal tabular-nums">
                    ৳{oldPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>

              {/* Key Features */}
              {product.features && product.features.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    বৈশিষ্ট্যসমূহ:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#16A34A] text-sm leading-none">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specs */}
              {visibleSpecs.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
                  {visibleSpecs.map((spec, i) => (
                    <div key={i} className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="text-gray-400 block">{spec.label}</span>
                      <span className="font-semibold text-gray-800">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
              {/* Clothing Size Selector */}
              {isSizedProduct && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">সাইজ নির্বাচন করুন:</span>
                    {selectedSize ? (
                      <span className="font-medium text-[#16A34A]">
                        উপলব্ধ স্টক: {selectedSizeStock} টি
                      </span>
                    ) : (
                      <span className="text-gray-400">একটি সাইজ বেছে নিন</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {CLOTHING_SIZES.map((size) => {
                      const entry = product.sizeInventory?.[size];
                      const stock = entry?.enabled ? sanitizeWholeStock(entry.stock) : 0;
                      const sizeOutOfStock = !entry?.enabled || stock <= 0;
                      const isSelected = selectedSize === size && !sizeOutOfStock;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={sizeOutOfStock}
                          onClick={() => handleSelectSize(size, stock)}
                          aria-label={`সাইজ ${size}${sizeOutOfStock ? ' (Out of Stock)' : ''}`}
                          aria-pressed={isSelected}
                          className={`min-w-[60px] px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center ${
                            sizeOutOfStock
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-75'
                              : isSelected
                              ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs ring-2 ring-[#16A34A]/25'
                              : 'bg-white text-gray-800 border-gray-200 hover:border-[#16A34A] hover:text-[#16A34A]'
                          }`}
                        >
                          <span className={sizeOutOfStock ? 'line-through' : ''}>{size}</span>
                          {sizeOutOfStock ? (
                            <span className="text-[9px] font-medium text-rose-500 leading-tight">
                              Out of Stock
                            </span>
                          ) : (
                            <span
                              className={`text-[9px] font-medium leading-tight tabular-nums ${
                                isSelected ? 'text-white/90' : 'text-gray-500'
                              }`}
                            >
                              {stock} টি
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedSize && inCartQty > 0 && remainingAddableStock === 0 && (
                    <p className="text-[11px] text-amber-600 font-medium">
                      সাইজ {selectedSize}-এর সব উপলব্ধ স্টক ({selectedSizeStock} টি) ইতিমধ্যে কার্টে রয়েছে।
                    </p>
                  )}
                </div>
              )}

              {sizeError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{sizeError}</span>
                </div>
              )}

              {/* Quantity Stepper */}
              {!isOutOfStock && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">পরিমাণ:</span>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-900 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={(isSizedProduct && !selectedSize) || quantity >= stepperMax}
                      onClick={() => setQuantity((q) => Math.min(stepperMax, q + 1))}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-semibold text-xs sm:text-sm transition-colors ${
                    isOutOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : addedAnimation
                      ? 'bg-[#15803D] text-white'
                      : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
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
                      <ShoppingCart className="w-4 h-4" />
                      <span>কার্টে যোগ করুন</span>
                    </>
                  )}
                </button>

                {isOutOfStock || (isSizedProduct && !selectedSize) ? (
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (isSizedProduct && !selectedSize) {
                        setSizeError('দয়া করে আগে একটি সাইজ নির্বাচন করুন');
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-semibold text-xs sm:text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="w-4 h-4 text-[#16A34A]" />
                    <span>WhatsApp অর্ডার</span>
                  </button>
                ) : (
                  <a
                    href={directWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-semibold text-xs sm:text-sm bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-[#16A34A]" />
                    <span>WhatsApp অর্ডার</span>
                  </a>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                  ১০০% আসল পণ্য
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#16A34A]" />
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
