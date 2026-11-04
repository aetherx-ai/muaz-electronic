import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Search,
  CheckCircle,
  AlertCircle,
  Package,
  Eye,
  EyeOff,
  SlidersHorizontal,
} from 'lucide-react';
import { Category, Product } from '../../types';
import { renderCategoryIcon } from '../../lib/categoryIcons';
import { CategoryFormModal } from './CategoryFormModal';
import { CategoryDeleteModal } from './CategoryDeleteModal';

interface CategoryManagementTabProps {
  categories: Category[];
  products: Product[];
  onAddCategory: (categoryData: Partial<Category> | string) => Promise<{ success: boolean; error: string | null }>;
  onUpdateCategory: (id: string, categoryData: Partial<Category>, oldName?: string) => Promise<{ success: boolean; error: string | null }>;
  onToggleStatus: (id: string, isActive: boolean) => Promise<{ success: boolean; error: string | null }>;
  onReorderCategories: (orderedIds: string[]) => Promise<{ success: boolean; error: string | null }>;
  onDeleteCategory: (id: string, reassignToCategoryName?: string) => Promise<{ success: boolean; error: string | null }>;
  onRefreshData?: () => void;
}

export const CategoryManagementTab: React.FC<CategoryManagementTabProps> = ({
  categories,
  products,
  onAddCategory,
  onUpdateCategory,
  onToggleStatus,
  onReorderCategories,
  onDeleteCategory,
}) => {
  // Quick Add State (Requirement 2)
  const [quickName, setQuickName] = useState('');
  const [quickBengaliName, setQuickBengaliName] = useState('');
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag and drop state (Requirement 5)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Toast feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Metrics calculations
  const totalCategories = categories.length;
  const activeCategoriesCount = categories.filter((c) => c.isActive !== false).length;
  const inactiveCategoriesCount = categories.filter((c) => c.isActive === false).length;

  // Compute products per category
  const categoriesWithLiveCounts = categories.map((cat) => {
    const count = products.filter((p) => p.category === cat.name).length;
    return {
      ...cat,
      productCount: count,
    };
  });

  // Filtered categories
  const filteredCategories = categoriesWithLiveCounts.filter((cat) => {
    const matchesSearch =
      !searchQuery.trim() ||
      cat.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (cat.bengaliName && cat.bengaliName.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
      cat.slug.toLowerCase().includes(searchQuery.trim().toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && cat.isActive !== false) ||
      (statusFilter === 'inactive' && cat.isActive === false);

    return matchesSearch && matchesStatus;
  });

  // Quick Add Handler
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    setIsQuickSubmitting(true);
    const slug = quickName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newCategory: Partial<Category> = {
      name: quickName.trim(),
      bengaliName: quickBengaliName.trim() || undefined,
      slug: slug || `cat-${Date.now()}`,
      isActive: true,
      displayOrder: categories.length + 1,
      icon: 'Layers',
    };

    const res = await onAddCategory(newCategory);
    setIsQuickSubmitting(false);

    if (res.success) {
      setQuickName('');
      setQuickBengaliName('');
      showToast('success', `"${quickName.trim()}" ক্যাটাগরি সফলভাবে ডাটাবেজে সংরক্ষণ করা হয়েছে`);
    } else {
      showToast('error', res.error || 'যুক্ত করা সম্ভব হয়নি');
    }
  };

  // Open Full Add Modal
  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setIsFormModalOpen(true);
  };

  // Save Add/Edit Category
  const handleSaveCategory = async (
    data: Partial<Category>,
    categoryId?: string,
    oldName?: string
  ) => {
    if (categoryId) {
      const res = await onUpdateCategory(categoryId, data, oldName);
      if (res.success) {
        showToast('success', `"${data.name || ''}" ক্যাটাগরি আপডেট সম্পন্ন হয়েছে`);
      }
      return res;
    } else {
      const res = await onAddCategory(data);
      if (res.success) {
        showToast('success', `"${data.name || ''}" ক্যাটাগরি তৈরি সম্পন্ন হয়েছে`);
      }
      return res;
    }
  };

  // Toggle Status
  const handleToggleActive = async (cat: Category) => {
    const newStatus = !cat.isActive;
    const res = await onToggleStatus(cat.id, newStatus);
    if (res.success) {
      showToast(
        'success',
        `"${cat.name}" ক্যাটাগরিটি ${newStatus ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'} করা হয়েছে`
      );
    } else {
      showToast('error', res.error || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    }
  };

  // Open Safe Delete / Reassign Modal (Requirement 9)
  const handleOpenDeleteModal = (cat: Category) => {
    setCategoryToDelete(cat);
    setIsDeleteModalOpen(true);
  };

  // Confirm Safe Delete with Reassignment
  const handleConfirmDelete = async (categoryId: string, reassignToCategoryName?: string) => {
    setIsDeleting(true);
    const res = await onDeleteCategory(categoryId, reassignToCategoryName);
    setIsDeleting(false);

    if (res.success) {
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      showToast(
        'success',
        reassignToCategoryName
          ? `ক্যাটাগরি মুছে ফেলা হয়েছে এবং প্রোডাক্টগুলো "${reassignToCategoryName}"-এ স্থানান্তর করা হয়েছে`
          : 'ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে'
      );
    } else {
      showToast('error', res.error || 'ডিলিট সম্পন্ন করা যায়নি');
    }
  };

  // Drag and Drop Handlers (Requirement 5)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...categories];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);

    setDraggedIndex(index);
  };

  const handleDrop = async () => {
    if (draggedIndex === null) return;
    setDraggedIndex(null);

    // Save new display order
    setIsReordering(true);
    const orderedIds = categories.map((c) => c.id);
    await onReorderCategories(orderedIds);
    setIsReordering(false);
    showToast('success', 'ক্যাটাগরির ক্রমবিন্যাস সংরক্ষিত হয়েছে');
  };

  // Up/Down Arrows Reordering for Mobile & 1-Click
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const updated = [...categories];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const orderedIds = updated.map((c) => c.id);
    setIsReordering(true);
    const res = await onReorderCategories(orderedIds);
    setIsReordering(false);

    if (res.success) {
      showToast('success', 'ক্যাটাগরির ক্রম পরিবর্তন করা হয়েছে');
    } else {
      showToast('error', 'ক্রম পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-150">
      
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-600" />
            <span>ডায়নামিক ক্যাটাগরি ম্যানেজমেন্ট</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            স্টোরের সকল পণ্য বিভাগ পরিচালনা করুন, নতুন ক্যাটাগরি তৈরি করুন এবং ড্র্যাগ-এন্ড-ড্রপ করে সাজান
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add New Category (নতুন ক্যাটাগরি)</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              মোট ক্যাটাগরি
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-display tabular-nums">
            {totalCategories}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">স্টোরে সংরক্ষিত বিভাগ</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              সক্রিয় ক্যাটাগরি
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 font-display tabular-nums">
            {activeCategoriesCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">স্টোরফ্রন্টে প্রদর্শিত</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              নিষ্ক্রিয় ক্যাটাগরি
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <EyeOff className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-500 font-display tabular-nums">
            {inactiveCategoriesCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">গ্রাহকদের থেকে লুকানো</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              মোট যুক্ত পণ্য
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-display tabular-nums">
            {products.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">ক্যাটালগ পণ্য</span>
        </div>
      </div>

      {/* Quick Add Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Add New Category (দ্রুত নতুন ক্যাটাগরি তৈরি)</span>
          </h3>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            ইংরেজি ও বাংলা নাম লিখে সংরক্ষণ করুন
          </span>
        </div>

        <form onSubmit={handleQuickAdd} className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="ক্যাটাগরির নাম (English, e.g. Smart Watches) *"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={quickBengaliName}
              onChange={(e) => setQuickBengaliName(e.target.value)}
              placeholder="বাংলা নাম (যেমন: স্মার্ট ওয়াচ ও ব্যান্ড)"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-bengali"
            />
          </div>

          <button
            type="submit"
            disabled={isQuickSubmitting || !quickName.trim()}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-xs disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
          >
            {isQuickSubmitting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>সেভ ক্যাটাগরি</span>
          </button>
        </form>
      </div>

      {/* Categories Table & Sorting (Requirements 3, 4, 5) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 font-display">
              ক্যাটাগরি তালিকা ও প্রদর্শন ক্রম ({filteredCategories.length})
            </h3>
            {isReordering && (
              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse border border-blue-100">
                ক্রম সংরক্ষিত হচ্ছে...
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ক্যাটাগরি খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium text-[11px] ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সব ({totalCategories})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium text-[11px] ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সক্রিয় ({activeCategoriesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium text-[11px] ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-slate-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                নিষ্ক্রিয় ({inactiveCategoriesCount})
              </button>
            </div>
          </div>
        </div>

        {/* Categories Drag & Drop Reorderable List */}
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
            <p className="text-xs">কোনো ক্যাটাগরি পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCategories.map((cat, index) => {
              const isFirst = index === 0;
              const isLast = index === filteredCategories.length - 1;
              const isActive = cat.isActive !== false;

              return (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDrop}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/75 transition-all cursor-move ${
                    draggedIndex === index ? 'opacity-40 bg-slate-100' : ''
                  }`}
                >
                  {/* Left: Drag Handle, Icon, Thumbnail, Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    
                    {/* Grip Handle for Drag & Drop */}
                    <div
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing shrink-0"
                      title="ড্র্যাগ করে ক্রম সাজান"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Up / Down Buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={isFirst}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                        title="উপরে নিন"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={isLast}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                        title="নিচে নিন"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Order Number */}
                    <span className="text-[10px] font-mono text-slate-400 w-5 shrink-0 text-center font-bold">
                      #{index + 1}
                    </span>

                    {/* Icon or Thumbnail */}
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-blue-600">
                          {renderCategoryIcon(cat.icon, 'w-5 h-5')}
                        </div>
                      )}
                    </div>

                    {/* Category Title & Bengali Name */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                          {cat.name}
                        </span>
                        {cat.bengaliName && (
                          <span className="text-[11px] text-slate-500 font-bengali truncate hidden sm:inline">
                            ({cat.bengaliName})
                          </span>
                        )}
                        {!isActive && (
                          <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold text-slate-500 bg-slate-100 rounded border border-slate-200">
                            নিষ্ক্রিয়
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-[10px]">/{cat.slug}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <Package className="w-3 h-3" />
                          <span>{cat.productCount} টি প্রোডাক্ট</span>
                        </span>
                        {cat.description && (
                          <>
                            <span className="hidden md:inline">•</span>
                            <span className="text-[10px] text-slate-400 truncate max-w-xs hidden md:inline">
                              {cat.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    
                    {/* Active/Inactive Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(cat)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={isActive ? 'ক্যাটাগরি নিষ্ক্রিয় করতে ক্লিক করুন' : 'ক্যাটাগরি সক্রিয় করতে ক্লিক করুন'}
                    >
                      {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{isActive ? 'সক্রিয়' : 'লুকানো'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                      title={`${cat.name} সম্পাদনা করুন`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                      title={`${cat.name} মুছে ফেলুন`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit & Add Modal */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        categoryToEdit={editingCategory}
        allCategories={categories}
      />

      {/* Accidental Deletion Prevention & Reassignment Modal (Requirement 9) */}
      <CategoryDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        categoryToDelete={categoryToDelete}
        availableCategories={categories}
        isDeleting={isDeleting}
      />

    </div>
  );
};
