import React, { useState } from 'react';
import { ShoppingCart, Heart, Share2, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { hasEnabledSizes, isProductOutOfStock, getEffectiveUnitPrice } from '../lib/sizeInventory';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setSelectedProductForDetail } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const isOutOfStock = isProductOutOfStock(product);
  const currentPrice = getEffectiveUnitPrice(product);
  const oldPrice = product.salePrice && product.salePrice < product.price ? product.price : null;
  const discountPercent = oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (hasEnabledSizes(product)) {
      setSelectedProductForDetail(product);
      return;
    }
    const res = addToCart(product, 1);
    if (res.added) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `${product.name} - MUAZ ELECTRONIC`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 1500);
  };

  return (
    <article
      onClick={() => setSelectedProductForDetail(product)}
      className="group relative bg-white border border-[#111827]/[0.06] rounded-[20px] overflow-hidden flex flex-col justify-between cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)] md:hover:-translate-y-1 transition-all duration-200 text-left"
    >
      {/* Top Image Container */}
      <div className="relative w-full aspect-square bg-[#F8FAF9] rounded-t-[20px] overflow-hidden flex items-center justify-center p-3 sm:p-4 border-b border-[#111827]/[0.03]">
        
        {/* Product Image */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain object-center group-hover:scale-[1.03] transition-transform duration-250 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Top-Left: Green Discount Badge */}
        {discountPercent !== null && discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-[#16A34A] text-white text-[11px] sm:text-[12px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs tracking-tight">
            -{discountPercent}%
          </div>
        )}

        {/* Top-Right: Circular Wishlist & Share buttons */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5 items-center">
          
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlist}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-center transition-all duration-150 hover:scale-105 hover:border-emerald-200 ${
              isWishlisted ? 'text-[#16A34A]' : 'text-gray-400 hover:text-[#16A34A]'
            }`}
            title="পছন্দের তালিকায় রাখুন"
            aria-label="পছন্দ করুন"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8] ${isWishlisted ? 'fill-[#16A34A] text-[#16A34A]' : 'text-gray-400'}`} />
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-center text-gray-400 hover:text-[#16A34A] transition-all duration-150 hover:scale-105 hover:border-emerald-200"
            title="শেয়ার করুন"
            aria-label="শেয়ার করুন"
          >
            {copiedShare ? (
              <Check className="w-3.5 h-3.5 text-[#16A34A] stroke-[2]" />
            ) : (
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8]" />
            )}
          </button>

        </div>

        {/* Out of Stock overlay if applicable */}
        {isOutOfStock && (
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
          {/* Title - Fixed 2-line height for perfect grid alignment */}
          <h3 className="text-[12.5px] sm:text-[13.5px] font-medium text-[#111827] group-hover:text-[#16A34A] transition-colors line-clamp-2 leading-snug h-[2.5rem] sm:h-[2.6rem]">
            {product.name}
          </h3>

          {/* Pricing: Bold Dark Current Price + Subtle Gray Old Price */}
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-[15px] sm:text-[17px] font-bold text-[#111827] font-display tabular-nums">
              ৳{currentPrice.toLocaleString()}
            </span>
            {oldPrice && (
              <span className="text-[11px] sm:text-[12px] text-[#9CA3AF] line-through font-normal tabular-nums">
                ৳{oldPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button (42-46px height, 12-14px border radius, full width) */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full mt-2.5 h-[42px] sm:h-[44px] px-3 rounded-[12px] sm:rounded-[14px] font-semibold text-[11.5px] sm:text-[13px] flex items-center justify-center gap-1.5 transition-all duration-150 shadow-2xs ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : justAdded
              ? 'bg-[#15803D] text-white'
              : 'bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white shadow-[0_2px_8px_rgba(22,163,74,0.22)]'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4 stroke-[2.2]" />
              <span>কার্টে যোগ হয়েছে</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 stroke-[1.9]" />
              <span>কার্টে যোগ করুন</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
