import React from 'react';
import {
  STORE_NAME,
  WHATSAPP_INTL,
  WHATSAPP_NUMBER,
  FACEBOOK_URL,
} from '../data/products';
import { Category } from '../types';

interface FooterProps {
  onNavigateToAdmin?: () => void;
  categories?: (string | Category)[];
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToAdmin }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-white text-gray-600 border-t border-gray-200 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-gray-200 text-xs sm:text-sm">
          <div>
            <span className="font-bold text-gray-900 block">{STORE_NAME}</span>
            <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
              স্মার্ট গ্যাজেট ও প্রয়োজনীয় এক্সেসরিজের নির্ভরযোগ্য অনলাইন স্টোর।
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-900 block mb-2">লিংক</span>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="#hero" className="hover:text-gray-900 hover:underline">
                  হোম
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-gray-900 hover:underline">
                  সকল পণ্য
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-gray-900 hover:underline">
                  আমাদের সম্পর্কে
                </a>
              </li>
              {onNavigateToAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToAdmin}
                    className="hover:text-gray-900 hover:underline text-left"
                  >
                    অ্যাডমিন পোর্টাল
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div>
            <span className="font-semibold text-gray-900 block mb-2">যোগাযোগ</span>
            <ul className="space-y-1.5 text-xs">
              <li>
                WhatsApp:{' '}
                <a
                  href={`https://wa.me/${WHATSAPP_INTL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#16A34A] font-semibold hover:underline font-mono"
                >
                  {WHATSAPP_NUMBER}
                </a>
              </li>
              <li>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Facebook Page
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-4 text-xs text-gray-400 text-center sm:text-left">
          © {currentYear} {STORE_NAME}. সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
};
