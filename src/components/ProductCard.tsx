import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { hasEnabledSizes, isProductOutOfStock, getEffectiveUnitPrice } from '../lib/sizeInventory';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setSelectedProductForDetail } = useCart();
  const [justAdded, setJustAdded] = useState(false);

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

  return (
    <article
      onClick={() => setSelectedProductForDetail(product)}
      className="bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col justify-between cursor-pointer hover:border-gray-300 transition-colors text-left"
    >
      {/* Image Box */}
      <div className="relative w-full aspect-square bg-gray-50 border-b border-gray-200 flex items-center justify-center p-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain object-center"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="px-2.5 py-1 bg-gray-900 text-white text-xs font-semibold rounded">
              স্টক শেষ
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <p className="text-[11px] text-gray-500 truncate">{product.category}</p>
          <h3 className="mt-0.5 text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[2.4rem]">
            {product.name}
          </h3>

          <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-gray-900 tabular-nums">
              ৳{currentPrice.toLocaleString()}
            </span>
            {oldPrice && (
              <span className="text-xs text-gray-400 line-through tabular-nums">
                ৳{oldPrice.toLocaleString()}
              </span>
            )}
            {discountPercent !== null && discountPercent > 0 && (
              <span className="text-[11px] font-semibold text-[#16A34A] tabular-nums">
                -{discountPercent}%
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full py-2 px-3 rounded-md font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : justAdded
              ? 'bg-[#15803D] text-white'
              : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4" />
              <span>কার্টে যোগ হয়েছে</span>
            </>
          ) : (
            <span>কার্টে যোগ করুন</span>
          )}
        </button>
      </div>
    </article>
  );
};
