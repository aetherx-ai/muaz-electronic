import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ShieldAlert, ArrowRight, Trash2 } from 'lucide-react';
import { Category } from '../../types';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (categoryId: string, reassignToCategoryName?: string) => Promise<void>;
  categoryToDelete: Category | null;
  availableCategories: Category[];
  isDeleting: boolean;
}

export const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categoryToDelete,
  availableCategories,
  isDeleting,
}) => {
  const [reassignCategory, setReassignCategory] = useState<string>('');

  const productCount = categoryToDelete?.productCount || 0;
  const hasProducts = productCount > 0;

  // Other categories eligible for reassignment
  const otherCategories = availableCategories.filter(
    (c) => c.id !== categoryToDelete?.id && c.name !== categoryToDelete?.name
  );

  useEffect(() => {
    if (otherCategories.length > 0) {
      setReassignCategory(otherCategories[0].name);
    } else {
      setReassignCategory('');
    }
  }, [categoryToDelete, availableCategories]);

  if (!isOpen || !categoryToDelete) return null;

  const handleConfirm = async () => {
    if (hasProducts && !reassignCategory) {
      return;
    }
    await onConfirm(categoryToDelete.id, hasProducts ? reassignCategory : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#292929] flex items-center justify-between bg-[#0e0e0e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FAFAFA] font-display">
                ক্যাটাগরি মুছে ফেলার নিশ্চয়তা
              </h3>
              <p className="text-xs text-[#A7A7A7]">
                "{categoryToDelete.name}" ক্যাটাগরি ডিলিট
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A7A7A7] hover:text-[#FAFAFA] hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {hasProducts ? (
            // ACCIDENTAL DELETION PREVENTION & REASSIGNMENT (Requirement 9)
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-200">
                <ShieldAlert className="w-5 h-5 text-[#FFC928] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-300 block text-[13px]">
                    দুর্ঘটনাজনিত ডিলিট প্রতিরোধ সক্রিয়!
                  </span>
                  <p className="text-amber-200/90 leading-relaxed">
                    এই ক্যাটাগরিতে বর্তমানে <strong>{productCount}</strong> টি প্রোডাক্ট অন্তর্ভুক্ত রয়েছে।
                    সরাসরি মুছে ফেললে প্রোডাক্টগুলোর ক্যাটাগরি লিঙ্ক হারিয়ে যাওয়ার ঝুঁকি রয়েছে।
                  </p>
                  <p className="text-amber-200/90 leading-relaxed font-semibold">
                    দয়া করে মোছার পূর্বে প্রোডাক্টগুলোকে অন্য কোনো বিভাগে স্থানান্তর (Reassign) করুন:
                  </p>
                </div>
              </div>

              {/* Reassignment Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#FAFAFA]">
                  প্রোডাক্ট স্থানান্তর করার নতুন ক্যাটাগরি *
                </label>
                <div className="relative">
                  <select
                    value={reassignCategory}
                    onChange={(e) => setReassignCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#171717] border border-[#292929] rounded-xl text-[#FAFAFA] focus:outline-none focus:border-[#FFC928] appearance-none"
                  >
                    {otherCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} {c.bengaliName ? `(${c.bengaliName})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                    ▼
                  </div>
                </div>
                <p className="text-[11px] text-[#A7A7A7] flex items-center gap-1 mt-1">
                  <ArrowRight className="w-3 h-3 text-[#16A34A]" />
                  <span>
                    বর্তমান <strong>{productCount}</strong> টি প্রোডাক্ট স্বয়ংক্রিয়ভাবে "<strong>{reassignCategory}</strong>" ক্যাটাগরিতে স্থানান্তরিত হবে।
                  </span>
                </p>
              </div>
            </div>
          ) : (
            // Safe Deletion with 0 products
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1">
              <span className="font-bold block text-[13px]">নিরাপদ ডিলিট:</span>
              <p className="text-emerald-300/90 leading-relaxed">
                এই ক্যাটাগরিতে বর্তমানে কোনো প্রোডাক্ট নেই। আপনি কোনো তথ্য হারানোর ঝুঁকি ছাড়াই এটি নিরাপদে মুছে ফেলতে পারেন।
              </p>
            </div>
          )}

          <p className="text-xs text-[#A7A7A7]">
            আপনি কি নিশ্চিত যে ক্যাটাগরিটি মুছে ফেলতে চান? এই অ্যাকশনটি ফিরিয়ে নেওয়া যাবে না।
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 sm:p-5 border-t border-[#292929] bg-[#0c0c0c] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-[#A7A7A7] hover:text-[#FAFAFA] bg-[#171717] hover:bg-[#202020] rounded-xl transition-colors"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting || (hasProducts && !reassignCategory)}
            className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-900/30 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>প্রক্রিয়াধীন...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>
                  {hasProducts
                    ? `${productCount} টি পণ্য স্থানান্তর ও ডিলিট`
                    : 'ক্যাটাগরি মুছে ফেলুন'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
