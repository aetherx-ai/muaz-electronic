import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { INITIAL_PRODUCTS, INITIAL_DETAILED_CATEGORIES } from './data/products';
import { productService, categoryService } from './lib/supabase';
import { Product, Category } from './types';

// Inner App Content with Route Switching and Auth state
function MainApp() {
  const { user, loading: authLoading } = useAuth();

  // Route state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Dynamic Catalog Data (synced with Supabase / Server / localStorage)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<(string | Category)[]>(INITIAL_DETAILED_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const loadStorefrontData = useCallback(async () => {
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        productService.getPublicProducts(),
        categoryService.getActiveCategories(),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Error loading storefront data:', err);
    }
  }, []);

  useEffect(() => {
    loadStorefrontData();

    const handleProductsUpdated = () => {
      loadStorefrontData();
    };
    window.addEventListener('muaz-products-updated', handleProductsUpdated);
    return () => window.removeEventListener('muaz-products-updated', handleProductsUpdated);
  }, [loadStorefrontData]);

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

  const handleSearchClick = () => {
    const el = document.getElementById('all-products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 350);
    }
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
    <CartProvider>
      <div className="min-h-screen bg-[#F8FAF9] text-[#111827] flex flex-col">
        <Header
          onSearchClick={handleSearchClick}
          onNavigateToAdmin={() => navigateTo('/admin')}
          categories={categories}
          onSelectCategory={(catName) => {
            setSelectedCategory(catName);
            setSearchQuery('');
          }}
        />

        <main className="flex-1">
          <Hero products={products} />
          <ProductCatalog
            products={products}
            categories={categories}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchInputRef={searchInputRef}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          <BrandTrust />
        </main>

        <Footer
          onNavigateToAdmin={() => navigateTo('/admin')}
          categories={categories}
        />

        <CartDrawer />
        <ProductDetailModal />
        <CheckoutModal />
        <FloatingWhatsApp />
        <MobileBottomNav onSearchClick={handleSearchClick} />
      </div>
    </CartProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
