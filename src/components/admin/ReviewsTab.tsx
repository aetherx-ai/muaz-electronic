import React, { useState, useMemo, useEffect } from 'react';
import {
  Star,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ThumbsUp,
  X,
  Send,
  Filter,
} from 'lucide-react';
import { ProductReview } from '../../types';

interface ReviewsTabProps {
  onRefreshData?: () => void;
}

const STORAGE_KEY_REVIEWS = 'muaz_admin_reviews_v1';

const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-01',
    productId: 'hoco-ga6-cooler',
    productName: 'Hoco GA6 Glacier AI Semiconductor Mobile Cooler',
    customerName: 'তানভীর হাসান',
    customerPhone: '01712984531',
    rating: 5,
    comment: 'কুলারটি অসাধারণ! পাবজি খেলার সময় ফোন বরফের মতো ঠান্ডা থাকে। সাউন্ড নেই একদম বললেই চলে। ডেলিভারিও খুব দ্রুত পেয়েছি।',
    date: '2026-10-28',
    isVerifiedPurchase: true,
    status: 'published',
    adminReply: 'ধন্যবাদ তানভীর ভাই! আপনার সন্তুষ্টিই আমাদের অনুপ্রেরণা।',
  },
  {
    id: 'rev-02',
    productId: 'hollyland-lark-m2',
    productName: 'Hollyland Lark M2 1:1 MasterCopy Wireless Microphone',
    customerName: 'আহমেদ জুবায়ের',
    customerPhone: '01552349012',
    rating: 5,
    comment: 'ইউটিউব কনটেন্ট বানানোর জন্য এর চেয়ে সেরা বাজেট মাইক হতে পারে না। নয়েজ ক্যান্সেলেশন দারুণ কাজ করে। ১:১ মাস্টারকপি হলেও আসলটার মতো বিল্ড কোয়ালিটি।',
    date: '2026-10-25',
    isVerifiedPurchase: true,
    status: 'published',
  },
  {
    id: 'rev-03',
    productId: 'apple-airpods-black-mastercopy',
    productName: 'Apple AirPods Matte Black Edition MasterCopy TWS',
    customerName: 'নাজমুল সাকিব',
    customerPhone: '01911432980',
    rating: 4,
    comment: 'ম্যাট ব্ল্যাক কালারটা প্রিমিয়াম লুক দেয়। সাউন্ড বেজ যথেষ্ট ভালো। তবে ব্যাটারি ব্যাকআপ ৫ ঘণ্টার কাছাকাছি পেয়েছি। সার্বিকভাবে চমৎকার।',
    date: '2026-10-20',
    isVerifiedPurchase: true,
    status: 'published',
  },
  {
    id: 'rev-04',
    productId: 'vendens-10000mah-powerbank',
    productName: 'VEN-DENS 10000mAh 22.5W Fast Charging Power Bank',
    customerName: 'মোহাম্মদ রফিকুল ইসলাম',
    customerPhone: '01822490182',
    rating: 5,
    comment: 'ফাস্ট চার্জিং কাজ করে এবং সাইজ অনেক কমপ্যাক্ট। ব্যাগে সহজেই ক্যারি করা যায়। প্যাকেজিং ও ডেলিভারি দারুণ ছিল।',
    date: '2026-10-15',
    isVerifiedPurchase: true,
    status: 'published',
  },
  {
    id: 'rev-05',
    productId: 'frb-wireless-neckband-pro',
    productName: 'FRB Signature Wireless Sports Neckband',
    customerName: 'শরিফুল ইসলাম',
    customerPhone: '01688902145',
    rating: 4,
    comment: 'নেকব্যান্ডের বিল্ড কোয়ালিটি বেশ মজবুত। কল করার সময় ভয়েস পরিষ্কার শোনা যায়। ভালো পণ্য।',
    date: '2026-10-10',
    isVerifiedPurchase: true,
    status: 'pending',
  },
];

