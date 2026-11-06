import { Product, StoreSettings, Category } from '../types';

import hocoCoolerImage from '../assets/images/product_hoco_cooler_1792754252903.jpg';
import hollylandMicImage from '../assets/images/product_hollyland_mic_1792754254527.jpg';
import powerBankImage from '../assets/images/product_vendens_powerbank_1792754254403.jpg';
import neckbandImage from '../assets/images/product_frb_neckband_1792754255689.jpg';
import x9ConsoleImage from '../assets/images/product_x9_console_1792754256202.jpg';
import airpodsImage from '../assets/images/product_airpods_black_1792754256092.jpg';

export const OFFICIAL_LOGO_PATH = '/assets/aistudio/image_55b23943.png';
export const WHATSAPP_NUMBER = '01822486585';
export const WHATSAPP_INTL = '8801822486585';
export const FACEBOOK_URL = 'https://www.facebook.com/share/1KwJp3ZvBy/';
export const STORE_NAME = 'MUAZ ELECTRONIC';
export const STORE_TAGLINE = 'Smart Gadgets • Better Life';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: STORE_NAME,
  tagline: STORE_TAGLINE,
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappIntl: WHATSAPP_INTL,
  facebookUrl: FACEBOOK_URL,
  deliveryFeeInsideDhaka: 70,
  deliveryFeeOutsideDhaka: 130,
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'hoco-ga6-cooler',
    name: 'Hoco GA6 Glacier AI Semiconductor Mobile Cooler',
    bengaliName: 'হোকো GA6 সেমিকন্ডাক্টর মোবাইল ফোন কুলার',
    price: 1500,
    salePrice: 1150,
    category: 'Mobile Accessories',
    brand: 'Hoco',
    stock: 133,
    status: 'published',
    isFeatured: true,
    image: hocoCoolerImage,
    description: 'উচ্চক্ষমতাসম্পন্ন সেমিকন্ডাক্টর রেফ্রিজারেশন প্রযুক্তিসম্পন্ন মোবাইল ফোন কুলিং ফ্যান। দীর্ঘক্ষণ গেমিং বা লাইভ স্ট্রিমিংয়ে ফোন অতিরিক্ত গরম হওয়া থেকে রক্ষা করে এবং ফ্রেম ড্রপ প্রতিরোধ করে।',
    features: [
      'সেমিকন্ডাক্টর ইনস্ট্যান্ট কুলিং অ্যালয় প্লেট',
      'নীরব কিন্তু শক্তিশালী টার্বো ফ্যান মোটর',
      'টাইপ-সি হাই-স্পিড পাওয়ার সংযোগ',
      'সার্বজনীন ক্ল্যাম্প ডিজাইন—যেকোনো স্মার্টফোনে সহজে ব্যবহারের উপযোগী'
    ],
    specs: [
      { label: 'কুলিং মেকানিজম', value: 'Semiconductor + Turbo Fan' },
      { label: 'উপাদান', value: 'ABS + Aluminum Alloy' },
      { label: 'মডেল', value: 'Hoco GA6 Glacier' },
      { label: 'বর্তমান স্টক', value: '১৩৩ পিস উপলব্ধ' }
    ]
  },
  {
    id: 'hollyland-lark-m2',
    name: 'Hollyland Lark M2 1:1 MasterCopy Wireless Microphone',
    bengaliName: 'হলিভ্যান্ড লার্ক এম২ ১:১ মাস্টারকপি মাইক্রোফোন',
    price: 1800,
    salePrice: 1400,
    category: 'Audio & Microphones',
    brand: 'Hollyland',
    stock: 45,
    status: 'published',
    isFeatured: true,
    image: hollylandMicImage,
    description: 'বাটন-সাইজ আল্ট্রা-লাইটওয়েট ওয়্যারলেস ল্যাভ্যালিয়ার মাইক্রোফোন সিস্টেম। ক্রিস্টাল-ক্লিয়ার অডিও ক্যাপচার, ভ্লগিং, কনটেন্ট ক্রিয়েশন এবং ইন্টারভিউ রেকর্ডিংয়ের জন্য নির্ভরযোগ্য সমাধান।',
    features: [
      'অতি হালকা ও কমপ্যাক্ট বাটন ডিজাইন',
      'নয়েজ ক্যানসেলিং অডিও প্রসেসিং',
      'চার্জিং কেসসহ দীর্ঘ ব্যাটারি ব্যাকআপ',
      'স্মার্টফোন ও ক্যামেরার সাথে সহজ প্লাগ-অ্যান্ড-প্লে সংযোগ'
    ],
    specs: [
      { label: 'মাইক্রোফোন টাইপ', value: 'Wireless Button Lavalier' },
      { label: 'এডিশন', value: '1:1 MasterCopy' },
      { label: 'কানেক্টিভিটি', value: '2.4GHz Digital Transmission' },
      { label: 'ব্যবহার উপযোগী', value: 'Mobile, Camera, PC' }
    ]
  },
  {
    id: 'ven-dens-20000mah',
    name: 'VEN-DENS 20000mAh LED Display Power Bank',
    bengaliName: 'ভেন-ডেন্স ২০,০০০ এমএএইচ পাওয়ার ব্যাংক',
    price: 1900,
    salePrice: 1450,
    category: 'Power Banks',
    brand: 'VEN-DENS',
    stock: 60,
    status: 'published',
    isFeatured: true,
    image: powerBankImage,
    description: 'বিশাল ২০,০০০ মিলিঅ্যাম্পিয়ার ক্ষমতার হেভি-ডিউটি পোর্টেবল পাওয়ার ব্যাংক। স্মার্ট এলইডি ডিজিটাল ডিসপ্লেতে সঠিক চার্জের শতাংশ প্রদর্শিত হয়, সাথে দ্রুত চার্জিং পোর্ট।',
    features: [
      'প্রকৃত ২০,০০০ mAh হাই-ডেনসিটি লিথিয়াম পলিমার ব্যাটারি',
      'স্মার্ট এলইডি ডিজিটাল চার্জ পার্সেন্টেজ ডিসপ্লে',
      'মাল্টিপল আউটপুট ও ইনপুট সাপোর্ট (USB-A & Type-C)',
      'মাল্টি-প্রোটেকশন ওভারহিটিং ও শর্ট সার্কিট সুরক্ষা'
    ],
    specs: [
      { label: 'ব্যাটারি ক্যাপাসিটি', value: '20,000mAh (74Wh)' },
      { label: 'ডিসপ্লে', value: 'Digital LED Percentage' },
      { label: 'পোর্টস', value: 'Dual Output Fast Charge' },
      { label: 'ব্র্যান্ড', value: 'VEN-DENS' }
    ]
  },
  {
    id: 'frb-n27-neckband',
    name: 'FRB N27 [400 Hours] Standby Wireless Neckband BT 5.3',
    bengaliName: 'এফআরবি এন২৭ ওয়্যারলেস নেকব্যান্ড ব্লুটুথ ৫.৩',
    price: 1100,
    salePrice: 800,
    category: 'Audio & Neckbands',
    brand: 'FRB',
    stock: 80,
    status: 'published',
    isFeatured: false,
    image: neckbandImage,
    description: 'সর্বাধুনিক ব্লুটুথ ৫.৩ সংযোগসহ ৪০০ ঘণ্টার অসাধারণ স্ট্যান্ডবাই টাইমের ওয়্যারলেস নেকব্যান্ড। ডিপ বাস, স্পষ্ট ভয়েস কল এবং দীর্ঘ ভ্রমণ ও ব্যায়ামের জন্য অত্যন্ত আরামদায়ক ডিজাইন।',
    features: [
      '৪০০ ঘণ্টার সুবিশাল স্ট্যান্ডবাই টাইম',
      'ব্লুটুথ ৫.৩ স্ট্যাবল ওয়্যারলেস কানেকশন',
      'ম্যাগনেটিক ইয়ারবাড লক ও ফ্লেক্সিবল মেমোরি কলার',
      'বিল্ট-ইন এইচডি মাইক ও মিডিয়া কন্ট্রোল বাটন'
    ],
    specs: [
      { label: 'স্ট্যান্ডবাই সময়', value: 'Up to 400 Hours' },
      { label: 'ব্লুটুথ সংস্করণ', value: 'Bluetooth 5.3' },
      { label: 'ড্রাইভার', value: 'Deep Bass Acoustic Dynamic' },
      { label: 'মডেল', value: 'FRB N27' }
    ]
  },
  {
    id: 'x9-black-hawk-console',
    name: 'X9 Handheld Retro Game Console Black Hawk Edition',
    bengaliName: 'এক্স৯ হ্যান্ডহোল্ড গেম কনসোল ব্ল্যাক হক',
    price: 5500,
    salePrice: 4500,
    category: 'Gaming Gadgets',
    brand: 'Black Hawk',
    stock: 25,
    status: 'published',
    isFeatured: true,
    image: x9ConsoleImage,
    description: 'রেট্রো ও ক্লাসিক গেমিংয়ের জন্য ব্ল্যাক হক এডিশনের শক্তিশালী হ্যান্ডহোল্ড গেম কনসোল। উজ্জ্বল কালার ডিসপ্লে, ডুয়াল অ্যানালগ স্টিক এবং অসংখ্য বিল্ট-ইন গেমের অফুরন্ত বিনোদন।',
    features: [
      'উজ্জ্বল ওয়াইডস্ক্রিন কালার এইচডি ডিসপ্লে',
      'ডুয়াল অ্যানালগ থাম্বস্টিক ও রেসপন্সিভ ডি-প্যাড',
      'অসংখ্য বিল্ট-ইন ক্লাসিক ও আর্কেড গেম সাপোর্ট',
      'টিভি আউটপুট ও হেডফোন জ্যাক সংযোগ'
    ],
    specs: [
      { label: 'কনসোল এডিশন', value: 'X9 Black Hawk Edition' },
      { label: 'কন্ট্রোল', value: 'Dual 360° Joystick + D-Pad' },
      { label: 'স্টোরেজ', value: 'Built-in Retro Game Library' },
      { label: 'ব্যাটারি', value: 'Rechargeable High-Capacity Li-ion' }
    ]
  },
  {
    id: 'apple-airpods-black-mastercopy',
    name: 'Apple AirPods Matte Black Edition MasterCopy TWS',
    bengaliName: 'অ্যাপল এয়ারপডস ব্ল্যাক স্পেশাল এডিশন মাস্টারকপি',
    price: 1200,
    salePrice: 850,
    category: 'Audio & Earbuds',
    brand: 'MasterCopy',
    stock: 90,
    status: 'published',
    isFeatured: false,
    image: airpodsImage,
    description: 'প্রিমিয়াম ম্যাট ব্ল্যাক ফিনিশের স্পেশাল এডিশন ওয়্যারলেস এয়ারপডস মাস্টারকপি। রিচ স্টেরিও সাউন্ড, টাচ সেন্সর কন্ট্রোল এবং পপ-আপ ইনস্ট্যান্ট পেয়ারিং সুবিধা।',
    features: [
      'এক্সক্লুসিভ স্টেলথ ম্যাট ব্ল্যাক ফিনিশ',
      'স্মার্ট টাচ কন্ট্রোল (প্লে/পজ, গান পরিবর্তন, কল রিসিভ)',
      'কমপ্যাক্ট ব্ল্যাক ম্যাগনেটিক চার্জিং কেস',
      'অ্যান্ড্রয়েড ও আইওএস উভয় ডিভাইসেই দ্রুত সংযোগ'
    ],
    specs: [
      { label: 'এডিশন', value: 'Special Black MasterCopy' },
      { label: 'কানেক্টিভিটি', value: 'Bluetooth 5.0+' },
      { label: 'কন্ট্রোল', value: 'Smart Touch Sensor' },
      { label: 'মাইক', value: 'Built-in Clear Mic for Calling' }
    ]
  }
];

