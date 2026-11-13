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
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-[12px] overflow-hidden shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 bg-[#F8FAF9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">
                ক্যাটাগরি মুছে ফেলার নিশ্চয়তা
              </h3>
              <p className="text-[11px] text-slate-500">
                "{categoryToDelete.name}" ক্যাটাগরি ডিলিট
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-[8px] transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">
          {hasProducts ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-[10px] flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-900 block text-xs">
                    দুর্ঘটনাজনিত ডিলিট প্রতিরোধ সক্রিয়
                  </span>
                  <p className="text-amber-800 leading-relaxed text-[11px]">
                    এই ক্যাটাগরিতে বর্তমানে <strong>{productCount}</strong> টি প্রোডাক্ট অন্তর্ভুক্ত রয়েছে।
                    মোছার পূর্বে প্রোডাক্টগুলোকে অন্য ক্যাটাগরিতে স্থানান্তর করুন:
                  </p>
                </div>
              </div>

              {/* Reassignment Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  নতুন ক্যাটাগরি নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={reassignCategory}
                    onChange={(e) => setReassignCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15"
                  >
                    {otherCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} {c.bengaliName ? `(${c.bengaliName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                  <ArrowRight className="w-3 h-3 text-[#16A34A]" />
                  <span>
                    বর্তমান <strong>{productCount}</strong> টি প্রোডাক্ট স্বয়ংক্রিয়ভাবে স্থানান্তরিত হবে।
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#ECFDF3] border border-emerald-200 rounded-[10px] text-xs text-[#15803D] space-y-0.5">
              <span className="font-bold block text-xs">নিরাপদ ডিলিট:</span>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                এই ক্যাটাগরিতে বর্তমানে কোনো প্রোডাক্ট নেই। আপনি কোনো তথ্য হারানোর ঝুঁকি ছাড়াই এটি মুছে ফেলতে পারেন।
              </p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            আপনি কি নিশ্চিত যে ক্যাটাগরিটি মুছে ফেলতে চান? এই অ্যাকশনটি ফিরিয়ে নেওয়া যাবে না।
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 bg-[#F8FAF9] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-[10px] border border-slate-200 transition-colors"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting || (hasProducts && !reassignCategory)}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-[10px] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>প্রক্রিয়াধীন...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
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
