import React, { useState } from 'react';
import {
  Save,
  CheckCircle,
  Database,
  Copy,
  Phone,
  Truck,
  Globe,
  Check,
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface StoreSettingsTabProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => Promise<{ success: boolean; error: string | null }>;
}

export const StoreSettingsTab: React.FC<StoreSettingsTabProps> = ({
  settings,
  onSaveSettings,
}) => {
  const { isSupabaseConnected } = useAuth();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [whatsappIntl, setWhatsappIntl] = useState(settings.whatsappIntl);
  const [facebookUrl, setFacebookUrl] = useState(settings.facebookUrl);
  const [deliveryFeeInsideDhaka, setDeliveryFeeInsideDhaka] = useState(settings.deliveryFeeInsideDhaka);
  const [deliveryFeeOutsideDhaka, setDeliveryFeeOutsideDhaka] = useState(settings.deliveryFeeOutsideDhaka);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const updated: StoreSettings = {
      storeName: storeName.trim(),
      tagline: tagline.trim(),
      whatsappNumber: whatsappNumber.trim(),
      whatsappIntl: whatsappIntl.trim(),
      facebookUrl: facebookUrl.trim(),
      deliveryFeeInsideDhaka: Number(deliveryFeeInsideDhaka),
      deliveryFeeOutsideDhaka: Number(deliveryFeeOutsideDhaka),
    };

    const res = await onSaveSettings(updated);
    setIsSaving(false);

    if (res.success) {
      setFeedback('স্টোর সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const copySqlToClipboard = () => {
    const sqlText = `-- MUAZ ELECTRONIC SQL SCHEMA
-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    bengali_name TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(12, 2),
    category TEXT NOT NULL,
    brand TEXT DEFAULT 'MUAZ ELECTRONIC',
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    image TEXT NOT NULL,
    description TEXT DEFAULT '',
    features JSONB DEFAULT '[]'::jsonb,
    specs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published products" ON public.products FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-150">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
          স্টোর ও ডাটাবেজ সেটিংস
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          যোগাযোগ নম্বর, ডেলিভারি ফি এবং ক্লাউড ডাটাবেজ ইন্টিগ্রেশন নিয়ন্ত্রণ করুন
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 bg-[#ECFDF3] border border-emerald-200 rounded-[12px] flex items-center gap-2 text-xs font-semibold text-[#15803D] shadow-2xs">
          <CheckCircle className="w-4 h-4 shrink-0 text-[#16A34A]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Supabase Status Card */}
      <div className="bg-white border border-slate-200/80 rounded-[12px] p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#ECFDF3] border border-emerald-200/70 text-[#16A34A] rounded-[10px]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  Supabase ডাটাবেজ ও ক্লাউড স্টোরেজ
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider border ${
                    isSupabaseConnected
                      ? 'bg-[#ECFDF3] text-[#15803D] border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isSupabaseConnected ? 'Live Cloud Connected' : 'Persistent Storage Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSupabaseConnected
                  ? 'সরাসরি Supabase PostgreSQL ও ক্লাউড ইমেজ বাকেটের সাথে সংযুক্ত।'
                  : 'বর্তমানে ব্রাউজারের ফুল-ফিচার্ড পারসিস্টেন্ট ডাটা স্টোরেজে সচল (কোনো ডাটা হারায় না)।'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={copySqlToClipboard}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-[10px] transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>SQL কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Supabase SQL কপি করুন</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">ক্লাউড প্রজেক্ট কানেক্ট করার সহজ ধাপ:</p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-500">
            <li>
              Supabase ড্যাশবোর্ডে গিয়ে একটি প্রজেক্ট খুলুন এবং SQL Editor-এ{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">
                supabase/schema.sql
              </code>{' '}
              রান করুন।
            </li>
            <li>
              Storage-এ গিয়ে{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">
                product-images
              </code>{' '}
              নামে একটি পাবলিক বাকেট তৈরি করুন।
            </li>
            <li>
              আপনার প্রজেক্টের{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">
                VITE_SUPABASE_URL
              </code>{' '}
              এবং{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">
                VITE_SUPABASE_ANON_KEY
              </code>{' '}
              টি{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">.env</code>{' '}
              ফাইলে যুক্ত করুন।
            </li>
          </ol>
        </div>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200/80 rounded-[12px] p-6 sm:p-7 space-y-6 shadow-xs"
      >
        {/* Brand Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#16A34A]" />
            <span>ব্র্যান্ড ও স্টোর তথ্য</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                স্টোরের নাম
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ট্যাগলাইন (Tagline)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp & Social Contacts */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#16A34A]" />
            <span>অফিসিয়াল যোগাযোগ ও সোশ্যাল</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                WhatsApp নম্বর (লোকাল ফরম্যাট)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="01822486585"
                className="w-full px-3.5 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 font-mono focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                WhatsApp নম্বর (ইন্টারন্যাশনাল ফরম্যাট)
              </label>
              <input
                type="text"
                value={whatsappIntl}
                onChange={(e) => setWhatsappIntl(e.target.value)}
                placeholder="8801822486585"
                className="w-full px-3.5 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 font-mono focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              অফিসিয়াল ফেসবুক পেজ লিংক
            </label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Delivery Rates */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#16A34A]" />
            <span>ডেলিভারি চার্জ নির্ধারণ (BDT ৳)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ঢাকা সিটির ভেতরে ডেলিভারি ফি (৳)
              </label>
              <input
                type="number"
                min="0"
                value={deliveryFeeInsideDhaka}
                onChange={(e) => setDeliveryFeeInsideDhaka(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 font-mono focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ঢাকার বাইরে ডেলিভারি ফি (৳)
              </label>
              <input
                type="number"
                min="0"
                value={deliveryFeeOutsideDhaka}
                onChange={(e) => setDeliveryFeeOutsideDhaka(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 font-mono focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[10px] transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষিত হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
