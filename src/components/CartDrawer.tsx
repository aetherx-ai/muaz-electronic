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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md bg-white border-l border-gray-200 flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#16A34A]" />
              <h2 className="text-base font-bold text-gray-900">
                শপিং ব্যাগ ({totalItems})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              aria-label="কার্ট বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <ShoppingCart className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-800">আপনার ব্যাগটি খালি রয়েছে</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  পছন্দের পণ্য নির্বাচন করে ব্যাগে যোগ করুন।
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs rounded-md"
                >
                  পণ্য দেখুন
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
                    className="bg-gray-50 border border-gray-200 rounded-md p-3 flex gap-3 items-center"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 object-contain rounded bg-white border border-gray-200 p-1 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-semibold text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        {item.selectedSize && (
                          <span className="shrink-0 text-[10px] font-semibold text-[#15803D]">
                            (সাইজ: {item.selectedSize})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#16A34A] font-bold mt-0.5 tabular-nums">
                        ৳{itemEffectivePrice.toLocaleString()} × {item.quantity} = ৳
                        {(itemEffectivePrice * item.quantity).toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-white border border-gray-300 rounded-md overflow-hidden text-xs">
                          <button
                            type="button"
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
                            type="button"
                            disabled={!canIncrement}
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1, item.selectedSize)
                            }
                            className="px-2.5 py-0.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                          className="text-gray-400 hover:text-rose-600 p-1"
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
            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>সাবটোটাল</span>
                  <span className="font-bold text-gray-900 tabular-nums">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>ডেলিভারি চার্জ</span>
                  <span>চেকআউটে নির্ধারিত হবে</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                  <span>মোট প্রদেয় মূল্য</span>
                  <span className="text-[#16A34A] tabular-nums">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-sm rounded-md transition-colors"
              >
                <span>অর্ডার করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
