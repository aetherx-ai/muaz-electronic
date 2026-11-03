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
  ArrowRight,
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
  const { login, isSupabaseConnected } = useAuth();

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAF9] px-4 py-8 font-sans text-[#111827] sm:px-6 sm:py-12">
      
      {/* Soft background ambient gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-[#16A34A]/[0.05] blur-[90px] rounded-full"
      />

      <section className="relative z-10 w-full max-w-[420px]">
        
        {/* Return to store */}
        <button
          type="button"
          onClick={onBackToStore}
          className="group mb-6 inline-flex items-center gap-2 text-[12.5px] font-medium text-gray-500 transition-colors hover:text-[#16A34A]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>স্টোরে ফিরে যান</span>
        </button>

        {/* Clean White Card */}
        <div className="relative overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-7 sm:p-9 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          
          {/* Brand Header */}
          <header className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-[68px] w-[68px] items-center justify-center rounded-full overflow-hidden shadow-xs">
              <img
                src={OFFICIAL_LOGO_PATH}
                alt={`${STORE_NAME} logo`}
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] block mb-1">
              {STORE_TAGLINE}
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              MUAZ <span className="text-[#16A34A]">ADMIN</span>
            </h1>

            <p className="mt-1 text-xs text-gray-500">
              {isSupabaseConnected
                ? 'আপনার অনুমোদিত অ্যাডমিন অ্যাকাউন্টে প্রবেশ করুন'
                : 'অ্যাডমিন ডেমো মোড সক্রিয় — যেকোনো ইমেইল ও পাসওয়ার্ড দিন'}
            </p>
          </header>

          {/* Error Notice */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700"
              >
                <Mail className="h-3.5 w-3.5 text-[#16A34A]" />
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
                placeholder="admin@muazelectronic.com"
                required
                disabled={loading}
                className="h-[44px] w-full rounded-xl border border-gray-200 bg-[#F8FAF9] px-3.5 text-[13px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#16A34A] focus:bg-white focus:ring-2 focus:ring-[#16A34A]/10 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700"
              >
                <LockKeyhole className="h-3.5 w-3.5 text-[#16A34A]" />
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
                  className="h-[44px] w-full rounded-xl border border-gray-200 bg-[#F8FAF9] py-2.5 pl-3.5 pr-11 text-[13px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#16A34A] focus:bg-white focus:ring-2 focus:ring-[#16A34A]/10 disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'লুকান' : 'দেখুন'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] px-4 font-semibold text-xs sm:text-[13px] text-white shadow-[0_2px_12px_rgba(22,163,74,0.25)] transition-all disabled:opacity-60"
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

          {/* Footer Security Badge */}
          <div className="mt-6 border-t border-gray-100 pt-4 text-center">
            <span className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#16A34A]" />
              নিরাপদ অ্যাডমিন কন্ট্রোল সিস্টেম
            </span>
          </div>

        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          © {new Date().getFullYear()} {STORE_NAME}. সর্বস্বত্ব সংরক্ষিত।
        </p>

      </section>
    </main>
  );
};
