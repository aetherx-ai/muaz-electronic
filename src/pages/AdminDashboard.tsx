import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Product,
  StoreSettings,
  Category,
  CustomerOrder,
  OrderStatus,
  PaymentStatus,
} from '../types';
import {
  productService,
  categoryService,
  settingsService,
  orderService,
} from '../lib/supabase';
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { OverviewTab } from '../components/admin/OverviewTab';
import { ProductManagementTab } from '../components/admin/ProductManagementTab';
import { CategoryManagementTab } from '../components/admin/CategoryManagementTab';
import { OrdersTab } from '../components/admin/OrdersTab';
import { CustomersTab } from '../components/admin/CustomersTab';
import { InventoryTab } from '../components/admin/InventoryTab';
import { DiscountsTab } from '../components/admin/DiscountsTab';
import { ReviewsTab } from '../components/admin/ReviewsTab';
import { AnalyticsTab } from '../components/admin/AnalyticsTab';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
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
      const [prods, cats, sets, ords] = await Promise.all([
        productService.getAllProductsAdmin(),
        categoryService.getAllCategoriesAdmin(),
        settingsService.getSettings(),
        orderService.getAllOrders(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSettings(sets);
      setOrders(ords);
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

  // Compute counters for sidebar badges
  const pendingOrderCount = useMemo(() => {
    return orders.filter((o) => (o.status || 'pending') === 'pending').length;
  }, [orders]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock < 10).length;
  }, [products]);

  const customerCount = useMemo(() => {
    const phones = new Set(orders.map((o) => o.phoneNumber.replace(/[\s-]/g, '')));
    return phones.size;
  }, [orders]);

  const activeCouponsCount = useMemo(() => {
    try {
      const raw = localStorage.getItem('muaz_admin_coupons_v1');
      if (raw) {
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list.filter((c: any) => c.isActive).length : 3;
      }
    } catch {}
    return 3;
  }, []);

  const pendingReviewsCount = useMemo(() => {
    try {
      const raw = localStorage.getItem('muaz_admin_reviews_v1');
      if (raw) {
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list.filter((r: any) => r.status === 'pending').length : 1;
      }
    } catch {}
    return 1;
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
    } else {
      showToast('error', 'ফিচার্ড স্ট্যাটাস পরিবর্তন করা যায়নি');
    }
  };

  // Stock Quick Update Handler
  const handleUpdateStock = async (
    productId: string,
    newStock: number
  ): Promise<{ success: boolean; error: string | null }> => {
    const res = await productService.updateProduct(productId, { stock: newStock });
    if (res.success && res.product) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
      showToast('success', `স্টক আপডেট সম্পন্ন: ${newStock} পিস`);
      return { success: true, error: null };
    }
    showToast('error', res.error || 'স্টক আপডেট করা যায়নি');
    return { success: false, error: res.error };
  };

  // Handlers for Dynamic Categories
  const handleAddCategory = async (categoryData: Partial<Category> | string) => {
    const res = await categoryService.addCategory(categoryData);
    if (res.success) {
      const [updatedCats, updatedProds] = await Promise.all([
        categoryService.getAllCategoriesAdmin(),
        productService.getAllProductsAdmin(),
      ]);
      setCategories(updatedCats);
      setProducts(updatedProds);
    }
    return res;
  };

  const handleUpdateCategory = async (
    id: string,
    categoryData: Partial<Category>,
    oldName?: string
  ) => {
    const res = await categoryService.updateCategory(id, categoryData, oldName);
    if (res.success) {
      const [updatedCats, updatedProds] = await Promise.all([
        categoryService.getAllCategoriesAdmin(),
        productService.getAllProductsAdmin(),
      ]);
      setCategories(updatedCats);
      setProducts(updatedProds);
    }
    return res;
  };

  const handleToggleCategoryStatus = async (id: string, isActive: boolean) => {
    const res = await categoryService.toggleCategoryStatus(id, isActive);
    if (res.success) {
      const updatedCats = await categoryService.getAllCategoriesAdmin();
      setCategories(updatedCats);
    }
    return res;
  };

  const handleReorderCategories = async (orderedIds: string[]) => {
    const res = await categoryService.reorderCategories(orderedIds);
    if (res.success) {
      const updatedCats = await categoryService.getAllCategoriesAdmin();
      setCategories(updatedCats);
    }
    return res;
  };

  const handleDeleteCategory = async (id: string, reassignToCategoryName?: string) => {
    const res = await categoryService.deleteCategory(id, reassignToCategoryName);
    if (res.success) {
      const [updatedCats, updatedProds] = await Promise.all([
        categoryService.getAllCategoriesAdmin(),
        productService.getAllProductsAdmin(),
      ]);
      setCategories(updatedCats);
      setProducts(updatedProds);
    }
    return res;
  };

  // Handlers for Orders
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ) => {
    const res = await orderService.updateOrderStatus(orderId, status, paymentStatus);
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || o.orderNumber === orderId
            ? {
                ...o,
                status,
                paymentStatus: paymentStatus || o.paymentStatus || 'cod',
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
      showToast('success', `অর্ডার স্ট্যাটাস "${status.toUpperCase()}" এ হালনাগাদ করা হয়েছে`);
    } else {
      showToast('error', res.error || 'অর্ডার স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
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
    <div className="min-h-screen bg-[#F8FAF9] text-slate-900 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-white text-emerald-800 border-emerald-200 shadow-emerald-950/5'
                : 'bg-white text-rose-800 border-rose-200 shadow-rose-950/5'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
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
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        categoryCount={categories.length}
        productCount={products.length}
        pendingOrderCount={pendingOrderCount}
        lowStockCount={lowStockCount}
        customerCount={customerCount}
        activeCouponsCount={activeCouponsCount}
        pendingReviewsCount={pendingReviewsCount}
        onBackToStore={onBackToStore}
      />

      {/* Main Content Area (dynamic left padding based on sidebar collapsed state) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]'
        }`}
      >
        
        {/* Top Navbar Header */}
        <AdminHeader
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          openMobileSidebar={() => setSidebarOpen(true)}
          onRefresh={loadAllData}
          isLoading={loading}
          onAddNewProduct={handleAddNewProduct}
          onBackToStore={onBackToStore}
          products={products}
          orders={orders}
          onSelectProduct={(p) => {
            handleEditProduct(p);
          }}
          onSelectOrder={(_o) => {
            setCurrentTab('orders');
          }}
        />

        {/* Tab Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loading && products.length === 0 ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">ডাটাবেজ থেকে তথ্য লোড হচ্ছে...</p>
            </div>
          ) : (
            <>
              {currentTab === 'overview' && (
                <OverviewTab
                  products={products}
                  orders={orders}
                  onAddNewProduct={handleAddNewProduct}
                  onEditProduct={handleEditProduct}
                  onViewAllProducts={() => setCurrentTab('products')}
                  onViewAllOrders={(_filter) => setCurrentTab('orders')}
                  onViewAllCategories={() => setCurrentTab('categories')}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
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
                  onManageCategories={() => setCurrentTab('categories')}
                />
              )}

              {currentTab === 'categories' && (
                <CategoryManagementTab
                  categories={categories}
                  products={products}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onToggleStatus={handleToggleCategoryStatus}
                  onReorderCategories={handleReorderCategories}
                  onDeleteCategory={handleDeleteCategory}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'orders' && (
                <OrdersTab
                  orders={orders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'customers' && (
                <CustomersTab
                  orders={orders}
                />
              )}

              {currentTab === 'inventory' && (
                <InventoryTab
                  products={products}
                  onUpdateStock={handleUpdateStock}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'discounts' && (
                <DiscountsTab
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'reviews' && (
                <ReviewsTab
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsTab
                  products={products}
                  orders={orders}
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
        onAddCategory={handleAddCategory}
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
