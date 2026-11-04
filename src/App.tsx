import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCatalog } from './components/ProductCatalog';
import { BrandTrust } from './components/BrandTrust';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { productService, categoryService } from './lib/supabase';
import { Product, Category } from './types';
import { INITIAL_DETAILED_CATEGORIES } from './data/products';

// Inner App Content with Route Switching and Auth state
function MainApp() {
  const { user, loading: authLoading } = useAuth();

  // Route state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Storefront Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_DETAILED_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Load public products and categories whenever on storefront
  const loadStorefrontData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        productService.getPublicProducts(),
        categoryService.getActiveCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Error loading storefront data:', err);
    }
  };

  useEffect(() => {
    if (currentPath === '/' || !currentPath.startsWith('/admin')) {
      loadStorefrontData();
    }
  }, [currentPath]);

  const handleSearchClick = () => {
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 400);
  };

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

    // If authenticated, show Admin Dashboard
    if (user) {
      return (
        <AdminDashboard
          onBackToStore={() => {
            loadStorefrontData();
            navigateTo('/');
          }}
        />
      );
    }

    // If not authenticated, show Admin Login
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

  // ROUTE 2: PUBLIC STOREFRONT
  return (
    <div className="min-h-screen bg-[#F7FAF8] text-gray-900 flex flex-col font-sans selection:bg-[#16A34A]/20 selection:text-[#16A34A]">
      {/* Navigation Top Bar with dynamic category navigation */}
      <Header
        onSearchClick={handleSearchClick}
        onNavigateToAdmin={() => navigateTo('/admin')}
        categories={categories}
        onSelectCategory={(catName) => {
          setSearchQuery('');
          const el = document.getElementById('all-products-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {/* Above-the-fold Luxury Campaign Hero */}
        <Hero />

        {/* Curated Product Discovery Catalog with Live Database Items */}
        <ProductCatalog
          products={products}
          categories={['All Products', ...categories]}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchInputRef={searchInputRef}
        />

        {/* Official Brand Trust Section */}
        <BrandTrust />
      </main>

      {/* Signature Footer */}
      <Footer
        onNavigateToAdmin={() => navigateTo('/admin')}
        categories={categories}
      />

      {/* Interactive Overlays & Nav */}
      <CartDrawer />
      <ProductDetailModal />
      <CheckoutModal />
      <FloatingWhatsApp />
      <MobileBottomNav onSearchClick={handleSearchClick} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
