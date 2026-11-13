import React from 'react';
import { X, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getAvailableStockForSize, getEffectiveUnitPrice } from '../lib/sizeInventory';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalItems,
    setIsCheckoutOpen,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 stroke-[1.8]" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                শপিং ব্যাগ ({totalItems})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="কার্ট বন্ধ করুন"
            >
              <X className="w-5 h-5 stroke-[1.8]" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-3">
                  <ShoppingCart className="w-8 h-8 stroke-[1.8] text-gray-300" />
                </div>
                <p className="text-base font-bold text-gray-800">আপনার ব্যাগটি খালি রয়েছে</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  পছন্দের পণ্য নির্বাচন করে ব্যাগে যোগ করুন এবং সহজে অর্ডার সম্পন্ন করুন।
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-6 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs rounded-full transition-colors shadow-sm"
                >
                  প্রোডাক্ট দেখুন
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemEffectivePrice = getEffectiveUnitPrice(item.product);
                const maxStock = getAvailableStockForSize(item.product, item.selectedSize);
                const canIncrement = maxStock <= 0 ? false : item.quantity < maxStock;
                return (
                  <div
                    key={`${item.product.id}-${item.selectedSize || 'default'}`}
                    className="bg-gray-50/70 border border-gray-100 rounded-2xl p-3 flex gap-3 items-center hover:border-gray-200 transition-colors"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-contain rounded-xl bg-white border border-gray-100 p-1 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-semibold text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        {item.selectedSize && (
                          <span className="shrink-0 text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200 px-1.5 py-0.5 rounded-md">
                            সাইজ: {item.selectedSize}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#16A34A] font-bold mt-0.5 tabular-nums">
                        ৳{itemEffectivePrice.toLocaleString()} × {item.quantity} = ৳
                        {(itemEffectivePrice * item.quantity).toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Stepper */}
                        <div className="flex items-center bg-white border border-gray-200 rounded-full overflow-hidden text-xs shadow-2xs">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1, item.selectedSize)
                            }
                            className="px-2.5 py-0.5 text-gray-600 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold text-gray-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            disabled={!canIncrement}
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1, item.selectedSize)
                            }
                            className="px-2.5 py-0.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                          className="text-gray-400 hover:text-rose-500 p-1 transition-colors"
                          title="রিমুভ করুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/70 space-y-3.5">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>সাবটোটাল</span>
                  <span className="font-bold text-gray-900 font-display tabular-nums">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="text-gray-500">চেকআউটে নির্ধারিত হবে</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                  <span>মোট প্রদেয় মূল্য</span>
                  <span className="text-[#16A34A] text-base font-display tabular-nums">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(22,163,74,0.3)]"
              >
                <span>অর্ডারের জন্য এগিয়ে যান</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
