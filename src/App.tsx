import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';

// Inner App Content with Route Switching and Auth state
function MainApp() {
  const { user, loading: authLoading } = useAuth();

  // Route state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Sync with browser navigation (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!currentPath.startsWith('/admin')) {
      document.body.style.backgroundColor = '#000000';
    } else {
      document.body.style.backgroundColor = '#F8FAF9';
    }
    return () => {
      document.body.style.backgroundColor = '#F8FAF9';
    };
  }, [currentPath]);

  // ROUTE 1: ADMIN DASHBOARD OR LOGIN
  if (currentPath.startsWith('/admin')) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#F7FAF8] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500">প্রবেশাধিকার যাচাই করা হচ্ছে...</p>
          </div>
        </div>
      );
    }

    if (user) {
      return (
        <AdminDashboard
          onBackToStore={() => {
            navigateTo('/');
          }}
        />
      );
    }

    return (
      <AdminLogin
        onLoginSuccess={() => {
          navigateTo('/admin');
        }}
        onBackToStore={() => {
          navigateTo('/');
        }}
      />
    );
  }

  // ROUTE 2: PUBLIC SITE — REALISTIC PLAN EXPIRED ERROR SCREEN
  return (
    <main className="min-h-screen w-full bg-black text-[#EDEDED] flex items-center justify-center p-5 sm:p-6 font-display">
      <div className="w-full max-w-[520px] rounded-lg border border-white/[0.12] bg-[#0A0A0A] p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.08] font-mono text-xs text-[#A1A1AA]">
          <span className="text-[#EDEDED] font-semibold">402 : PAYMENT_REQUIRED</span>
          <span>Code: PLAN_LIMIT_EXCEEDED</span>
        </div>

        <div className="mt-5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            Your plan is over. Upgrade your plan.
          </h1>
          <p className="mt-2.5 text-sm text-[#A1A1AA] leading-relaxed">
            This application is temporarily unavailable because the active plan limit has
            been reached. Please upgrade your plan to restore access.
          </p>
        </div>

        <div className="mt-5 rounded-md bg-black border border-white/[0.08] px-4 py-3 font-mono text-xs text-[#888888] space-y-1.5">
          <p>
            <span className="text-[#666666]">Status:</span>{' '}
            <span className="text-[#EDEDED]">402 Payment Required</span>
          </p>
          <p>
            <span className="text-[#666666]">Reason:</span>{' '}
            <span className="text-[#EDEDED]">PLAN_EXPIRED</span>
          </p>
          <p>
            <span className="text-[#666666]">Action:</span>{' '}
            <span className="text-[#EDEDED]">Upgrade your plan to reactivate this site</span>
          </p>
        </div>

        <p className="mt-5 pt-4 border-t border-white/[0.08] font-mono text-[11px] text-[#666666]">
          If you are the site owner, upgrade your plan from your project dashboard.
        </p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
