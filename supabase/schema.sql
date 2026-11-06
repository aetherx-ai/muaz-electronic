-- ==============================================================================
-- MUAZ ELECTRONIC — COMPLETE SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Instructions: Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADMIN USERS TABLE & AUTHORIZATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

-- Helper Function: Check if the calling authenticated user is an active admin.
-- Defined as SECURITY DEFINER with fixed search_path to prevent recursion and privilege issues.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  );
$$;

-- Grant execution to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Auto-sync Trigger: When designated admin (kl6544340@gmail.com) is in auth.users,
-- automatically ensure they are registered and marked active in public.admin_users.
CREATE OR REPLACE FUNCTION public.handle_admin_auth_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF LOWER(NEW.email) = 'kl6544340@gmail.com' THEN
    INSERT INTO public.admin_users (user_id, email, role, is_active)
    VALUES (NEW.id, NEW.email, 'admin', true)
    ON CONFLICT (user_id) DO UPDATE SET
      is_active = true,
      email = EXCLUDED.email,
      role = 'admin',
      updated_at = timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_admin_sync ON auth.users;
CREATE TRIGGER on_auth_user_admin_sync
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_auth_sync();

-- Seed existing kl6544340@gmail.com if already present in auth.users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'kl6544340@gmail.com') THEN
    INSERT INTO public.admin_users (user_id, email, role, is_active)
    SELECT id, email, 'admin', true
    FROM auth.users
    WHERE LOWER(email) = 'kl6544340@gmail.com'
    ON CONFLICT (user_id) DO UPDATE SET
      is_active = true,
      email = EXCLUDED.email,
      role = 'admin',
      updated_at = timezone('utc'::text, now());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL UNIQUE,
    bengali_name TEXT,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'Layers',
    image TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- -----------------------------------------------------------------------------
-- 3. PRODUCTS TABLE
-- -----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);

-- -----------------------------------------------------------------------------
-- 4. STORE SETTINGS TABLE
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
-- Enable RLS across all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5A. ADMIN_USERS RLS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON public.admin_users;

-- Authenticated users can read their own admin record to verify session
CREATE POLICY "Users can view own admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Only active admins can manage admin_users records
CREATE POLICY "Admins can manage admin_users"
ON public.admin_users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5B. CATEGORIES RLS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- Requirement 1: Public visitors can SELECT active categories (admins can select all)
CREATE POLICY "Public read active categories"
ON public.categories
FOR SELECT
TO public
USING (is_active = true OR public.is_admin());

-- Requirement 2: Active authorized admins can INSERT categories
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Requirement 3: Active authorized admins can UPDATE categories
CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Requirement 4: Active authorized admins can DELETE categories
CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5C. PRODUCTS RLS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read published products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Public can read published products, admins can read all (including drafts)
CREATE POLICY "Public read published products" 
ON public.products 
FOR SELECT 
TO public
USING (status = 'published' OR public.is_admin());

-- Only active admins can insert products
CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

-- Only active admins can update products
CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only active admins can delete products
CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5D. STORE SETTINGS RLS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins update store settings" ON public.store_settings;

CREATE POLICY "Public read store settings" 
ON public.store_settings 
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Admins update store settings" 
ON public.store_settings 
FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. STORAGE BUCKET & STORAGE RLS POLICIES
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin())
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. INITIAL SEED DATA
-- -----------------------------------------------------------------------------
-- Initial Store Settings
INSERT INTO public.store_settings (
  id, store_name, tagline, whatsapp_number, whatsapp_intl, facebook_url, delivery_fee_inside_dhaka, delivery_fee_outside_dhaka
) VALUES (
  'default', 'MUAZ ELECTRONIC', 'Smart Gadgets • Better Life', '01822486585', '8801822486585', 'https://www.facebook.com/share/1KwJp3ZvBy/', 70.00, 130.00
) ON CONFLICT (id) DO NOTHING;

-- Initial Default Categories (including Watch / ঘড়ি)
INSERT INTO public.categories (name, bengali_name, slug, icon, is_active, display_order, description) VALUES
('Audio & Earbuds', 'অডিও ও ইয়ারবাডস', 'audio-earbuds', 'Headphones', true, 1, 'প্রিমিয়াম কোয়ালিটির ট্রু ওয়্যারলেস স্টেরিও (TWS) এয়ারবাডস ও হেডফোন কালেকশন'),
('Power Banks', 'পাওয়ার ব্যাংকস', 'power-banks', 'BatteryCharging', true, 2, 'দ্রুত চার্জিং সক্ষমতার হাই-ক্যাপাসিটি পাওয়ার ব্যাংক'),
('Mobile Accessories', 'মোবাইল এক্সেসরিজ', 'mobile-accessories', 'Smartphone', true, 3, 'ফোন কুলার, স্ট্যান্ড, গ্যাজেট এক্সেসরিজ ও প্রয়োজনীয় সামগ্রী'),
('Gaming Gadgets', 'গেমিং গ্যাজেটস', 'gaming-gadgets', 'Gamepad2', true, 4, 'পোর্টেবল কনসোল, গেমিং ট্রিগার ও এক্সেসরিজ'),
('Audio & Microphones', 'অডিও ও মাইক্রোফোন', 'audio-microphones', 'Mic', true, 5, 'ওয়্যারলেস ল্যাপেল মাইক্রোফোন ও স্ট্রিমিং অডিও সরঞ্জাম'),
('Audio & Neckbands', 'অডিও ও নেকব্যান্ড', 'audio-neckbands', 'Radio', true, 6, 'স্পোর্টস ব্লুটুথ নেকব্যান্ড ও ওয়্যারলেস ইয়ারফোন'),
('Watch', 'ঘড়ি', 'watch', 'Watch', true, 7, 'স্মার্টওয়াচ, ফিটনেস ব্যান্ড ও প্রিমিয়াম হাতঘড়ি কালেকশন')
ON CONFLICT (name) DO UPDATE SET
  bengali_name = EXCLUDED.bengali_name,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description;

-- -----------------------------------------------------------------------------
-- 8. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_categories_updated ON public.categories;
CREATE TRIGGER on_categories_updated
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_products_updated ON public.products;
CREATE TRIGGER on_products_updated
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_admin_users_updated ON public.admin_users;
CREATE TRIGGER on_admin_users_updated
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
