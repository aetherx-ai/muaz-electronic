import React, { useState } from 'react';
import { X, CheckCircle2, MessageCircle, AlertCircle, ShieldCheck, MapPin, Phone, User, FileText } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { WHATSAPP_INTL, WHATSAPP_NUMBER } from '../data/products';

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen, items, subtotal, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  if (!isCheckoutOpen) return null;

  const deliveryFee = deliveryArea === 'inside_dhaka' ? 70 : 130;
  const grandTotal = subtotal + deliveryFee;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.customerName = 'অনুগ্রহ করে আপনার সঠিক নাম লিখুন';
    }

    // Bangladesh mobile number validation (11 digits, starts with 01)
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!cleanPhone) {
      newErrors.phoneNumber = 'মোবাইল নম্বর প্রদান করা আবশ্যক';
    } else if (!bdPhoneRegex.test(cleanPhone)) {
      newErrors.phoneNumber = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01822486585)';
    }

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 6) {
      newErrors.deliveryAddress = 'সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড, থানা, জেলা) লিখুন';
    }

    if (items.length === 0) {
      newErrors.general = 'আপনার ব্যাগে কোনো প্রোডাক্ট নেই';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const orderId = `ME-${Date.now().toString().slice(-6)}`;
    const areaName = deliveryArea === 'inside_dhaka' ? 'ঢাকা সিটির ভেতরে (৳৭০)' : 'ঢাকার বাইরে (৳১৩০)';

    // Build the formatted Bengali order message
    let message = `*নতুন অর্ডার - MUAZ ELECTRONIC*\n`;
    message += `অর্ডার আইডি: #${orderId}\n`;
    message += `--------------------------------\n`;
    message += `👤 *গ্রাহকের নাম:* ${customerName.trim()}\n`;
    message += `📱 *মোবাইল:* ${phoneNumber.trim()}\n`;
    message += `📍 *ঠিকানা:* ${deliveryAddress.trim()}\n`;
    message += `🚚 *ডেলিভারি এরিয়া:* ${areaName}\n`;
    if (notes.trim()) {
      message += `📝 *বিশেষ নোট:* ${notes.trim()}\n`;
    }
    message += `--------------------------------\n`;
    message += `📦 *অর্ডারকৃত প্রোডাক্টসমূহ:*\n`;

    items.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   পরিমাণ: ${item.quantity} টি | দাম: ৳${(item.product.price * item.quantity).toLocaleString()}\n`;
    });

    message += `--------------------------------\n`;
    message += `💵 *সাবটোটাল:* ৳${subtotal.toLocaleString()}\n`;
    message += `🚚 *ডেলিভারি ফি:* ৳${deliveryFee}\n`;
    message += `💰 *সর্বমোট প্রদেয় বিল:* ৳${grandTotal.toLocaleString()}\n`;
    message += `--------------------------------\n`;
    message += `(অনগ্রহ করে অর্ডারটি দ্রুত কনফার্ম করে ডেলিভারি আপডেট জানান)`;

    const targetUrl = `https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(message)}`;
    setWhatsappUrl(targetUrl);
    setGeneratedOrderNumber(orderId);
    setOrderConfirmed(true);

    // Automatically trigger WhatsApp in new window
    window.open(targetUrl, '_blank');

    // Clear cart upon creating order
    clearCart();
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setOrderConfirmed(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-2xl my-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#292929] flex items-center justify-between bg-[#0a0a0a]">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#FAFAFA]">
              {orderConfirmed ? 'অর্ডার তথ্য প্রস্তুত' : 'অর্ডার ও চেকআউট ফর্ম'}
            </h2>
            <p className="text-xs text-[#A7A7A7] mt-0.5">
              {orderConfirmed
                ? 'WhatsApp-এ বার্তাটি সেন্ড করে অর্ডার সম্পন্ন করুন'
                : 'ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ)'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-[#A7A7A7] hover:text-[#FAFAFA] hover:bg-[#171717] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderConfirmed ? (
          /* Order Confirmation Screen */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-[#171717] border border-[#25D366]/40 text-[#25D366] rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-[#FFC928] font-bold font-display">
                অর্ডার রেফারেন্স নম্বর: #{generatedOrderNumber}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mt-1">
                আপনার অর্ডার বার্তাটি তৈরি হয়েছে!
              </h3>
              <p className="text-sm text-[#A7A7A7] mt-2 max-w-md mx-auto">
                অর্ডারটি চূড়ান্ত করতে নিচের বাটনে ক্লিক করে আমাদের অফিসিয়াল WhatsApp নম্বরে{' '}
                <span className="text-[#FAFAFA] font-mono">({WHATSAPP_NUMBER})</span> বার্তাটি পাঠিয়ে দিন।
              </p>
            </div>

            {/* Direct WhatsApp Launch Button */}
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#25D366]/20"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>WhatsApp খুলে সেন্ড করুন</span>
              </a>
            </div>

            <div className="p-4 bg-[#070707] border border-[#292929] rounded-xl text-left text-xs space-y-1.5 text-[#A7A7A7]">
              <div className="flex justify-between">
                <span>গ্রাহকের নাম:</span>
                <span className="font-semibold text-[#FAFAFA]">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>ফোন নম্বর:</span>
                <span className="font-semibold text-[#FAFAFA]">{phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>ডেলিভারি ঠিকানা:</span>
                <span className="font-semibold text-[#FAFAFA]">{deliveryAddress}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#292929]">
                <span>সর্বমোট পরিশোধযোগ্য:</span>
                <span className="font-bold text-[#FFC928] text-sm tabular-nums">
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="text-xs text-[#A7A7A7] hover:text-[#FAFAFA] underline underline-offset-4"
              >
                শপিং এ ফিরে যান
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmitOrder} className="p-6 sm:p-8 space-y-6">
            {errors.general && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#FFC928]" />
                  <span>আপনার নাম *</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
                  }}
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  className={`w-full px-3.5 py-2.5 text-sm bg-[#171717] border rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none transition-colors ${
                    errors.customerName
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-[#292929] focus:border-[#FFC928]'
                  }`}
                />
                {errors.customerName && (
                  <p className="mt-1 text-xs text-rose-400">{errors.customerName}</p>
                )}
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#FFC928]" />
                  <span>মোবাইল নম্বর (১১ ডিজিট) *</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                  }}
                  placeholder="যেমন: 01822486585"
                  className={`w-full px-3.5 py-2.5 text-sm bg-[#171717] border rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none transition-colors font-mono ${
                    errors.phoneNumber
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-[#292929] focus:border-[#FFC928]'
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-rose-400">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Delivery Area */}
              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                  ডেলিভারি এরিয়া নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryArea('inside_dhaka')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      deliveryArea === 'inside_dhaka'
                        ? 'border-[#FFC928] bg-[#FFC928]/10 text-[#FAFAFA]'
                        : 'border-[#292929] bg-[#171717] text-[#A7A7A7] hover:border-[#383838]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[#FAFAFA]">ঢাকা সিটি</div>
                    <div className="text-[11px] text-[#FFC928] mt-0.5">ডেলিভারি চার্জ: ৳৭০</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryArea('outside_dhaka')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      deliveryArea === 'outside_dhaka'
                        ? 'border-[#FFC928] bg-[#FFC928]/10 text-[#FAFAFA]'
                        : 'border-[#292929] bg-[#171717] text-[#A7A7A7] hover:border-[#383838]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[#FAFAFA]">ঢাকার বাইরে</div>
                    <div className="text-[11px] text-[#FFC928] mt-0.5">ডেলিভারি চার্জ: ৳১৩০</div>
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FFC928]" />
                  <span>সম্পূর্ণ ঠিকানা *</span>
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    if (errors.deliveryAddress) setErrors((prev) => ({ ...prev, deliveryAddress: '' }));
                  }}
                  placeholder="বাসা নং, রোড নং, এলাকা/থানা এবং জেলা উল্লেখ করুন"
                  className={`w-full px-3.5 py-2.5 text-sm bg-[#171717] border rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none transition-colors ${
                    errors.deliveryAddress
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-[#292929] focus:border-[#FFC928]'
                  }`}
                />
                {errors.deliveryAddress && (
                  <p className="mt-1 text-xs text-rose-400">{errors.deliveryAddress}</p>
                )}
              </div>

              {/* Order Notes (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#A7A7A7] mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>অতিরিক্ত নোট (ঐচ্ছিক)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="যেমন: কালারের পছন্দ বা ডেলিভারির সময় সংক্রান্ত"
                  className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928]"
                />
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="p-4 bg-[#0a0a0a] border border-[#292929] rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-[#FAFAFA] text-[13px] border-b border-[#292929] pb-2">
                অর্ডার সারাংশ ({items.length} টি আইটেম)
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {items.map((it) => (
                  <div key={it.product.id} className="flex justify-between text-[#A7A7A7]">
                    <span className="truncate max-w-[280px]">
                      {it.product.name} × {it.quantity}
                    </span>
                    <span className="font-mono text-[#FAFAFA]">
                      ৳{(it.product.price * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#292929] space-y-1">
                <div className="flex justify-between text-[#A7A7A7]">
                  <span>সাবটোটাল</span>
                  <span className="font-mono">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#A7A7A7]">
                  <span>ডেলিভারি ফি</span>
                  <span className="font-mono">৳{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#FAFAFA] pt-1 border-t border-[#292929]">
                  <span>সর্বমোট বিল</span>
                  <span className="text-[#FFC928] text-base font-display tabular-nums">
                    ৳{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Trust Notice */}
            <div className="flex items-center gap-2 text-xs text-[#A7A7A7] bg-[#141414] p-3 rounded-lg border border-[#292929]">
              <ShieldCheck className="w-4 h-4 text-[#FFC928] shrink-0" />
              <span>
                ক্যাশ অন ডেলিভারি প্রযোজ্য। পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করবেন।
              </span>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#FFC928] hover:bg-[#F7D77B] text-[#070707] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-[#FFC928]/20"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>অর্ডার সম্পন্ন করতে WhatsApp-এ পাঠান</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
