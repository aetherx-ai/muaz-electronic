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
  CheckCircle2,
  Globe,
  Boxes,
  ChevronDown,
  ChevronUp,
  Link2,
  RefreshCw,
  Info,
  ExternalLink,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  Code,
  LayoutDashboard,
  ShoppingBag,
  Users,
  TicketPercent,
  BarChart3,
  Settings,
  Store,
  Menu,
  ChevronRight,
  ShieldCheck,
  Heart,
  Share2,
  ShoppingCart,
  MoveLeft,
  MoveRight,
  Barcode,
  Layers3,
  Copy,
} from 'lucide-react';
import { Product, ProductStatus, Category } from '../../types';
import { AdminTab } from './AdminSidebar';

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
  onNavigateTab?: (tab: AdminTab) => void;
  onBackToStore?: () => void;
}

const BRAND_SUGGESTIONS = [
  'MUAZ ELECTRONIC',
  'HOCO',
  'VEN-DENS',
  'REMAX',
  'BASEUS',
  'APPLE',
  'SAMSUNG',
  'ANKER',
];

const DEFAULT_TAG_OPTIONS = [
  'Smart Gadget',
  'Gaming',
  'Audio & Sound',
  'Fast Charge',
  'Wireless',
  'Best Seller',
  'New Arrival',
  'Premium Edition',
];

