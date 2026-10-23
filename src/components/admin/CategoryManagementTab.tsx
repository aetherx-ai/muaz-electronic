import React, { useState } from 'react';
import { Layers, Plus, Trash2, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { Product } from '../../types';

interface CategoryManagementTabProps {
  categories: string[];
  products: Product[];
  onAddCategory: (name: string) => Promise<{ success: boolean; error: string | null }>;
  onDeleteCategory: (name: string) => Promise<{ success: boolean; error: string | null }>;
}

export const CategoryManagementTab: React.FC<CategoryManagementTabProps> = ({
  categories,
  products,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    const res = await onAddCategory(newCategoryName.trim());
    setIsSubmitting(false);

    if (res.success) {
      setNewCategoryName('');
      setFeedback({ type: 'success', message: 'নতুন ক্যাটাগরি সফলভাবে যুক্ত করা হয়েছে' });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'যুক্ত করা সম্ভব হয়নি' });
    }
  };

  const handleDelete = async (categoryName: string) => {
    if (categoryName === 'All Products') return;
    const count = products.filter((p) => p.category === categoryName).length;
    if (count > 0) {
      const confirm = window.confirm(
        `এই ক্যাটাগরিতে বর্তমানে ${count} টি প্রোডাক্ট রয়েছে। আপনি কি নিশ্চিত যে এটি মুছে ফেলতে চান?`
      );
      if (!confirm) return;
    }

    setFeedback(null);
    const res = await onDeleteCategory(categoryName);
    if (res.success) {
      setFeedback({ type: 'success', message: 'ক্যাটাগরি মুছে ফেলা হয়েছে' });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'ডিলিট ব্যর্থ হয়েছে' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-150">
      
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] font-display">
          ক্যাটাগরি ম্যানেজমেন্ট
        </h2>
        <p className="text-xs text-[#A7A7A7] mt-0.5">
          স্টোরের পণ্যগুলোকে বিভিন্ন বিভাগে সুবিন্যস্ত করুন
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Add Category Form */}
      <div className="bg-[#111111] border border-[#292929] rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-[#FAFAFA] mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#FFC928]" />
          <span>নতুন ক্যাটাগরি তৈরি করুন</span>
        </h3>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7A7A7]" />
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="যেমন: Smart Watches / Gaming Accessories"
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#171717] border border-[#292929] rounded-xl text-[#FAFAFA] placeholder-[#A7A7A7]/50 focus:outline-none focus:border-[#FFC928]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newCategoryName.trim()}
            className="px-6 py-2.5 text-xs font-bold text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-xl transition-all shadow-md shadow-[#FFC928]/20 disabled:opacity-50 shrink-0"
          >
            {isSubmitting ? 'যুক্ত হচ্ছে...' : 'ক্যাটাগরি যুক্ত করুন'}
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[#292929]">
          <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FFC928]" />
            <span>বর্তমান ক্যাটাগরি তালিকা ({categories.filter((c) => c !== 'All Products').length})</span>
          </h3>
        </div>

        <div className="divide-y divide-[#292929]">
          {categories
            .filter((c) => c !== 'All Products')
            .map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <div
                  key={cat}
                  className="p-4 px-6 flex items-center justify-between hover:bg-[#141414] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#171717] border border-[#292929] flex items-center justify-center text-[#FFC928]">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#FAFAFA] block">{cat}</span>
                      <span className="text-[11px] text-[#A7A7A7]">{count} টি প্রোডাক্ট অন্তর্ভুক্ত</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-2 text-[#A7A7A7] hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors"
                    title={`${cat} মুছে ফেলুন`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

    </div>
  );
};