export const INITIAL_DETAILED_CATEGORIES: Category[] = [
  {
    id: 'cat-audio-earbuds',
    name: 'Audio & Earbuds',
    bengaliName: 'অডিও ও ইয়ারবাডস',
    slug: 'audio-earbuds',
    icon: 'Headphones',
    isActive: true,
    displayOrder: 1,
    description: 'প্রিমিয়াম কোয়ালিটির ট্রু ওয়্যারলেস স্টেরিও (TWS) এয়ারবাডস ও হেডফোন কালেকশন',
  },
  {
    id: 'cat-power-banks',
    name: 'Power Banks',
    bengaliName: 'পাওয়ার ব্যাংকস',
    slug: 'power-banks',
    icon: 'BatteryCharging',
    isActive: true,
    displayOrder: 2,
    description: 'দ্রুত চার্জিং সক্ষমতার হাই-ক্যাপাসিটি পাওয়ার ব্যাংক',
  },
  {
    id: 'cat-mobile-accessories',
    name: 'Mobile Accessories',
    bengaliName: 'মোবাইল এক্সেসরিজ',
    slug: 'mobile-accessories',
    icon: 'Smartphone',
    isActive: true,
    displayOrder: 3,
    description: 'ফোন কুলার, স্ট্যান্ড, গ্যাজেট এক্সেসরিজ ও প্রয়োজনীয় সামগ্রী',
  },
  {
    id: 'cat-gaming-gadgets',
    name: 'Gaming Gadgets',
    bengaliName: 'গেমিং গ্যাজেটস',
    slug: 'gaming-gadgets',
    icon: 'Gamepad2',
    isActive: true,
    displayOrder: 4,
    description: 'পোর্টেবল কনসোল, গেমিং ট্রিগার ও এক্সেসরিজ',
  },
  {
    id: 'cat-audio-microphones',
    name: 'Audio & Microphones',
    bengaliName: 'অডিও ও মাইক্রোফোন',
    slug: 'audio-microphones',
    icon: 'Mic',
    isActive: true,
    displayOrder: 5,
    description: 'ওয়্যারলেস ল্যাপেল মাইক্রোফোন ও স্ট্রিমিং অডিও সরঞ্জাম',
  },
  {
    id: 'cat-audio-neckbands',
    name: 'Audio & Neckbands',
    bengaliName: 'অডিও ও নেকব্যান্ড',
    slug: 'audio-neckbands',
    icon: 'Radio',
    isActive: true,
    displayOrder: 6,
    description: 'স্পোর্টস ব্লুটুথ নেকব্যান্ড ও ওয়্যারলেস ইয়ারফোন',
  },
  {
    id: 'cat-watch',
    name: 'Watch',
    bengaliName: 'ঘড়ি',
    slug: 'watch',
    icon: 'Layers',
    isActive: true,
    displayOrder: 7,
    description: 'স্মার্টওয়াচ, ফিটনেস ব্যান্ড ও প্রিমিয়াম হাতঘড়ি কালেকশন',
  },
];

