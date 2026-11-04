import React from 'react';
import {
  Headphones,
  BatteryCharging,
  Smartphone,
  Gamepad2,
  Mic,
  Radio,
  Watch,
  Laptop,
  Camera,
  Speaker,
  Tv,
  Zap,
  Cable,
  Tablet,
  Shield,
  Cpu,
  Flame,
  Sparkles,
  Box,
  Layers,
  Tag,
  ShoppingBag,
  LucideIcon,
} from 'lucide-react';

export interface CategoryIconOption {
  id: string;
  label: string;
  bengaliLabel: string;
  icon: LucideIcon;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: 'Headphones', label: 'Headphones / Earbuds', bengaliLabel: 'হেডফোন / ইয়ারবাড', icon: Headphones },
  { id: 'BatteryCharging', label: 'Power Bank / Battery', bengaliLabel: 'পাওয়ার ব্যাংক', icon: BatteryCharging },
  { id: 'Smartphone', label: 'Mobile Phone & Cases', bengaliLabel: 'মোবাইল ফোন ও কভার', icon: Smartphone },
  { id: 'Gamepad2', label: 'Gaming & Consoles', bengaliLabel: 'গেমিং ও কন্ট্রোলার', icon: Gamepad2 },
  { id: 'Mic', label: 'Microphone & Audio', bengaliLabel: 'মাইক্রোফোন', icon: Mic },
  { id: 'Radio', label: 'Neckband & Wireless', bengaliLabel: 'নেকব্যান্ড / অডিও', icon: Radio },
  { id: 'Watch', label: 'Smartwatch & Band', bengaliLabel: 'স্মার্টওয়াচ', icon: Watch },
  { id: 'Speaker', label: 'Bluetooth Speaker', bengaliLabel: 'স্পিকার', icon: Speaker },
  { id: 'Cable', label: 'Cable & Adapters', bengaliLabel: 'ক্যাবল ও চার্জার', icon: Cable },
  { id: 'Laptop', label: 'Laptop & PC', bengaliLabel: 'ল্যাপটপ ও কম্পিউটার', icon: Laptop },
  { id: 'Camera', label: 'Camera & Video', bengaliLabel: 'ক্যামেরা', icon: Camera },
  { id: 'Tv', label: 'Smart TV & Displays', bengaliLabel: 'স্মার্ট টিভি', icon: Tv },
  { id: 'Tablet', label: 'Tablet & iPad', bengaliLabel: 'ট্যাবলেট', icon: Tablet },
  { id: 'Zap', label: 'Fast Charger & Power', bengaliLabel: 'ফাস্ট চার্জার', icon: Zap },
  { id: 'Cpu', label: 'Chips & Smart Tech', bengaliLabel: 'প্রসেসর ও চিপ', icon: Cpu },
  { id: 'Shield', label: 'Screen Protector', bengaliLabel: 'স্ক্রিন প্রটেক্টর', icon: Shield },
  { id: 'Flame', label: 'Trending & Hot', bengaliLabel: 'হট গ্যাজেটস', icon: Flame },
  { id: 'Sparkles', label: 'Special Edition', bengaliLabel: 'স্পেশাল কালেকশন', icon: Sparkles },
  { id: 'Box', label: 'Accessories & Box', bengaliLabel: 'এক্সেসরিজ', icon: Box },
  { id: 'ShoppingBag', label: 'Store Essentials', bengaliLabel: 'অন্যান্য পণ্য', icon: ShoppingBag },
  { id: 'Layers', label: 'General Category', bengaliLabel: 'সাধারণ ক্যাটাগরি', icon: Layers },
];

const ICON_MAP: Record<string, LucideIcon> = {
  Headphones,
  BatteryCharging,
  Smartphone,
  Gamepad2,
  Mic,
  Radio,
  Watch,
  Laptop,
  Camera,
  Speaker,
  Tv,
  Zap,
  Cable,
  Tablet,
  Shield,
  Cpu,
  Flame,
  Sparkles,
  Box,
  Layers,
  Tag,
  ShoppingBag,
};

export function renderCategoryIcon(iconName?: string, className: string = 'w-4 h-4') {
  if (!iconName) {
    return <Layers className={className} />;
  }

  const IconComponent = ICON_MAP[iconName];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Fallback
  return <Tag className={className} />;
}
