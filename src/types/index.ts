export type ProductStatus = 'published' | 'draft';

export interface Product {
  id: string;
  name: string;
  bengaliName?: string;
  price: number;
  salePrice?: number;
  category: string;
  brand?: string;
  stock: number;
  status: ProductStatus;
  isFeatured?: boolean;
  image: string;
  description: string;
  features: string[];
  specs?: { label: string; value: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  bengaliName?: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  whatsappIntl: string;
  facebookUrl: string;
  deliveryFeeInsideDhaka: number;
  deliveryFeeOutsideDhaka: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'cod' | 'paid' | 'pending';

export interface CustomerOrder {
  id?: string;
  customerName: string;
  phoneNumber: string;
  deliveryAddress: string;
  deliveryArea: 'inside_dhaka' | 'outside_dhaka';
  notes?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderDate: string;
  orderNumber: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  name?: string;
}