export const INITIAL_CATEGORIES = [
  'All Products',
  ...INITIAL_DETAILED_CATEGORIES.map((c) => c.name),
];

export const INITIAL_ORDERS: import('../types').CustomerOrder[] = [
  {
    id: 'ord-me-871239',
    orderNumber: 'ME-871239',
    customerName: 'ফারহানা আহমেদ',
    phoneNumber: '01733451290',
    deliveryAddress: 'রোড ২০, হাউস ১২, ব্লক এফ, বনানী, ঢাকা',
    deliveryArea: 'inside_dhaka',
    notes: 'বিকেল ৪টার পর ডেলিভারি করবেন প্লিজ',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1 },
      { product: INITIAL_PRODUCTS[2], quantity: 1 },
    ],
    subtotal: 2600,
    deliveryFee: 70,
    total: 2670,
    orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    paymentStatus: 'cod',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-me-860491',
    orderNumber: 'ME-860491',
    customerName: 'আহমেদ জুবায়ের',
    phoneNumber: '01552349012',
    deliveryAddress: 'মিরপুর ১২, ব্লক ডি, রোড ৫, বাড়ি ৩, ঢাকা',
    deliveryArea: 'inside_dhaka',
    notes: 'কল দিয়ে আসবেন',
    items: [
      { product: INITIAL_PRODUCTS[5], quantity: 1 },
    ],
    subtotal: 950,
    deliveryFee: 70,
    total: 1020,
    orderDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    paymentStatus: 'cod',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-me-845620',
    orderNumber: 'ME-845620',
    customerName: 'শরিফুল ইসলাম',
    phoneNumber: '01688902145',
    deliveryAddress: 'চৌহাট্টা পয়েন্ট, থানা সদর, সিলেট',
    deliveryArea: 'outside_dhaka',
    notes: 'সুন্দরবন কুরিয়ারে পাঠাবেন',
    items: [
      { product: INITIAL_PRODUCTS[4], quantity: 1 },
      { product: INITIAL_PRODUCTS[3], quantity: 1 },
    ],
    subtotal: 2500,
    deliveryFee: 130,
    total: 2630,
    orderDate: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    paymentStatus: 'cod',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-me-830112',
    orderNumber: 'ME-830112',
    customerName: 'নাজমুল সাকিব',
    phoneNumber: '01911432980',
    deliveryAddress: 'ফ্ল্যাট ৪বি, বাড়ি ১৯, ধানমন্ডি ২৭, ঢাকা',
    deliveryArea: 'inside_dhaka',
    items: [
      { product: INITIAL_PRODUCTS[1], quantity: 1 },
    ],
    subtotal: 1400,
    deliveryFee: 70,
    total: 1470,
    orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'shipped',
    paymentStatus: 'cod',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-me-819204',
    orderNumber: 'ME-819204',
    customerName: 'মোহাম্মদ রফিকুল ইসলাম',
    phoneNumber: '01822490182',
    deliveryAddress: 'জিইসি মোড়, নাসিরাবাদ হাউজিং সোসাইটি, চট্টগ্রাম',
    deliveryArea: 'outside_dhaka',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 1 },
    ],
    subtotal: 1450,
    deliveryFee: 130,
    total: 1580,
    orderDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-me-729410',
    orderNumber: 'ME-729410',
    customerName: 'তানভীর হাসান',
    phoneNumber: '01712984531',
    deliveryAddress: 'বাড়ি ২৪, রোড ৭, সেক্টর ৪, উত্তরা, ঢাকা',
    deliveryArea: 'inside_dhaka',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1 },
    ],
    subtotal: 1150,
    deliveryFee: 70,
    total: 1220,
    orderDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
