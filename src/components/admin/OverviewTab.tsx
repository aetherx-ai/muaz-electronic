import React from 'react';
import { Package, CheckCircle, FileText, AlertTriangle, Coins, Plus, ArrowRight, Eye } from 'lucide-react';
import { Product } from '../../types';

interface OverviewTabProps {
  products: Product[];
  onAddNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewAllProducts: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  products,
  onAddNewProduct,
  onEditProduct,
  onViewAllProducts,
}) => {
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.status === 'published').length;
  const draftProducts = products.filter((p) => p.status === 'draft').length;
  const lowStockProducts = products.filter((p) => p.stock < 10);
  const totalInventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);

  const recentProducts = products.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Top Banner & Quick Action */}
      <div className="bg-[#111111] border border-[#292929] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFC928]/5 blur-3xl pointer-events-none rounded-full" />
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-[#FFC928] font-display block mb-1">
            CONTROL CENTER
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] font-display">
            মুয়াজ ইলেকট্রনিক্স ড্যাশবোর্ড
          </h2>
          <p className="text-xs sm:text-sm text-[#A7A7A7] mt-1 max-w-xl">
            আপনার স্মার্ট গ্যাজেট শপের প্রোডাক্ট ক্যাটালগ, স্টক ইনভেন্টরি এবং লাইভ স্টোরফ্রন্ট সহজে নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onAddNewProduct}
            className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-[#070707] bg-[#FFC928] hover:bg-[#F7D77B] rounded-xl transition-all shadow-md shadow-[#FFC928]/20"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন প্রোডাক্ট যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Products */}
        <div className="bg-[#111111] border border-[#292929] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7A7A7] mb-3">
            <span className="text-xs font-semibold">মোট প্রোডাক্ট</span>
            <div className="p-2 bg-[#171717] rounded-lg border border-[#292929] text-[#FAFAFA]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-[#FAFAFA] font-display tabular-nums">
              {totalProducts}
            </span>
            <span className="text-[11px] text-[#A7A7A7] block mt-0.5">ক্যাটালগে সংরক্ষিত</span>
          </div>
        </div>

        {/* Published Products */}
        <div className="bg-[#111111] border border-[#292929] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7A7A7] mb-3">
            <span className="text-xs font-semibold">লাইভ প্রকাশিত</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-emerald-400 font-display tabular-nums">
              {publishedProducts}
            </span>
            <span className="text-[11px] text-[#A7A7A7] block mt-0.5">গ্রাহকদের জন্য উন্মুক্ত</span>
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-[#111111] border border-[#292929] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7A7A7] mb-3">
            <span className="text-xs font-semibold">ড্রাফট প্রোডাক্ট</span>
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-amber-400 font-display tabular-nums">
              {draftProducts}
            </span>
            <span className="text-[11px] text-[#A7A7A7] block mt-0.5">পাবলিশের অপেক্ষায়</span>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-[#111111] border border-[#292929] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7A7A7] mb-3">
            <span className="text-xs font-semibold">লো-স্টক সতর্কতা</span>
            <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-rose-400 font-display tabular-nums">
              {lowStockProducts.length}
            </span>
            <span className="text-[11px] text-[#A7A7A7] block mt-0.5">&lt; ১০ পিস মজুদ</span>
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-[#111111] border border-[#292929] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A7A7A7] mb-3">
            <span className="text-xs font-semibold">ইনভেন্টরি ভ্যালু</span>
            <div className="p-2 bg-[#FFC928]/10 rounded-lg border border-[#FFC928]/20 text-[#FFC928]">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-[#FFC928] font-display tabular-nums truncate block">
              ৳{totalInventoryValue.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#A7A7A7] block mt-0.5">মোট পণ্যের বাজারমূল্য</span>
          </div>
        </div>

      </div>

      {/* Recent Products Table */}
      <div className="bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[#292929] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#FAFAFA]">সর্বশেষ প্রোডাক্ট তালিকা</h3>
            <p className="text-xs text-[#A7A7A7] mt-0.5">সম্প্রতি হালনাগাদকৃত গ্যাজেট ও অ্যাক্সেসরিজ</p>
          </div>

          <button
            onClick={onViewAllProducts}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#FFC928] hover:underline"
          >
            <span>সকল প্রোডাক্ট দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e0e0e] text-[#A7A7A7] border-b border-[#292929]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">প্রোডাক্ট</th>
                <th className="py-3.5 px-4 font-semibold">ক্যাটাগরি</th>
                <th className="py-3.5 px-4 font-semibold">মূল্য</th>
                <th className="py-3.5 px-4 font-semibold">স্টক</th>
                <th className="py-3.5 px-4 font-semibold">স্ট্যাটাস</th>
                <th className="py-3.5 px-4 font-semibold text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292929]">
              {recentProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#141414] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover bg-[#0a0a0a] border border-[#292929] shrink-0"
                      />
                      <div className="min-w-0 max-w-xs">
                        <span className="font-semibold text-[#FAFAFA] block truncate">{p.name}</span>
                        {p.bengaliName && (
                          <span className="text-[11px] text-[#A7A7A7] block truncate">{p.bengaliName}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-[#A7A7A7]">{p.category}</td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#FAFAFA] font-display tabular-nums">
                      ৳{p.price.toLocaleString()}
                    </span>
                    {p.salePrice && (
                      <span className="block text-[11px] text-[#FFC928] line-through font-mono">
                        ৳{p.salePrice.toLocaleString()}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`font-semibold tabular-nums ${
                        p.stock === 0
                          ? 'text-rose-400'
                          : p.stock < 10
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {p.stock} Units
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onEditProduct(p)}
                      className="px-3 py-1 bg-[#171717] hover:bg-[#222222] text-[#FAFAFA] hover:text-[#FFC928] border border-[#292929] rounded-md transition-colors"
                    >
                      এডিট
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
