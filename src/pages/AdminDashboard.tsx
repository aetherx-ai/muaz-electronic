import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Product,
  StoreSettings,
  Category,
  CustomerOrder,
  OrderStatus,
  PaymentStatus,
  SizeInventoryMap,
} from '../types';
import { computeTotalStockFromSizes, hasEnabledSizes } from '../lib/sizeInventory';
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
import { ClothingSizesTab } from '../components/admin/ClothingSizesTab';
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
  const [ordersInitialStatus, setOrdersInitialStatus] = useState<string>('all');
  const [inventoryInitialFilter, setInventoryInitialFilter] = useState<'all' | 'healthy' | 'low' | 'out'>('all');
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

  const handleSelectTab = (tab: AdminTab) => {
    if (tab !== 'orders') setOrdersInitialStatus('all');
    if (tab !== 'inventory') setInventoryInitialFilter('all');
    setIsFormModalOpen(false);
    setEditingProduct(null);
    setCurrentTab(tab);
  };

  // Compute counters for sidebar badges
  const pendingOrderCount = useMemo(() => {
    return orders.filter((o) => (o.status || 'pending') === 'pending').length;
  }, [orders]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock < 10).length;
  }, [products]);

  const sizedProductCount = useMemo(() => {
    return products.filter((p) => hasEnabledSizes(p)).length;
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsFormModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProduct = async (
    productPayload: Omit<Product, 'id'>,
    imageFile?: File,
    productId?: string
  ): Promise<{ success: boolean; error: string | null }> => {
    if (productId) {
      const res = await productService.updateProduct(productId, productPayload, imageFile);
      if (res.success && res.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
        window.dispatchEvent(new CustomEvent('muaz-products-updated'));
        showToast('success', `"${res.product.name}" সফলভাবে আপডেট করা হয়েছে`);
        return { success: true, error: null };
      }
      return { success: false, error: res.error };
    } else {
      const res = await productService.createProduct(productPayload, imageFile);
      if (res.product) {
        setProducts((prev) => [res.product!, ...prev]);
        window.dispatchEvent(new CustomEvent('muaz-products-updated'));
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
      window.dispatchEvent(new CustomEvent('muaz-products-updated'));
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
      window.dispatchEvent(new CustomEvent('muaz-products-updated'));
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
      window.dispatchEvent(new CustomEvent('muaz-products-updated'));
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
      window.dispatchEvent(new CustomEvent('muaz-products-updated'));
      showToast('success', `স্টক আপডেট সম্পন্ন: ${newStock} পিস`);
      return { success: true, error: null };
    }
    showToast('error', res.error || 'স্টক আপডেট করা যায়নি');
    return { success: false, error: res.error };
  };

  // Size-wise Stock Quick Update Handler
  const handleUpdateSizeStock = async (
    productId: string,
    sizeInventory: SizeInventoryMap | null,
    fallbackStock?: number
  ): Promise<{ success: boolean; error: string | null }> => {
    const hasAnySize =
      Boolean(sizeInventory) &&
      Object.values(sizeInventory || {}).some((entry) => Boolean(entry?.enabled));
    const total = hasAnySize
      ? computeTotalStockFromSizes(sizeInventory!)
      : typeof fallbackStock === 'number'
      ? Math.max(0, Math.floor(fallbackStock))
      : 0;

    const res = await productService.updateProduct(productId, {
      hasSizes: hasAnySize,
      sizeInventory: hasAnySize ? sizeInventory! : undefined,
      stock: total,
    });
    if (res.success && res.product) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
      setEditingProduct((prev) => (prev && prev.id === productId ? res.product! : prev));
      window.dispatchEvent(new CustomEvent('muaz-products-updated'));
      showToast('success', `সাইজ-ভিত্তিক স্টক আপডেট সম্পন্ন (মোট: ${total} পিস)`);
      return { success: true, error: null };
    }
    showToast('error', res.error || 'সাইজ স্টক আপডেট করা যায়নি');
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
      const [updatedProds, updatedOrds] = await Promise.all([
        productService.getAllProductsAdmin(),
        orderService.getAllOrders(),
      ]);
      setProducts(updatedProds);
      setOrders(updatedOrds);
      window.dispatchEvent(new CustomEvent('muaz-products-updated'));
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
    <div className="min-h-screen bg-[#F6F8F7] text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-[12px] shadow-xl border flex items-center gap-2.5 text-xs font-semibold bg-white ${
              toast.type === 'success'
                ? 'text-[#15803D] border-emerald-200 shadow-emerald-950/5'
                : 'text-rose-700 border-rose-200 shadow-rose-950/5'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
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
        setCurrentTab={handleSelectTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        categoryCount={categories.length}
        productCount={products.length}
        pendingOrderCount={pendingOrderCount}
        lowStockCount={lowStockCount}
        customerCount={customerCount}
        sizedProductCount={sizedProductCount}
        activeCouponsCount={activeCouponsCount}
        pendingReviewsCount={pendingReviewsCount}
        onBackToStore={onBackToStore}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[256px]'
        }`}
      >
        {/* Top Navbar Header */}
        <AdminHeader
          currentTab={currentTab}
          setCurrentTab={handleSelectTab}
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
            setOrdersInitialStatus('all');
            setCurrentTab('orders');
          }}
        />

        {/* Tab Content or Create/Edit Product Page */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isFormModalOpen ? (
            <ProductFormModal
              isOpen={isFormModalOpen}
              onClose={() => {
                setIsFormModalOpen(false);
                setEditingProduct(null);
              }}
              onSave={handleSaveProduct}
              onSaveSizeInventory={handleUpdateSizeStock}
              productToEdit={editingProduct}
              categories={categories}
              onAddCategory={handleAddCategory}
              onNavigateTab={(tab) => {
                setIsFormModalOpen(false);
                setEditingProduct(null);
                handleSelectTab(tab);
              }}
              onBackToStore={onBackToStore}
            />
          ) : loading && products.length === 0 ? (
            <div className="py-24 text-center bg-white border border-slate-200/80 rounded-[12px] shadow-xs">
              <RefreshCw className="w-7 h-7 text-[#16A34A] animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-600 font-medium">ডাটাবেজ থেকে তথ্য লোড হচ্ছে...</p>
            </div>
          ) : (
            <>
              {currentTab === 'overview' && (
                <OverviewTab
                  products={products}
                  orders={orders}
                  onAddNewProduct={handleAddNewProduct}
                  onEditProduct={handleEditProduct}
                  onViewAllProducts={() => handleSelectTab('products')}
                  onViewAllOrders={(filter) => {
                    setOrdersInitialStatus(filter || 'all');
                    setCurrentTab('orders');
                  }}
                  onViewAllCategories={() => handleSelectTab('categories')}
                  onViewLowStock={() => {
                    setInventoryInitialFilter('low');
                    setCurrentTab('inventory');
                  }}
                  onViewClothingSizes={() => handleSelectTab('clothing-sizes')}
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
                  onManageCategories={() => handleSelectTab('categories')}
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
                  initialStatusFilter={ordersInitialStatus}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'customers' && <CustomersTab orders={orders} />}

              {currentTab === 'inventory' && (
                <InventoryTab
                  products={products}
                  initialStockFilter={inventoryInitialFilter}
                  onUpdateStock={handleUpdateStock}
                  onUpdateSizeStock={handleUpdateSizeStock}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'clothing-sizes' && (
                <ClothingSizesTab
                  products={products}
                  categories={categories}
                  onUpdateSizeStock={handleUpdateSizeStock}
                  onEditProduct={handleEditProduct}
                  onAddNewProduct={handleAddNewProduct}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'discounts' && <DiscountsTab onRefreshData={loadAllData} />}

              {currentTab === 'reviews' && <ReviewsTab onRefreshData={loadAllData} />}

              {currentTab === 'analytics' && (
                <AnalyticsTab products={products} orders={orders} />
              )}

              {currentTab === 'settings' && (
                <StoreSettingsTab settings={settings} onSaveSettings={handleSaveSettings} />
              )}
            </>
          )}
        </main>
      </div>

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
