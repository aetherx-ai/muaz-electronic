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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#141519] border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl shadow-black/95 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#18191f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                ক্যাটাগরি মুছে ফেলার নিশ্চয়তা
              </h3>
              <p className="text-[11px] text-zinc-400">
                "{categoryToDelete.name}" ক্যাটাগরি ডিলিট
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded-lg transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">
          {hasProducts ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 text-xs text-amber-200">
                <ShieldAlert className="w-4 h-4 text-[#FFC928] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-200 block text-xs">
                    দুর্ঘটনাজনিত ডিলিট প্রতিরোধ সক্রিয়!
                  </span>
                  <p className="text-amber-200/90 leading-relaxed text-[11px]">
                    এই ক্যাটাগরিতে বর্তমানে <strong>{productCount}</strong> টি প্রোডাক্ট অন্তর্ভুক্ত রয়েছে।
                    মোছার পূর্বে প্রোডাক্টগুলোকে অন্য ক্যাটাগরিতে স্থানান্তর করুন:
                  </p>
                </div>
              </div>

              {/* Reassignment Dropdown */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-300">
                  নতুন ক্যাটাগরি নির্বাচন করুন *
                </label>
                <div className="relative">
                  <select
                    value={reassignCategory}
                    onChange={(e) => setReassignCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#1a1b20] border border-white/[0.08] rounded-lg text-zinc-100 focus:outline-none focus:border-[#FFC928] appearance-none"
                  >
                    {otherCategories.map((c) => (
                      <option key={c.id} value={c.name} className="bg-[#141519] text-zinc-100">
                        {c.name} {c.bengaliName ? `(${c.bengaliName})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
                    ▼
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1">
                  <ArrowRight className="w-3 h-3 text-[#FFC928]" />
                  <span>
                    বর্তমান <strong>{productCount}</strong> টি প্রোডাক্ট স্বয়ংক্রিয়ভাবে স্থানান্তরিত হবে।
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 space-y-0.5">
              <span className="font-bold block text-xs">নিরাপদ ডিলিট:</span>
              <p className="text-emerald-300/90 leading-relaxed text-[11px]">
                এই ক্যাটাগরিতে বর্তমানে কোনো প্রোডাক্ট নেই। আপনি কোনো তথ্য হারানোর ঝুঁকি ছাড়াই এটি মুছে ফেলতে পারেন।
              </p>
            </div>
          )}

          <p className="text-xs text-zinc-400">
            আপনি কি নিশ্চিত যে ক্যাটাগরিটি মুছে ফেলতে চান? এই অ্যাকশনটি ফিরিয়ে নেওয়া যাবে না।
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#18191f] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] rounded-lg border border-white/[0.08] transition-colors"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting || (hasProducts && !reassignCategory)}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
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