interface ProductVariantItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
  onAddCategory,
  onNavigateTab,
  onBackToStore,
}) => {
  // Main form states
  const [name, setName] = useState('');
  const [bengaliName, setBengaliName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('MUAZ ELECTRONIC');
  const [stock, setStock] = useState<number | ''>(20);
  const [status, setStatus] = useState<ProductStatus>('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [continueSellingWhenOutOfStock, setContinueSellingWhenOutOfStock] = useState(false);
  const [tags, setTags] = useState<string[]>(['Smart Gadget', 'Best Seller']);
  const [newTagInput, setNewTagInput] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([
    { label: '', value: '' },
  ]);

  // Product Variants (Shopify Style)
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptionName, setVariantOptionName] = useState('Color');
  const [variantValuesInput, setVariantValuesInput] = useState('Matte Black, Glacier Silver');
  const [variantsList, setVariantsList] = useState<ProductVariantItem[]>([
    { id: '1', name: 'Matte Black', sku: 'ME-COL-BLK', price: 1500, stock: 12 },
    { id: '2', name: 'Glacier Silver', sku: 'ME-COL-SLV', price: 1500, stock: 8 },
  ]);

  // Mobile sidebar drawer
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Preview toggle in right column
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  // Collapsible advanced specs
  const [showAdvancedSpecs, setShowAdvancedSpecs] = useState(false);

  // Gallery Images & Upload Manager
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Validation & Loading
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline category drawer state
  const [isInlineCategoryOpen, setIsInlineCategoryOpen] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');
  const [inlineCatBengali, setInlineCatBengali] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [inlineCatError, setInlineCatError] = useState<string | null>(null);

  // Synchronize state when opening modal or editing product
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setBengaliName(productToEdit.bengaliName || '');
      setPrice(productToEdit.price || '');
      const existingCat = productToEdit.category || '';
      const matchedCat = categories.find(
        (c) =>
          typeof c !== 'string' &&
          (c.name.trim().toLowerCase() === existingCat.trim().toLowerCase() ||
            c.id === existingCat ||
            c.slug === existingCat ||
            (c.bengaliName && c.bengaliName.trim().toLowerCase() === existingCat.trim().toLowerCase()))
      ) as Category | undefined;
      setCategory(matchedCat ? matchedCat.name : existingCat);
      setBrand(productToEdit.brand || 'MUAZ ELECTRONIC');
      setStock(typeof productToEdit.stock === 'number' ? productToEdit.stock : 20);
      setStatus(productToEdit.status || 'published');
      setIsFeatured(Boolean(productToEdit.isFeatured));
      setDescription(productToEdit.description || '');
      setSku(`ME-${(productToEdit.category || 'PROD').slice(0, 3).toUpperCase()}-${productToEdit.id.slice(0, 6).toUpperCase()}`);
      setBarcode(`890${Math.floor(100000000 + Math.random() * 900000000)}`);

      // Initialize gallery with product image
      if (productToEdit.image) {
        setGalleryImages([productToEdit.image]);
        setPrimaryImageIndex(0);
      } else {
        setGalleryImages([]);
        setPrimaryImageIndex(0);
      }
      setImageFiles([]);
      setUploadProgress(null);

      setFeatures(
        productToEdit.features && productToEdit.features.length > 0
          ? productToEdit.features
          : ['']
      );
      setSpecs(
        productToEdit.specs && productToEdit.specs.length > 0
          ? productToEdit.specs
          : [{ label: '', value: '' }]
      );

      // Check if specs contain variant information
      const variantSpec = productToEdit.specs?.find((s) => s.label.toLowerCase().includes('color') || s.label.toLowerCase().includes('variant'));
      if (variantSpec) {
        setHasVariants(true);
        setVariantOptionName(variantSpec.label);
        setVariantValuesInput(variantSpec.value);
        const parsed = variantSpec.value.split(',').map((v, i) => ({
          id: String(i + 1),
          name: v.trim(),
          sku: `ME-${v.slice(0, 3).toUpperCase()}-${i + 1}`,
          price: productToEdit.price || 0,
          stock: Math.floor((productToEdit.stock || 20) / 2),
        }));
        setVariantsList(parsed.length > 0 ? parsed : variantsList);
      } else {
        setHasVariants(false);
      }

      if (
        (productToEdit.features && productToEdit.features.length > 0 && productToEdit.features[0]) ||
        (productToEdit.specs && productToEdit.specs.length > 0 && productToEdit.specs[0].label)
      ) {
        setShowAdvancedSpecs(true);
      }
    } else {
      setName('');
      setBengaliName('');
      setPrice('');
      setSalePrice('');
      setCostPrice('');
      const catNames = categories
        .map((c) => (typeof c === 'string' ? c : c.name))
        .filter((c) => c && c !== 'All Products' && c !== 'All');
      const firstAvailableCat = catNames[0] || '';
      setCategory(firstAvailableCat);
      setBrand('MUAZ ELECTRONIC');
      setStock(20);
      setStatus('published');
      setIsFeatured(false);
      setDescription('');
      setSku(`ME-${(firstAvailableCat || 'PRD').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode(`890${Math.floor(100000000 + Math.random() * 900000000)}`);
      setTags(['Smart Gadget', 'Best Seller']);
      setFeatures(['']);
      setSpecs([{ label: '', value: '' }]);
      setGalleryImages([]);
      setPrimaryImageIndex(0);
      setImageFiles([]);
      setUploadProgress(null);
      setShowAdvancedSpecs(false);
      setHasVariants(false);
    }
    setErrors({});
    setIsInlineCategoryOpen(false);
    setInlineCatName('');
    setInlineCatBengali('');
    setInlineCatError(null);
    setIsMobileSidebarOpen(false);
  }, [productToEdit, isOpen, categories]);

  // Real-time calculated discount percentage & savings
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

  // Profit Margin calculation
  const profitMargin = useMemo(() => {
    const reg = typeof salePrice === 'number' && salePrice > 0 ? salePrice : (typeof price === 'number' ? price : 0);
    const cost = typeof costPrice === 'number' ? costPrice : 0;
    if (reg > 0 && cost > 0 && reg > cost) {
      const profit = reg - cost;
      const margin = Math.round((profit / reg) * 100);
      return { profit, margin, valid: true };
    }
    return { profit: 0, margin: 0, valid: false };
  }, [price, salePrice, costPrice]);

  // Active Hero image
  const activeHeroImage = useMemo(() => {
    if (galleryImages.length > 0 && galleryImages[primaryImageIndex]) {
      return galleryImages[primaryImageIndex];
    }
    return galleryImages[0] || '';
  }, [galleryImages, primaryImageIndex]);

  // SEO Slug preview
  const seoSlug = useMemo(() => {
    if (!name.trim()) return 'new-product-slug';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, [name]);

  // Stock status descriptor
  const stockStatus = useMemo(() => {
    const s = typeof stock === 'number' ? stock : 0;
    if (s <= 0) {
      return {
        label: 'Out of Stock',
        badge: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
        desc: 'Product will display as Sold Out on live storefront',
      };
    }
    if (s <= 5) {
      return {
        label: 'Low Stock Alert',
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500 animate-pulse',
        desc: 'Fewer than 5 units left in warehouse inventory',
      };
    }
    return {
      label: 'In Stock & Ready',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500 shadow-xs',
      desc: 'Available for immediate storefront ordering',
    };
  }, [stock]);

  // Completion validator for footer guidance
  const formProgress = useMemo(() => {
    const missing: string[] = [];
    if (!name.trim()) missing.push('Product Title');
    if (price === '' || Number(price) <= 0) missing.push('Regular Price');
    if (!category.trim()) missing.push('Category');
    if (stock === '' || Number(stock) < 0) missing.push('Stock Quantity');
    if (galleryImages.length === 0) missing.push('Product Image');

    return {
      isComplete: missing.length === 0,
      missing,
    };
  }, [name, price, category, stock, galleryImages]);

  if (!isOpen) return null;

  // Process files dropped or picked
  const processFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        if (file.size <= 5 * 1024 * 1024) {
          validFiles.push(file);
        }
      }
    });

    if (validFiles.length === 0) {
      setErrors((prev) => ({ ...prev, image: 'Please select valid image files (PNG, JPG, WEBP under 5MB)' }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    setUploadProgress(35);
    setImageFiles((prev) => [...prev, ...validFiles]);

    let readCount = 0;
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        readCount++;
        validPreviews.push(reader.result as string);
        if (readCount === validFiles.length) {
          setGalleryImages((prev) => [...prev, ...validPreviews]);
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(null), 400);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleAddUrlImage = () => {
    if (urlInput.trim()) {
      setGalleryImages((prev) => [...prev, urlInput.trim()]);
      setUrlInput('');
      setErrors((prev) => {
        const next = { ...prev };
        delete next.image;
        return next;
      });
    }
  };

  const handleRemoveImageAt = (index: number) => {
    setGalleryImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (primaryImageIndex >= updated.length) {
        setPrimaryImageIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    setPrimaryImageIndex(index);
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= galleryImages.length) return;
    const updated = [...galleryImages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setGalleryImages(updated);

    if (primaryImageIndex === fromIndex) {
      setPrimaryImageIndex(toIndex);
    } else if (primaryImageIndex === toIndex) {
      setPrimaryImageIndex(fromIndex);
    }
  };

  // Rich-text formatting helper
  const handleInsertFormat = (tagPrefix: string, tagSuffix: string = '') => {
    const textarea = descTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    const replacement = `${tagPrefix}${selectedText || 'text'}${tagSuffix}`;

    const newDesc = description.substring(0, start) + replacement + description.substring(end);
    setDescription(newDesc);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagPrefix.length, start + tagPrefix.length + (selectedText.length || 4));
    }, 10);
  };

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
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

  // Generate variants from input
  const handleUpdateVariantsFromInput = () => {
    const values = variantValuesInput
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) return;

    const newVariants: ProductVariantItem[] = values.map((val, idx) => ({
      id: String(idx + 1),
      name: val,
      sku: `${sku || 'ME-VAR'}-${val.slice(0, 3).toUpperCase()}`,
      price: typeof price === 'number' ? price : 0,
      stock: Math.max(1, Math.floor((typeof stock === 'number' ? stock : 20) / values.length)),
    }));
    setVariantsList(newVariants);
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!name.trim()) {
      errs.name = 'Product Title is required';
    }

    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      errs.price = 'Enter a valid regular price greater than 0';
    }

    if (salePrice !== '' && !isNaN(Number(salePrice))) {
      if (Number(salePrice) >= Number(price)) {
        errs.salePrice = 'Discount price must be lower than regular price';
      }
    }

    if (!category.trim()) {
      errs.category = 'Please assign a category to this product';
    }

    if (stock === '' || isNaN(Number(stock)) || Number(stock) < 0) {
      errs.stock = 'Specify inventory stock quantity (0 or greater)';
    }

    if (galleryImages.length === 0) {
      errs.image = 'At least one product photo is required for live catalog';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveWithStatus = async (targetStatus?: ProductStatus) => {
    if (!validate()) return;

    setIsSubmitting(true);

    const cleanFeatures = features.map((f) => f.trim()).filter(Boolean);
    const cleanSpecs = specs.filter((s) => s.label.trim() && s.value.trim());

    // If variants enabled, ensure variant specs are recorded
    if (hasVariants && variantsList.length > 0) {
      cleanSpecs.push({
        label: variantOptionName,
        value: variantsList.map((v) => `${v.name} (৳${v.price})`).join(', '),
      });
    }

    const matchedCategory = categories.find(
      (c) =>
        typeof c !== 'string' &&
        (c.name.trim().toLowerCase() === category.trim().toLowerCase() ||
          c.id === category ||
          c.slug === category ||
          (c.bengaliName && c.bengaliName.trim().toLowerCase() === category.trim().toLowerCase()))
    ) as Category | undefined;

    const finalCategoryName = (matchedCategory && typeof matchedCategory !== 'string')
      ? matchedCategory.name
      : category.trim();

    const primaryImg = activeHeroImage;
    const primaryFile = imageFiles[primaryImageIndex] || imageFiles[0];

    const productPayload: Omit<Product, 'id'> = {
      name: name.trim(),
      bengaliName: bengaliName.trim() || undefined,
      price: Number(price),
      salePrice: salePrice !== '' ? Number(salePrice) : undefined,
      category: finalCategoryName,
      brand: brand.trim() || 'MUAZ ELECTRONIC',
      stock: Number(stock),
      status: targetStatus || status,
      isFeatured,
      image: primaryImg,
      description: description.trim(),
      features: cleanFeatures,
      specs: cleanSpecs,
    };

    const res = await onSave(productPayload, primaryFile, productToEdit?.id);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrors((prev) => ({ ...prev, general: res.error || 'Failed to save product' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveWithStatus(status);
  };

  // Nav list for left sidebar
  const sidebarNavItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'discounts', label: 'Discounts', icon: TicketPercent },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-150">
      {/* =================================================================== */}
      {/* 1. LEFT SIDEBAR — Deep Charcoal Professional Admin Navigation */}
      {/* =================================================================== */}
      <aside className="w-64 shrink-0 bg-[#0B0F19] text-slate-300 border-r border-slate-800/80 flex flex-col justify-between hidden lg:flex select-none">
        <div>
          {/* Brand Logo & Header */}
          <div className="p-5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#F3CE65] to-[#C5A059] flex items-center justify-center text-slate-950 font-bold shadow-md shadow-[#D4AF37]/20 shrink-0">
                <Package className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4AF37] block font-display">
                  MUAZ COMMERCE
                </span>
                <span className="text-xs text-slate-400 font-medium truncate block">
                  Product Studio
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Commerce Navigation
            </div>
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === 'products';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) {
                      onNavigateTab(item.id);
                    } else if (item.id !== 'products') {
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#C5A059]/15 text-[#E5C378] font-bold border-r-2 border-[#D4AF37] shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="text-[10px] bg-[#D4AF37]/20 text-[#F3CE65] px-1.5 py-0.5 rounded font-mono font-semibold">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Storefront Link */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          {onBackToStore && (
            <button
              type="button"
              onClick={onBackToStore}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
            >
              <Store className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>View Storefront</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          )}
          <div className="flex items-center gap-2.5 px-2 py-1 text-slate-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>MUAZ Online Store • v2.4</span>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div
            className="w-72 bg-[#0B0F19] h-full p-4 flex flex-col justify-between text-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center text-slate-950 font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white font-display">MUAZ COMMERCE</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="py-4 space-y-1">
                {sidebarNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === 'products';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setIsMobileSidebarOpen(false);
                        if (onNavigateTab) {
                          onNavigateTab(item.id);
                        } else if (item.id !== 'products') {
                          onClose();
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                        isActive
                          ? 'bg-[#C5A059]/20 text-[#E5C378] font-bold border-l-2 border-[#D4AF37]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {onBackToStore && (
              <button
                type="button"
                onClick={onBackToStore}
                className="w-full py-2.5 text-xs text-center text-slate-300 bg-slate-800 rounded-lg"
              >
                View Live Storefront
              </button>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. MAIN CONTENT AREA — Clean White / Soft Ivory Commercial Canvas */}
      {/* =================================================================== */}
      <main className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/90 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="hover:text-slate-900 transition-colors"
                >
                  Products
                </button>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-slate-800 font-semibold truncate">
                  {productToEdit ? 'Edit Product' : 'Add New Product'}
                </span>
              </div>

              {/* Page Title */}
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-display flex items-center gap-2.5 truncate">
                <span>{productToEdit ? 'Edit Product' : 'Create Product'}</span>
                {productToEdit && (
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    ID: {productToEdit.id.slice(0, 8)}
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg transition-all"
            >
              Discard
            </button>

            {/* Save as Draft Button */}
            <button
              type="button"
              onClick={() => handleSaveWithStatus('draft')}
              disabled={isSubmitting}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-lg transition-all disabled:opacity-50"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Save as Draft</span>
            </button>

            {/* Toggle Preview Button */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>{isPreviewOpen ? 'Hide Preview' : 'Show Preview'}</span>
            </button>

            {/* Primary Publish Product Button */}
            <button
              type="button"
              onClick={() => handleSaveWithStatus('published')}
              disabled={isSubmitting}
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-[#D4AF37] to-[#F3CE65] hover:brightness-105 active:scale-98 rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{productToEdit ? 'Save Changes' : 'Publish Product'}</span>
                </>
              )}
            </button>

            {/* Close Cross */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors ml-1"
              title="Close editor"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-7 lg:p-8 space-y-6 pb-28 min-w-0"
        >
          {errors.general && (
            <div className="max-w-7xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs sm:text-sm text-red-700 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Two-Column Editor Layout (Shopify / Amazon Style) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto w-full">
            {/* ============================================================= */}
            {/* LEFT COLUMN — Main Product Content (8 cols) */}
            {/* ============================================================= */}
            <div className="lg:col-span-8 space-y-6 w-full min-w-0">
              {/* CARD 1: PRODUCT INFORMATION */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-display">
                      Product Information
                    </h2>
                    <p className="text-xs text-slate-500">
                      Product title, localized Bengali naming, customer description, and URL slug
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                    Required
                  </span>
                </div>

                <div className="space-y-4">
                  {/* English Product Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Product Title (English) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {name.length}/120 characters
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={120}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Hoco GA6 Semiconductor Mobile Cooling Fan"
                      className={`w-full px-3.5 py-2.5 text-sm sm:text-base font-medium text-slate-900 bg-white border rounded-lg placeholder:text-slate-400 focus:outline-none transition-all shadow-xs ${
                        errors.name
                          ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                          : 'border-slate-300 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Bengali Product Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <span>Bangla Product Name (বাংলা নাম)</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-1.5 py-0.5 rounded border border-emerald-200">
                          লোকাল ক্যাটালগ
                        </span>
                      </label>
                      <span className="text-xs text-slate-400">ঐচ্ছিক</span>
                    </div>
                    <input
                      type="text"
                      value={bengaliName}
                      onChange={(e) => setBengaliName(e.target.value)}
                      placeholder="যেমন: হোকো GA6 সেমিকন্ডাক্টর মোবাইল ফোন কুলার"
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bengali shadow-xs"
                    />
                  </div>

                  {/* Product Description with Rich-Text Toolbar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Product Description
                      </label>
                      <span className="text-xs text-slate-400">Storefront overview</span>
                    </div>

                    {/* Rich-Text Formatting Toolbar */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-300/80 border-b-0 rounded-t-lg">
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('**', '**')}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-white rounded transition-colors"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('*', '*')}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-white rounded transition-colors"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('### ')}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-white rounded transition-colors"
                        title="Heading"
                      >
                        <Heading className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-4 bg-slate-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('\n- ')}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-white rounded transition-colors"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('\n1. ')}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-white rounded transition-colors"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('[', '](https://)')}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-white rounded transition-colors"
                        title="Insert Link"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('`', '`')}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-white rounded transition-colors"
                        title="Inline Code"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      ref={descTextareaRef}
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter detailed product description, specifications, and customer-facing highlights..."
                      className="w-full px-3.5 py-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-b-lg placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all resize-none leading-relaxed shadow-xs"
                    />
                  </div>

                  {/* SEO / URL Slug Live Preview */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span className="text-slate-500 font-mono truncate">
                        muaz-electronic.com/products/{seoSlug}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium shrink-0 ml-2">
                      Storefront URL Preview
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: PRODUCT MEDIA GALLERY (Shopify Multiple Images & Drag & Drop) */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-display">
                      Product Media Gallery
                    </h2>
                    <p className="text-xs text-slate-500">
                      Upload multiple images. Click any image to designate it as the Main Hero asset.
                    </p>
                  </div>

                  {/* Mode Selector Tabs (Upload vs URL) */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                        imageInputMode === 'upload'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                        imageInputMode === 'url'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Add via URL</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Upload Progress Bar if active */}
                  {uploadProgress !== null && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />
                          <span>Uploading & optimizing assets...</span>
                        </span>
                        <span className="font-mono">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#D4AF37] transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Drag & Drop Upload Zone (Always Visible for Appending More Media) */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-slate-300 hover:border-[#D4AF37] bg-slate-50/50 hover:bg-white'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto mb-2.5 shadow-xs">
                      <Upload className="w-5 h-5 stroke-[2]" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5 font-display">
                      Drag and drop product images here, or{' '}
                      <span className="text-[#C5A059] underline underline-offset-4">browse files</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Supports multiple PNG, JPG, or WEBP up to 5 MB each.
                    </p>
                  </div>

                  {/* Direct Web URL Mode */}
                  {imageInputMode === 'url' && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 animate-in fade-in">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Paste Public Image HTTPS Link
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://images.unsplash.com/... or https://example.com/item.png"
                          className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button
                          type="button"
                          onClick={handleAddUrlImage}
                          disabled={!urlInput.trim()}
                          className="px-4 py-2 text-xs font-bold bg-[#D4AF37] hover:bg-[#C5A059] text-slate-950 rounded-lg transition-all disabled:opacity-50 shrink-0"
                        >
                          Add to Gallery
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Multiple Gallery Images Grid */}
                  {galleryImages.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">
                          Uploaded Photos ({galleryImages.length})
                        </span>
                        <span className="text-slate-400">Click any card to designate as Main Image</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {galleryImages.map((img, idx) => {
                          const isPrimary = idx === primaryImageIndex;
                          return (
                            <div
                              key={idx}
                              onClick={() => handleSetPrimaryImage(idx)}
                              className={`group relative rounded-xl border p-2 bg-white transition-all cursor-pointer shadow-xs ${
                                isPrimary
                                  ? 'border-2 border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-md'
                                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="aspect-square rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center p-2 relative">
                                <img
                                  src={img}
                                  alt={`Product ${idx + 1}`}
                                  className="w-full h-full object-contain"
                                />

                                {isPrimary && (
                                  <span className="absolute top-1 left-1 bg-[#D4AF37] text-slate-950 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-slate-950" />
                                    <span>Main Image</span>
                                  </span>
                                )}
                              </div>

                              {/* Card Actions Footer */}
                              <div className="mt-2 flex items-center justify-between gap-1 text-[11px] text-slate-600">
                                <span className="font-mono text-[10px] text-slate-400">
                                  #{idx + 1}
                                </span>

                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveImage(idx, idx - 1);
                                      }}
                                      className="p-1 hover:text-slate-950 hover:bg-slate-100 rounded"
                                      title="Move Left"
                                    >
                                      <MoveLeft className="w-3 h-3" />
                                    </button>
                                  )}
                                  {idx < galleryImages.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveImage(idx, idx + 1);
                                      }}
                                      className="p-1 hover:text-slate-950 hover:bg-slate-100 rounded"
                                      title="Move Right"
                                    >
                                      <MoveRight className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveImageAt(idx);
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Delete Image"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {errors.image && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.image}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* CARD 3: PRICING & PROFIT ECONOMICS (Shopify Style) */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-display">
                      Pricing & Commercial Economics
                    </h2>
                    <p className="text-xs text-slate-500">
                      Regular customer price, compare-at promotional price, and merchant profit margins
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">BDT (৳)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Regular Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                      Regular Price (BDT) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="1500"
                        className={`w-full pl-7 pr-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white border rounded-lg focus:outline-none transition-all shadow-xs ${
                          errors.price
                            ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                            : 'border-slate-300 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20'
                        }`}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.price}</span>
                      </p>
                    )}
                  </div>

                  {/* Compare-at / Discount Price */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Compare-at / Discount
                      </label>
                      <span className="text-[11px] text-slate-400">Optional</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
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
                        className={`w-full pl-7 pr-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white border rounded-lg focus:outline-none transition-all shadow-xs ${
                          errors.salePrice
                            ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                            : 'border-slate-300 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20'
                        }`}
                      />
                    </div>
                    {errors.salePrice && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.salePrice}</span>
                      </p>
                    )}
                  </div>

                  {/* Cost per item (Merchant cost) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Cost per Item (Wholesale)
                      </label>
                      <span className="text-[11px] text-slate-400">Private</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={costPrice}
                        onChange={(e) =>
                          setCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="800"
                        className="w-full pl-7 pr-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                {/* Profit & Promotion Summary Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {discountInfo.valid && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-xs text-emerald-800">
                      <span className="font-bold flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        <span>Active Deal: {discountInfo.percent}% OFF</span>
                      </span>
                      <span className="text-emerald-700">
                        Customer saves ৳{discountInfo.savings.toLocaleString()} (Pays ৳{Number(salePrice).toLocaleString()})
                      </span>
                    </div>
                  )}

                  {profitMargin.valid && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3 text-xs text-slate-700">
                      <span className="font-bold text-slate-900">
                        Merchant Margin: {profitMargin.margin}%
                      </span>
                      <span className="text-slate-500">
                        Estimated Profit: +৳{profitMargin.profit.toLocaleString()} per unit
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 4: INVENTORY & STOCK MANAGEMENT */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-display">
                      Inventory & Warehouse Tracking
                    </h2>
                    <p className="text-xs text-slate-500">
                      Physical stock quantity, custom SKU code, and availability alerts
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700">{stock || 0} Units</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  {/* Stock Quantity with Quick Steppers */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                      Available Stock (Units) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStock((prev) => Math.max(0, (typeof prev === 'number' ? prev : 0) - 1))}
                        className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center justify-center shrink-0 active:scale-95"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) =>
                          setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                        }
                        placeholder="20"
                        className={`w-full text-center py-2 text-sm font-mono font-bold text-slate-900 bg-white border rounded-lg focus:outline-none transition-all shadow-xs ${
                          errors.stock
                            ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                            : 'border-slate-300 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setStock((prev) => (typeof prev === 'number' ? prev : 0) + 1)}
                        className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center justify-center shrink-0 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    {errors.stock && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.stock}</span>
                      </p>
                    )}
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                      SKU (Stock Keeping Unit)
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="ME-GAD-001"
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  {/* Barcode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                      Barcode (ISBN / UPC / GTIN)
                    </label>
                    <div className="relative">
                      <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="890123456789"
                        className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${stockStatus.badge}`}>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stockStatus.dot}`} />
                    <span className="text-xs font-bold">{stockStatus.label}:</span>
                    <span className="text-xs text-slate-600">{stockStatus.desc}</span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={continueSellingWhenOutOfStock}
                      onChange={(e) => setContinueSellingWhenOutOfStock(e.target.checked)}
                      className="rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span>Allow customer backorders when out of stock</span>
                  </label>
                </div>
              </div>

              {/* CARD 5: PRODUCT VARIANTS (Shopify-Style Matrix) */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-display">
                      Product Variants
                    </h2>
                    <p className="text-xs text-slate-500">
                      Options like Color, Edition, or Capacity with separate SKU, pricing, and stock
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={(e) => setHasVariants(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                  </label>
                </div>

                {hasVariants ? (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Option Name
                        </label>
                        <input
                          type="text"
                          value={variantOptionName}
                          onChange={(e) => setVariantOptionName(e.target.value)}
                          placeholder="e.g. Color / Edition"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Option Values (comma separated)
                        </label>
                        <input
                          type="text"
                          value={variantValuesInput}
                          onChange={(e) => setVariantValuesInput(e.target.value)}
                          placeholder="Matte Black, Glacier Silver, Gold"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleUpdateVariantsFromInput}
                          className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors"
                        >
                          Generate
                        </button>
                      </div>
                    </div>

                    {/* Variant Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                          <tr>
                            <th className="p-2.5">Variant</th>
                            <th className="p-2.5">SKU</th>
                            <th className="p-2.5">Price (৳)</th>
                            <th className="p-2.5">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {variantsList.map((variant, vIdx) => (
                            <tr key={variant.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-800">
                                {variant.name}
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={(e) => {
                                    const updated = [...variantsList];
                                    updated[vIdx].sku = e.target.value;
                                    setVariantsList(updated);
                                  }}
                                  className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => {
                                    const updated = [...variantsList];
                                    updated[vIdx].price = Number(e.target.value);
                                    setVariantsList(updated);
                                  }}
                                  className="w-24 px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => {
                                    const updated = [...variantsList];
                                    updated[vIdx].stock = Number(e.target.value);
                                    setVariantsList(updated);
                                  }}
                                  className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    This product has no multiple variants. Enable the switch above to offer different colors, editions, or storage sizes.
                  </p>
                )}
              </div>

              {/* CARD 6: TECHNICAL SPECS & HIGHLIGHTS */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSpecs(!showAdvancedSpecs)}
                  className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#D4AF37]" />
                    <span>Technical Specifications & Bullet Highlights</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({features.filter(Boolean).length} points, {specs.filter((s) => s.label).length} specs)
                    </span>
                  </div>
                  {showAdvancedSpecs ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showAdvancedSpecs && (
                  <div className="pt-3 border-t border-slate-100 space-y-5 animate-in fade-in">
                    {/* Key Highlights */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <AlignLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Bullet Highlights</span>
                        </span>
                        <button
                          type="button"
                          onClick={addFeatureRow}
                          className="text-xs font-bold text-[#C5A059] hover:text-[#9A7B38] flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Point</span>
                        </button>
                      </div>
                      {features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600 flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => handleFeatureChange(idx, e.target.value)}
                            placeholder={`Point #${idx + 1} (e.g. Instant semiconductor cooling)`}
                            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#D4AF37]"
                          />
                          <button
                            type="button"
                            onClick={() => removeFeatureRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Technical Specs */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Specifications Matrix</span>
                        </span>
                        <button
                          type="button"
                          onClick={addSpecRow}
                          className="text-xs font-bold text-[#C5A059] hover:text-[#9A7B38] flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Row</span>
                        </button>
                      </div>
                      {specs.map((spec, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={spec.label}
                            onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                            placeholder="Spec (e.g. Battery)"
                            className="col-span-5 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#D4AF37]"
                          />
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                            placeholder="Value (e.g. 20,000 mAh)"
                            className="col-span-6 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#D4AF37]"
                          />
                          <button
                            type="button"
                            onClick={() => removeSpecRow(idx)}
                            className="col-span-1 p-1.5 text-slate-400 hover:text-red-600 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================= */}
            {/* RIGHT COLUMN — Settings & Live Storefront Preview (4 cols) */}
            {/* ============================================================= */}
            <div className="lg:col-span-4 space-y-6 w-full min-w-0">
              {/* CARD 1: PUBLISHING & VISIBILITY */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    Publishing Status
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>{status === 'published' ? 'Active' : 'Draft'}</span>
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* Segmented Switch for Active vs Draft */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setStatus('published')}
                      className={`py-2 px-3 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        status === 'published'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('draft')}
                      className={`py-2 px-3 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        status === 'draft'
                          ? 'bg-white text-amber-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Draft</span>
                    </button>
                  </div>

                  {/* Featured Product Toggle Card */}
                  <div
                    onClick={() => setIsFeatured(!isFeatured)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isFeatured
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isFeatured ? 'bg-[#D4AF37] text-slate-950' : 'bg-white text-slate-400 border border-slate-200'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isFeatured ? 'fill-slate-950' : ''}`} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Featured Showcase
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Highlight in VIP homepage collection
                        </span>
                      </div>
                    </div>

                    <div className="relative inline-flex items-center pointer-events-none">
                      <div
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          isFeatured ? 'bg-[#D4AF37]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform absolute top-[2px] ${
                            isFeatured ? 'translate-x-[22px]' : 'translate-x-[2px]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: REAL 1:1 CUSTOMER-FACING STOREFRONT PREVIEW CARD (Matches ProductCard.tsx) */}
              {isPreviewOpen && (
                <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
                      <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Live Storefront Card Preview</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Buyer View</span>
                  </div>

                  {/* 1:1 Customer-Facing ProductCard Simulation */}
                  <div className="group relative bg-white border border-[#111827]/[0.08] rounded-[20px] overflow-hidden flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-left">
                    {/* Top Image Container */}
                    <div className="relative w-full aspect-square bg-[#F8FAF9] rounded-t-[20px] overflow-hidden flex items-center justify-center p-3 sm:p-4 border-b border-[#111827]/[0.03]">
                      {activeHeroImage ? (
                        <img
                          src={activeHeroImage}
                          alt={name || 'Product'}
                          className="w-full h-full object-contain object-center"
                        />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-1">
                          <ImageIcon className="w-10 h-10" />
                          <span className="text-[11px]">No Photo Selected</span>
                        </div>
                      )}

                      {/* Top-Left: Green Discount Badge */}
                      {discountInfo.valid && (
                        <div className="absolute top-2.5 left-2.5 z-10 bg-[#16A34A] text-white text-[11px] sm:text-[12px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs tracking-tight">
                          -{discountInfo.percent}%
                        </div>
                      )}

                      {/* Top-Right: Circular Wishlist & Share */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5 items-center">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-center text-gray-400">
                          <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8]" />
                        </div>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-center text-gray-400">
                          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8]" />
                        </div>
                      </div>

                      {/* Out of Stock overlay if applicable */}
                      {Number(stock) <= 0 && (
                        <div className="absolute inset-0 bg-white/75 backdrop-blur-2xs flex items-center justify-center z-10">
                          <span className="px-3 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-full">
                            স্টক শেষ
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Info & Pricing Area */}
                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Title - Fixed 2-line height */}
                        <h3 className="text-[12.5px] sm:text-[13.5px] font-medium text-[#111827] line-clamp-2 leading-snug h-[2.5rem] sm:h-[2.6rem]">
                          {name || 'Product Title Appears Here'}
                        </h3>

                        {/* Pricing */}
                        <div className="mt-1.5 flex items-baseline gap-1.5">
                          <span className="text-[15px] sm:text-[17px] font-bold text-[#111827] font-display tabular-nums">
                            ৳{Number(salePrice || price || 0).toLocaleString()}
                          </span>
                          {discountInfo.valid && (
                            <span className="text-[11px] sm:text-[12px] text-[#9CA3AF] line-through font-normal tabular-nums">
                              ৳{Number(price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        disabled
                        className="w-full mt-2.5 h-[42px] sm:h-[44px] px-3 rounded-[12px] sm:rounded-[14px] font-semibold text-[11.5px] sm:text-[13px] flex items-center justify-center gap-1.5 bg-[#16A34A] text-white shadow-[0_2px_8px_rgba(22,163,74,0.22)]"
                      >
                        <ShoppingCart className="w-4 h-4 stroke-[2]" />
                        <span>কার্টে যোগ করুন</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 3: ORGANIZATION & TAXONOMY */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    Organization
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Category Selector with Inline Creator Drawer */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Category <span className="text-red-500">*</span>
                      </label>
                      {onAddCategory && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsInlineCategoryOpen(!isInlineCategoryOpen);
                            setInlineCatError(null);
                          }}
                          className="text-xs font-bold text-[#C5A059] hover:text-[#9A7B38] flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isInlineCategoryOpen ? 'Close' : 'Add Category'}</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Category Quick Creation Drawer */}
                    {isInlineCategoryOpen && (
                      <div className="mb-3 p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-2.5 shadow-xs animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1 font-display">
                            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Quick Add Category</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsInlineCategoryOpen(false)}
                            className="text-slate-400 hover:text-slate-700 text-xs p-1"
                          >
                            ✕
                          </button>
                        </div>

                        {inlineCatError && (
                          <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            {inlineCatError}
                          </p>
                        )}

                        <div className="space-y-2">
                          <input
                            type="text"
                            value={inlineCatName}
                            onChange={(e) => setInlineCatName(e.target.value)}
                            placeholder="Name (English) *"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#D4AF37]"
                          />
                          <input
                            type="text"
                            value={inlineCatBengali}
                            onChange={(e) => setInlineCatBengali(e.target.value)}
                            placeholder="বাংলা নাম (যেমন: স্মার্টওয়াচ)"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#D4AF37] font-bengali"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsInlineCategoryOpen(false)}
                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                          >
                            Cancel
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
                            className="px-3 py-1 text-xs font-bold text-slate-950 bg-gradient-to-r from-[#D4AF37] to-[#F3CE65] rounded disabled:opacity-50 transition-all shadow-xs"
                          >
                            {isCreatingCategory ? 'Creating...' : 'Save & Assign'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-lg text-slate-900 focus:outline-none transition-all appearance-none cursor-pointer pr-8 shadow-xs ${
                          errors.category
                            ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                            : 'border-slate-300 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20'
                        }`}
                      >
                        {!category && (
                          <option value="" disabled className="text-slate-400">
                            -- Select Category --
                          </option>
                        )}
                        {Array.from(
                          new Set([
                            ...categories
                              .map((c) => (typeof c === 'string' ? c : c.name))
                              .filter((c) => c && c.trim() !== 'All Products' && c.trim() !== 'All'),
                            ...(category && category.trim() !== 'All Products' ? [category] : []),
                          ])
                        ).map((catName) => {
                          const matchedCat = categories.find(
                            (c) =>
                              typeof c !== 'string' &&
                              c.name.trim().toLowerCase() === catName.trim().toLowerCase()
                          ) as Category | undefined;
                          return (
                            <option key={catName} value={catName}>
                              {catName} {matchedCat?.bengaliName ? `(${matchedCat.bengaliName})` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Layers className="w-4 h-4" />
                      </div>
                    </div>
                    {errors.category && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.category}</span>
                      </p>
                    )}
                  </div>

                  {/* Brand Field with Quick Chips */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                      Brand / Manufacturer
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. MUAZ ELECTRONIC"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37]"
                    />

                    <div className="flex items-center gap-1 flex-wrap mt-2">
                      {BRAND_SUGGESTIONS.slice(0, 4).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBrand(b)}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded transition-all ${
                            brand.toLowerCase() === b.toLowerCase()
                              ? 'bg-[#D4AF37]/20 text-[#8B6B1F] border border-[#D4AF37]'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                      Tags
                    </label>
                    <div className="flex items-center gap-1 flex-wrap mb-2">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(newTagInput);
                          }
                        }}
                        placeholder="Add tag..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(newTagInput)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* =================================================================== */}
        {/* 3. STICKY BOTTOM ACTION BAR — Responsive Enterprise Commerce Footer */}
        {/* =================================================================== */}
        <footer className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 z-30 shadow-md">
          {/* Unsaved Changes & Progress Indicator */}
          <div className="flex items-center gap-2 text-xs">
            {formProgress.isComplete ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All required product details configured</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-800 font-medium">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Unsaved draft • Required: {formProgress.missing.slice(0, 2).join(', ')}
                  {formProgress.missing.length > 2 && ` +${formProgress.missing.length - 2} more`}
                </span>
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors text-center disabled:opacity-50"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={() => handleSaveWithStatus('draft')}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-lg transition-colors text-center disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSaveWithStatus('published')}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-[#D4AF37] to-[#F3CE65] hover:brightness-105 active:scale-98 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 text-center"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span>{productToEdit ? 'Save Changes' : 'Publish Product'}</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};
