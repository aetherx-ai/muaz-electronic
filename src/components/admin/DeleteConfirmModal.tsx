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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200/90 rounded-[12px] p-5 sm:p-6 shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[8px] transition-colors"
          disabled={isDeleting}
          title="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-base font-bold text-slate-900 font-display">
              প্রোডাক্টটি ডিলিট করতে চান?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              এই অ্যাকশনটি স্থায়ী। আপনি কি নিশ্চিত যে এই প্রোডাক্টটি ক্যাটালগ থেকে সম্পূর্ণ মুছে ফেলতে চান?
            </p>
          </div>
        </div>

        {/* Product preview */}
        <div className="mt-4 p-3 bg-[#F8FAF9] border border-slate-200/80 rounded-[10px] flex items-center gap-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-11 h-11 rounded-[8px] object-cover bg-slate-100 border border-slate-200 shrink-0"
          />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-slate-900 truncate">{product.name}</p>
            <p className="text-[#15803D] font-bold mt-0.5 tabular-nums">
              ৳{(product.salePrice || product.price).toLocaleString('en-IN')}
              {product.salePrice && product.salePrice < product.price && (
                <span className="text-slate-400 line-through font-normal ml-1.5 text-[11px]">
                  ৳{product.price.toLocaleString('en-IN')}
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
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-[10px] transition-colors disabled:opacity-50"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-[10px] transition-colors shadow-xs disabled:opacity-50"
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
