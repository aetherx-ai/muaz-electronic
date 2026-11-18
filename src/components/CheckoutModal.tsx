import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  FileText,
  ChevronDown,
  Truck,
  ShoppingBag,
  Building2,
  Navigation,
  Map,
  Check,
  Package,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { WHATSAPP_INTL, WHATSAPP_NUMBER, STORE_NAME } from '../data/products';
import {
  BANGLADESH_GEO,
  getDistrictsByDivision,
  getThanasByDistrict,
} from '../data/bangladeshGeo';
import { formatOrderDeliveryAddress } from '../lib/addressUtils';
import { orderService, settingsService } from '../lib/supabase';
import { getEffectiveUnitPrice } from '../lib/sizeInventory';

interface ConfirmedSnapshot {
  orderNumber: string;
  customerName: string;
  phoneNumber: string;
  streetAddress: string;
  division: string;
  district: string;
  thana: string;
  deliveryArea: 'inside_dhaka' | 'outside_dhaka';
  total: number;
  itemCount: number;
}

const normalizeDigits = (value: string): string => {
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  return value.replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d)));
};

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen, items, subtotal, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [thana, setThana] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [notes, setNotes] = useState('');

  const [storeWhatsappIntl, setStoreWhatsappIntl] = useState(WHATSAPP_INTL);
  const [storeWhatsappNumber, setStoreWhatsappNumber] = useState(WHATSAPP_NUMBER);
  const [feeInsideDhaka, setFeeInsideDhaka] = useState(70);
  const [feeOutsideDhaka, setFeeOutsideDhaka] = useState(130);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const [confirmedSnapshot, setConfirmedSnapshot] = useState<ConfirmedSnapshot | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  useEffect(() => {
    if (!isCheckoutOpen) return;
    let active = true;
    settingsService
      .getSettings()
      .then((settings) => {
        if (!active || !settings) return;
        if (settings.whatsappIntl) setStoreWhatsappIntl(settings.whatsappIntl);
        if (settings.whatsappNumber) setStoreWhatsappNumber(settings.whatsappNumber);
        if (settings.deliveryFeeInsideDhaka > 0) {
          setFeeInsideDhaka(settings.deliveryFeeInsideDhaka);
        }
        if (settings.deliveryFeeOutsideDhaka > 0) {
          setFeeOutsideDhaka(settings.deliveryFeeOutsideDhaka);
        }
      })
      .catch(() => {
        // Keep defaults
      });
    return () => {
      active = false;
    };
  }, [isCheckoutOpen]);

  const availableDistricts = useMemo(
    () => (division ? getDistrictsByDivision(division) : []),
    [division]
  );

  const availableThanas = useMemo(
    () => (division && district ? getThanasByDistrict(division, district) : []),
    [division, district]
  );

  if (!isCheckoutOpen) return null;

  const deliveryFee = deliveryArea === 'inside_dhaka' ? feeInsideDhaka : feeOutsideDhaka;
  const grandTotal = subtotal + deliveryFee;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleDivisionChange = (nextDivision: string) => {
    setDivision(nextDivision);
    setDistrict('');
    setThana('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next.division;
      delete next.district;
      delete next.thana;
      return next;
    });
  };

  const handleDistrictChange = (nextDistrict: string) => {
    setDistrict(nextDistrict);
    setThana('');
    if (nextDistrict === 'ঢাকা') {
      setDeliveryArea('inside_dhaka');
    } else if (nextDistrict) {
      setDeliveryArea('outside_dhaka');
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.district;
      delete next.thana;
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.customerName = 'অনুগ্রহ করে কাস্টমারের পুরো নাম লিখুন';
    }

    const cleanPhone = normalizeDigits(phoneNumber).replace(/[\s-]/g, '');
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!cleanPhone) {
      newErrors.phoneNumber = 'মোবাইল নাম্বার প্রদান করা আবশ্যক';
    } else if (!bdPhoneRegex.test(cleanPhone)) {
      newErrors.phoneNumber = 'সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 01822486585)';
    }

    if (!streetAddress.trim() || streetAddress.trim().length < 5) {
      newErrors.streetAddress = 'বাসা নং, রোড নং ও এলাকার বিস্তারিত ঠিকানা লিখুন';
    }

    if (!division) {
      newErrors.division = 'অনুগ্রহ করে বিভাগ নির্বাচন করুন';
    }

    if (!district) {
      newErrors.district = 'অনুগ্রহ করে জেলা নির্বাচন করুন';
    }

    if (!thana) {
      newErrors.thana = 'অনুগ্রহ করে থানা / উপজেলা নির্বাচন করুন';
    }

    if (items.length === 0) {
      newErrors.general = 'আপনার ব্যাগে কোনো প্রোডাক্ট নেই';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    if (!validate()) return;

    submitLockRef.current = true;
    setIsSubmitting(true);
    setErrors({});

    const cleanPhone = normalizeDigits(phoneNumber).trim().replace(/[\s-]/g, '');
    const cleanName = customerName.trim();
    const cleanStreet = streetAddress.trim();
    const cleanNotes = notes.trim();
    const clientOrderId = `ME-${Date.now().toString().slice(-6)}`;
    const areaName =
      deliveryArea === 'inside_dhaka'
        ? `ঢাকা সিটি (৳${feeInsideDhaka})`
        : `ঢাকার বাইরে (৳${feeOutsideDhaka})`;

    const formattedFullAddress = formatOrderDeliveryAddress(
      cleanStreet,
      division,
      district,
      thana
    );

    try {
      const result = await orderService.createOrder({
        orderNumber: clientOrderId,
        customerName: cleanName,
        phoneNumber: cleanPhone,
        deliveryAddress: formattedFullAddress,
        division,
        district,
        thana,
        deliveryArea,
        notes: cleanNotes || undefined,
        items: [...items],
        subtotal,
        deliveryFee,
        total: grandTotal,
        orderDate: new Date().toISOString(),
        status: 'pending',
        paymentStatus: 'cod',
      });

      if (!result.success) {
        setErrors({
          general:
            result.error ||
            'অর্ডার সম্পন্ন করা যায়নি। অনুগ্রহ করে স্টক যাচাই করে আবার চেষ্টা করুন।',
        });
        window.dispatchEvent(new CustomEvent('muaz-products-updated'));
        return;
      }

      const finalOrderId = result.order?.orderNumber || clientOrderId;

      let message = `*নতুন অর্ডার - ${STORE_NAME}*\n`;
      message += `অর্ডার আইডি: #${finalOrderId}\n`;
      message += `--------------------------------\n`;
      message += `👤 *কাস্টমারের নাম:* ${cleanName}\n`;
      message += `📱 *মোবাইল নাম্বার:* ${cleanPhone}\n`;
      message += `🏠 *সম্পূর্ণ ঠিকানা:* ${cleanStreet}\n`;
      message += `🗺️ *বিভাগ:* ${division}\n`;
      message += `🏙️ *জেলা:* ${district}\n`;
      message += `📍 *থানা / উপজেলা:* ${thana}\n`;
      message += `🚚 *ডেলিভারি এরিয়া:* ${areaName}\n`;
      if (cleanNotes) {
        message += `📝 *অতিরিক্ত নোট:* ${cleanNotes}\n`;
      }
      message += `--------------------------------\n`;
      message += `📦 *অর্ডারকৃত পণ্যসমূহ:*\n`;

      items.forEach((item, index) => {
        const price = getEffectiveUnitPrice(item.product);
        const sizeLabel = item.selectedSize ? ` (সাইজ: ${item.selectedSize})` : '';
        message += `${index + 1}. ${item.product.name}${sizeLabel}\n`;
        message += `   পরিমাণ: ${item.quantity} টি | মূল্য: ৳${(
          price * item.quantity
        ).toLocaleString()}\n`;
      });

      message += `--------------------------------\n`;
      message += `💵 *সাবটোটাল:* ৳${subtotal.toLocaleString()}\n`;
      message += `🚚 *ডেলিভারি চার্জ:* ৳${deliveryFee}\n`;
      message += `💰 *সর্বমোট প্রদেয় বিল:* ৳${grandTotal.toLocaleString()}\n`;
      message += `--------------------------------\n`;
      message += `(ক্যাশ অন ডেলিভারি — অনুগ্রহ করে অর্ডারটি কনফার্ম করুন)`;

      const cleanTargetIntl = storeWhatsappIntl.replace(/[^\d]/g, '') || WHATSAPP_INTL;
      const targetUrl = `https://wa.me/${cleanTargetIntl}?text=${encodeURIComponent(message)}`;

      setWhatsappUrl(targetUrl);
      setConfirmedSnapshot({
        orderNumber: finalOrderId,
        customerName: cleanName,
        phoneNumber: cleanPhone,
        streetAddress: cleanStreet,
        division,
        district,
        thana,
        deliveryArea,
        total: grandTotal,
        itemCount: totalItemCount,
      });
      clearCart();
      window.dispatchEvent(new CustomEvent('muaz-products-updated'));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'অর্ডার প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      setErrors({ general: msg });
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setConfirmedSnapshot(null);
    setErrors({});
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/60 backdrop-blur-[2px] flex items-start sm:items-center justify-center p-2.5 sm:p-5 animate-in fade-in duration-150"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div
        className={`relative w-full ${
          confirmedSnapshot ? 'max-w-lg' : 'max-w-4xl'
        } bg-white rounded-[20px] shadow-2xl border border-slate-200/90 my-auto max-h-[94vh] flex flex-col overflow-hidden text-left`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 bg-[#F8FAF9] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[12px] bg-[#ECFDF3] border border-emerald-200/80 text-[#16A34A] flex items-center justify-center shrink-0">
              {confirmedSnapshot ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <ShoppingBag className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="checkout-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate"
              >
                {confirmedSnapshot ? 'অর্ডার সফলভাবে তৈরি হয়েছে' : 'অর্ডার ও চেকআউট'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {confirmedSnapshot
                  ? 'WhatsApp-এ অর্ডার বার্তাটি পাঠিয়ে দ্রুত কনফার্মেশন নিন'
                  : `${STORE_NAME} • ক্যাশ অন ডেলিভারি সুবিধা`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="চেকআউট বন্ধ করুন"
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 rounded-[10px] transition-colors shrink-0"
          >
            <X className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {confirmedSnapshot ? (
          /* Order Confirmation Screen */
          <div className="p-5 sm:p-7 overflow-y-auto space-y-5 text-center">
            <div className="w-16 h-16 bg-[#ECFDF3] border border-emerald-200 text-[#16A34A] rounded-2xl mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-[8px] bg-[#ECFDF3] border border-emerald-200 text-xs font-mono font-bold text-[#15803D]">
                অর্ডার আইডি: #{confirmedSnapshot.orderNumber}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-3">
                ধন্যবাদ, {confirmedSnapshot.customerName}!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                আপনার অর্ডারটি আমাদের সিস্টেমে সংরক্ষিত হয়েছে। দ্রুত ডেলিভারির জন্য নিচের বাটনে ক্লিক করে{' '}
                <span className="font-semibold text-slate-900 font-mono">
                  {storeWhatsappNumber}
                </span>{' '}
                নম্বরে WhatsApp মেসেজ পাঠান।
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm rounded-[12px] transition-all shadow-[0_6px_18px_rgba(22,163,74,0.28)]"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>WhatsApp খুলে অর্ডার পাঠান</span>
            </a>

            {/* Confirmed Customer & Address Summary */}
            <div className="p-4 bg-[#F8FAF9] rounded-[14px] text-left text-xs space-y-2.5 text-slate-600 border border-slate-200/80">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">কাস্টমার:</span>
                <span className="font-semibold text-slate-900 text-right">
                  {confirmedSnapshot.customerName}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">মোবাইল:</span>
                <span className="font-semibold text-slate-900 font-mono text-right">
                  {confirmedSnapshot.phoneNumber}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">এলাকা:</span>
                <span className="font-semibold text-slate-900 text-right">
                  {confirmedSnapshot.thana}, {confirmedSnapshot.district}, {confirmedSnapshot.division}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">ঠিকানা:</span>
                <span className="font-medium text-slate-800 text-right leading-relaxed">
                  {confirmedSnapshot.streetAddress}
                </span>
              </div>
              <div className="flex justify-between gap-3 pt-2 border-t border-slate-200/80 items-center">
                <span className="font-semibold text-slate-700">
                  সর্বমোট প্রদেয় বিল ({confirmedSnapshot.itemCount} টি পণ্য):
                </span>
                <span className="font-bold text-[#16A34A] text-base font-display tabular-nums">
                  ৳{confirmedSnapshot.total.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-[10px] transition-colors"
            >
              শপিং চালিয়ে যান
            </button>
          </div>
        ) : (
          /* Main Two-Column Responsive Checkout Form */
          <form
            onSubmit={handleSubmitOrder}
            noValidate
            className="flex-1 overflow-y-auto overflow-x-hidden"
          >
            <div className="p-4 sm:p-6 space-y-5">
              {errors.general && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[12px] flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-medium leading-relaxed">{errors.general}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
                {/* LEFT COLUMN: Customer Information + Delivery Charge + Note */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Section 1: Customer Information (Exact 6 Fields in Requested Order) */}
                  <section className="bg-white border border-slate-200/80 rounded-[16px] p-4 sm:p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-[8px] bg-[#ECFDF3] text-[#15803D] border border-emerald-200/80 text-xs font-bold flex items-center justify-center tabular-nums">
                          ১
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          কাস্টমারের তথ্য ও ডেলিভারি ঠিকানা
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        * চিহ্নিত তথ্য আবশ্যক
                      </span>
                    </div>

                    {/* 1. কাস্টমারের পুরো নাম */}
                    <div>
                      <label
                        htmlFor="checkout-customer-name"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        <User className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>কাস্টমারের পুরো নাম</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-customer-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          clearFieldError('customerName');
                        }}
                        placeholder="আপনার সম্পূর্ণ নাম লিখুন।"
                        className={`w-full px-3.5 py-2.5 text-sm bg-[#F8FAF9] border rounded-[12px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                          errors.customerName
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                            : 'border-slate-200 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                        }`}
                      />
                      {errors.customerName && (
                        <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.customerName}</span>
                        </p>
                      )}
                    </div>

                    {/* 2. কাস্টমারের মোবাইল নাম্বার */}
                    <div>
                      <label
                        htmlFor="checkout-phone-number"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>কাস্টমারের মোবাইল নাম্বার</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="checkout-phone-number"
                          type="tel"
                          inputMode="tel"
                          required
                          autoComplete="tel"
                          maxLength={14}
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(normalizeDigits(e.target.value));
                            clearFieldError('phoneNumber');
                          }}
                          placeholder="01XXXXXXXXX"
                          className={`w-full px-3.5 py-2.5 text-sm bg-[#F8FAF9] border rounded-[12px] text-slate-900 placeholder:text-slate-400 font-mono focus:outline-none focus:bg-white transition-all ${
                            errors.phoneNumber
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                              : 'border-slate-200 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                          }`}
                        />
                      </div>
                      {errors.phoneNumber ? (
                        <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.phoneNumber}</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-slate-400">
                          ১১ ডিজিটের সচল বাংলাদেশি মোবাইল নাম্বার (যেমন: 01822486585)
                        </p>
                      )}
                    </div>

                    {/* 3. কাস্টমারের সম্পূর্ণ ঠিকানা */}
                    <div>
                      <label
                        htmlFor="checkout-street-address"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>কাস্টমারের সম্পূর্ণ ঠিকানা</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="checkout-street-address"
                        rows={2}
                        required
                        autoComplete="street-address"
                        value={streetAddress}
                        onChange={(e) => {
                          setStreetAddress(e.target.value);
                          clearFieldError('streetAddress');
                        }}
                        placeholder="বাসা নং, রোড নং, এলাকা ও বিস্তারিত ঠিকানা লিখুন।"
                        className={`w-full px-3.5 py-2.5 text-sm bg-[#F8FAF9] border rounded-[12px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all resize-none ${
                          errors.streetAddress
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                            : 'border-slate-200 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                        }`}
                      />
                      {errors.streetAddress && (
                        <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.streetAddress}</span>
                        </p>
                      )}
                    </div>

                    {/* 4. বিভাগ (Division) | 5. জেলা (District) | 6. থানা (Thana / Upazila) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* 4. বিভাগ (Division) */}
                      <div>
                        <label
                          htmlFor="checkout-division"
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          <Map className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span>বিভাগ</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="checkout-division"
                            required
                            value={division}
                            onChange={(e) => handleDivisionChange(e.target.value)}
                            className={`w-full appearance-none pl-3 pr-8 py-2.5 text-xs sm:text-sm bg-[#F8FAF9] border rounded-[12px] focus:outline-none focus:bg-white transition-all cursor-pointer ${
                              division ? 'text-slate-900 font-medium' : 'text-slate-400'
                            } ${
                              errors.division
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                                : 'border-slate-200 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                            }`}
                          >
                            <option value="">বিভাগ নির্বাচন</option>
                            {BANGLADESH_GEO.map((div) => (
                              <option key={div.name} value={div.name} className="text-slate-900">
                                {div.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                        {errors.division && (
                          <p className="mt-1 text-[11px] font-medium text-rose-600">
                            {errors.division}
                          </p>
                        )}
                      </div>

                      {/* 5. জেলা (District) */}
                      <div>
                        <label
                          htmlFor="checkout-district"
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          <Building2 className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span>জেলা</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="checkout-district"
                            required
                            disabled={!division}
                            value={district}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            className={`w-full appearance-none pl-3 pr-8 py-2.5 text-xs sm:text-sm border rounded-[12px] focus:outline-none transition-all ${
                              !division
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : `bg-[#F8FAF9] focus:bg-white cursor-pointer ${
                                    district ? 'text-slate-900 font-medium' : 'text-slate-400'
                                  }`
                            } ${
                              errors.district
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                                : 'border-slate-200 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                            }`}
                          >
                            <option value="">
                              {division ? 'জেলা নির্বাচন' : 'আগে বিভাগ দিন'}
                            </option>
                            {availableDistricts.map((dist) => (
                              <option key={dist.name} value={dist.name} className="text-slate-900">
                                {dist.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                        {errors.district && (
                          <p className="mt-1 text-[11px] font-medium text-rose-600">
                            {errors.district}
                          </p>
                        )}
                      </div>

                      {/* 6. থানা (Thana / Upazila) */}
                      <div>
                        <label
                          htmlFor="checkout-thana"
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span>থানা / উপজেলা</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="checkout-thana"
                            required
                            disabled={!district}
                            value={thana}
                            onChange={(e) => {
                              setThana(e.target.value);
                              clearFieldError('thana');
                            }}
                            className={`w-full appearance-none pl-3 pr-8 py-2.5 text-xs sm:text-sm border rounded-[12px] focus:outline-none transition-all ${
                              !district
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : `bg-[#F8FAF9] focus:bg-white cursor-pointer ${
                                    thana ? 'text-slate-900 font-medium' : 'text-slate-400'
                                  }`
                            } ${
                              errors.thana
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                                : 'border-slate-200 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                            }`}
                          >
                            <option value="">
                              {district ? 'থানা নির্বাচন' : 'আগে জেলা দিন'}
                            </option>
                            {availableThanas.map((t) => (
                              <option key={t} value={t} className="text-slate-900">
                                {t}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                        {errors.thana && (
                          <p className="mt-1 text-[11px] font-medium text-rose-600">
                            {errors.thana}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Section 2: Delivery Area & Additional Note */}
                  <section className="bg-white border border-slate-200/80 rounded-[16px] p-4 sm:p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <span className="w-6 h-6 rounded-[8px] bg-[#ECFDF3] text-[#15803D] border border-emerald-200/80 text-xs font-bold flex items-center justify-center tabular-nums">
                        ২
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        ডেলিভারি এরিয়া ও অতিরিক্ত নির্দেশনা
                      </h3>
                    </div>

                    {/* Preserved Delivery Charge Selectable Cards */}
                    <div>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                        <Truck className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>ডেলিভারি এলাকা নির্বাচন করুন *</span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDeliveryArea('inside_dhaka')}
                          className={`p-3.5 rounded-[12px] border text-left transition-all flex items-center justify-between gap-2 ${
                            deliveryArea === 'inside_dhaka'
                              ? 'border-[#16A34A] bg-[#ECFDF3]/85 ring-2 ring-[#16A34A]/15 shadow-2xs'
                              : 'border-slate-200 bg-[#F8FAF9] hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-slate-900">
                              ঢাকা সিটি – ৳{feeInsideDhaka}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              ২৪-৪৮ ঘণ্টার মধ্যে দ্রুত হোম ডেলিভারি
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              deliveryArea === 'inside_dhaka'
                                ? 'bg-[#16A34A] border-[#16A34A] text-white'
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {deliveryArea === 'inside_dhaka' && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeliveryArea('outside_dhaka')}
                          className={`p-3.5 rounded-[12px] border text-left transition-all flex items-center justify-between gap-2 ${
                            deliveryArea === 'outside_dhaka'
                              ? 'border-[#16A34A] bg-[#ECFDF3]/85 ring-2 ring-[#16A34A]/15 shadow-2xs'
                              : 'border-slate-200 bg-[#F8FAF9] hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-slate-900">
                              ঢাকার বাইরে – ৳{feeOutsideDhaka}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              সারা বাংলাদেশে ২-৪ দিনে কুরিয়ার ডেলিভারি
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              deliveryArea === 'outside_dhaka'
                                ? 'bg-[#16A34A] border-[#16A34A] text-white'
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {deliveryArea === 'outside_dhaka' && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Additional Note */}
                    <div>
                      <label
                        htmlFor="checkout-notes"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>অতিরিক্ত নোট (ঐচ্ছিক)</span>
                      </label>
                      <input
                        id="checkout-notes"
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="যেমন: কালারের পছন্দ, ডেলিভারি সংক্রান্ত নির্দেশনা ইত্যাদি।"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F8FAF9] border border-slate-200 rounded-[12px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 transition-all"
                      />
                    </div>
                  </section>
                </div>

                {/* RIGHT COLUMN: Order Summary + Cash on Delivery Card + WhatsApp CTA */}
                <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
                  <div className="bg-[#F8FAF9] border border-slate-200/80 rounded-[16px] p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#16A34A]" />
                        <span>অর্ডার সামারি</span>
                      </h3>
                      <span className="text-xs font-semibold text-slate-500 tabular-nums">
                        {totalItemCount} টি পণ্য
                      </span>
                    </div>

                    {/* Cart Items List with Product Images, Size, Qty, Price */}
                    {items.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        আপনার শপিং ব্যাগটি খালি রয়েছে।
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {items.map((item) => {
                          const unitPrice = getEffectiveUnitPrice(item.product);
                          const lineTotal = unitPrice * item.quantity;
                          return (
                            <div
                              key={`${item.product.id}-${item.selectedSize || 'default'}`}
                              className="bg-white border border-slate-200/80 rounded-[12px] p-2.5 flex items-center gap-3"
                            >
                              <div className="w-12 h-12 rounded-[10px] bg-slate-50 border border-slate-100 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                                {item.product.image ? (
                                  <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Package className="w-5 h-5 text-slate-300" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">
                                  {item.product.name}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {item.selectedSize && (
                                    <span className="inline-block text-[10px] font-bold bg-[#ECFDF3] text-[#15803D] border border-emerald-200 px-1.5 py-0.5 rounded-[6px]">
                                      সাইজ: {item.selectedSize}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-slate-500 tabular-nums">
                                    ৳{unitPrice.toLocaleString()} × {item.quantity}
                                  </span>
                                </div>
                              </div>

                              <div className="text-xs font-bold text-slate-900 font-mono tabular-nums shrink-0">
                                ৳{lineTotal.toLocaleString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Subtotal, Delivery Fee & Total Payable */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>সাবটোটাল</span>
                        <span className="font-semibold text-slate-900 font-mono tabular-nums">
                          ৳{subtotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>
                          ডেলিভারি চার্জ ({deliveryArea === 'inside_dhaka' ? 'ঢাকা সিটি' : 'ঢাকার বাইরে'})
                        </span>
                        <span className="font-semibold text-slate-900 font-mono tabular-nums">
                          ৳{deliveryFee}
                        </span>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">সর্বমোট প্রদেয় বিল</span>
                        <span className="text-lg font-extrabold text-[#16A34A] font-display tabular-nums">
                          ৳{grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Exact Preserved Cash on Delivery Emerald Card */}
                    <div className="flex items-start gap-2.5 text-xs text-[#15803D] bg-[#ECFDF3] p-3 rounded-[12px] border border-emerald-200/90 leading-relaxed">
                      <ShieldCheck className="w-4.5 h-4.5 text-[#16A34A] shrink-0 mt-0.5" />
                      <span className="font-medium">
                        ক্যাশ অন ডেলিভারি প্রযোজ্য। পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করবেন।
                      </span>
                    </div>

                    {/* Primary Green WhatsApp Confirmation Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || items.length === 0}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-[12px] transition-all shadow-[0_6px_18px_rgba(22,163,74,0.28)] cursor-pointer"
                    >
                      <MessageCircle className="w-4.5 h-4.5 fill-current shrink-0" />
                      <span>
                        {isSubmitting
                          ? 'অর্ডার যাচাই ও কনফার্ম হচ্ছে...'
                          : 'WhatsApp-এ অর্ডার কনফার্ম করুন'}
                      </span>
                    </button>

                    <p className="text-[11px] text-center text-slate-400">
                      অর্ডার কনফার্ম করলে স্টক সংরক্ষিত হবে এবং WhatsApp-এ আপনার অর্ডার ডিটেইলস তৈরি হবে।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
