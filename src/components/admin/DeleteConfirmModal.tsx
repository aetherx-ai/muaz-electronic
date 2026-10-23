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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#111111] border border-[#292929] rounded-2xl p-6 shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#A7A7A7] hover:text-[#FAFAFA] rounded-lg transition-colors"
          disabled={isDeleting}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-lg font-bold text-[#FAFAFA]">প্রোডাক্টটি ডিলিট করতে চান?</h3>
            <p className="text-xs text-[#A7A7A7] mt-1 leading-relaxed">
              এই অ্যাকশনটি স্থায়ী। আপনি কি নিশ্চিত যে আপনি নিচের প্রোডাক্টটি স্থায়ীভাবে মুছে ফেলতে চান?
            </p>
          </div>
        </div>

        {/* Product preview */}
        <div className="mt-5 p-3 bg-[#171717] border border-[#292929] rounded-xl flex items-center gap-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-12 h-12 rounded-lg object-cover bg-[#0a0a0a] border border-[#292929]"
          />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-[#FAFAFA] truncate">{product.name}</p>
            <p className="text-[#FFC928] font-mono mt-0.5">৳{product.price.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 text-xs font-semibold text-[#A7A7A7] hover:text-[#FAFAFA] bg-[#171717] hover:bg-[#202020] border border-[#292929] rounded-lg transition-colors"
          >
            বাতিল করুন
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-50"
          >
            {isDeleting ? (
              <span>ডিলিট হচ্ছে...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>হ্যাঁ, ডিলিট করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
