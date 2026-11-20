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

  // ROUTE 2: PUBLIC SITE — PURE BLACK ERROR SCREEN ONLY
  return (
    <main className="min-h-screen w-full bg-black text-white flex items-center justify-center p-6">
      <div className="flex items-center gap-4 text-sm sm:text-base">
        <h1 className="text-xl sm:text-2xl font-medium pr-4 border-r border-white/30">
          Error
        </h1>
        <p className="text-white/85">
          Something went wrong.
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
