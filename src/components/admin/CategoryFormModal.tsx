import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Sparkles, AlertCircle, Check, Upload } from 'lucide-react';
import { Category } from '../../types';
import { CATEGORY_ICON_OPTIONS, renderCategoryIcon } from '../../lib/categoryIcons';
import { generateCategorySlug } from '../../lib/supabase';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    categoryData: Partial<Category>,
    categoryId?: string,
    oldName?: string
  ) => Promise<{ success: boolean; error: string | null }>;
  categoryToEdit?: Category | null;
  allCategories: Category[];
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
}) => {
  const [name, setName] = useState('');
  const [bengaliName, setBengaliName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState('');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setBengaliName(categoryToEdit.bengaliName || '');
      setSlug(categoryToEdit.slug);
      setIcon(categoryToEdit.icon || 'Layers');
      setImage(categoryToEdit.image || '');
      setDescription(categoryToEdit.description || '');
      setIsActive(categoryToEdit.isActive !== false);
      setDisplayOrder(categoryToEdit.displayOrder || 1);
    } else {
      setName('');
      setBengaliName('');
      setSlug('');
      setIcon('Layers');
      setImage('');
      setDescription('');
      setIsActive(true);
      setDisplayOrder(1);
    }
    setError(null);
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!categoryToEdit) {
      setSlug(generateCategorySlug(val));
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('ছবির আকার সর্বোচ্চ ৩ মেগাবাইট হতে পারবে');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('ক্যাটাগরির নাম অবশ্যই দিতে হবে');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const generatedSlug = slug.trim() || generateCategorySlug(name.trim());

    const payload: Partial<Category> = {
      name: name.trim(),
      bengaliName: bengaliName.trim() || undefined,
      slug: generatedSlug,
      icon,
      image: image.trim() || undefined,
      description: description.trim() || undefined,
      isActive,
      displayOrder: Number(displayOrder) || 1,
    };

    const res = await onSave(payload, categoryToEdit?.id, categoryToEdit?.name);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  const filteredIcons = CATEGORY_ICON_OPTIONS.filter(
    (opt) =>
      opt.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
      opt.bengaliLabel.toLowerCase().includes(iconSearch.toLowerCase()) ||
      opt.id.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const productCount = categoryToEdit?.productCount || 0;
  const isRenaming = categoryToEdit && categoryToEdit.name !== name.trim();

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-3.5 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white border border-slate-200/90 rounded-[12px] overflow-hidden shadow-2xl my-4 text-left flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200/80 bg-[#F8FAF9] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#ECFDF3] border border-emerald-200/80 flex items-center justify-center text-[#16A34A]">
              {renderCategoryIcon(icon, 'w-4 h-4')}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                {categoryToEdit ? 'ক্যাটাগরি সম্পাদনা করুন' : 'নতুন কাস্টম ক্যাটাগরি'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {categoryToEdit
                  ? `"${categoryToEdit.name}" ক্যাটাগরির বিস্তারিত পরিবর্তন`
                  : 'স্টোরের জন্য নতুন ক্যাটাগরি ও ফিল্টার অপশন যোগ করুন'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-[8px] transition-colors"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[10px] flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Cascading Rename Notice */}
          {isRenaming && productCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-[10px] flex items-start gap-2 text-xs text-amber-900">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold block">স্বয়ংক্রিয় প্রোডাক্ট লিঙ্কিং বজায় থাকবে:</span>
                <span>
                  এই ক্যাটাগরিতে <strong>{productCount}</strong> টি প্রোডাক্ট রয়েছে। নাম পরিবর্তন
                  করলে সংশ্লিষ্ট সব প্রোডাক্ট স্বয়ংক্রিয়ভাবে নতুন নামে আপডেট হবে।
                </span>
              </div>
            </div>
          )}

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ক্যাটাগরির নাম (English) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="যেমন: Smart Watches"
                required
                className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                বাংলা নাম <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
              </label>
              <input
                type="text"
                value={bengaliName}
                onChange={(e) => setBengaliName(e.target.value)}
                placeholder="যেমন: স্মার্ট ওয়াচ ও ব্যান্ড"
                className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors font-bengali"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL স্লাগ (Slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="smart-watches"
                className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                প্রদর্শন ক্রম (Order)
              </label>
              <input
                type="number"
                min="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white transition-colors tabular-nums"
              />
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>আইকন নির্বাচন</span>
                <span className="text-[10px] text-slate-400">({icon})</span>
              </label>
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="আইকন খুঁজুন..."
                className="px-2.5 py-1 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[8px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] w-32"
              />
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-2 bg-[#F8FAF9] border border-slate-200 rounded-[10px] max-h-32 overflow-y-auto">
              {filteredIcons.map((opt) => {
                const isSelected = icon === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIcon(opt.id)}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-[8px] border text-center transition-colors ${
                      isSelected
                        ? 'bg-[#ECFDF3] border-[#16A34A] text-[#15803D] font-semibold'
                        : 'bg-white border-slate-200/80 text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                    title={`${opt.label} (${opt.bengaliLabel})`}
                  >
                    <IconComponent className="w-3.5 h-3.5 mb-1" />
                    <span className="text-[9px] truncate max-w-full leading-none">{opt.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Image */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              ক্যাটাগরি ছবি <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
            </label>
            <div className="flex items-center gap-3">
              {image ? (
                <div className="relative w-14 h-12 rounded-[10px] border border-slate-200 overflow-hidden bg-slate-100 shrink-0 group">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="মুছুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-12 rounded-[10px] border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-[#F8FAF9] shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={image.startsWith('data:') ? 'আপলোডকৃত ছবি সংরক্ষিত' : image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="ছবির URL (https://...)"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[8px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:bg-white"
                />

                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-[8px] text-[11px] font-medium cursor-pointer transition-colors">
                  <Upload className="w-3 h-3 text-[#16A34A]" />
                  <span>ফাইল নির্বাচন</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              বিবরণ <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="এই ক্যাটাগরিতে কী কী পণ্য পাওয়া যাবে..."
              className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 focus:bg-white resize-none"
            />
          </div>

          {/* Active Status Toggle */}
          <div className="p-3.5 bg-[#F8FAF9] border border-slate-200/80 rounded-[10px] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">
                সক্রিয় স্ট্যাটাস (Active)
              </span>
              <span className="text-[11px] text-slate-500">
                নিষ্ক্রিয় থাকলে স্টোরের গ্রাহক ফিল্টারে এটি দৃশ্যমান হবে না
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                isActive ? 'bg-[#16A34A]' : 'bg-slate-300'
              }`}
              aria-label="Toggle active status"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 sm:px-6 border-t border-slate-200/80 bg-[#F8FAF9] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-[10px] border border-slate-200 transition-colors"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[10px] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{categoryToEdit ? 'আপডেট করুন' : 'ক্যাটাগরি তৈরি করুন'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
