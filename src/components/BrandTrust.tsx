import React from 'react';

export const BrandTrust: React.FC = () => {
  const trustFeatures = [
    {
      title: 'দ্রুত ডেলিভারি',
      description: 'ঢাকা ও সারা দেশে হোম ডেলিভারি সুবিধা',
    },
    {
      title: 'ক্যাশ অন ডেলিভারি',
      description: 'পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করুন',
    },
    {
      title: 'মানসম্মত পণ্য',
      description: 'যাচাইকৃত অরিজিনাল গ্যাজেট ও এক্সেসরিজ',
    },
    {
      title: 'সরাসরি সাপোর্ট',
      description: 'WhatsApp-এ সহজ ও দ্রুত অর্ডার সহায়তা',
    },
  ];

  return (
    <section id="about" className="py-8 bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          {trustFeatures.map((item, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