export const ReviewsTab: React.FC<ReviewsTabProps> = () => {
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
      return raw ? JSON.parse(raw) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pending' | 'hidden'>('all');

  // Reply Modal
  const [activeReplyingReview, setActiveReplyingReview] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.error('Failed to save reviews:', e);
    }
  }, [reviews]);

  const handleToggleStatus = (id: string, newStatus: 'published' | 'pending' | 'hidden') => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  const handleDeleteReview = (id: string) => {
    if (window.confirm('আপনি কি এই রিভিউটি স্থায়ীভাবে মুছে ফেলতে চান?')) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleSaveReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplyingReview) return;

    setReviews((prev) =>
      prev.map((r) =>
        r.id === activeReplyingReview.id
          ? { ...r, adminReply: replyText.trim() || undefined }
          : r
      )
    );
    setActiveReplyingReview(null);
    setReplyText('');
  };

  // Metrics
  const totalReviews = reviews.length;
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      counts[r.rating] = (counts[r.rating] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.productName.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reviews, ratingFilter, statusFilter, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            কাস্টমার রিভিউ ও রেটিং
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            পণ্যের মান, গ্রাহক সন্তুষ্টি ও ফিডব্যাক পরিচালনা করুন
          </p>
        </div>

        {pendingCount > 0 && (
          <span className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{pendingCount} টি রিভিউ অনুমোদনের অপেক্ষায়</span>
          </span>
        )}
      </div>

      {/* Aggregate Rating Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left score */}
        <div className="flex items-center gap-5 md:border-r border-slate-100 pr-4">
          <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-display tracking-tight">
            {averageRating}
          </div>
          <div>
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(Number(averageRating))
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium block mt-1">
              মোট {totalReviews} টি কাস্টমার রিভিউ এর ভিত্তিতে
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
              ১০০% ভেরিফাইড পারচেজার রিভিউ
            </span>
          </div>
        </div>

        {/* Middle distribution */}
        <div className="space-y-1.5 md:col-span-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingCounts[rating] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={rating} className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 w-12 text-slate-600 font-medium font-mono shrink-0">
                  <span>{rating}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-[11px] text-slate-400 tabular-nums">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="পণ্য বা গ্রাহকের নাম অনুসন্ধান..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="all">সকল রেটিং</option>
            <option value="5">৫ স্টার রিভিউ</option>
            <option value="4">৪ স্টার রিভিউ</option>
            <option value="3">৩ স্টার রিভিউ</option>
            <option value="2">২ স্টার রিভিউ</option>
            <option value="1">১ স্টার রিভিউ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="published">প্রকাশিত (Published)</option>
            <option value="pending">অপেক্ষমান (Pending)</option>
            <option value="hidden">লুকানো (Hidden)</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3.5">
        {filteredReviews.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-16 text-center shadow-xs">
            <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">কোনো রিভিউ পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 font-display text-xs">
                    {review.customerName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{review.customerName}</span>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ভেরিফাইড ক্রেতা</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      তারিখ: {review.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Star rating */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      review.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : review.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {review.status}
                  </span>
                </div>
              </div>

              {/* Product link */}
              <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-700">পণ্য:</span> {review.productName}
              </div>

              {/* Comment text */}
              <p className="text-xs text-slate-700 leading-relaxed font-sans font-normal">
                "{review.comment}"
              </p>

              {/* Admin reply if present */}
              {review.adminReply && (
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-[11px]">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>অফিসিয়াল অ্যাডমিন উত্তর:</span>
                  </div>
                  <p className="text-slate-700">{review.adminReply}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveReplyingReview(review);
                      setReplyText(review.adminReply || '');
                    }}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{review.adminReply ? 'উত্তর এডিট করুন' : 'উত্তর দিন'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {review.status !== 'published' ? (
                    <button
                      onClick={() => handleToggleStatus(review.id, 'published')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                    >
                      অনুমোদন করুন (Publish)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(review.id, 'hidden')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      লুকান (Hide)
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="রিভিউ মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin Reply Modal */}
      {activeReplyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm font-display">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span>গ্রাহকের রিভিউতে উত্তর প্রদান</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveReplyingReview(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block">
                {activeReplyingReview.customerName} এর মন্তব্য:
              </span>
              <p className="italic">"{activeReplyingReview.comment}"</p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  আপনার অফিশিয়াল উত্তর লিখুন
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="ধন্যবাদ আমাদের সাথে থাকার জন্য..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReplyingReview(null)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>উত্তর প্রকাশ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
