import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Sparkles, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { Category } from '../../types';
import { CATEGORY_ICON_OPTIONS, renderCategoryIcon } from '../../lib/categoryIcons';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Partial<Category>, categoryId?: string, oldName?: string) => Promise<{ success: boolean; error: string | null }>;
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
      // Auto-generate slug
      const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setSlug(generated);
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

    const payload: Partial<Category> = {
      name: name.trim(),
      bengaliName: bengaliName.trim() || undefined,
      slug: (slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, ''),
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-2xl my-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#292929] flex items-center justify-between bg-[#0e0e0e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#292929] flex items-center justify-center text-[#FFC928]">
              {renderCategoryIcon(icon, 'w-5 h-5')}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#FAFAFA] font-display">
                {categoryToEdit ? 'ক্যাটাগরি সম্পাদনা করুন' : 'নতুন কাস্টম ক্যাটাগরি তৈরি'}
              </h2>
              <p className="text-xs text-[#A7A7A7] mt-0.5">
                {categoryToEdit
                  ? `"${categoryToEdit.name}" ক্যাটাগরির বিস্তারিত পরিবর্তন করুন`
                  : 'স্টোরের জন্য নতুন ক্যাটাগরি ও ফিল্টার অপশন যোগ করুন'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#A7A7A7] hover:text-[#FAFAFA] hover:bg-[#1a1a1a] rounded-lg transition-colors"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cascading Rename Notice (Requirement 8) */}
          {isRenaming && productCount > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
              <Sparkles className="w-4 h-4 shrink-0 text-[#FFC928] mt-0.5" />
              <div>
                <span className="font-semibold block">স্বয়ংক্রিয় প্রোডাক্ট লিঙ্কিং বজায় থাকবে:</span>
                <span>
                  এই ক্যাটাগরিতে বর্তমানে <strong>{productCount}</strong> টি প্রোডাক্ট রয়েছে। নাম পরিবর্তন করলে সংশ্লিষ্ট সব প্রোডাক্টের ক্যাটাগরি স্বয়ংক্রিয়ভাবে নতুন নামে আপডেট হয়ে যাবে।
                </span>
              </div>
            </div>
          )}

          {/* Section: Names & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                ক্যাটাগরির নাম (English) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="যেমন: Smart Watches"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-[#171717] border border-[#292929] rounded-xl text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                বাংলা নাম (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={bengaliName}
                onChange={(e) => setBengaliName(e.target.value)}
                placeholder="যেমন: স্মার্ট ওয়াচ ও ব্যান্ড"
                className="w-full px-3.5 py-2.5 text-xs bg-[#171717] border border-[#292929] rounded-xl text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                URL স্লাগ (Slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="smart-watches"
                className="w-full px-3.5 py-2.5 text-xs bg-[#171717] border border-[#292929] rounded-xl text-[#FAFAFA] font-mono placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                প্রদর্শন ক্রম (Display Order)
              </label>
              <input
                type="number"
                min="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#171717] border border-[#292929] rounded-xl text-[#FAFAFA] focus:outline-none focus:border-[#FFC928] transition-colors"
              />
            </div>
          </div>

          {/* Section: Icon Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#FAFAFA] flex items-center gap-1.5">
                <span>ক্যাটাগরি আইকন নির্বাচন করুন</span>
                <span className="text-[10px] text-[#A7A7A7] font-normal">(সিলেক্টেড: {icon})</span>
              </label>
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="আইকন খুঁজুন..."
                className="px-2.5 py-1 text-[11px] bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928] w-36"
              />
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 p-2.5 bg-[#171717] border border-[#292929] rounded-xl max-h-36 overflow-y-auto">
              {filteredIcons.map((opt) => {
                const isSelected = icon === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIcon(opt.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'bg-[#FFC928]/15 border-[#FFC928] text-[#FFC928] shadow-sm'
                        : 'bg-[#111111] border-[#292929] text-[#A7A7A7] hover:text-[#FAFAFA] hover:border-[#404040]'
                    }`}
                    title={`${opt.label} (${opt.bengaliLabel})`}
                  >
                    <IconComponent className="w-4 h-4 mb-1" />
                    <span className="text-[9px] truncate max-w-full leading-tight">{opt.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Optional Image (Upload or URL) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#FAFAFA]">
              ক্যাটাগরি ব্যানার / ছবি (ঐচ্ছিক)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {image ? (
                <div className="relative w-20 h-16 rounded-xl border border-[#292929] overflow-hidden bg-[#171717] shrink-0 group">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="ছবি মুছুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-16 rounded-xl border border-dashed border-[#292929] flex flex-col items-center justify-center text-[#A7A7A7] bg-[#171717] shrink-0">
                  <ImageIcon className="w-5 h-5 mb-0.5 text-[#555]" />
                  <span className="text-[8px]">কোনো ছবি নেই</span>
                </div>
              )}

              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={image.startsWith('data:') ? 'আপলোডকৃত ছবি সংরক্ষিত' : image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="ছবির সরাসরি ওয়েব URL (https://...)"
                  className="w-full px-3 py-2 text-xs bg-[#171717] border border-[#292929] rounded-xl text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928]"
                />

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1f1f1f] hover:bg-[#282828] text-[#FAFAFA] border border-[#292929] rounded-lg text-xs font-medium cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#FFC928]" />
                  <span>ডিভাইস থেকে ফাইল নির্বাচন করুন</span>
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

          {/* Section: Description */}
          <div>
            <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
              ক্যাটাগরির বিবরণ / ট্যাগলাইন (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="এই ক্যাটাগরিতে কী কী পণ্য পাওয়া যাবে তার সংক্ষিপ্ত বিবরণ..."
              className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-xl text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928] resize-none"
            />
          </div>

          {/* Section: Active / Inactive Status Toggle */}
          <div className="p-3.5 bg-[#171717] border border-[#292929] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#FAFAFA] block">
                ক্যাটাগরি সক্রিয় রাখুন (Active Status)
              </span>
              <span className="text-[11px] text-[#A7A7A7]">
                নিষ্ক্রিয় থাকলে স্টোরের গ্রাহক ফিল্টারে এটি দৃশ্যমান হবে না
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                isActive ? 'bg-[#16A34A]' : 'bg-[#333333]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#292929] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#A7A7A7] hover:text-[#FAFAFA] bg-[#1a1a1a] hover:bg-[#242424] rounded-xl transition-colors"
            >
              বাতিল
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2.5 text-xs font-bold text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-xl transition-all shadow-md shadow-[#FFC928]/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{categoryToEdit ? 'আপডেট করুন' : 'ক্যাটাগরি তৈরি করুন'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
