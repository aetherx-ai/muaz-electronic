
import React, { useState } from 'react';
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
  ArrowUpRight,
} from 'lucide-react';

import {
  OFFICIAL_LOGO_PATH,
  STORE_NAME,
  STORE_TAGLINE,
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
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-4 py-8 font-sans text-[#F5F3EC] sm:px-6 sm:py-12">

      {/* Subtle background lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C5A15B]/[0.035] blur-[110px]"
      />

      {/* Fine background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#C5A15B 1px, transparent 1px), linear-gradient(90deg, #C5A15B 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage:
            'radial-gradient(ellipse at center, black, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black, transparent 75%)',
        }}
      />

      <section className="relative z-10 w-full max-w-[420px]">

        {/* Return to store */}
        <button
          type="button"
          onClick={onBackToStore}
          className="group mb-8 inline-flex items-center gap-2.5 text-[12px] font-medium tracking-wide text-[#8F8B80] transition-colors duration-200 hover:text-[#DCC184] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A15B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080808]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span>স্টোরে ফিরে যান</span>
        </button>

        {/* Signature Card */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#C5A15B]/20 bg-[#10100F] shadow-[0_30px_100px_-40px_rgba(0,0,0,0.95)]">

          {/* Fine gold top edge */}
          <div
            aria-hidden="true"
            className="absolute left-[12%] right-[12%] top-0 h-px bg-gradient-to-r from-transparent via-[#D8BD7B]/80 to-transparent"
          />

          <div className="p-6 sm:p-9">

            {/* Brand */}
            <header className="mb-9 text-center">

              <div className="mx-auto mb-6 flex h-[78px] w-[78px] items-center justify-center rounded-[20px] border border-[#C5A15B]/30 bg-[#090909] p-2.5 shadow-[0_8px_35px_-20px_rgba(197,161,91,0.35)]">
                <img
                  src={OFFICIAL_LOGO_PATH}
                  alt={`${STORE_NAME} logo`}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.35em] text-[#BCA36C]">
                Signature Collection
              </p>

              <h1 className="text-[26px] font-semibold tracking-[0.12em] text-[#F5F3EC] sm:text-[30px]">
                MUAZ <span className="font-normal text-[#C5A15B]">ADMIN</span>
              </h1>

              <div className="mx-auto mt-4 h-px w-12 bg-[#C5A15B]/60" />

              <p className="mt-4 text-[12px] leading-6 text-[#858176]">
                {STORE_TAGLINE}
              </p>
            </header>

            {/* Form heading */}
            <div className="mb-6">
              <h2 className="text-[16px] font-medium tracking-wide text-[#EAE7DE]">
                Welcome back
              </h2>

              <p className="mt-1.5 text-[12px] leading-5 text-[#777369]">
                আপনার অ্যাডমিন অ্যাকাউন্টে প্রবেশ করুন।
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-[12px] leading-5 text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span className="min-w-0 flex-1">{error}</span>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="ত্রুটির বার্তা বন্ধ করুন"
                  className="shrink-0 rounded p-0.5 text-red-300/70 hover:text-red-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[#C9C5BA]"
                >
                  <Mail className="h-3.5 w-3.5 text-[#C5A15B]" />
                  ইমেইল অ্যাড্রেস
                </label>

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
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                  className="h-[49px] w-full rounded-xl border border-[#FFFFFF]/[0.09] bg-[#090909] px-4 text-[13px] text-[#F5F3EC] outline-none transition-all duration-200 placeholder:text-[#555249] hover:border-[#FFFFFF]/[0.16] focus:border-[#C5A15B]/70 focus:ring-2 focus:ring-[#C5A15B]/10 disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[#C9C5BA]"
                >
                  <LockKeyhole className="h-3.5 w-3.5 text-[#C5A15B]" />
                  পাসওয়ার্ড
                </label>

                <div className="relative">
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
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    required
                    disabled={loading}
                    className="h-[49px] w-full rounded-xl border border-[#FFFFFF]/[0.09] bg-[#090909] py-3 pl-4 pr-12 text-[13px] text-[#F5F3EC] outline-none transition-all duration-200 placeholder:text-[#555249] hover:border-[#FFFFFF]/[0.16] focus:border-[#C5A15B]/70 focus:ring-2 focus:ring-[#C5A15B]/10 disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    aria-label={
                      showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'
                    }
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#777369] transition-colors hover:text-[#DCC184] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A15B] disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border border-[#E1C982]/30 bg-[#C5A15B] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.13em] text-[#11100C] transition-all duration-200 hover:border-[#F0DBA5] hover:bg-[#D9BB78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E1C982] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10100F] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>অ্যাডমিন প্যানেলে প্রবেশ</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Security footer */}
            <div className="mt-7 border-t border-white/[0.07] pt-5">
              <div className="flex items-center justify-center gap-2 text-[#777369]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#B49A5A]" />

                <span className="text-[10px] tracking-wide">
                  Secure Administration Portal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page footer */}
        <footer className="mt-7 text-center">
          <p className="text-[10px] tracking-wide text-[#69665D]">
            © {new Date().getFullYear()} {STORE_NAME}
          </p>

          <p className="mt-1.5 text-[9px] uppercase tracking-[0.2em] text-[#4F4C44]">
            Designed for excellence
          </p>
        </footer>
      </section>
    </main>
  );
};
