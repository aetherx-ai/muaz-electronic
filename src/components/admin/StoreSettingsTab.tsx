import React, { useState } from 'react';
import {
  Save,
  CheckCircle,
  Database,
  Copy,
  ExternalLink,
  ShieldAlert,
  Phone,
  Truck,
  Globe,
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
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-150">
      
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] font-display">
          স্টোর ও ডাটাবেজ সেটিংস
        </h2>
        <p className="text-xs text-[#A7A7A7] mt-0.5">
          যোগাযোগ নম্বর, ডেলিভারি ফি এবং ক্লাউড ডাটাবেজ ইন্টিগ্রেশন নিয়ন্ত্রণ করুন
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Supabase Status Card */}
      <div className="bg-[#111111] border border-[#292929] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292929]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#171717] border border-[#292929] rounded-xl text-[#FFC928]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#FAFAFA]">Supabase ডাটাবেজ ও ক্লাউড স্টোরেজ</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isSupabaseConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#FFC928]/10 text-[#FFC928] border border-[#FFC928]/30'
                  }`}
                >
                  {isSupabaseConnected ? 'Live Cloud Connected' : 'Persistent Storage Active'}
                </span>
              </div>
              <p className="text-xs text-[#A7A7A7] mt-0.5">
                {isSupabaseConnected
                  ? 'সরাসরি Supabase PostgreSQL ও ক্লাউড ইমেজ বাকেটের সাথে সংযুক্ত।'
                  : 'বর্তমানে ব্রাউজারের ফুল-ফিচার্ড পারসিস্টেন্ট ডাটা স্টোরেজে সচল (কোনো ডাটা হারায় না)।'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={copySqlToClipboard}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#171717] hover:bg-[#202020] text-[#FAFAFA] border border-[#292929] rounded-lg transition-colors self-start sm:self-auto"
          >
            {copiedSql ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>SQL কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#FFC928]" />
                <span>Supabase SQL কপি করুন</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 text-xs text-[#A7A7A7] space-y-2">
          <p>
            <strong>ক্লাউড প্রজেক্ট কানেক্ট করার সহজ ধাপ:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
            <li>
              Supabase ড্যাশবোর্ডে গিয়ে একটি প্রজেক্ট খুলুন এবং SQL Editor-এ <code>supabase/schema.sql</code> রান করুন।
            </li>
            <li>
              Storage-এ গিয়ে <code>product-images</code> নামে একটি পাবলিক বাকেট তৈরি করুন।
            </li>
            <li>
              আপনার প্রজেক্টের <code>VITE_SUPABASE_URL</code> এবং <code>VITE_SUPABASE_ANON_KEY</code> টি <code>.env</code> ফাইলে যুক্ত করুন।
            </li>
          </ol>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-[#111111] border border-[#292929] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        
        {/* Brand Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC928] border-b border-[#292929] pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>ব্র্যান্ড ও স্টোর তথ্য</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                স্টোরের নাম
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFC928]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                ট্যাগলাইন (Tagline)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFC928]"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp & Social Contacts */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC928] border-b border-[#292929] pb-2 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>অফিসিয়াল যোগাযোগ ও সোশ্যাল</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                WhatsApp নম্বর (লোকাল ফরম্যাট)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="01822486585"
                className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] font-mono focus:outline-none focus:border-[#FFC928]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                WhatsApp নম্বর (ইন্টারন্যাশনাল ফরম্যাট)
              </label>
              <input
                type="text"
                value={whatsappIntl}
                onChange={(e) => setWhatsappIntl(e.target.value)}
                placeholder="8801822486585"
                className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] font-mono focus:outline-none focus:border-[#FFC928]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
              অফিসিয়াল ফেসবুক পেজ লিংক
            </label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>

        {/* Delivery Rates */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC928] border-b border-[#292929] pb-2 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            <span>ডেলিভারি চার্জ নির্ধারণ (BDT ৳)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                ঢাকা সিটির ভেতরে ডেলিভারি ফি (৳)
              </label>
              <input
                type="number"
                min="0"
                value={deliveryFeeInsideDhaka}
                onChange={(e) => setDeliveryFeeInsideDhaka(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] font-mono focus:outline-none focus:border-[#FFC928]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                ঢাকার বাইরে ডেলিভারি ফি (৳)
              </label>
              <input
                type="number"
                min="0"
                value={deliveryFeeOutsideDhaka}
                onChange={(e) => setDeliveryFeeOutsideDhaka(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] font-mono focus:outline-none focus:border-[#FFC928]"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#292929] flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-xl transition-all shadow-md shadow-[#FFC928]/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষিত হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
