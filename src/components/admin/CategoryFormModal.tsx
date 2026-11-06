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

    const generatedSlug = (slug.trim() || generateCategorySlug(name.trim()));

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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#141519] border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl shadow-black/95 my-4 text-left flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-white/[0.08] bg-[#18191f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFC928]/10 border border-[#FFC928]/25 flex items-center justify-center text-[#FFC928]">
              {renderCategoryIcon(icon, 'w-4 h-4')}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100">
                {categoryToEdit ? 'ক্যাটাগরি সম্পাদনা করুন' : 'নতুন কাস্টম ক্যাটাগরি'}
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {categoryToEdit
                  ? `"${categoryToEdit.name}" ক্যাটাগরির বিস্তারিত পরিবর্তন`
                  : 'স্টোরের জন্য নতুন ক্যাটাগরি ও ফিল্টার অপশন যোগ করুন'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded-lg transition-colors"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Cascading Rename Notice */}
          {isRenaming && productCount > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-start gap-2 text-xs text-amber-200">
              <Sparkles className="w-4 h-4 shrink-0 text-[#FFC928] mt-0.5" />
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
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                ক্যাটাগরির নাম (English) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="যেমন: Smart Watches"
                required
                className="w-full px-3 py-2 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                বাংলা নাম <span className="text-zinc-500 font-normal">(ঐচ্ছিক)</span>
              </label>
              <input
                type="text"
                value={bengaliName}
                onChange={(e) => setBengaliName(e.target.value)}
                placeholder="যেমন: স্মার্ট ওয়াচ ও ব্যান্ড"
                className="w-full px-3 py-2 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                URL স্লাগ (Slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="smart-watches"
                className="w-full px-3 py-2 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 font-mono placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                প্রদর্শন ক্রম (Order)
              </label>
              <input
                type="number"
                min="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 focus:outline-none focus:border-[#FFC928] transition-colors"
              />
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <span>আইকন নির্বাচন</span>
                <span className="text-[10px] text-zinc-400">({icon})</span>
              </label>
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="আইকন খুঁজুন..."
                className="px-2 py-0.5 text-xs bg-[#1a1b20] border border-white/[0.08] rounded text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928] w-28"
              />
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-2 bg-[#1a1b20] border border-white/[0.08] rounded-lg max-h-32 overflow-y-auto">
              {filteredIcons.map((opt) => {
                const isSelected = icon === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIcon(opt.id)}
                    className={`flex flex-col items-center justify-center p-1.5 rounded border text-center transition-all ${
                      isSelected
                        ? 'bg-[#FFC928]/15 border-[#FFC928] text-[#FFC928] shadow-sm font-semibold'
                        : 'bg-[#141519] border-white/[0.05] text-zinc-400 hover:text-zinc-100 hover:border-white/[0.15]'
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
            <label className="block text-xs font-semibold text-zinc-300">
              ক্যাটাগরি ছবি <span className="text-zinc-500 font-normal">(ঐচ্ছিক)</span>
            </label>
            <div className="flex items-center gap-3">
              {image ? (
                <div className="relative w-14 h-12 rounded-lg border border-white/[0.08] overflow-hidden bg-[#121316] shrink-0 group">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="মুছুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-12 rounded-lg border border-dashed border-white/[0.1] flex flex-col items-center justify-center text-zinc-500 bg-[#1a1b20] shrink-0">
                  <ImageIcon className="w-4 h-4 text-zinc-600" />
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={image.startsWith('data:') ? 'আপলোডকৃত ছবি সংরক্ষিত' : image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="ছবির URL (https://...)"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928]"
                />

                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] rounded text-[11px] font-medium cursor-pointer transition-colors">
                  <Upload className="w-3 h-3 text-[#FFC928]" />
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
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              বিবরণ <span className="text-zinc-500 font-normal">(ঐচ্ছিক)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="এই ক্যাটাগরিতে কী কী পণ্য পাওয়া যাবে..."
              className="w-full px-3 py-1.5 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928] resize-none"
            />
          </div>

          {/* Active Status Toggle */}
          <div className="p-3 bg-[#18191f] border border-white/[0.06] rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">
                সক্রিয় স্ট্যাটাস (Active)
              </span>
              <span className="text-[10px] text-zinc-400">
                নিষ্ক্রিয় থাকলে স্টোরের গ্রাহক ফিল্টারে এটি দৃশ্যমান হবে না
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                isActive ? 'bg-[#FFC928]' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3 sm:px-6 border-t border-white/[0.08] bg-[#18191f] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] rounded-lg border border-white/[0.08] transition-colors"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2 text-xs font-bold text-zinc-950 bg-[#FFC928] hover:bg-[#ffd966] active:bg-[#eab420] rounded-lg transition-all shadow-md shadow-[#FFC928]/15 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
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
