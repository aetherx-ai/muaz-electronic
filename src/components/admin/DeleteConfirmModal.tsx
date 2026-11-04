import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Product } from '../../types';

interface DeleteConfirmModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#141519] border border-white/[0.1] rounded-xl p-5 sm:p-6 shadow-2xl shadow-black/90 relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded-lg transition-colors"
          disabled={isDeleting}
          title="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-base font-bold text-zinc-100">
              প্রোডাক্টটি ডিলিট করতে চান?
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              এই অ্যাকশনটি স্থায়ী। আপনি কি নিশ্চিত যে এই প্রোডাক্টটি ক্যাটালগ থেকে সম্পূর্ণ মুছে ফেলতে চান?
            </p>
          </div>
        </div>

        {/* Product preview */}
        <div className="mt-4 p-3 bg-[#1a1b20] border border-white/[0.06] rounded-lg flex items-center gap-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-11 h-11 rounded-md object-cover bg-[#121316] border border-white/[0.08] shrink-0"
          />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-zinc-100 truncate">{product.name}</p>
            <p className="text-[#FFC928] font-bold mt-0.5">
              ৳{product.price.toLocaleString('en-IN')}
              {product.salePrice && product.salePrice < product.price && (
                <span className="text-zinc-500 line-through font-normal ml-1.5 text-[11px]">
                  ৳{product.salePrice.toLocaleString('en-IN')}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors disabled:opacity-50"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm shadow-rose-600/20 disabled:opacity-50"
          >
            {isDeleting ? (
              <span>ডিলিট হচ্ছে...</span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>হ্যাঁ, ডিলিট করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
