import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0e0e0e] border-l border-[#292929] shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-[#292929] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#FFC928]" />
              <h2 className="text-lg font-bold text-[#FAFAFA]">শপিং ব্যাগ ({totalItems})</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-[#A7A7A7] hover:text-[#FAFAFA] hover:bg-[#171717] rounded-lg transition-colors"
              aria-label="কার্ট বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#171717] border border-[#292929] flex items-center justify-center text-[#A7A7A7] mb-4">
                  <ShoppingBag className="w-8 h-8 text-[#A7A7A7]" />
                </div>
                <p className="text-base font-semibold text-[#FAFAFA]">আপনার ব্যাগটি খালি রয়েছে</p>
                <p className="text-xs text-[#A7A7A7] mt-1 max-w-xs">
                  পছন্দের গ্যাজেট নির্বাচন করে ব্যাগে যোগ করুন এবং সহজে অর্ডার সম্পন্ন করুন।
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-5 py-2.5 bg-[#FFC928] hover:bg-[#F7D77B] text-[#070707] font-semibold text-xs rounded-lg transition-colors"
                >
                  প্রোডাক্ট দেখুন
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-[#141414] border border-[#292929] rounded-xl p-3.5 flex gap-3.5 items-center hover:border-[#383838] transition-colors"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg bg-[#070707] border border-[#292929] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[#FAFAFA] truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-[#FFC928] font-bold font-display mt-0.5 tabular-nums">
                      ৳{item.product.price.toLocaleString()} × {item.quantity} = ৳
                      {(item.product.price * item.quantity).toLocaleString()}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-[#070707] border border-[#292929] rounded-md overflow-hidden text-xs">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-[#A7A7A7] hover:text-[#FAFAFA] hover:bg-[#1a1a1a]"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 font-bold text-[#FAFAFA] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-[#A7A7A7] hover:text-[#FAFAFA] hover:bg-[#1a1a1a]"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-xs text-[#A7A7A7] hover:text-rose-400 p-1 transition-colors"
                        title="রিমুভ করুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#292929] bg-[#070707] space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#A7A7A7]">
                  <span>সাবটোটাল</span>
                  <span className="font-bold text-[#FAFAFA] font-display tabular-nums">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#A7A7A7]">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="text-[#A7A7A7]">চেকআউটে নির্ধারিত হবে</span>
                </div>
                <div className="pt-2 border-t border-[#292929] flex justify-between text-sm font-bold text-[#FAFAFA]">
                  <span>মোট প্রোডাক্ট মূল্য</span>
                  <span className="text-[#FFC928] text-base font-display tabular-nums">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#FFC928] hover:bg-[#F7D77B] text-[#070707] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-[#FFC928]/20"
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
