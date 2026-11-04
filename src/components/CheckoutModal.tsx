import React, { useState } from 'react';
import { X, CheckCircle2, MessageCircle, AlertCircle, ShieldCheck, MapPin, Phone, User, FileText } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { WHATSAPP_INTL, WHATSAPP_NUMBER } from '../data/products';
import { orderService } from '../lib/supabase';

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

    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, '');
    const orderId = `ME-${Date.now().toString().slice(-6)}`;
    const areaName = deliveryArea === 'inside_dhaka' ? 'ঢাকা সিটির ভেতরে (৳৭০)' : 'ঢাকার বাইরে (৳১৩০)';

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
    message += `📦 *অর্ডারকৃত পণ্যসমূহ:*\n`;

    items.forEach((item, index) => {
      const price = item.product.salePrice || item.product.price;
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   পরিমাণ: ${item.quantity} টি | দাম: ৳${(price * item.quantity).toLocaleString()}\n`;
    });

    message += `--------------------------------\n`;
    message += `💵 *সাবটোটাল:* ৳${subtotal.toLocaleString()}\n`;
    message += `🚚 *ডেলিভারি ফি:* ৳${deliveryFee}\n`;
    message += `💰 *সর্বমোট প্রদেয় বিল:* ৳${grandTotal.toLocaleString()}\n`;
    message += `--------------------------------\n`;
    message += `(অনুগ্রহ করে অর্ডারটি দ্রুত কনফার্ম করে ডেলিভারি আপডেট জানান)`;

    const targetUrl = `https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(message)}`;
    setWhatsappUrl(targetUrl);
    setGeneratedOrderNumber(orderId);
    setOrderConfirmed(true);

    // Save to persistent database / orderService
    orderService.createOrder({
      orderNumber: orderId,
      customerName: customerName.trim(),
      phoneNumber: cleanPhone,
      deliveryAddress: deliveryAddress.trim(),
      deliveryArea,
      notes: notes.trim() || undefined,
      items: [...items],
      subtotal,
      deliveryFee,
      total: grandTotal,
      orderDate: new Date().toISOString(),
      status: 'pending',
      paymentStatus: 'cod',
    }).catch((err) => console.error('Order save error:', err));

    window.open(targetUrl, '_blank');
    clearCart();
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setOrderConfirmed(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-[24px] overflow-hidden shadow-2xl my-6 text-left border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {orderConfirmed ? 'অর্ডার প্রস্তুত' : 'অর্ডার ও চেকআউট'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {orderConfirmed
                ? 'WhatsApp-এ বার্তাটি সেন্ড করে অর্ডার সম্পন্ন করুন'
                : 'ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে চেক করে পরিশোধ)'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {orderConfirmed ? (
          /* Order Confirmation Screen */
          <div className="p-6 sm:p-8 space-y-5 text-center">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-[#16A34A] rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-[#16A34A] font-bold">
                অর্ডার রেফারেন্স নম্বর: #{generatedOrderNumber}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                আপনার অর্ডার তৈরি হয়েছে!
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1.5 max-w-sm mx-auto">
                অর্ডারটি সম্পন্ন করতে নিচের বাটনে ক্লিক করে আমাদের WhatsApp নম্বরে{' '}
                <span className="font-semibold text-gray-900">({WHATSAPP_NUMBER})</span> বার্তাটি পাঠিয়ে দিন।
              </p>
            </div>

            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>WhatsApp খুলে সেন্ড করুন</span>
              </a>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl text-left text-xs space-y-1.5 text-gray-600 border border-gray-100">
              <div className="flex justify-between">
                <span>গ্রাহক:</span>
                <span className="font-semibold text-gray-900">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>ফোন:</span>
                <span className="font-semibold text-gray-900">{phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>ঠিকানা:</span>
                <span className="font-semibold text-gray-900">{deliveryAddress}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span>সর্বমোট বিল:</span>
                <span className="font-bold text-[#16A34A] text-sm tabular-nums">
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-4"
              >
                হোমপেজে ফিরে যান
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmitOrder} className="p-5 sm:p-7 space-y-4">
            {errors.general && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>আপনার নাম *</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
                  }}
                  placeholder="আপনার পূর্ণ নাম"
                  className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-gray-50 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none transition-colors ${
                    errors.customerName ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 focus:border-[#16A34A]'
                  }`}
                />
                {errors.customerName && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.customerName}</p>
                )}
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#16A34A]" />
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
                  className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-gray-50 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none transition-colors font-mono ${
                    errors.phoneNumber ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 focus:border-[#16A34A]'
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Delivery Area Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  ডেলিভারি এলাকা *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryArea('inside_dhaka')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      deliveryArea === 'inside_dhaka'
                        ? 'border-[#16A34A] bg-emerald-50/70 text-gray-900 shadow-2xs'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-gray-900">ঢাকা সিটি</div>
                    <div className="text-[11px] text-[#16A34A] font-medium mt-0.5">ডেলিভারি চার্জ: ৳৭০</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryArea('outside_dhaka')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      deliveryArea === 'outside_dhaka'
                        ? 'border-[#16A34A] bg-emerald-50/70 text-gray-900 shadow-2xs'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-gray-900">ঢাকার বাইরে</div>
                    <div className="text-[11px] text-[#16A34A] font-medium mt-0.5">ডেলিভারি চার্জ: ৳১৩০</div>
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>সম্পূর্ণ ঠিকানা *</span>
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    if (errors.deliveryAddress) setErrors((prev) => ({ ...prev, deliveryAddress: '' }));
                  }}
                  placeholder="বাসা নং, রোড নং, এলাকা/থানা এবং জেলা"
                  className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-gray-50 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none transition-colors ${
                    errors.deliveryAddress ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 focus:border-[#16A34A]'
                  }`}
                />
                {errors.deliveryAddress && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.deliveryAddress}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>অতিরিক্ত নোট (ঐচ্ছিক)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="যেমন: কালারের পছন্দ ইত্যাদি"
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>

            {/* Bill Summary */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>সাবটোটাল</span>
                <span className="font-mono text-gray-900">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>ডেলিভারি ফি</span>
                <span className="font-mono text-gray-900">৳{deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                <span>সর্বমোট প্রদেয় বিল</span>
                <span className="text-[#16A34A] text-base font-display tabular-nums">
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>ক্যাশ অন ডেলিভারি প্রযোজ্য। পণ্য দেখে মূল্য পরিশোধ করবেন।</span>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(22,163,74,0.3)]"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp-এ অর্ডার কনফার্ম করুন</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
