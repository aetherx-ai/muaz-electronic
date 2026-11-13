import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, ClothingSize } from '../types';
import {
  getAvailableStockForSize,
  getEffectiveUnitPrice,
  hasEnabledSizes,
  isValidClothingSize,
} from '../lib/sizeInventory';

interface AddToCartResult {
  added: boolean;
  error?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: ClothingSize) => AddToCartResult;
  removeFromCart: (productId: string, selectedSize?: ClothingSize) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: ClothingSize) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  selectedProductForDetail: Product | null;
  setSelectedProductForDetail: React.Dispatch<React.SetStateAction<Product | null>>;
}

const CART_STORAGE_KEY = 'muaz_electronic_cart_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

const isSameCartItem = (
  item: CartItem,
  productId: string,
  selectedSize?: ClothingSize
): boolean => {
  return (
    item.product.id === productId &&
    (item.selectedSize || undefined) === (selectedSize || undefined)
  );
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedSize?: ClothingSize
  ): AddToCartResult => {
    const requestedQty = Math.max(1, Math.floor(Number(quantity) || 1));
    const productHasSizes = hasEnabledSizes(product);
    const normalizedSize = productHasSizes ? selectedSize : undefined;

    if (productHasSizes) {
      if (!normalizedSize || !isValidClothingSize(normalizedSize)) {
        return { added: false, error: 'দয়া করে আগে একটি সাইজ নির্বাচন করুন' };
      }
      const sizeStock = getAvailableStockForSize(product, normalizedSize);
      if (sizeStock <= 0) {
        return { added: false, error: `সাইজ ${normalizedSize}-এর স্টক শেষ হয়ে গেছে` };
      }
    }

    const maxStock = getAvailableStockForSize(product, normalizedSize);
    if (maxStock <= 0) {
      return { added: false, error: 'এই পণ্যটির পর্যাপ্ত স্টক নেই' };
    }

    const existingItem = items.find((item) =>
      isSameCartItem(item, product.id, normalizedSize)
    );
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (currentQty >= maxStock) {
      return {
        added: false,
        error: normalizedSize
          ? `সাইজ ${normalizedSize}-এর সর্বোচ্চ স্টক (${maxStock} টি) ইতিমধ্যে কার্টে রয়েছে`
          : `সর্বোচ্চ স্টক (${maxStock} টি) ইতিমধ্যে কার্টে রয়েছে`,
      };
    }

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) =>
        isSameCartItem(item, product.id, normalizedSize)
      );
      if (existingIndex > -1) {
        const newItems = [...prevItems];
        const prevQty = newItems[existingIndex].quantity;
        const cappedQty = Math.min(maxStock, prevQty + requestedQty);
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          product,
          quantity: cappedQty,
        };
        return newItems;
      }

      const initialQty = Math.min(maxStock, requestedQty);
      const newItem: CartItem = normalizedSize
        ? { product, quantity: initialQty, selectedSize: normalizedSize }
        : { product, quantity: initialQty };
      return [...prevItems, newItem];
    });

    setIsCartOpen(true);
    return { added: true };
  };

  const removeFromCart = (productId: string, selectedSize?: ClothingSize) => {
    setItems((prev) =>
      prev.filter((item) => !isSameCartItem(item, productId, selectedSize))
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    selectedSize?: ClothingSize
  ) => {
    const wholeQty = Math.floor(Number(quantity) || 0);
    if (wholeQty <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (!isSameCartItem(item, productId, selectedSize)) return item;
        const maxStock = getAvailableStockForSize(item.product, item.selectedSize);
        const cappedQty = maxStock > 0 ? Math.min(wholeQty, maxStock) : wholeQty;
        return { ...item, quantity: Math.max(1, cappedQty) };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + getEffectiveUnitPrice(item.product) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        selectedProductForDetail,
        setSelectedProductForDetail,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
