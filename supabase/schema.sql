-- ==============================================================================
-- MUAZ ELECTRONIC — SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL UNIQUE,
    bengali_name TEXT,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    image TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    bengali_name TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(12, 2) CHECK (sale_price IS NULL OR sale_price >= 0),
    category TEXT NOT NULL,
    brand TEXT DEFAULT 'MUAZ ELECTRONIC',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    image TEXT NOT NULL,
    description TEXT DEFAULT '',
    features JSONB DEFAULT '[]'::jsonb,
    specs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create store settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    store_name TEXT NOT NULL DEFAULT 'MUAZ ELECTRONIC',
    tagline TEXT NOT NULL DEFAULT 'Smart Gadgets • Better Life',
    whatsapp_number TEXT NOT NULL DEFAULT '01822486585',
    whatsapp_intl TEXT NOT NULL DEFAULT '8801822486585',
    facebook_url TEXT NOT NULL DEFAULT 'https://www.facebook.com/share/1KwJp3ZvBy/',
    delivery_fee_inside_dhaka NUMERIC(8, 2) NOT NULL DEFAULT 70.00,
    delivery_fee_outside_dhaka NUMERIC(8, 2) NOT NULL DEFAULT 130.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 5. Products RLS Policies
-- Public read access: Anyone can read published products
CREATE POLICY "Public read published products" 
ON public.products 
FOR SELECT 
USING (status = 'published' OR auth.role() = 'authenticated');

-- Admin full access: Only authenticated admin users can insert, update, or delete
CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
TO authenticated 
USING (true);

-- 6. Categories RLS Policies
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anon manage categories" ON public.categories;

CREATE POLICY "Public read categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins manage categories" 
ON public.categories 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Also allow anon role so category operations work seamlessly with the Supabase public anon key
CREATE POLICY "Anon manage categories" 
ON public.categories 
FOR ALL 
TO anon 
USING (true)
WITH CHECK (true);

-- 7. Store Settings RLS Policies
CREATE POLICY "Public read store settings" 
ON public.store_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins update store settings" 
ON public.store_settings 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 8. Storage bucket for product images
-- NOTE: In Supabase Dashboard, create a public bucket named 'product-images'
-- Or run the following storage extensions if storage schema is available:
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public can view images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Storage RLS: Authenticated users can upload and manage images
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 9. Insert Initial Store Settings
INSERT INTO public.store_settings (id, store_name, tagline, whatsapp_number, whatsapp_intl, facebook_url, delivery_fee_inside_dhaka, delivery_fee_outside_dhaka)
VALUES ('default', 'MUAZ ELECTRONIC', 'Smart Gadgets • Better Life', '01822486585', '8801822486585', 'https://www.facebook.com/share/1KwJp3ZvBy/', 70.00, 130.00)
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Default Categories
INSERT INTO public.categories (name, bengali_name, slug, icon, is_active, display_order, description) VALUES
('Audio & Earbuds', 'অডিও ও ইয়ারবাডস', 'audio-earbuds', 'Headphones', true, 1, 'প্রিমিয়াম কোয়ালিটির ট্রু ওয়্যারলেস স্টেরিও (TWS) এয়ারবাডস ও হেডফোন কালেকশন'),
('Power Banks', 'পাওয়ার ব্যাংকস', 'power-banks', 'BatteryCharging', true, 2, 'দ্রুত চার্জিং সক্ষমতার হাই-ক্যাপাসিটি পাওয়ার ব্যাংক'),
('Mobile Accessories', 'মোবাইল এক্সেসরিজ', 'mobile-accessories', 'Smartphone', true, 3, 'ফোন কুলার, স্ট্যান্ড, গ্যাজেট এক্সেসরিজ ও প্রয়োজনীয় সামগ্রী'),
('Gaming Gadgets', 'গেমিং গ্যাজেটস', 'gaming-gadgets', 'Gamepad2', true, 4, 'পোর্টেবল কনসোল, গেমিং ট্রিগার ও এক্সেসরিজ'),
('Audio & Microphones', 'অডিও ও মাইক্রোফোন', 'audio-microphones', 'Mic', true, 5, 'ওয়্যারলেস ল্যাপেল মাইক্রোফোন ও স্ট্রিমিং অডিও সরঞ্জাম'),
('Audio & Neckbands', 'অডিও ও নেকব্যান্ড', 'audio-neckbands', 'Radio', true, 6, 'স্পোর্টস ব্লুটুথ নেকব্যান্ড ও ওয়্যারলেস ইয়ারফোন')
ON CONFLICT (name) DO UPDATE SET
  bengali_name = EXCLUDED.bengali_name,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;

-- 11. Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_products_updated
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
