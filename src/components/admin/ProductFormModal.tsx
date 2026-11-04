import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
  Percent,
  Tag,
  Package,
  Layers,
  Check,
  AlignLeft,
  Sliders,
  DollarSign,
  Eye,
  EyeOff,
  Star,
} from 'lucide-react';
import { Product, ProductStatus, Category } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    productData: Omit<Product, 'id'>,
    imageFile?: File,
    productId?: string
  ) => Promise<{ success: boolean; error: string | null }>;
  productToEdit?: Product | null;
  categories: (string | Category)[];
  onAddCategory?: (
    categoryData: Partial<Category> | string
  ) => Promise<{ success: boolean; category?: Category; error: string | null }>;
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
  const [isDragging, setIsDragging] = useState(false);
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
      setSpecs(
        productToEdit.specs && productToEdit.specs.length > 0
          ? productToEdit.specs
          : [{ label: '', value: '' }]
      );
      setImageUrl(productToEdit.image);
      setImagePreview(productToEdit.image);
      setImageFile(undefined);
    } else {
      setName('');
      setBengaliName('');
      setPrice('');
      setSalePrice('');
      const catNames = categories
        .map((c) => (typeof c === 'string' ? c : c.name))
        .filter((c) => c !== 'All Products');
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
    setIsInlineCategoryOpen(false);
    setInlineCatName('');
    setInlineCatBengali('');
    setInlineCatError(null);
  }, [productToEdit, isOpen, categories]);

  // Real-time calculated discount percentage
  const discountInfo = useMemo(() => {
    const reg = typeof price === 'number' ? price : parseFloat(String(price));
    const sale = typeof salePrice === 'number' ? salePrice : parseFloat(String(salePrice));

    if (!isNaN(reg) && reg > 0 && !isNaN(sale) && sale > 0 && sale < reg) {
      const percent = Math.round(((reg - sale) / reg) * 100);
      const savings = reg - sale;
      return { percent, savings, valid: true };
    }
    return { percent: 0, savings: 0, valid: false };
  }, [price, salePrice]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'শুধুমাত্র ইমেজ ফরম্যাট (PNG/JPG/WEBP) আপলোড করুন' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'ছবির আকার সর্বোচ্চ ৫ মেগাবাইট হতে পারবে' }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(undefined);
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      errs.name = 'প্রোডাক্টের নাম (English) দেওয়া আবশ্যক';
    }

    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      errs.price = 'সঠিক রেগুলার মূল্য দিন (০ এর বেশি)';
    }

    if (salePrice !== '' && !isNaN(Number(salePrice))) {
      if (Number(salePrice) >= Number(price)) {
        errs.salePrice = 'ডিসকাউন্ট প্রাইস অবশ্যই রেগুলার মূল্যের চেয়ে কম হতে হবে';
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
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#141519] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/95 overflow-hidden text-left flex flex-col max-h-[90vh] my-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Refined Charcoal Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-white/[0.08] bg-[#18191f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFC928]/10 border border-[#FFC928]/25 flex items-center justify-center text-[#FFC928] shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-zinc-100">
                  {productToEdit ? 'প্রোডাক্ট তথ্য সম্পাদনা' : 'নতুন প্রোডাক্ট যুক্ত করুন'}
                </h2>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-[#FFC928]/10 text-[#FFC928] border border-[#FFC928]/20">
                  {productToEdit ? 'Edit Product' : 'New Product'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                MUAZ ELECTRONIC • স্মার্ট গ্যাজেট ক্যাটালগ ও ইনভেন্টরি ম্যানেজমেন্ট
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded-lg transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errors.general && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* SECTION 1: BASIC INFORMATION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
              <Tag className="w-3.5 h-3.5 text-[#FFC928]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                ১. প্রাথমিক তথ্য (Basic Details)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Product Name English */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  প্রোডাক্টের নাম (English) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hoco GA6 Semiconductor Mobile Cooler"
                  className={`w-full px-3 py-2 text-xs bg-[#1a1b20] border rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors ${
                    errors.name
                      ? 'border-rose-500/80 focus:border-rose-500'
                      : 'border-white/[0.08] focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928]/30'
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Product Name Bengali */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  বাংলা নাম / সাবটাইটেল <span className="text-zinc-500 font-normal">(ঐচ্ছিক)</span>
                </label>
                <input
                  type="text"
                  value={bengaliName}
                  onChange={(e) => setBengaliName(e.target.value)}
                  placeholder="যেমন: হোকো GA6 সেমিকন্ডাক্টর মোবাইল ফোন কুলার"
                  className="w-full px-3 py-2 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928]/30 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    ক্যাটাগরি <span className="text-rose-400">*</span>
                  </label>
                  {onAddCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsInlineCategoryOpen(!isInlineCategoryOpen);
                        setInlineCatError(null);
                      }}
                      className="text-[11px] font-bold text-[#FFC928] hover:text-[#ffd966] flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isInlineCategoryOpen ? 'বাতিল' : '+ নতুন ক্যাটাগরি'}</span>
                    </button>
                  )}
                </div>

                {/* Inline Category Quick Creation Box */}
                {isInlineCategoryOpen && (
                  <div className="mb-2.5 p-3 bg-[#1e2026] border border-[#FFC928]/30 rounded-lg space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#FFC928] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>কাস্টম ক্যাটাগরি যোগ করুন</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsInlineCategoryOpen(false)}
                        className="text-zinc-400 hover:text-zinc-200 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    {inlineCatError && (
                      <p className="text-[11px] text-rose-300 bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                        {inlineCatError}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={inlineCatName}
                        onChange={(e) => setInlineCatName(e.target.value)}
                        placeholder="Name (English, e.g. Smart Watches) *"
                        className="w-full px-2.5 py-1.5 text-xs bg-[#141519] border border-white/[0.08] rounded text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928]"
                      />
                      <input
                        type="text"
                        value={inlineCatBengali}
                        onChange={(e) => setInlineCatBengali(e.target.value)}
                        placeholder="বাংলা নাম (যেমন: স্মার্ট ওয়াচ)"
                        className="w-full px-2.5 py-1.5 text-xs bg-[#141519] border border-white/[0.08] rounded text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setIsInlineCategoryOpen(false)}
                        className="px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
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
                        className="px-2.5 py-1 text-[11px] font-bold text-zinc-950 bg-[#FFC928] hover:bg-[#ffd966] rounded disabled:opacity-50 transition-colors"
                      >
                        {isCreatingCategory ? 'তৈরি হচ্ছে...' : 'তৈরি ও নির্বাচন'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full px-3 py-2 text-xs bg-[#1a1b20] border rounded-lg text-zinc-100 focus:outline-none transition-colors appearance-none cursor-pointer ${
                      errors.category
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-white/[0.08] focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928]/30'
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
                        <option key={catName} value={catName} className="bg-[#141519] text-zinc-100">
                          {catName} {matchedCat?.bengaliName ? `(${matchedCat.bengaliName})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                </div>
                {errors.category && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.category}</span>
                  </p>
                )}
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  ব্র্যান্ড (Brand)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. MUAZ ELECTRONIC / Hoco / VEN-DENS"
                  className="w-full px-3 py-2 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928]/30 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PRICING, STOCK & STATUS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-[#FFC928]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  ২. মূল্য, স্টক এবং স্ট্যাটাস (Pricing & Inventory)
                </h3>
              </div>
              {discountInfo.valid && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FFC928]/15 border border-[#FFC928]/30 text-[#FFC928] text-[11px] font-semibold animate-in fade-in">
                  <Percent className="w-3 h-3" />
                  <span>
                    ৳{Number(price).toLocaleString()} → ৳{Number(salePrice).toLocaleString()} |{' '}
                    {discountInfo.percent}% OFF
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Regular Price */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  রেগুলার প্রাইস (৳ BDT) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="1500"
                    className={`w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold bg-[#1a1b20] border rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors ${
                      errors.price
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-white/[0.08] focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928]/30'
                    }`}
                  />
                </div>
                {errors.price && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.price}</span>
                  </p>
                )}
              </div>

              {/* Discount / Offer Price */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    ডিসকাউন্ট অফার প্রাইস (৳)
                  </label>
                  <span className="text-[10px] text-zinc-500">ঐচ্ছিক</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={salePrice}
                    onChange={(e) =>
                      setSalePrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="1200"
                    className={`w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold bg-[#1a1b20] border rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors ${
                      errors.salePrice
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-white/[0.08] focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928]/30'
                    }`}
                  />
                </div>
                {errors.salePrice && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.salePrice}</span>
                  </p>
                )}
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  স্টক সংখ্যা (Units) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  placeholder="20"
                  className={`w-full px-3 py-2 text-xs font-mono font-semibold bg-[#1a1b20] border rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors ${
                    errors.stock
                      ? 'border-rose-500/80 focus:border-rose-500'
                      : 'border-white/[0.08] focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928]/30'
                  }`}
                />
                {errors.stock && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.stock}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Compact Status and Featured Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="px-3.5 py-2.5 bg-[#18191f] border border-white/[0.06] rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">পাবলিশ স্ট্যাটাস</span>
                  <span className="text-[10px] text-zinc-400">
                    {status === 'published' ? 'স্টোরে সক্রিয় ও দৃশ্যমান' : 'ড্রাফট হিসেবে সংরক্ষিত'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-[#121316] p-0.5 rounded-lg border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all flex items-center gap-1 ${
                      status === 'published'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Published</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all flex items-center gap-1 ${
                      status === 'draft'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Draft</span>
                  </button>
                </div>
              </div>

              <div className="px-3.5 py-2.5 bg-[#18191f] border border-white/[0.06] rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFeatured ? 'text-[#FFC928] fill-[#FFC928]' : 'text-zinc-500'
                      }`}
                    />
                    <span>ফিচার্ড প্রোডাক্ট</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">হোমপেজের বিশেষ তালিকায় হাইলাইট</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FFC928]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 3: MEDIA & PHOTOGRAPHY */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-[#FFC928]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  ৩. প্রোডাক্ট ছবি (Product Photography) <span className="text-rose-400">*</span>
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500">ড্র্যাগ অ্যান্ড ড্রপ বা সরাসরি আপলোড</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
              {/* Dropzone & URL input */}
              <div className="sm:col-span-8 space-y-2">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all bg-[#1a1b20] ${
                    isDragging
                      ? 'border-[#FFC928] bg-[#FFC928]/5'
                      : 'border-white/[0.12] hover:border-[#FFC928]/60 hover:bg-[#1e2026]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-[#FFC928] mx-auto mb-1.5 opacity-90" />
                  <p className="text-xs font-medium text-zinc-200">
                    কম্পিউটার থেকে ছবি ড্র্যাগ অ্যান্ড ড্রপ করুন অথবা ক্লিক করুন
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    PNG, JPG, WEBP ফরম্যাট (সর্বোচ্চ সাইজ: 5MB)
                  </p>
                </div>

                <div className="relative">
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
                    placeholder="অথবা সরাসরি ওয়েব ইমেজ লিংক পেস্ট করুন (https://...)"
                    className="w-full px-3 py-1.5 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928] transition-colors"
                  />
                </div>
                {errors.image && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.image}</span>
                  </p>
                )}
              </div>

              {/* Preview Window */}
              <div className="sm:col-span-4 flex flex-col items-center">
                <div className="w-full aspect-[4/3] bg-[#121316] border border-white/[0.08] rounded-lg overflow-hidden flex items-center justify-center relative group shadow-inner">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-sm text-[#FFC928] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#FFC928]/30 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        <span>Main Photo</span>
                      </div>
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2 py-1 bg-white/[0.15] hover:bg-white/[0.25] text-white text-[10px] font-semibold rounded backdrop-blur-sm transition-colors"
                        >
                          পরিবর্তন
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded border border-rose-500/30 transition-colors"
                          title="মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-3">
                      <ImageIcon className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
                      <span className="text-[10px] text-zinc-500 block">কোনো ছবি নেই</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: DESCRIPTION & SPECS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <AlignLeft className="w-3.5 h-3.5 text-[#FFC928]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  ৪. বিবরণ ও স্পেসিফিকেশন (Description & Specs)
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500">পণ্যের বিস্তারিত বিবরণ</span>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                বিস্তারিত পণ্যের বিবরণ (Description)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="প্রোডাক্টের বৈশিষ্ট্য ও কার্যকারিতার সংক্ষিপ্ত বিবরণ..."
                className="w-full px-3 py-2 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928]/30 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Bullet Highlights / Features */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  প্রধান আকর্ষণসমূহ (Key Features / Highlights)
                </label>
                <button
                  type="button"
                  onClick={addFeatureRow}
                  className="text-[11px] font-bold text-[#FFC928] hover:text-[#ffd966] flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>ফিচার যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-500 w-5 text-center">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      placeholder={`যেমন: ${
                        idx === 0
                          ? 'সেমিকন্ডাক্টর ইনস্ট্যান্ট কুলিং টেকনোলজি'
                          : idx === 1
                            ? 'RGB ডায়নামিক লাইটিং ও আল্ট্রা-সাইলেন্ট ফ্যান'
                            : 'টাইপ-সি ফাস্ট কানেক্টিভিটি'
                      }`}
                      className="flex-1 px-3 py-1.5 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#FFC928] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeatureRow(idx)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specifications */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  টেকনিক্যাল স্পেসিফিকেশন (Technical Specs)
                </label>
                <button
                  type="button"
                  onClick={addSpecRow}
                  className="text-[11px] font-bold text-[#FFC928] hover:text-[#ffd966] flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>স্পেক যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {specs.map((spec, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={spec.label}
                      onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                      placeholder="লেবেল (যেমন: ব্যাটারি)"
                      className="col-span-5 px-3 py-1.5 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#FFC928]"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      placeholder="মান (যেমন: 20,000 mAh)"
                      className="col-span-6 px-3 py-1.5 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#FFC928]"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecRow(idx)}
                      className="col-span-1 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors flex items-center justify-center"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Sticky Refined Charcoal Footer */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-white/[0.08] bg-[#18191f] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC928]"></span>
            <span>
              <span className="text-rose-400 font-semibold">*</span> চিহ্নিত ফিল্ড আবশ্যক
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] rounded-lg transition-colors disabled:opacity-50"
            >
              বাতিল
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
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
                  <span>{productToEdit ? 'পরিবর্তন সংরক্ষণ করুন' : 'প্রোডাক্ট সংরক্ষণ করুন'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
