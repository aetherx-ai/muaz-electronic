import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Plus, Trash2, Image as ImageIcon, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Product, ProductStatus, Category } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'>, imageFile?: File, productId?: string) => Promise<{ success: boolean; error: string | null }>;
  productToEdit?: Product | null;
  categories: (string | Category)[];
  onAddCategory?: (categoryData: Partial<Category> | string) => Promise<{ success: boolean; category?: Category; error: string | null }>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
  onAddCategory,
}) => {
  const [name, setName] = useState('');
  const [bengaliName, setBengaliName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('MUAZ ELECTRONIC');
  const [stock, setStock] = useState<number | ''>(10);
  const [status, setStatus] = useState<ProductStatus>('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([
    { label: '', value: '' },
  ]);

  // Image handling
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation & Loading
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline category creation state
  const [isInlineCategoryOpen, setIsInlineCategoryOpen] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');
  const [inlineCatBengali, setInlineCatBengali] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [inlineCatError, setInlineCatError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setBengaliName(productToEdit.bengaliName || '');
      setPrice(productToEdit.price);
      setSalePrice(productToEdit.salePrice || '');
      setCategory(productToEdit.category);
      setBrand(productToEdit.brand || 'MUAZ ELECTRONIC');
      setStock(productToEdit.stock);
      setStatus(productToEdit.status);
      setIsFeatured(Boolean(productToEdit.isFeatured));
      setDescription(productToEdit.description || '');
      setFeatures(productToEdit.features.length > 0 ? productToEdit.features : ['']);
      setSpecs(productToEdit.specs && productToEdit.specs.length > 0 ? productToEdit.specs : [{ label: '', value: '' }]);
      setImageUrl(productToEdit.image);
      setImagePreview(productToEdit.image);
      setImageFile(undefined);
    } else {
      // Defaults for new product
      setName('');
      setBengaliName('');
      setPrice('');
      setSalePrice('');
      const catNames = categories.map((c) => (typeof c === 'string' ? c : c.name)).filter((c) => c !== 'All Products');
      const firstAvailableCat = catNames[0] || '';
      setCategory(firstAvailableCat);
      setBrand('MUAZ ELECTRONIC');
      setStock(20);
      setStatus('published');
      setIsFeatured(false);
      setDescription('');
      setFeatures(['']);
      setSpecs([{ label: '', value: '' }]);
      setImageUrl('');
      setImagePreview('');
      setImageFile(undefined);
    }
    setErrors({});
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageUrl(''); // Clear manual URL if file selected
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...features];
    updated[index] = val;
    setFeatures(updated);
  };

  const addFeatureRow = () => {
    setFeatures([...features, '']);
  };

  const removeFeatureRow = (index: number) => {
    if (features.length <= 1) {
      setFeatures(['']);
    } else {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const addSpecRow = () => {
    setSpecs([...specs, { label: '', value: '' }]);
  };

  const removeSpecRow = (index: number) => {
    if (specs.length <= 1) {
      setSpecs([{ label: '', value: '' }]);
    } else {
      setSpecs(specs.filter((_, i) => i !== index));
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!name.trim()) {
      errs.name = 'প্রোডাক্টের নাম (ইংরেজিতে) দেওয়া আবশ্যক';
    }

    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      errs.price = 'সঠিক রেগুলার মূল্য প্রদান করুন (০ এর বেশি হতে হবে)';
    }

    if (salePrice !== '' && !isNaN(Number(salePrice))) {
      if (Number(salePrice) >= Number(price)) {
        errs.salePrice = 'সেল প্রাইস অবশ্যই রেগুলার মূল্যের চেয়ে কম হতে হবে';
      }
    }

    if (!category.trim()) {
      errs.category = 'ক্যাটাগরি নির্বাচন করা আবশ্যক';
    }

    if (stock === '' || isNaN(Number(stock)) || Number(stock) < 0) {
      errs.stock = 'সঠিক স্টক সংখ্যা দিন (০ বা তার বেশি)';
    }

    if (!imagePreview && !imageUrl.trim() && !imageFile) {
      errs.image = 'প্রোডাক্টের ছবি আপলোড করুন অথবা ইমেজ লিংক দিন';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const cleanFeatures = features.map((f) => f.trim()).filter(Boolean);
    const cleanSpecs = specs.filter((s) => s.label.trim() && s.value.trim());

    const productPayload: Omit<Product, 'id'> = {
      name: name.trim(),
      bengaliName: bengaliName.trim() || undefined,
      price: Number(price),
      salePrice: salePrice !== '' ? Number(salePrice) : undefined,
      category: category.trim(),
      brand: brand.trim() || 'MUAZ ELECTRONIC',
      stock: Number(stock),
      status,
      isFeatured,
      image: imagePreview || imageUrl.trim(),
      description: description.trim(),
      features: cleanFeatures,
      specs: cleanSpecs,
    };

    const res = await onSave(productPayload, imageFile, productToEdit?.id);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrors((prev) => ({ ...prev, general: res.error || 'সংরক্ষণ ব্যর্থ হয়েছে' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-2xl my-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#292929] flex items-center justify-between bg-[#0a0a0a]">
          <div>
            <h2 className="text-xl font-bold text-[#FAFAFA]">
              {productToEdit ? 'প্রোডাক্ট এডিট করুন' : 'নতুন প্রোডাক্ট যুক্ত করুন'}
            </h2>
            <p className="text-xs text-[#A7A7A7] mt-0.5">
              মুয়াজ ইলেকট্রনিক্স শপের ইনভেন্টরিতে সরাসরি প্রোডাক্ট যোগ ও পরিচালনা
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#A7A7A7] hover:text-[#FAFAFA] hover:bg-[#171717] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {errors.general && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC928] border-b border-[#292929] pb-2">
              ১. প্রাথমিক তথ্য (Basic Details)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                  প্রোডাক্টের নাম (English) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hoco GA6 Semiconductor Cooler"
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#171717] border rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none transition-colors ${
                    errors.name ? 'border-rose-500' : 'border-[#292929] focus:border-[#FFC928]'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                  বাংলা নাম / সাবটাইটেল (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={bengaliName}
                  onChange={(e) => setBengaliName(e.target.value)}
                  placeholder="যেমন: হোচো জিএ৬ মোবাইল ফোন কুলার"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#FAFAFA]">
                    ক্যাটাগরি *
                  </label>
                  {onAddCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsInlineCategoryOpen(!isInlineCategoryOpen);
                        setInlineCatError(null);
                      }}
                      className="text-[11px] font-bold text-[#FFC928] hover:text-[#F7D77B] flex items-center gap-1 transition-colors"
                      title="নতুন ক্যাটাগরি তৈরি করুন"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isInlineCategoryOpen ? 'বাতিল' : '+ নতুন ক্যাটাগরি যোগ করুন'}</span>
                    </button>
                  )}
                </div>

                {/* Inline Category Quick Creation Box */}
                {isInlineCategoryOpen && (
                  <div className="mb-3 p-3 bg-[#171717] border border-[#FFC928]/40 rounded-xl space-y-2.5 animate-in fade-in duration-150 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FFC928] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>কাস্টম ক্যাটাগরি তৈরি ও নির্বাচন</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsInlineCategoryOpen(false)}
                        className="text-gray-400 hover:text-white text-xs p-1"
                        aria-label="বন্ধ করুন"
                      >
                        ✕
                      </button>
                    </div>

                    {inlineCatError && (
                      <p className="text-[11px] text-rose-400 bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/30">
                        {inlineCatError}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={inlineCatName}
                        onChange={(e) => setInlineCatName(e.target.value)}
                        placeholder="ক্যাটাগরির নাম (English, e.g. Smart Watches) *"
                        className="w-full px-3 py-2 text-xs bg-[#111111] border border-[#292929] rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928]"
                      />
                      <input
                        type="text"
                        value={inlineCatBengali}
                        onChange={(e) => setInlineCatBengali(e.target.value)}
                        placeholder="বাংলা নাম (যেমন: স্মার্ট ওয়াচ ও ব্যান্ড)"
                        className="w-full px-3 py-2 text-xs bg-[#111111] border border-[#292929] rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsInlineCategoryOpen(false)}
                        className="px-2.5 py-1 text-xs text-gray-400 hover:text-white"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!inlineCatName.trim()) {
                            setInlineCatError('ক্যাটাগরির নাম দিন');
                            return;
                          }
                          if (!onAddCategory) return;
                          setIsCreatingCategory(true);
                          setInlineCatError(null);
                          const res = await onAddCategory({
                            name: inlineCatName.trim(),
                            bengaliName: inlineCatBengali.trim() || undefined,
                            icon: 'Layers',
                            isActive: true,
                          });
                          setIsCreatingCategory(false);
                          if (res.success && res.category) {
                            setCategory(res.category.name);
                            setInlineCatName('');
                            setInlineCatBengali('');
                            setIsInlineCategoryOpen(false);
                          } else {
                            setInlineCatError(res.error || 'ক্যাটাগরি তৈরি ব্যর্থ হয়েছে');
                          }
                        }}
                        disabled={isCreatingCategory || !inlineCatName.trim()}
                        className="px-3 py-1.5 text-xs font-bold text-black bg-[#FFC928] hover:bg-[#F7D77B] rounded-lg disabled:opacity-50 transition-all flex items-center gap-1 shadow-sm"
                      >
                        {isCreatingCategory ? 'তৈরি হচ্ছে...' : 'তৈরি ও নির্বাচন করুন'}
                      </button>
                    </div>
                  </div>
                )}

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#171717] border rounded-lg text-[#FAFAFA] focus:outline-none transition-colors ${
                    errors.category ? 'border-rose-500' : 'border-[#292929] focus:border-[#FFC928]'
                  }`}
                >
                  {Array.from(
                    new Set([
                      ...categories
                        .map((c) => (typeof c === 'string' ? c : c.name))
                        .filter((c) => c !== 'All Products'),
                      ...(category ? [category] : []),
                    ])
                  ).map((catName) => {
                    const matchedCat = categories.find(
                      (c) => typeof c !== 'string' && c.name === catName
                    ) as Category | undefined;
                    return (
                      <option key={catName} value={catName}>
                        {catName} {matchedCat?.bengaliName ? `(${matchedCat.bengaliName})` : ''}
                      </option>
                    );
                  })}
                </select>
                {errors.category && <p className="text-[11px] text-rose-400 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                  ব্র্যান্ড (Brand)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. MUAZ ELECTRONIC / Hoco / VEN-DENS"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing, Stock, and Visibility */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC928] border-b border-[#292929] pb-2">
              ২. মূল্য, স্টক এবং স্ট্যাটাস (Price, Stock & Status)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                  রেগুলার প্রাইস (৳ BDT) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="যেমন: 1150"
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#171717] border rounded-lg text-[#FAFAFA] font-mono focus:outline-none transition-colors ${
                    errors.price ? 'border-rose-500' : 'border-[#292929] focus:border-[#FFC928]'
                  }`}
                />
                {errors.price && <p className="text-[11px] text-rose-400 mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                  ডিসকাউন্ট / অফার প্রাইস (৳ ঐচ্ছিক)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="রেগুলার মূল্যের চেয়ে কম"
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#171717] border rounded-lg text-[#FAFAFA] font-mono focus:outline-none transition-colors ${
                    errors.salePrice ? 'border-rose-500' : 'border-[#292929] focus:border-[#FFC928]'
                  }`}
                />
                {errors.salePrice && <p className="text-[11px] text-rose-400 mt-1">{errors.salePrice}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                  মজুদ স্টক সংখ্যা (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="যেমন: 133"
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#171717] border rounded-lg text-[#FAFAFA] font-mono focus:outline-none transition-colors ${
                    errors.stock ? 'border-rose-500' : 'border-[#292929] focus:border-[#FFC928]'
                  }`}
                />
                {errors.stock && <p className="text-[11px] text-rose-400 mt-1">{errors.stock}</p>}
              </div>
            </div>

            {/* Status and Featured toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3 bg-[#171717] border border-[#292929] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#FAFAFA] block">পাবলিশ স্ট্যাটাস</span>
                  <span className="text-[11px] text-[#A7A7A7]">
                    {status === 'published' ? 'স্টোরে প্রদর্শিত হবে' : 'ড্রাফট হিসেবে সংরক্ষিত থাকবে'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-[#070707] p-1 rounded-lg border border-[#292929]">
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      status === 'published'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-[#A7A7A7] hover:text-[#FAFAFA]'
                    }`}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      status === 'draft'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-[#A7A7A7] hover:text-[#FAFAFA]'
                    }`}
                  >
                    Draft
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#171717] border border-[#292929] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#FAFAFA] block">ফিচার্ড প্রোডাক্ট</span>
                  <span className="text-[11px] text-[#A7A7A7]">হোমপেজ ও বিশেষ তালিকায় হাইলাইট হবে</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#292929] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC928]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Product Imagery */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC928] border-b border-[#292929] pb-2">
              ৩. প্রোডাক্ট ছবি (Product Photography) *
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Upload Dropzone */}
              <div className="md:col-span-8 space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#292929] hover:border-[#FFC928]/60 bg-[#171717]/60 hover:bg-[#171717] rounded-xl p-6 text-center cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-[#FFC928] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#FAFAFA]">
                    ক্লিক করে কম্পিউটার বা ডিভাইস থেকে ছবি নির্বাচন করুন
                  </p>
                  <p className="text-[11px] text-[#A7A7A7] mt-1">
                    PNG, JPG, WEBP ফরম্যাট সমর্থিত (সর্বোচ্চ 5MB)
                  </p>
                </div>

                <div className="relative">
                  <span className="text-[11px] text-[#A7A7A7] block mb-1">
                    অথবা সরাসরি ছবির URL পেস্ট করুন:
                  </span>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      if (e.target.value.trim()) {
                        setImagePreview(e.target.value.trim());
                        setImageFile(undefined);
                      }
                    }}
                    placeholder="https://... অথবা /src/assets/..."
                    className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/40 focus:outline-none focus:border-[#FFC928]"
                  />
                </div>
                {errors.image && <p className="text-[11px] text-rose-400">{errors.image}</p>}
              </div>

              {/* Preview Window */}
              <div className="md:col-span-4 flex flex-col items-center">
                <span className="text-xs font-semibold text-[#A7A7A7] mb-2">প্রিভিউ:</span>
                <div className="w-full aspect-[4/3] bg-[#0a0a0a] border border-[#292929] rounded-xl overflow-hidden flex items-center justify-center relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-[#292929] mx-auto mb-1" />
                      <span className="text-[10px] text-[#A7A7A7]">ছবি লোড হয়নি</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Description, Features & Specs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC928] border-b border-[#292929] pb-2">
              ৪. বর্ণনা ও স্পেসিফিকেশন (Description & Specs)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#FAFAFA] mb-1.5">
                বিস্তারিত বর্ণনা (Description)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="প্রোডাক্টের কার্যকারিতা ও বিস্তারিত বিবরণ..."
                className="w-full px-3.5 py-2 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928]"
              />
            </div>

            {/* Bullet features */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#FAFAFA]">
                  মূল ফিচারসমূহ (Bullet Points)
                </label>
                <button
                  type="button"
                  onClick={addFeatureRow}
                  className="text-xs font-semibold text-[#FFC928] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ফিচার যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-2">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      placeholder={`ফিচার #${idx + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFC928]"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeatureRow(idx)}
                      className="p-1.5 text-[#A7A7A7] hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs key-value */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#FAFAFA]">
                  প্রযুক্তিগত স্পেসিফিকেশন (Technical Specs)
                </label>
                <button
                  type="button"
                  onClick={addSpecRow}
                  className="text-xs font-semibold text-[#FFC928] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>স্পেক যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-2">
                {specs.map((spec, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={spec.label}
                      onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                      placeholder="লেবেল (যেমন: ব্যাটারি)"
                      className="col-span-5 px-3 py-1.5 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFC928]"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      placeholder="মান (যেমন: 20000mAh)"
                      className="col-span-6 px-3 py-1.5 text-xs bg-[#171717] border border-[#292929] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFC928]"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecRow(idx)}
                      className="col-span-1 p-1.5 text-[#A7A7A7] hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-6 border-t border-[#292929] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-[#A7A7A7] hover:text-[#FAFAFA] bg-[#171717] hover:bg-[#202020] border border-[#292929] rounded-lg transition-colors"
            >
              বাতিল
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-lg transition-colors shadow-lg shadow-[#FFC928]/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{productToEdit ? 'পরিবর্তন সংরক্ষণ করুন' : 'প্রোডাক্ট যোগ করুন'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
