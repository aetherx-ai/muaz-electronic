import React from 'react';
import { ShoppingBag, Eye, MessageCircle, Check, Star, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { WHATSAPP_INTL } from '../data/products';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, items, setSelectedProductForDetail } = useCart();

  const isItemInCart = items.some((item) => item.product.id === product.id);
  const isOutOfStock = product.stock <= 0;
  const effectivePrice = product.salePrice || product.price;

  const handleQuickWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `আসসালামু আলাইকুম, আমি Muaz Electronic থেকে সরাসরি "${product.name}" (মূল্য: ৳${effectivePrice.toLocaleString()}) অর্ডার করতে চাই।`;
    window.open(`https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <article
      onClick={() => setSelectedProductForDetail(product)}
      className="group relative bg-[#111111] hover:bg-[#141414] border border-[#292929] hover:border-[#FFC928]/40 rounded-xl overflow-hidden transition-all duration-200 flex flex-col cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1"
    >
      {/* Product Image Frame */}
      <div className="relative w-full aspect-[4/3] bg-[#0d0d0d] overflow-hidden border-b border-[#292929]/80">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Top Badges: Featured & Sale */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
          {product.isFeatured && (
            <div className="text-[10px] font-bold bg-[#070707]/90 text-[#FFC928] px-2 py-0.5 rounded border border-[#FFC928]/40 flex items-center gap-1 font-display">
              <Star className="w-3 h-3 fill-current" />
              <span>FEATURED</span>
            </div>
          )}
          {product.salePrice && product.salePrice < product.price && (
            <div className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded shadow-sm font-display">
              অফার
            </div>
          )}
        </div>

        {/* Quick View Floating Button on Hover */}
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProductForDetail(product);
            }}
            className="p-2 bg-[#070707]/90 hover:bg-[#FFC928] text-[#FAFAFA] hover:text-[#070707] rounded-lg backdrop-blur-sm transition-colors shadow-md"
            title="বিস্তারিত দেখুন"
            aria-label="বিস্তারিত দেখুন"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Stock status indicator */}
        <div className="absolute bottom-2 left-2">
          {isOutOfStock ? (
            <div className="text-[10px] font-bold bg-rose-950/90 text-rose-300 px-2 py-0.5 rounded border border-rose-500/40">
              আউট অব স্টক
            </div>
          ) : product.stock < 10 ? (
            <div className="text-[10px] font-medium bg-[#070707]/90 text-amber-400 px-2 py-0.5 rounded border border-amber-500/40">
              সীমিত স্টক: {product.stock} টি
            </div>
          ) : (
            <div className="text-[10px] font-medium bg-[#070707]/85 text-[#F7D77B] px-2 py-0.5 rounded border border-[#FFC928]/30 font-display">
              স্টক: {product.stock} পিস
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata: Category unboxed with subtle separator (Strict Zero-Pill) */}
          <div className="flex items-center gap-2 text-xs text-[#A7A7A7] mb-1.5">
            <span className="font-medium text-[#FFC928]/90 uppercase tracking-wider text-[11px]">
              {product.category}
            </span>
            <span aria-hidden="true" className="text-[#292929]">·</span>
            <span className="text-[11px]">{product.brand || 'অফিসিয়াল গ্যাজেট'}</span>
          </div>

          {/* Product Name (Readable, high contrast, clean typography) */}
          <h3 className="text-base font-semibold text-[#FAFAFA] group-hover:text-[#FFC928] transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Bengali Subtitle / Context */}
          {product.bengaliName && (
            <p className="text-xs text-[#A7A7A7] mt-1 line-clamp-1 font-bengali">
              {product.bengaliName}
            </p>
          )}
        </div>

        {/* Price and Actions */}
        <div className="mt-4 pt-3 border-t border-[#292929]">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#A7A7A7] block leading-none mb-1">
                প্রাইস
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#FFC928] font-display tabular-nums">
                  ৳{effectivePrice.toLocaleString()}
                </span>
                {product.salePrice && product.salePrice < product.price && (
                  <span className="text-xs text-[#A7A7A7] line-through font-mono">
                    ৳{product.price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            
            {/* Quick WhatsApp order text link */}
            {!isOutOfStock && (
              <button
                onClick={handleQuickWhatsApp}
                className="text-xs font-medium text-[#A7A7A7] hover:text-[#25D366] transition-colors flex items-center gap-1"
                title="সরাসরি WhatsApp-এ অর্ডার"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp অর্ডার</span>
              </button>
            )}
          </div>

          {/* Primary Action: Add to Cart */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isOutOfStock) {
                  addToCart(product, 1);
                }
              }}
              disabled={isOutOfStock}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                isOutOfStock
                  ? 'bg-[#171717] text-[#A7A7A7] border border-[#292929] cursor-not-allowed opacity-60'
                  : isItemInCart
                  ? 'bg-[#171717] border border-[#FFC928] text-[#FFC928]'
                  : 'bg-[#FFC928] hover:bg-[#F7D77B] text-[#070707] shadow-sm'
              }`}
            >
              {isOutOfStock ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>স্টক শেষ</span>
                </>
              ) : isItemInCart ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>কার্টে যুক্ত আছে</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>কার্টে যোগ করুন</span>
                </>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProductForDetail(product);
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium bg-[#171717] hover:bg-[#202020] text-[#FAFAFA] border border-[#292929] hover:border-[#A7A7A7]/40 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#A7A7A7]" />
              <span>বিস্তারিত</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
