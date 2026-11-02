import React, { useState, useEffect } from 'react';
import { Menu, Plus, RefreshCw, CheckCircle, AlertCircle, Store } from 'lucide-react';
import { Product, StoreSettings } from '../types';
import {
  productService,
  categoryService,
  settingsService,
  isSupabaseConfigured,
} from '../lib/supabase';
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar';
import { OverviewTab } from '../components/admin/OverviewTab';
import { ProductManagementTab } from '../components/admin/ProductManagementTab';
import { CategoryManagementTab } from '../components/admin/CategoryManagementTab';
import { StoreSettingsTab } from '../components/admin/StoreSettingsTab';
import { ProductFormModal } from '../components/admin/ProductFormModal';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { DEFAULT_STORE_SETTINGS } from '../data/products';

interface AdminDashboardProps {
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToStore }) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [prods, cats, sets] = await Promise.all([
        productService.getAllProductsAdmin(),
        categoryService.getCategories(),
        settingsService.getSettings(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSettings(sets);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast('error', 'ডাটাবেজ থেকে তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers for Products
  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsFormModalOpen(true);
  };

  const handleSaveProduct = async (
    productPayload: Omit<Product, 'id'>,
    imageFile?: File,
    productId?: string
  ): Promise<{ success: boolean; error: string | null }> => {
    if (productId) {
      // Update
      const res = await productService.updateProduct(productId, productPayload, imageFile);
      if (res.success && res.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
        showToast('success', `"${res.product.name}" সফলভাবে আপডেট করা হয়েছে`);
        return { success: true, error: null };
      }
      return { success: false, error: res.error };
    } else {
      // Create new
      const res = await productService.createProduct(productPayload, imageFile);
      if (res.product) {
        setProducts((prev) => [res.product!, ...prev]);
        showToast('success', `"${res.product.name}" সফলভাবে স্টোরে যুক্ত হয়েছে`);
        return { success: true, error: null };
      }
      return { success: false, error: res.error };
    }
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);

    const res = await productService.deleteProduct(deletingProduct.id);
    setIsDeleting(false);

    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setIsDeleteModalOpen(false);
      showToast('success', `"${deletingProduct.name}" সফলভাবে ডিলিট করা হয়েছে`);
      setDeletingProduct(null);
    } else {
      showToast('error', res.error || 'ডিলিট সম্পন্ন করা যায়নি');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'published' ? 'draft' : 'published';
    const res = await productService.updateProduct(product.id, { status: newStatus });
    if (res.success && res.product) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? res.product! : p)));
      showToast(
        'success',
        `"${product.name}" এর স্ট্যাটাস "${newStatus.toUpperCase()}" এ পরিবর্তন করা হয়েছে`
      );
    } else {
      showToast('error', 'স্ট্যাটাস পরিবর্তন করা যায়নি');
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    const newFeatured = !product.isFeatured;
    const res = await productService.updateProduct(product.id, { isFeatured: newFeatured });
    if (res.success && res.product) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? res.product! : p)));
      showToast(
        'success',
        newFeatured ? `ফিচার্ড প্রোডাক্ট হিসেবে যুক্ত করা হয়েছে` : `ফিচার্ড তালিকা থেকে বাদ দেওয়া হয়েছে`
      );
    }
  };

  // Handlers for Categories
  const handleAddCategory = async (name: string) => {
    const res = await categoryService.addCategory(name);
    if (res.success) {
      const updated = await categoryService.getCategories();
      setCategories(updated);
      showToast('success', `"${name}" ক্যাটাগরি তৈরি হয়েছে`);
    }
    return res;
  };

  const handleDeleteCategory = async (name: string) => {
    const res = await categoryService.deleteCategory(name);
    if (res.success) {
      const updated = await categoryService.getCategories();
      setCategories(updated);
      showToast('success', `"${name}" ক্যাটাগরি মুছে ফেলা হয়েছে`);
    }
    return res;
  };

  // Handlers for Settings
  const handleSaveSettings = async (newSettings: StoreSettings) => {
    const res = await settingsService.updateSettings(newSettings);
    if (res.success) {
      setSettings(newSettings);
      showToast('success', 'স্টোর সেটিংস সফলভাবে সেভ হয়েছে');
    }
    return res;
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#111827] flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-white text-emerald-700 border-emerald-300 shadow-emerald-900/10'
                : 'bg-white text-rose-700 border-rose-300 shadow-rose-900/10'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              aria-label="মেনু খুলুন"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <span>MUAZ Dashboard</span>
              <span>/</span>
              <span className="text-[#16A34A] font-semibold capitalize">
                {currentTab === 'overview'
                  ? 'ড্যাশবোর্ড ওভারভিউ'
                  : currentTab === 'products'
                  ? 'প্রোডাক্টস'
                  : currentTab === 'categories'
                  ? 'ক্যাটাগরি'
                  : 'সেটিংস'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-[#16A34A] hover:bg-gray-100 rounded-lg transition-colors"
              title="তথ্য রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#16A34A]' : ''}`} />
            </button>

            <button
              onClick={handleAddNewProduct}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] rounded-xl transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন প্রোডাক্ট</span>
            </button>

            <button
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-[#16A34A] bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-[#16A34A]" />
              <span className="hidden md:inline">স্টোরে যান</span>
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loading && products.length === 0 ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-8 h-8 text-[#16A34A] animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-500">ডাটাবেজ থেকে তথ্য লোড হচ্ছে...</p>
            </div>
          ) : (
            <>
              {currentTab === 'overview' && (
                <OverviewTab
                  products={products}
                  onAddNewProduct={handleAddNewProduct}
                  onEditProduct={handleEditProduct}
                  onViewAllProducts={() => setCurrentTab('products')}
                />
              )}

              {currentTab === 'products' && (
                <ProductManagementTab
                  products={products}
                  categories={categories}
                  onAddNewProduct={handleAddNewProduct}
                  onEditProduct={handleEditProduct}
                  onDeleteProduct={handleDeleteClick}
                  onToggleStatus={handleToggleStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {currentTab === 'categories' && (
                <CategoryManagementTab
                  categories={categories}
                  products={products}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}

              {currentTab === 'settings' && (
                <StoreSettingsTab
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        categories={categories}
      />

      <DeleteConfirmModal
        product={deletingProduct}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

    </div>
  );
};
