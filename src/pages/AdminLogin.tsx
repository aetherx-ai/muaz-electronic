import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  LoaderCircle,
  X,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Boxes,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';

import {
  OFFICIAL_LOGO_PATH,
  STORE_NAME,
  STORE_TAGLINE,
  WHATSAPP_INTL,
} from '../data/products';

import { useAuth } from '../context/AuthContext';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToStore,
}) => {
  const { login, isSupabaseConnected } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('muaz_remembered_admin_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError('ইমেইল এবং পাসওয়ার্ড উভয়ই প্রদান করুন।');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (rememberMe) {
        try {
          localStorage.setItem('muaz_remembered_admin_email', cleanEmail);
        } catch {
          // ignore
        }
      } else {
        try {
          localStorage.removeItem('muaz_remembered_admin_email');
        } catch {
          // ignore
        }
      }

      const result = await login(cleanEmail, password);

      if (result.success) {
        onLoginSuccess();
      } else {
        setError(
          result.error ||
            'লগইন করা যায়নি। আপনার তথ্য যাচাই করে আবার চেষ্টা করুন।'
        );
      }
    } catch {
      setError(
        'সার্ভারের সঙ্গে সংযোগ করা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-500/20 selection:text-emerald-800">
      
      {/* =================================================================== */}
      {/* LEFT SIDE — BRAND EXPERIENCE (DEEP NAVY WITH EMERALD ACCENTS)       */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden bg-[#0A1128] text-white lg:w-[48%] xl:w-[50%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 min-h-[380px] lg:min-h-screen select-none">
        
        {/* Abstract Ambient Gradient Orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 w-[480px] h-[480px] bg-emerald-600/10 rounded-full blur-[140px]"
        />

        {/* Abstract Geometric Grid Lines Background */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full stroke-white/[0.04] [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        >
          <defs>
            <pattern
              id="admin-login-grid"
              width="48"
              height="48"
              x="50%"
              y="-1"
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 48V.5H48" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" strokeWidth="0" fill="url(#admin-login-grid)" />
        </svg>

        {/* Top: Return button and Brand Lockup */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0 shadow-lg backdrop-blur-md">
              <img
                src={OFFICIAL_LOGO_PATH}
                alt={`${STORE_NAME} Logo`}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-white font-display block">
                {STORE_NAME}
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest block font-sans">
                {STORE_TAGLINE}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToStore}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">স্টোরে ফিরে যান</span>
            <span className="sm:hidden">স্টোর</span>
          </button>
        </div>

        {/* Middle: Brand Headline, Value Propositions & Metric Preview */}
        <div className="relative z-10 my-8 sm:my-12 lg:my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-5 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Commerce Operating System</span>
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white font-display tracking-tight leading-[1.15]">
            Manage Your Business{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200">
              Smarter.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 font-bengali leading-relaxed font-normal">
            আপনার সম্পূর্ণ ই-কমার্স ব্যবসা পরিচালনা করুন একটি স্মার্ট ড্যাশবোর্ড থেকে।
          </p>

          {/* 3 Value Propositions */}
          <div className="mt-8 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-slate-200 font-medium font-bengali">
                রিয়েল-টাইম সেলস রেভিনিউ ও কাস্টমার অর্ডার ট্র্যাকিং
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-slate-200 font-medium font-bengali">
                ডাইনামিক ক্যাটাগরি ও গুদাম ইনভেন্টরি অটোমেশন
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-slate-200 font-medium font-bengali">
                গ্রাহক ডেটাবেজ ও দ্রুত WhatsApp অর্ডার সমন্বয়
              </span>
            </div>
          </div>

          {/* Subtle Live Stats Showcase Card */}
          <div className="mt-8 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">সিস্টেম সিকিউরিটি</span>
                <span className="text-xs font-bold text-white block">২৫৬-বিট এনক্রিপ্টেড সেশন</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30">
                সচল পোর্টাল
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Security Notice */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} {STORE_NAME}. All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Admin Gateway</span>
          </span>
        </div>

      </div>

      {/* =================================================================== */}
      {/* RIGHT SIDE — LOGIN EXPERIENCE (CLEAN LIGHT THEME WITH EMERALD CTA)   */}
      {/* =================================================================== */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-18 bg-[#F8FAFC]">
        
        {/* Top space or mobile logo */}
        <div className="w-full flex items-center justify-between lg:justify-end">
          <div className="lg:hidden flex items-center gap-2">
            <img
              src={OFFICIAL_LOGO_PATH}
              alt={STORE_NAME}
              className="w-7 h-7 object-contain"
            />
            <span className="text-xs font-bold text-slate-900 font-display">MUAZ ADMIN</span>
          </div>

          <button
            type="button"
            onClick={onBackToStore}
            className="lg:hidden inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>স্টোরে যান</span>
          </button>
        </div>

        {/* Centered Login Card */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-8">
          
          <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-sm">
            
            {/* Header */}
            <header className="mb-7">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 block mb-1 font-display">
                ADMIN ACCESS
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
                Welcome Back
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-sans">
                Sign in to your admin account.
              </p>
            </header>

            {/* Error Notice */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 animate-in fade-in zoom-in-95"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span className="flex-1 font-medium">{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-400 hover:text-rose-600"
                  aria-label="বন্ধ করুন"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email field */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  ইমেইল অ্যাড্রেস
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="admin@muazelectronic.com"
                    required
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50 font-sans"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  পাসওয়ার্ড
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LockKeyhole className="h-4 w-4" />
                  </div>
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••••••"
                    required
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-11 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50 font-sans"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'লুকান' : 'দেখুন'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <span>মনে রাখুন (Remember Me)</span>
                </label>

                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] px-4 font-semibold text-xs sm:text-sm text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>অ্যাডমিন প্যানেলে প্রবেশ করুন</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Authentication Mode Notice */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {isSupabaseConnected ? 'Supabase Auth সচল' : 'অ্যাডমিন স্টোরেজ মোড'}
              </span>
              <span className="text-slate-400">SSL সিকিউরড</span>
            </div>

          </div>

        </div>

        {/* Footer */}
        <footer className="w-full text-center text-xs text-slate-400 py-2">
          {STORE_NAME} Commerce Management System
        </footer>

      </div>

      {/* =================================================================== */}
      {/* FORGOT PASSWORD MODAL HELPER                                        */}
      {/* =================================================================== */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm font-display">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span>পাসওয়ার্ড রিকভারি সহায়তা</span>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              নিরাপত্তা বিধির কারণে অ্যাডমিন পাসওয়ার্ড পরিবর্তন বা রিসেট করার জন্য সরাসরি স্টোর কর্তৃপক্ষ বা ডেভেলপারের সাথে যোগাযোগ করুন।
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs text-slate-700">
              <span className="font-semibold block">অনুমোদিত সাপোর্ট চ্যানেল:</span>
              <span className="text-slate-500 block">WhatsApp: +{WHATSAPP_INTL}</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent('আসসালামু আলাইকুম, Muaz Electronic অ্যাডমিন পাসওয়ার্ড রিসেট করতে সহায়তা চাচ্ছি।')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp এ যোগাযোগ</span>
              </a>

              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
