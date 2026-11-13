import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  AlertTriangle,
  Percent,
  Layers,
  Check,
  AlignLeft,
  Sliders,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
  XCircle,
  Globe,
  ChevronDown,
  ChevronUp,
  Link2,
  RefreshCw,
  Info,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  Code,
  Heart,
  ShoppingCart,
  MoveLeft,
  MoveRight,
  Barcode,
  Ruler,
  Sparkles,
  Tag,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  Product,
  ProductStatus,
  Category,
  CLOTHING_SIZES,
  ClothingSize,
  SizeInventoryMap,
} from '../../types';
import { AdminTab } from './AdminSidebar';
import {
  getCategorySelectOptions,
  getCanonicalCategoryName,
} from '../../lib/categoryUtils';
import {
  createDefaultSizeInventory,
  sanitizeWholeStock,
  stripInternalSpecs,
} from '../../lib/sizeInventory';
import {
  ClothingSizeStockManager,
  SizeDraftMap,
} from './ClothingSizeStockManager';
import { AdminConfirmModal } from './AdminConfirmModal';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    productData: Omit<Product, 'id'>,
    imageFile?: File,
    productId?: string
  ) => Promise<{ success: boolean; error: string | null }>;
  onSaveSizeInventory?: (
    productId: string,
    sizeInventory: SizeInventoryMap | null,
    fallbackStock?: number
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

interface MediaGalleryItem {
  id: string;
  url: string;
  file?: File;
}

function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_SIZE_DRAFT: SizeDraftMap = {
  S: { enabled: false, stock: 0 },
  M: { enabled: false, stock: 0 },
  L: { enabled: false, stock: 0 },
  XL: { enabled: false, stock: 0 },
  XXL: { enabled: false, stock: 0 },
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveSizeInventory,
  productToEdit,
  categories,
  onAddCategory,
}) => {
  // Basic Information
  const [name, setName] = useState('');
  const [bengaliName, setBengaliName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('MUAZ ELECTRONIC');
  const [description, setDescription] = useState('');
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Pricing & Inventory
  const [price, setPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(20);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [continueSellingWhenOutOfStock, setContinueSellingWhenOutOfStock] = useState(false);

  // Clothing Size Management
  const [sizeInventoryState, setSizeInventoryState] = useState<SizeDraftMap>(() => ({
    ...EMPTY_SIZE_DRAFT,
  }));
  const [previewSelectedSize, setPreviewSelectedSize] = useState<ClothingSize | null>(null);

  // Additional Information
  const [status, setStatus] = useState<ProductStatus>('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState<string[]>(['Smart Gadget', 'Best Seller']);
  const [newTagInput, setNewTagInput] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([
    { label: '', value: '' },
  ]);

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptionName, setVariantOptionName] = useState('Color');
  const [variantValuesInput, setVariantValuesInput] = useState('Matte Black, Glacier Silver');
  const [variantsList, setVariantsList] = useState<ProductVariantItem[]>([
    { id: '1', name: 'Matte Black', sku: 'ME-COL-BLK', price: 1500, stock: 12 },
    { id: '2', name: 'Glacier Silver', sku: 'ME-COL-SLV', price: 1500, stock: 8 },
  ]);

  // Expandable Sub-sections
  const [showSeoSection, setShowSeoSection] = useState(false);
  const [showVariantsSection, setShowVariantsSection] = useState(false);
  const [showAdvancedSpecs, setShowAdvancedSpecs] = useState(false);

  // Media Gallery
  const [mediaItems, setMediaItems] = useState<MediaGalleryItem[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Inline Category Creator
  const [isInlineCategoryOpen, setIsInlineCategoryOpen] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');
  const [inlineCatBengali, setInlineCatBengali] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [inlineCatError, setInlineCatError] = useState<string | null>(null);

  // Validation, Dirty State & Confirmations
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const initializedKeyRef = useRef<string | null>(null);

  const useClothingSizes = useMemo(
    () => CLOTHING_SIZES.some((sz) => Boolean(sizeInventoryState[sz]?.enabled)),
    [sizeInventoryState]
  );

  const isSizeInventoryDirty = useMemo(() => {
    const saved = productToEdit?.sizeInventory;
    return CLOTHING_SIZES.some((sz) => {
      const draft = sizeInventoryState[sz];
      const orig = saved?.[sz];
      const origEnabled = Boolean(orig?.enabled);
      const origStock = origEnabled ? sanitizeWholeStock(orig?.stock) : 0;
      const draftStock = draft.enabled ? sanitizeWholeStock(draft.stock) : 0;
      return draft.enabled !== origEnabled || draftStock !== origStock;
    });
  }, [sizeInventoryState, productToEdit]);

  // Keep slug synced to name until manually edited
  useEffect(() => {
    if (!isSlugCustomized) {
      setSlug(slugifyText(name));
    }
  }, [name, isSlugCustomized]);

  // Initialize form from productToEdit or blank template
  useEffect(() => {
    if (!isOpen) {
      initializedKeyRef.current = null;
      return;
    }

    const targetKey = productToEdit ? productToEdit.id : '__new__';
    if (initializedKeyRef.current === targetKey) {
      if (productToEdit) {
        setStock(typeof productToEdit.stock === 'number' ? productToEdit.stock : 0);
        const defaults = createDefaultSizeInventory();
        const syncedSizeState: SizeDraftMap = { ...EMPTY_SIZE_DRAFT };
        for (const sz of CLOTHING_SIZES) {
          const entry = productToEdit.sizeInventory?.[sz] || defaults[sz];
          syncedSizeState[sz] = {
            enabled: Boolean(entry.enabled),
            stock: entry.enabled ? sanitizeWholeStock(entry.stock) : 0,
          };
        }
        setSizeInventoryState(syncedSizeState);
      }
      return;
    }

    initializedKeyRef.current = targetKey;

    if (productToEdit) {
      const initName = productToEdit.name || '';
      const initBengali = productToEdit.bengaliName || '';
      const initSlug = slugifyText(initName);
      const initPrice = typeof productToEdit.price === 'number' ? productToEdit.price : '';
      const initSalePrice =
        typeof productToEdit.salePrice === 'number' ? productToEdit.salePrice : '';
      const existingCat = productToEdit.category || '';
      const canonicalCat = getCanonicalCategoryName(existingCat, categories) || existingCat;
      const initBrand = productToEdit.brand || 'MUAZ ELECTRONIC';
      const initStock = typeof productToEdit.stock === 'number' ? productToEdit.stock : 20;
      const initStatus = productToEdit.status || 'published';
      const initFeatured = Boolean(productToEdit.isFeatured);
      const initDesc = productToEdit.description || '';
      const initSku = `ME-${(productToEdit.category || 'PRD')
        .slice(0, 3)
        .toUpperCase()}-${productToEdit.id.slice(0, 6).toUpperCase()}`;
      const initBarcode = `890${String(productToEdit.id.replace(/\D/g, '') || '100200300')
        .slice(0, 9)
        .padEnd(9, '0')}`;
      const initMedia: MediaGalleryItem[] = productToEdit.image
        ? [{ id: 'initial-0', url: productToEdit.image }]
        : [];
      const initFeatures =
        productToEdit.features && productToEdit.features.length > 0
          ? productToEdit.features
          : [''];
      const visibleSpecs = stripInternalSpecs(productToEdit.specs);
      const initSpecs = visibleSpecs.length > 0 ? visibleSpecs : [{ label: '', value: '' }];

      const defaults = createDefaultSizeInventory();
      const nextSizeState: SizeDraftMap = { ...EMPTY_SIZE_DRAFT };
      for (const sz of CLOTHING_SIZES) {
        const entry = productToEdit.sizeInventory?.[sz] || defaults[sz];
        nextSizeState[sz] = {
          enabled: Boolean(entry.enabled),
          stock: entry.enabled ? sanitizeWholeStock(entry.stock) : 0,
        };
      }

      setName(initName);
      setBengaliName(initBengali);
      setSlug(initSlug);
      setIsSlugCustomized(false);
      setPrice(initPrice);
      setSalePrice(initSalePrice);
      setCostPrice('');
      setCategory(canonicalCat);
      setBrand(initBrand);
      setStock(initStock);
      setStatus(initStatus);
      setIsFeatured(initFeatured);
      setDescription(initDesc);
      setIsDescExpanded(false);
      setSku(initSku);
      setBarcode(initBarcode);
      setMediaItems(initMedia);
      setPrimaryImageIndex(0);
      setUploadProgress(null);
      setShowUrlInput(false);
      setFeatures(initFeatures);
      setSpecs(initSpecs);
      setSeoTitle('');
      setSeoDescription('');
      setSizeInventoryState(nextSizeState);

      const firstEnabled = CLOTHING_SIZES.find((sz) => nextSizeState[sz].enabled) || null;
      setPreviewSelectedSize(firstEnabled);

      const variantSpec = visibleSpecs.find(
        (s) =>
          s.label.toLowerCase().includes('color') ||
          s.label.toLowerCase().includes('variant')
      );
      if (variantSpec) {
        setHasVariants(true);
        setShowVariantsSection(true);
        setVariantOptionName(variantSpec.label);
        setVariantValuesInput(variantSpec.value);
        const parsed = variantSpec.value.split(',').map((v, i) => ({
          id: String(i + 1),
          name: v.trim(),
          sku: `ME-${v.slice(0, 3).toUpperCase()}-${i + 1}`,
          price: productToEdit.price || 0,
          stock: Math.floor((productToEdit.stock || 20) / 2),
        }));
        if (parsed.length > 0) setVariantsList(parsed);
      } else {
        setHasVariants(false);
        setShowVariantsSection(false);
      }

      setShowAdvancedSpecs(
        Boolean(
          (productToEdit.features && productToEdit.features.length > 0 && productToEdit.features[0]) ||
            (visibleSpecs.length > 0 && visibleSpecs[0].label)
        )
      );

      setInitialSnapshot(
        JSON.stringify({
          name: initName,
          bengaliName: initBengali,
          slug: initSlug,
          price: initPrice,
          salePrice: initSalePrice,
          costPrice: '',
          category: canonicalCat,
          brand: initBrand,
          stock: initStock,
          status: initStatus,
          isFeatured: initFeatured,
          description: initDesc,
          mediaUrls: initMedia.map((m) => m.url),
          primaryImageIndex: 0,
          features: initFeatures,
          specs: initSpecs,
          sizeInventoryState: nextSizeState,
        })
      );
    } else {
      const catNames = categories
        .map((c) => (typeof c === 'string' ? c : c.name))
        .filter((c) => c && c !== 'All Products' && c !== 'All');
      const firstAvailableCat = catNames[0] || '';
      const generatedSku = `ME-${(firstAvailableCat || 'PRD')
        .slice(0, 3)
        .toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const generatedBarcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;

      setName('');
      setBengaliName('');
      setSlug('');
      setIsSlugCustomized(false);
      setPrice('');
      setSalePrice('');
      setCostPrice('');
      setCategory(firstAvailableCat);
      setBrand('MUAZ ELECTRONIC');
      setStock(20);
      setStatus('published');
      setIsFeatured(false);
      setDescription('');
      setIsDescExpanded(false);
      setSku(generatedSku);
      setBarcode(generatedBarcode);
      setTags(['Smart Gadget', 'Best Seller']);
      setSeoTitle('');
      setSeoDescription('');
      setFeatures(['']);
      setSpecs([{ label: '', value: '' }]);
      setMediaItems([]);
      setPrimaryImageIndex(0);
      setUploadProgress(null);
      setShowUrlInput(false);
      setShowAdvancedSpecs(false);
      setShowSeoSection(false);
      setShowVariantsSection(false);
      setHasVariants(false);
      setSizeInventoryState({ ...EMPTY_SIZE_DRAFT });
      setPreviewSelectedSize(null);

      setInitialSnapshot(
        JSON.stringify({
          name: '',
          bengaliName: '',
          slug: '',
          price: '',
          salePrice: '',
          costPrice: '',
          category: firstAvailableCat,
          brand: 'MUAZ ELECTRONIC',
          stock: 20,
          status: 'published',
          isFeatured: false,
          description: '',
          mediaUrls: [],
          primaryImageIndex: 0,
          features: [''],
          specs: [{ label: '', value: '' }],
          sizeInventoryState: EMPTY_SIZE_DRAFT,
        })
      );
    }

    setErrors({});
    setIsInlineCategoryOpen(false);
    setInlineCatName('');
    setInlineCatBengali('');
    setInlineCatError(null);
    setDiscardConfirmOpen(false);
  }, [productToEdit, isOpen]);

  // Pre-select first category if categories arrive async
  useEffect(() => {
    if (isOpen && !productToEdit && !category && categories.length > 0) {
      const firstCat = categories
        .map((c) => (typeof c === 'string' ? c : c.name))
        .find((c) => c && c !== 'All Products' && c !== 'All');
      if (firstCat) setCategory(firstCat);
    }
  }, [categories, isOpen, productToEdit, category]);

  // Keep preview selected size valid
  useEffect(() => {
    if (!useClothingSizes) {
      setPreviewSelectedSize(null);
      return;
    }
    if (!previewSelectedSize || !sizeInventoryState[previewSelectedSize]?.enabled) {
      const firstAvailable =
        CLOTHING_SIZES.find(
          (sz) =>
            sizeInventoryState[sz]?.enabled &&
            sanitizeWholeStock(sizeInventoryState[sz]?.stock) > 0
        ) ||
        CLOTHING_SIZES.find((sz) => sizeInventoryState[sz]?.enabled) ||
        null;
      setPreviewSelectedSize(firstAvailable);
    }
  }, [useClothingSizes, sizeInventoryState, previewSelectedSize]);

  // Dirty check
  const hasUnsavedChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    const currentSnapshot = JSON.stringify({
      name,
      bengaliName,
      slug,
      price,
      salePrice,
      costPrice,
      category,
      brand,
      stock,
      status,
      isFeatured,
      description,
      mediaUrls: mediaItems.map((m) => m.url),
      primaryImageIndex,
      features,
      specs,
      sizeInventoryState,
    });
    return currentSnapshot !== initialSnapshot;
  }, [
    initialSnapshot,
    name,
    bengaliName,
    slug,
    price,
    salePrice,
    costPrice,
    category,
    brand,
    stock,
    status,
    isFeatured,
    description,
    mediaItems,
    primaryImageIndex,
    features,
    specs,
    sizeInventoryState,
  ]);

  // Discount info
  const discountInfo = useMemo(() => {
    const reg = typeof price === 'number' ? price : parseFloat(String(price));
    const sale = typeof salePrice === 'number' ? salePrice : parseFloat(String(salePrice));
    if (!isNaN(reg) && reg > 0 && !isNaN(sale) && sale > 0 && sale < reg) {
      return {
        percent: Math.round(((reg - sale) / reg) * 100),
        savings: reg - sale,
        valid: true,
      };
    }
    return { percent: 0, savings: 0, valid: false };
  }, [price, salePrice]);

  // Profit Margin
  const profitMargin = useMemo(() => {
    const reg =
      typeof salePrice === 'number' && salePrice > 0
        ? salePrice
        : typeof price === 'number'
        ? price
        : 0;
    const cost = typeof costPrice === 'number' ? costPrice : 0;
    if (reg > 0 && cost > 0 && reg > cost) {
      const profit = reg - cost;
      return { profit, margin: Math.round((profit / reg) * 100), valid: true };
    }
    return { profit: 0, margin: 0, valid: false };
  }, [price, salePrice, costPrice]);

  // Active Media
  const activeMediaItem = useMemo(() => {
    if (mediaItems.length > 0 && mediaItems[primaryImageIndex]) {
      return mediaItems[primaryImageIndex];
    }
    return mediaItems[0] || null;
  }, [mediaItems, primaryImageIndex]);

  const activeHeroImage = activeMediaItem?.url || '';

  // Effective Stock
  const effectiveStock = useMemo(() => {
    if (useClothingSizes) {
      return CLOTHING_SIZES.reduce((sum, sz) => {
        const entry = sizeInventoryState[sz];
        if (entry?.enabled) {
          const n = Number(entry.stock);
          return sum + (Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);
        }
        return sum;
      }, 0);
    }
    return typeof stock === 'number' && Number.isFinite(stock) && stock >= 0
      ? Math.floor(stock)
      : 0;
  }, [useClothingSizes, sizeInventoryState, stock]);

  // Stock Status
  const stockStatus = useMemo(() => {
    const s = effectiveStock;
    if (s <= 0) {
      return {
        label: 'Out of Stock',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        Icon: XCircle,
      };
    }
    if (s <= 5) {
      return {
        label: `Low Stock (${s} left)`,
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        Icon: AlertTriangle,
      };
    }
    return {
      label: `In Stock (${s} pcs)`,
      badge: 'bg-[#ECFDF3] text-[#15803D] border-emerald-200',
      Icon: CheckCircle2,
    };
  }, [effectiveStock]);

  // Completion guidance
  const formProgress = useMemo(() => {
    const missing: string[] = [];
    if (!name.trim()) missing.push('Product Name');
    if (price === '' || Number(price) <= 0) missing.push('Regular Price');
    if (!category.trim()) missing.push('Category');
    if (useClothingSizes) {
      const anyEnabled = CLOTHING_SIZES.some((sz) => sizeInventoryState[sz]?.enabled);
      if (!anyEnabled) missing.push('Clothing Size');
    } else if (stock === '' || Number(stock) < 0) {
      missing.push('Stock');
    }
    if (mediaItems.length === 0) missing.push('Product Image');

    return {
      isComplete: missing.length === 0,
      missing,
    };
  }, [name, price, category, stock, mediaItems.length, useClothingSizes, sizeInventoryState]);

  const previewSizeStock = useMemo(() => {
    if (!useClothingSizes || !previewSelectedSize) return effectiveStock;
    const entry = sizeInventoryState[previewSelectedSize];
    if (!entry?.enabled) return 0;
    return sanitizeWholeStock(entry.stock);
  }, [useClothingSizes, previewSelectedSize, sizeInventoryState, effectiveStock]);

  if (!isOpen) return null;

  // Media Handlers
  const processFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) {
      setErrors((prev) => ({
        ...prev,
        image: 'Please select valid image files (PNG, JPG, WEBP under 5 MB)',
      }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    setUploadProgress(40);
    const loadedItems: MediaGalleryItem[] = [];
    let readCount = 0;

    validFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        readCount++;
        loadedItems.push({
          id: `file-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          url: reader.result as string,
          file,
        });
        if (readCount === validFiles.length) {
          setMediaItems((prev) => [...prev, ...loadedItems]);
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(null), 350);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
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
    const clean = urlInput.trim();
    if (!clean) return;
    setMediaItems((prev) => [
      ...prev,
      { id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, url: clean },
    ]);
    setUrlInput('');
    setShowUrlInput(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
  };

  const handleRemoveImageAt = (index: number) => {
    setMediaItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (primaryImageIndex >= updated.length) {
        setPrimaryImageIndex(Math.max(0, updated.length - 1));
      } else if (index < primaryImageIndex) {
        setPrimaryImageIndex(Math.max(0, primaryImageIndex - 1));
      }
      return updated;
    });
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= mediaItems.length) return;
    const updated = [...mediaItems];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setMediaItems(updated);

    if (primaryImageIndex === fromIndex) {
      setPrimaryImageIndex(toIndex);
    } else if (primaryImageIndex === toIndex) {
      setPrimaryImageIndex(fromIndex);
    }
  };

  // Rich-text toolbar
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
      textarea.setSelectionRange(
        start + tagPrefix.length,
        start + tagPrefix.length + (selectedText.length || 4)
      );
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

  const addFeatureRow = () => setFeatures([...features, '']);

  const removeFeatureRow = (index: number) => {
    if (features.length <= 1) setFeatures(['']);
    else setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const addSpecRow = () => setSpecs([...specs, { label: '', value: '' }]);

  const removeSpecRow = (index: number) => {
    if (specs.length <= 1) setSpecs([{ label: '', value: '' }]);
    else setSpecs(specs.filter((_, i) => i !== index));
  };

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
      errs.name = 'Product Name is required';
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
      errs.category = 'Please assign a category';
    }

    if (useClothingSizes) {
      const enabledSizes = CLOTHING_SIZES.filter((sz) => sizeInventoryState[sz]?.enabled);
      if (enabledSizes.length === 0) {
        errs.sizes = 'Enable at least one clothing size (S, M, L, XL, or XXL)';
      } else {
        for (const sz of enabledSizes) {
          const val = sizeInventoryState[sz].stock;
          const num = Number(val);
          if (val === '' || isNaN(num) || num < 0 || !Number.isInteger(num)) {
            errs.sizes = `Size ${sz} stock must be a whole number (0 or greater)`;
            break;
          }
        }
      }
    } else {
      const stockNum = Number(stock);
      if (stock === '' || isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
        errs.stock = 'Specify a valid whole number stock quantity (0 or greater)';
      }
    }

    if (mediaItems.length === 0) {
      errs.image = 'At least one product image is required';
    }

    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;
    if (!isValid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return isValid;
  };

  const handleSaveWithStatus = async (targetStatus?: ProductStatus) => {
    if (!validate()) return;

    setIsSubmitting(true);

    const cleanFeatures = features.map((f) => f.trim()).filter(Boolean);
    const cleanSpecs = stripInternalSpecs(specs).filter(
      (s) => s.label.trim() && s.value.trim()
    );

    if (hasVariants && variantsList.length > 0) {
      cleanSpecs.push({
        label: variantOptionName,
        value: variantsList.map((v) => `${v.name} (৳${v.price})`).join(', '),
      });
    }

    const finalCategoryName = getCanonicalCategoryName(category, categories) || category.trim();
    const primaryImg = activeHeroImage;
    const primaryFile = activeMediaItem?.file;

    let finalSizeInventory: SizeInventoryMap | undefined = undefined;
    let finalStock = Number(stock);

    if (useClothingSizes) {
      const builtSizes: SizeInventoryMap = {};
      let sum = 0;
      for (const sz of CLOTHING_SIZES) {
        const entry = sizeInventoryState[sz];
        const qty = entry.enabled ? sanitizeWholeStock(entry.stock) : 0;
        builtSizes[sz] = { enabled: Boolean(entry.enabled), stock: qty };
        if (entry.enabled) sum += qty;
      }
      finalSizeInventory = builtSizes;
      finalStock = sum;
    }

    const productPayload: Omit<Product, 'id'> = {
      name: name.trim(),
      bengaliName: bengaliName.trim() || undefined,
      price: Number(price),
      salePrice: salePrice !== '' ? Number(salePrice) : undefined,
      category: finalCategoryName,
      brand: brand.trim() || 'MUAZ ELECTRONIC',
      stock: finalStock,
      hasSizes: useClothingSizes,
      sizeInventory: finalSizeInventory,
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
      setErrors((prev) => ({
        ...prev,
        general: res.error || 'Failed to save product',
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveSizeChanges = async (): Promise<{
    success: boolean;
    error?: string | null;
    message?: string;
  }> => {
    setErrors((prev) => {
      if (!prev.sizes) return prev;
      const next = { ...prev };
      delete next.sizes;
      return next;
    });

    if (productToEdit) {
      if (useClothingSizes) {
        const builtSizes: SizeInventoryMap = {};
        for (const sz of CLOTHING_SIZES) {
          const entry = sizeInventoryState[sz];
          builtSizes[sz] = {
            enabled: Boolean(entry.enabled),
            stock: entry.enabled ? sanitizeWholeStock(entry.stock) : 0,
          };
        }
        if (onSaveSizeInventory) {
          const res = await onSaveSizeInventory(productToEdit.id, builtSizes);
          if (res.success) {
            return { success: true, message: 'Size and stock quantities updated.' };
          }
          return { success: false, error: res.error || 'Failed to save size stock.' };
        }
      } else if (onSaveSizeInventory) {
        const fallback = sanitizeWholeStock(stock);
        const res = await onSaveSizeInventory(productToEdit.id, null, fallback);
        if (res.success) {
          return { success: true, message: 'Size inventory disabled; standard stock saved.' };
        }
        return { success: false, error: res.error || 'Failed to save stock changes.' };
      }

      await handleSaveWithStatus(status);
      return { success: true, message: 'Product saved.' };
    }

    if (!validate()) {
      return {
        success: false,
        error: 'Complete the required product fields above to save.',
      };
    }

    await handleSaveWithStatus(status);
    return { success: true, message: 'Product created with size inventory.' };
  };

  const handleDiscardClick = () => {
    if (hasUnsavedChanges) {
      setDiscardConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveWithStatus(status);
  };

  const displaySlug = slug.trim() || slugifyText(name) || 'new-product';
  const StockStatusIcon = stockStatus.Icon;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-150">
      {/* ================================================================= */}
      {/* A. COMPACT SHOPIFY TOP HEADER                                     */}
      {/* ================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-[14px] px-4 sm:px-6 py-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={handleDiscardClick}
            className="w-9 h-9 mt-0.5 rounded-[10px] bg-[#F8FAF9] hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Back to Products"
            aria-label="Back to Products"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
              <button
                type="button"
                onClick={handleDiscardClick}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                Products
              </button>
              <span aria-hidden="true">/</span>
              <span className="text-slate-700 font-medium">
                {productToEdit ? 'Edit Product' : 'Create Product'}
              </span>
              {productToEdit && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    #{productToEdit.id.slice(0, 8)}
                  </span>
                </>
              )}
            </nav>

            <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-display tracking-tight mt-0.5 truncate">
              {productToEdit ? `Edit: ${productToEdit.name}` : 'Create Product'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {productToEdit
                ? 'Update product information, pricing, media, and live inventory.'
                : 'Add a new product to your storefront.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end shrink-0">
          <button
            type="button"
            onClick={() => handleSaveWithStatus('draft')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-[10px] transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSaveWithStatus('published')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[10px] transition-colors shadow-xs disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span>{productToEdit ? 'Save & Publish' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation / Server Error Banner */}
      {(errors.general || Object.keys(errors).length > 0) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-[12px] flex items-start gap-3 text-xs sm:text-sm text-rose-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-900">
              {errors.general || 'Please fix the following required details:'}
            </p>
            {Object.entries(errors)
              .filter(([key]) => key !== 'general')
              .map(([key, msg]) => (
                <p key={key} className="text-xs text-rose-700">
                  · {msg}
                </p>
              ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* B. MAIN EDITOR AREA — 68% Left Form / 32% Right Sticky Preview    */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.125fr)_minmax(0,1fr)] gap-6 items-start">
        {/* LEFT COLUMN (~68%) — Product Editing Studio */}
        <div className="space-y-6 min-w-0">
          {/* CARD 1: BASIC INFORMATION */}
          <section className="bg-white border border-slate-200/80 rounded-[14px] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-[15px] font-bold text-slate-900 font-display">
                Basic Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Core product title, URL handle, taxonomy, and storefront description.
              </p>
            </div>

            {/* Product Name & Bangla Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {name.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={120}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. Premium Cotton Polo Shirt"
                  className={`w-full px-3 py-2 text-sm text-slate-900 bg-white border rounded-[10px] placeholder:text-slate-400 focus:outline-none transition-colors ${
                    errors.name
                      ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/10'
                      : 'border-slate-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Bangla Name (বাংলা নাম)
                  </label>
                  <span className="text-[11px] text-slate-400">Optional</span>
                </div>
                <input
                  type="text"
                  value={bengaliName}
                  onChange={(e) => setBengaliName(e.target.value)}
                  placeholder="যেমন: প্রিমিয়াম কটন পোলো শার্ট"
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-[10px] placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 transition-colors font-bengali"
                />
              </div>
            </div>

            {/* Product Slug + Category + Brand */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Product Slug
                  </label>
                  {isSlugCustomized && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSlugCustomized(false);
                        setSlug(slugifyText(name));
                      }}
                      className="text-[11px] font-semibold text-[#16A34A] hover:text-[#15803D] cursor-pointer"
                    >
                      Auto
                    </button>
                  )}
                </div>
                <div className="flex items-center bg-[#F8FAF9] border border-slate-300 rounded-[10px] overflow-hidden focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-[#16A34A]/15">
                  <span className="pl-2.5 pr-1 py-2 text-[11px] font-mono text-slate-400 shrink-0 select-none">
                    /products/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setIsSlugCustomized(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                    }}
                    placeholder="product-slug"
                    className="w-full pr-2.5 py-2 text-xs font-mono text-slate-800 bg-transparent focus:outline-none min-w-0"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  {onAddCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsInlineCategoryOpen(!isInlineCategoryOpen);
                        setInlineCatError(null);
                      }}
                      className="text-[11px] font-semibold text-[#16A34A] hover:text-[#15803D] flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isInlineCategoryOpen ? 'Close' : 'Add'}</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (errors.category) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.category;
                          return next;
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-[10px] text-slate-900 focus:outline-none transition-colors appearance-none cursor-pointer pr-8 ${
                      errors.category
                        ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/10'
                        : 'border-slate-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                    }`}
                  >
                    {!category && (
                      <option value="" disabled>
                        Select category...
                      </option>
                    )}
                    {getCategorySelectOptions(categories, category).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Layers className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.category && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.category}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="MUAZ ELECTRONIC"
                  list="muaz-brand-suggestions"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15"
                />
                <datalist id="muaz-brand-suggestions">
                  {BRAND_SUGGESTIONS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Inline Quick Category Creator */}
            {isInlineCategoryOpen && (
              <div className="p-3.5 bg-[#F8FAF9] border border-slate-200 rounded-[10px] space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Quick Add Category</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsInlineCategoryOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                    aria-label="Close category creator"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {inlineCatError && (
                  <p className="text-xs text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-[8px] border border-rose-200">
                    {inlineCatError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={inlineCatName}
                    onChange={(e) => setInlineCatName(e.target.value)}
                    placeholder="English Name (e.g. Polo T-Shirts) *"
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 focus:outline-none focus:border-[#16A34A]"
                  />
                  <input
                    type="text"
                    value={inlineCatBengali}
                    onChange={(e) => setInlineCatBengali(e.target.value)}
                    placeholder="বাংলা নাম (যেমন: পোলো টি-শার্ট)"
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 focus:outline-none focus:border-[#16A34A] font-bengali"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInlineCategoryOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
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
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[8px] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isCreatingCategory ? 'Creating...' : 'Save & Select'}
                  </button>
                </div>
              </div>
            )}

            {/* Compact Expandable Description Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Product Description
                </label>
                <span className="text-[11px] text-slate-400">
                  Shown on storefront product page
                </span>
              </div>

              <div className="border border-slate-300 rounded-[10px] overflow-hidden focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-[#16A34A]/15 transition-colors bg-white">
                <div className="flex items-center justify-between px-2 py-1 bg-[#F8FAF9] border-b border-slate-200/80">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('**', '**')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-[6px] transition-colors cursor-pointer"
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('*', '*')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-[6px] transition-colors cursor-pointer"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('### ')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-[6px] transition-colors cursor-pointer"
                      title="Heading"
                    >
                      <Heading className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3.5 bg-slate-200 mx-1" />
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('\n- ')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-[6px] transition-colors cursor-pointer"
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('\n1. ')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-[6px] transition-colors cursor-pointer"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('[', '](https://)')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-[6px] transition-colors cursor-pointer"
                      title="Link"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertFormat('`', '`')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-[6px] transition-colors cursor-pointer"
                      title="Code"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-white rounded-[6px] transition-colors cursor-pointer"
                    title={isDescExpanded ? 'Compact height' : 'Expand editor'}
                  >
                    {isDescExpanded ? (
                      <>
                        <Minimize2 className="w-3 h-3" />
                        <span>Compact</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3 h-3" />
                        <span>Expand</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  ref={descTextareaRef}
                  rows={isDescExpanded ? 7 : 3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe material, key features, warranty, and usage details..."
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none resize-y leading-relaxed transition-all"
                />
              </div>
            </div>
          </section>

          {/* CARD 2: PRODUCT MEDIA */}
          <section className="bg-white border border-slate-200/80 rounded-[14px] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900 font-display">
                  Product Media
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload photos or add via HTTPS URL. Click any thumbnail to set as Main Image.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] border transition-colors cursor-pointer whitespace-nowrap ${
                    showUrlInput
                      ? 'bg-[#ECFDF3] text-[#15803D] border-emerald-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Add via URL</span>
                </button>
              </div>
            </div>

            {showUrlInput && (
              <div className="p-3 bg-[#F8FAF9] border border-slate-200 rounded-[10px] flex flex-col sm:flex-row gap-2 animate-in fade-in">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrlImage();
                    }
                  }}
                  placeholder="https://cdn.example.com/product-image.jpg"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A]"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-[#16A34A] hover:bg-[#15803D] text-white rounded-[8px] transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  Add Image
                </button>
              </div>
            )}

            {uploadProgress !== null && (
              <div className="p-3 bg-[#F8FAF9] border border-slate-200 rounded-[10px] space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-[#16A34A] animate-spin" />
                    <span>Uploading images...</span>
                  </span>
                  <span className="font-mono tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#16A34A] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {mediaItems.length === 0 ? (
              /* Large Drag & Drop Upload Zone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[12px] py-10 px-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#16A34A] bg-[#ECFDF3]'
                    : errors.image
                    ? 'border-rose-300 bg-rose-50/40 hover:border-[#16A34A]'
                    : 'border-slate-300 hover:border-[#16A34A] bg-[#F8FAF9] hover:bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-[12px] bg-white border border-slate-200 flex items-center justify-center text-[#16A34A] mx-auto mb-3 shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  Drag &amp; drop product images here, or{' '}
                  <span className="text-[#16A34A] underline underline-offset-4">
                    choose files
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Upload multiple PNG, JPG, or WEBP photos (up to 5 MB each)
                </p>
              </div>
            ) : (
              /* Shopify Bento Media Gallery Grid */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-[12px] transition-colors ${
                  isDragging ? 'ring-2 ring-[#16A34A] bg-[#ECFDF3]/40 p-2' : ''
                }`}
              >
                {mediaItems.map((item, idx) => {
                  const isPrimary = idx === primaryImageIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPrimaryImageIndex(idx)}
                      className={`group relative rounded-[12px] border bg-white overflow-hidden transition-all cursor-pointer ${
                        idx === 0 ? 'col-span-2 row-span-2' : 'col-span-1'
                      } ${
                        isPrimary
                          ? 'border-2 border-[#16A34A] ring-2 ring-[#16A34A]/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="aspect-square bg-[#F8FAF9] p-3 flex items-center justify-center relative">
                        <img
                          src={item.url}
                          alt={`Product ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />

                        {isPrimary && (
                          <span className="absolute top-2.5 left-2.5 bg-[#16A34A] text-white font-semibold text-[10px] px-2 py-0.5 rounded-[6px] shadow-2xs flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            <span>Main</span>
                          </span>
                        )}

                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveImage(idx, idx - 1);
                              }}
                              className="w-7 h-7 rounded-[8px] bg-white/95 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-2xs cursor-pointer"
                              title="Move Left"
                              aria-label="Move image left"
                            >
                              <MoveLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < mediaItems.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveImage(idx, idx + 1);
                              }}
                              className="w-7 h-7 rounded-[8px] bg-white/95 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-2xs cursor-pointer"
                              title="Move Right"
                              aria-label="Move image right"
                            >
                              <MoveRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImageAt(idx);
                            }}
                            className="w-7 h-7 rounded-[8px] bg-white/95 border border-slate-200 text-slate-500 hover:text-rose-600 flex items-center justify-center shadow-2xs cursor-pointer"
                            title="Remove Image"
                            aria-label="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Compact Add More Tile */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-[12px] border-2 border-dashed border-slate-300 hover:border-[#16A34A] bg-[#F8FAF9] hover:bg-white flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-[#16A34A] transition-colors p-3 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-semibold">Add Media</span>
                </button>
              </div>
            )}

            {errors.image && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.image}</span>
              </p>
            )}
          </section>

          {/* CARD 3: PRICING & INVENTORY (Clean Two-Column Form Layout) */}
          <section className="bg-white border border-slate-200/80 rounded-[14px] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900 font-display">
                  Pricing &amp; Inventory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer pricing, promotional savings, SKU, and general stock levels.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500">BDT (৳)</span>
            </div>

            {/* Clean Two-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Regular Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Regular Price <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value === '' ? '' : Number(e.target.value));
                      if (errors.price) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.price;
                          return next;
                        });
                      }
                    }}
                    placeholder="1500"
                    className={`w-full pl-7 pr-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white border rounded-[10px] focus:outline-none transition-colors tabular-nums ${
                      errors.price
                        ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/10'
                        : 'border-slate-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                    }`}
                  />
                </div>
                {errors.price && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.price}</span>
                  </p>
                )}
              </div>

              {/* Discount Price */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Discount Price
                  </label>
                  {discountInfo.valid ? (
                    <span className="text-[11px] font-semibold text-[#15803D] flex items-center gap-0.5 tabular-nums">
                      <Percent className="w-3 h-3" />
                      {discountInfo.percent}% OFF (Save ৳{discountInfo.savings.toLocaleString()})
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Optional</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={salePrice}
                    onChange={(e) => {
                      setSalePrice(e.target.value === '' ? '' : Number(e.target.value));
                      if (errors.salePrice) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.salePrice;
                          return next;
                        });
                      }
                    }}
                    placeholder="1200"
                    className={`w-full pl-7 pr-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white border rounded-[10px] focus:outline-none transition-colors tabular-nums ${
                      errors.salePrice
                        ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/10'
                        : 'border-slate-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                    }`}
                  />
                </div>
                {errors.salePrice && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.salePrice}</span>
                  </p>
                )}
              </div>

              {/* Cost per Item */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Cost per Item
                  </label>
                  {profitMargin.valid ? (
                    <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                      Margin: {profitMargin.margin}% (+৳{profitMargin.profit.toLocaleString()})
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Internal only</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={costPrice}
                    onChange={(e) =>
                      setCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="850"
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-[10px] focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 tabular-nums"
                  />
                </div>
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="ME-PRD-1001"
                  className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-[10px] placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15"
                />
              </div>

              {/* General Stock */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {useClothingSizes ? 'Total Size Stock' : 'General Stock'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  {useClothingSizes && (
                    <span className="text-[11px] font-medium text-[#15803D]">
                      Synced from sizes
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={useClothingSizes}
                    onClick={() =>
                      setStock((prev) =>
                        Math.max(0, (typeof prev === 'number' ? prev : 0) - 1)
                      )
                    }
                    className="w-9 h-9 rounded-[10px] bg-[#F8FAF9] hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    readOnly={useClothingSizes}
                    value={useClothingSizes ? effectiveStock : stock}
                    onChange={(e) => {
                      if (useClothingSizes) return;
                      setStock(e.target.value === '' ? '' : Number(e.target.value));
                      if (errors.stock) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.stock;
                          return next;
                        });
                      }
                    }}
                    placeholder="20"
                    className={`w-full text-center py-2 text-sm font-mono font-bold border rounded-[10px] focus:outline-none transition-colors tabular-nums ${
                      useClothingSizes
                        ? 'bg-[#F8FAF9] border-slate-200 text-slate-600 cursor-not-allowed'
                        : errors.stock
                        ? 'bg-white border-rose-400 text-slate-900 focus:border-rose-500 ring-2 ring-rose-500/10'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                    }`}
                  />
                  <button
                    type="button"
                    disabled={useClothingSizes}
                    onClick={() =>
                      setStock((prev) => (typeof prev === 'number' ? prev : 0) + 1)
                    }
                    className="w-9 h-9 rounded-[10px] bg-[#F8FAF9] hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    +
                  </button>
                </div>
                {errors.stock && !useClothingSizes && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.stock}</span>
                  </p>
                )}
              </div>

              {/* Stock Status + Barcode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Stock Status &amp; Barcode
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-3 py-2 rounded-[10px] border flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 tabular-nums ${stockStatus.badge}`}
                  >
                    <StockStatusIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{stockStatus.label}</span>
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Barcode"
                      className="w-full pl-8 pr-2.5 py-2 text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-[10px] placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={continueSellingWhenOutOfStock}
                  onChange={(e) => setContinueSellingWhenOutOfStock(e.target.checked)}
                  className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
                />
                <span>Continue selling when out of stock (allow backorders)</span>
              </label>
            </div>
          </section>

          {/* CARD 4: CLOTHING SIZE MANAGEMENT (Compact Inventory Table) */}
          <section aria-label="Clothing Size Management">
            <ClothingSizeStockManager
              compact
              value={sizeInventoryState}
              onChange={(next) => {
                setSizeInventoryState(next);
                if (errors.sizes) {
                  setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.sizes;
                    return updated;
                  });
                }
              }}
              onSaveChanges={handleSaveSizeChanges}
              saveButtonLabel={productToEdit ? 'Save Size Stock' : 'Save & Publish'}
              isDirty={isSizeInventoryDirty}
              validationError={errors.sizes || null}
            />
          </section>

          {/* CARD 5: ADDITIONAL INFORMATION */}
          <section className="bg-white border border-slate-200/80 rounded-[14px] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-[15px] font-bold text-slate-900 font-display">
                Additional Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visibility, featured placement, tags, SEO metadata, variants, and technical specifications.
              </p>
            </div>

            {/* Status & Featured */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Product Status
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-[10px] border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-[8px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      status === 'published'
                        ? 'bg-white text-[#15803D] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Published</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-[8px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      status === 'draft'
                        ? 'bg-white text-amber-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Draft</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Featured Placement
                </label>
                <button
                  type="button"
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`w-full px-3.5 py-2 rounded-[10px] border transition-colors flex items-center justify-between gap-2 text-left cursor-pointer ${
                    isFeatured
                      ? 'bg-[#ECFDF3] border-emerald-200 text-slate-900'
                      : 'bg-[#F8FAF9] border-slate-200 text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold truncate">
                    <Star
                      className={`w-4 h-4 shrink-0 ${
                        isFeatured ? 'text-[#16A34A] fill-[#16A34A]' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">Feature on Storefront Homepage</span>
                  </span>
                  <span
                    className={`text-[11px] font-semibold shrink-0 ${
                      isFeatured ? 'text-[#15803D]' : 'text-slate-400'
                    }`}
                  >
                    {isFeatured ? 'Enabled' : 'Off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Product Tags */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Product Tags</span>
                </label>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {tags.length} tags
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
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
                  placeholder="Add tag and press Enter..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A]"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(newTagInput)}
                  disabled={!newTagInput.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[8px] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  Add Tag
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-xs font-medium bg-[#ECFDF3] text-[#15803D] border border-emerald-200/80"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-emerald-600 hover:text-rose-600 cursor-pointer ml-0.5"
                      aria-label={`Remove tag ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {DEFAULT_TAG_OPTIONS.filter((opt) => !tags.includes(opt))
                  .slice(0, 4)
                  .map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleAddTag(opt)}
                      className="text-[11px] text-slate-500 hover:text-slate-900 px-2 py-0.5 rounded-[6px] border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                    >
                      + {opt}
                    </button>
                  ))}
              </div>
            </div>

            {/* Accordion 1: SEO Information */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSeoSection(!showSeoSection)}
                className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#16A34A]" />
                  <span>Search Engine Listing (SEO)</span>
                </span>
                {showSeoSection ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showSeoSection && (
                <div className="mt-3 space-y-3 animate-in fade-in">
                  <div className="p-3 bg-[#F8FAF9] border border-slate-200/80 rounded-[10px] space-y-0.5">
                    <span className="text-[11px] font-mono text-[#15803D] block truncate">
                      https://www.muazelectronic.online/products/{displaySlug}
                    </span>
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {seoTitle.trim() || name.trim() || 'Product Page Title'} — MUAZ ELECTRONIC
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {seoDescription.trim() ||
                        description.trim() ||
                        'Shop online at MUAZ ELECTRONIC with nationwide Cash on Delivery across Bangladesh.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          SEO Title
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                          {(seoTitle || name).length}/70
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={70}
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder={name || 'Defaults to Product Name'}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 focus:outline-none focus:border-[#16A34A]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          SEO Meta Description
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                          {(seoDescription || description).length}/160
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        maxLength={160}
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder="Short summary for search engines..."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 focus:outline-none focus:border-[#16A34A] resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Color / Edition Variants */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowVariantsSection(!showVariantsSection)}
                className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#16A34A]" />
                  <span>Color / Edition Variants</span>
                  {hasVariants && (
                    <span className="text-[11px] font-medium text-[#15803D]">
                      ({variantsList.length} active)
                    </span>
                  )}
                </span>
                {showVariantsSection ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showVariantsSection && (
                <div className="mt-3 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between p-3 bg-[#F8FAF9] border border-slate-200 rounded-[10px]">
                    <span className="text-xs font-medium text-slate-700">
                      Enable option variants (e.g. Color, Storage)
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => setHasVariants(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#16A34A]" />
                    </label>
                  </div>

                  {hasVariants && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Option Name
                          </label>
                          <input
                            type="text"
                            value={variantOptionName}
                            onChange={(e) => setVariantOptionName(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 focus:outline-none focus:border-[#16A34A]"
                          />
                        </div>
                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Values (comma separated)
                          </label>
                          <input
                            type="text"
                            value={variantValuesInput}
                            onChange={(e) => setVariantValuesInput(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 focus:outline-none focus:border-[#16A34A]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={handleUpdateVariantsFromInput}
                            className="w-full py-1.5 px-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-[8px] cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-[10px] overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#F8FAF9] border-b border-slate-200 text-slate-600 font-semibold">
                            <tr>
                              <th className="p-2.5">Variant</th>
                              <th className="p-2.5">SKU</th>
                              <th className="p-2.5">Price (৳)</th>
                              <th className="p-2.5">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {variantsList.map((variant, vIdx) => (
                              <tr key={variant.id}>
                                <td className="p-2.5 font-semibold text-slate-900">
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
                                    className="w-28 px-2 py-1 text-xs border border-slate-300 rounded-[6px] font-mono focus:outline-none focus:border-[#16A34A]"
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
                                    className="w-24 px-2 py-1 text-xs border border-slate-300 rounded-[6px] font-mono font-bold tabular-nums focus:outline-none focus:border-[#16A34A]"
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
                                    className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-[6px] font-mono tabular-nums focus:outline-none focus:border-[#16A34A]"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 3: Highlights & Technical Specifications */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdvancedSpecs(!showAdvancedSpecs)}
                className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#16A34A]" />
                  <span>Bullet Highlights &amp; Specifications</span>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    ({features.filter(Boolean).length} · {specs.filter((s) => s.label).length})
                  </span>
                </span>
                {showAdvancedSpecs ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showAdvancedSpecs && (
                <div className="mt-3 space-y-4 animate-in fade-in">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <AlignLeft className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>Bullet Highlights</span>
                      </span>
                      <button
                        type="button"
                        onClick={addFeatureRow}
                        className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D] flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Point</span>
                      </button>
                    </div>
                    {features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => handleFeatureChange(idx, e.target.value)}
                          placeholder={`Highlight #${idx + 1}`}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 focus:outline-none focus:border-[#16A34A]"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeatureRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          aria-label="Remove highlight"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>Specifications</span>
                      </span>
                      <button
                        type="button"
                        onClick={addSpecRow}
                        className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D] flex items-center gap-1 cursor-pointer"
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
                          placeholder="Label (e.g. Fabric)"
                          className="col-span-5 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 focus:outline-none focus:border-[#16A34A]"
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                          placeholder="Value (e.g. 100% Cotton)"
                          className="col-span-6 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-[8px] text-slate-900 focus:outline-none focus:border-[#16A34A]"
                        />
                        <button
                          type="button"
                          onClick={() => removeSpecRow(idx)}
                          className="col-span-1 p-1.5 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                          aria-label="Remove specification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN (~32%) — Sticky Live Product Preview                 */}
        {/* ================================================================= */}
        <aside className="w-full min-w-0 xl:sticky xl:top-20 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-[14px] p-5 shadow-xs space-y-4">
            {/* Preview Panel Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#16A34A]" />
                <h2 className="text-sm font-bold text-slate-900 font-display">
                  Live Product Preview
                </h2>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-[6px] border ${
                  status === 'published'
                    ? 'bg-[#ECFDF3] text-[#15803D] border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>

            {/* Storefront Product Card Preview */}
            <div className="bg-white border border-slate-200/90 rounded-[14px] overflow-hidden">
              {/* Large Product Image Stage */}
              <div className="relative w-full aspect-[4/3] bg-[#F7F8F7] flex items-center justify-center p-4 border-b border-slate-100 overflow-hidden">
                {activeHeroImage ? (
                  <img
                    src={activeHeroImage}
                    alt={name || 'Product preview'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain object-center"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center gap-1.5 text-slate-400">
                    <ImageIcon className="w-9 h-9 text-slate-300" />
                    <span className="text-xs font-medium">Product image preview</span>
                  </div>
                )}

                {discountInfo.valid && (
                  <span className="absolute top-3 left-3 bg-[#16A34A] text-white text-[11px] font-bold px-2 py-0.5 rounded-[6px] tabular-nums">
                    -{discountInfo.percent}%
                  </span>
                )}

                <div className="absolute top-3 right-3 w-7 h-7 rounded-[8px] bg-white/95 border border-slate-200/80 flex items-center justify-center text-slate-400">
                  <Heart className="w-3.5 h-3.5" />
                </div>

                {effectiveStock <= 0 && !continueSellingWhenOutOfStock && (
                  <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-[8px]">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Category & Brand Metadata */}
                <div className="flex items-center justify-between gap-2 text-[11.5px] text-slate-500">
                  <span className="truncate">
                    {category || 'Category'} · {brand || 'MUAZ ELECTRONIC'}
                  </span>
                  {isFeatured && (
                    <span className="inline-flex items-center gap-1 text-[#15803D] font-semibold shrink-0">
                      <Star className="w-3 h-3 fill-[#16A34A] text-[#16A34A]" />
                      Featured
                    </span>
                  )}
                </div>

                {/* Product Title */}
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2">
                    {name.trim() || 'Product Title'}
                  </h3>
                  {bengaliName.trim() && (
                    <p className="text-xs text-slate-500 font-bengali mt-0.5 truncate">
                      {bengaliName}
                    </p>
                  )}
                </div>

                {/* Regular & Discount Pricing */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-lg font-bold text-slate-900 font-display tabular-nums">
                    ৳{Number(discountInfo.valid ? salePrice : price || 0).toLocaleString()}
                  </span>
                  {discountInfo.valid && (
                    <>
                      <span className="text-xs text-slate-400 line-through tabular-nums">
                        ৳{Number(price).toLocaleString()}
                      </span>
                      <span className="text-[11px] font-semibold text-[#15803D] tabular-nums">
                        Save ৳{discountInfo.savings.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>

                {/* Availability */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Availability</span>
                  <span
                    className={`font-semibold flex items-center gap-1 tabular-nums ${
                      (useClothingSizes ? previewSizeStock : effectiveStock) <= 0
                        ? 'text-rose-600'
                        : (useClothingSizes ? previewSizeStock : effectiveStock) <= 5
                        ? 'text-amber-700'
                        : 'text-[#15803D]'
                    }`}
                  >
                    {(useClothingSizes ? previewSizeStock : effectiveStock) <= 0 ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Out of Stock</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          In Stock ({useClothingSizes ? previewSizeStock : effectiveStock} pcs)
                        </span>
                      </>
                    )}
                  </span>
                </div>

                {/* Clothing Size Selection Preview */}
                {useClothingSizes && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Ruler className="w-3 h-3 text-[#16A34A]" />
                        <span>Size</span>
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {previewSelectedSize
                          ? `${previewSelectedSize} · ${previewSizeStock} available`
                          : 'Select size'}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {CLOTHING_SIZES.map((sz) => {
                        const entry = sizeInventoryState[sz];
                        const enabled = Boolean(entry?.enabled);
                        const qty = enabled ? sanitizeWholeStock(entry?.stock) : 0;
                        const available = enabled && qty > 0;
                        const selected = previewSelectedSize === sz;

                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              if (enabled) setPreviewSelectedSize(sz);
                            }}
                            disabled={!enabled}
                            title={
                              !enabled
                                ? `${sz}: Disabled`
                                : qty === 0
                                ? `${sz}: Out of Stock`
                                : `${sz}: ${qty} in stock`
                            }
                            className={`py-1.5 rounded-[8px] border text-xs font-mono font-bold transition-colors ${
                              selected
                                ? 'bg-[#16A34A] text-white border-[#16A34A]'
                                : available
                                ? 'bg-white text-slate-800 border-slate-300 hover:border-[#16A34A] cursor-pointer'
                                : enabled
                                ? 'bg-slate-50 text-slate-400 border-slate-200 line-through cursor-pointer'
                                : 'bg-slate-100/70 text-slate-300 border-slate-200/70 line-through cursor-not-allowed'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Storefront Action Preview */}
                <button
                  type="button"
                  disabled
                  className={`w-full py-2.5 px-3 rounded-[10px] font-semibold text-xs flex items-center justify-center gap-1.5 ${
                    effectiveStock > 0 || continueSellingWhenOutOfStock
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>
                    {effectiveStock <= 0 && !continueSellingWhenOutOfStock
                      ? 'Out of Stock'
                      : useClothingSizes && previewSelectedSize
                      ? `Add to Cart (${previewSelectedSize})`
                      : 'Add to Cart'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quiet Readiness Summary */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Catalog Readiness</span>
                <span
                  className={`font-semibold ${
                    formProgress.isComplete ? 'text-[#15803D]' : 'text-amber-700'
                  }`}
                >
                  {formProgress.isComplete
                    ? 'Ready to publish'
                    : `${formProgress.missing.length} required`}
                </span>
              </div>
              {!formProgress.isComplete && (
                <p className="text-[11px] text-slate-500">
                  Missing: {formProgress.missing.join(', ')}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ================================================================= */}
      {/* C. NON-OVERLAPPING BOTTOM ACTION BAR                              */}
      {/* ================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-[14px] px-4 sm:px-6 py-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Unsaved Changes Indicator */}
        <div className="flex items-center gap-2 text-xs min-w-0">
          {hasUnsavedChanges ? (
            <span className="inline-flex items-center gap-1.5 text-amber-800 font-semibold truncate">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Unsaved changes</span>
            </span>
          ) : formProgress.isComplete ? (
            <span className="inline-flex items-center gap-1.5 text-[#15803D] font-semibold truncate">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>All required product details complete</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium truncate">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Required: {formProgress.missing.join(', ')}</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDiscardClick}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-[10px] transition-colors text-center disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={() => handleSaveWithStatus('draft')}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-800 hover:text-slate-950 bg-[#F8FAF9] hover:bg-slate-100 border border-slate-300 rounded-[10px] transition-colors text-center disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSaveWithStatus('published')}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[10px] transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span>{productToEdit ? 'Save & Publish' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      <AdminConfirmModal
        isOpen={discardConfirmOpen}
        onClose={() => setDiscardConfirmOpen(false)}
        onConfirm={() => {
          setDiscardConfirmOpen(false);
          onClose();
        }}
        title="Discard unsaved changes?"
        description="You have unsaved product details. Leaving this editor will discard your changes."
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="danger"
      />
    </form>
  );
};
