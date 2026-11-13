-- ==============================================================================
-- MUAZ ELECTRONIC — COMPLETE SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Instructions: Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADMIN USERS TABLE & AUTHORIZATION
-- -----------------------------------------------------------------------------
-- Exact verified schema: user_id (UUID), is_active (BOOLEAN), created_at (TIMESTAMPTZ)
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

-- Helper Function: Check if the calling authenticated user is an active admin.
-- Defined as SECURITY DEFINER with fixed search_path to prevent recursion and privilege issues.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
    _current_uid UUID;
    _is_active BOOLEAN;
BEGIN
    _current_uid := auth.uid();
    IF _current_uid IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT is_active INTO _is_active
    FROM public.admin_users
    WHERE user_id = _current_uid
    LIMIT 1;

    RETURN COALESCE(_is_active, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- -----------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    size_inventory JSONB DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    image TEXT NOT NULL,
    description TEXT DEFAULT '',
    features JSONB DEFAULT '[]'::jsonb,
    specs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Backward-compatible column migration for existing databases
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_inventory JSONB DEFAULT NULL;

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
-- 4B. ORDERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_area TEXT NOT NULL CHECK (delivery_area IN ('inside_dhaka', 'outside_dhaka')),
    notes TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'cod' CHECK (payment_status IN ('cod', 'paid', 'pending')),
    stock_deducted BOOLEAN NOT NULL DEFAULT false,
    order_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
-- Enable RLS across all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5A. ADMIN_USERS RLS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON public.admin_users;

-- Authenticated users can read only their own admin record
CREATE POLICY "Users can read own admin record"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

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
-- 5E. ORDERS RLS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Public can create orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can read orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5F. ATOMIC STOCK VALIDATION, DEDUCTION & CANCELLATION RESTORATION RPCs
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_order_with_stock_deduction(p_order JSONB)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    _item JSONB;
    _product_id TEXT;
    _selected_size TEXT;
    _qty INTEGER;
    _prod public.products%ROWTYPE;
    _size_inv JSONB;
    _has_sizes BOOLEAN;
    _size_entry JSONB;
    _size_stock INTEGER;
    _new_size_stock INTEGER;
    _total_stock INTEGER;
    _sz TEXT;
    _inserted_order public.orders%ROWTYPE;
BEGIN
    IF p_order IS NULL OR jsonb_array_length(COALESCE(p_order->'items', '[]'::jsonb)) = 0 THEN
        RAISE EXCEPTION 'অর্ডারে কোনো পণ্য নেই।';
    END IF;

    -- Lock and deduct each ordered line item atomically
    FOR _item IN SELECT * FROM jsonb_array_elements(p_order->'items')
    LOOP
        _product_id := COALESCE(_item->'product'->>'id', _item->>'productId');
        _selected_size := NULLIF(TRIM(COALESCE(_item->>'selectedSize', '')), '');
        _qty := COALESCE((_item->>'quantity')::INTEGER, 0);

        IF _product_id IS NULL OR _qty <= 0 THEN
            RAISE EXCEPTION 'অবৈধ পণ্যের পরিমাণ পাওয়া গেছে।';
        END IF;

        SELECT * INTO _prod
        FROM public.products
        WHERE id = _product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'পণ্য (%) ডাটাবেজে পাওয়া যায়নি।', _product_id;
        END IF;

        _size_inv := _prod.size_inventory;
        _has_sizes := false;
        IF _size_inv IS NOT NULL AND jsonb_typeof(_size_inv) = 'object' THEN
            FOR _sz IN SELECT unnest(ARRAY['S','M','L','XL','XXL'])
            LOOP
                IF COALESCE((_size_inv->_sz->>'enabled')::BOOLEAN, false) THEN
                    _has_sizes := true;
                END IF;
            END LOOP;
        END IF;

        IF _has_sizes THEN
            IF _selected_size IS NULL OR NOT (_selected_size = ANY(ARRAY['S','M','L','XL','XXL'])) THEN
                RAISE EXCEPTION '"%" এর জন্য অনুগ্রহ করে একটি বৈধ সাইজ নির্বাচন করুন।', _prod.name;
            END IF;

            _size_entry := _size_inv->_selected_size;
            IF _size_entry IS NULL OR NOT COALESCE((_size_entry->>'enabled')::BOOLEAN, false) THEN
                RAISE EXCEPTION '"%" এর সাইজ "%" বর্তমানে উপলব্ধ নয়।', _prod.name, _selected_size;
            END IF;

            _size_stock := GREATEST(0, COALESCE((_size_entry->>'stock')::INTEGER, 0));
            IF _qty > _size_stock THEN
                RAISE EXCEPTION '"%" (সাইজ: %) পর্যাপ্ত স্টক নেই। উপলব্ধ: % টি।', _prod.name, _selected_size, _size_stock;
            END IF;

            _new_size_stock := _size_stock - _qty;
            _size_inv := jsonb_set(
                _size_inv,
                ARRAY[_selected_size, 'stock'],
                to_jsonb(_new_size_stock),
                true
            );

            _total_stock := 0;
            FOR _sz IN SELECT unnest(ARRAY['S','M','L','XL','XXL'])
            LOOP
                IF COALESCE((_size_inv->_sz->>'enabled')::BOOLEAN, false) THEN
                    _total_stock := _total_stock + GREATEST(0, COALESCE((_size_inv->_sz->>'stock')::INTEGER, 0));
                END IF;
            END LOOP;

            UPDATE public.products
            SET size_inventory = _size_inv,
                stock = _total_stock,
                updated_at = timezone('utc'::text, now())
            WHERE id = _product_id;
        ELSE
            IF _qty > _prod.stock THEN
                RAISE EXCEPTION '"%" পর্যাপ্ত স্টক নেই। উপলব্ধ: % টি।', _prod.name, _prod.stock;
            END IF;

            UPDATE public.products
            SET stock = _prod.stock - _qty,
                updated_at = timezone('utc'::text, now())
            WHERE id = _product_id;
        END IF;
    END LOOP;

    INSERT INTO public.orders (
        id,
        order_number,
        customer_name,
        phone_number,
        delivery_address,
        delivery_area,
        notes,
        items,
        subtotal,
        delivery_fee,
        total,
        status,
        payment_status,
        stock_deducted,
        order_date
    ) VALUES (
        p_order->>'id',
        p_order->>'order_number',
        p_order->>'customer_name',
        p_order->>'phone_number',
        p_order->>'delivery_address',
        COALESCE(p_order->>'delivery_area', 'inside_dhaka'),
        p_order->>'notes',
        p_order->'items',
        COALESCE((p_order->>'subtotal')::NUMERIC, 0),
        COALESCE((p_order->>'delivery_fee')::NUMERIC, 0),
        COALESCE((p_order->>'total')::NUMERIC, 0),
        COALESCE(p_order->>'status', 'pending'),
        COALESCE(p_order->>'payment_status', 'cod'),
        true,
        COALESCE((p_order->>'order_date')::TIMESTAMPTZ, timezone('utc'::text, now()))
    )
    RETURNING * INTO _inserted_order;

    RETURN _inserted_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_order_status_with_stock(
    p_order_id TEXT,
    p_status TEXT,
    p_payment_status TEXT DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    _order public.orders%ROWTYPE;
    _item JSONB;
    _product_id TEXT;
    _selected_size TEXT;
    _qty INTEGER;
    _prod public.products%ROWTYPE;
    _size_inv JSONB;
    _has_sizes BOOLEAN;
    _size_stock INTEGER;
    _total_stock INTEGER;
    _sz TEXT;
    _next_stock_deducted BOOLEAN;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'অর্ডার আপডেট করার অনুমতি নেই।';
    END IF;

    SELECT * INTO _order
    FROM public.orders
    WHERE id = p_order_id OR order_number = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'অর্ডার পাওয়া যায়নি।';
    END IF;

    _next_stock_deducted := _order.stock_deducted;

    -- Transition to cancelled while stock is deducted -> restore stock
    IF p_status = 'cancelled' AND _order.stock_deducted = true THEN
        FOR _item IN SELECT * FROM jsonb_array_elements(_order.items)
        LOOP
            _product_id := COALESCE(_item->'product'->>'id', _item->>'productId');
            _selected_size := NULLIF(TRIM(COALESCE(_item->>'selectedSize', '')), '');
            _qty := COALESCE((_item->>'quantity')::INTEGER, 0);

            IF _product_id IS NOT NULL AND _qty > 0 THEN
                SELECT * INTO _prod FROM public.products WHERE id = _product_id FOR UPDATE;
                IF FOUND THEN
                    _size_inv := _prod.size_inventory;
                    _has_sizes := false;
                    IF _size_inv IS NOT NULL AND jsonb_typeof(_size_inv) = 'object' THEN
                        FOR _sz IN SELECT unnest(ARRAY['S','M','L','XL','XXL'])
                        LOOP
                            IF COALESCE((_size_inv->_sz->>'enabled')::BOOLEAN, false) THEN
                                _has_sizes := true;
                            END IF;
                        END LOOP;
                    END IF;

                    IF _has_sizes AND _selected_size IS NOT NULL AND _size_inv ? _selected_size THEN
                        _size_stock := GREATEST(0, COALESCE((_size_inv->_selected_size->>'stock')::INTEGER, 0)) + _qty;
                        _size_inv := jsonb_set(_size_inv, ARRAY[_selected_size, 'stock'], to_jsonb(_size_stock), true);

                        _total_stock := 0;
                        FOR _sz IN SELECT unnest(ARRAY['S','M','L','XL','XXL'])
                        LOOP
                            IF COALESCE((_size_inv->_sz->>'enabled')::BOOLEAN, false) THEN
                                _total_stock := _total_stock + GREATEST(0, COALESCE((_size_inv->_sz->>'stock')::INTEGER, 0));
                            END IF;
                        END LOOP;

                        UPDATE public.products
                        SET size_inventory = _size_inv,
                            stock = _total_stock,
                            updated_at = timezone('utc'::text, now())
                        WHERE id = _product_id;
                    ELSE
                        UPDATE public.products
                        SET stock = _prod.stock + _qty,
                            updated_at = timezone('utc'::text, now())
                        WHERE id = _product_id;
                    END IF;
                END IF;
            END IF;
        END LOOP;
        _next_stock_deducted := false;

    -- Transition from cancelled back to active -> re-validate & re-deduct
    ELSIF _order.status = 'cancelled' AND p_status <> 'cancelled' AND _order.stock_deducted = false THEN
        FOR _item IN SELECT * FROM jsonb_array_elements(_order.items)
        LOOP
            _product_id := COALESCE(_item->'product'->>'id', _item->>'productId');
            _selected_size := NULLIF(TRIM(COALESCE(_item->>'selectedSize', '')), '');
            _qty := COALESCE((_item->>'quantity')::INTEGER, 0);

            IF _product_id IS NOT NULL AND _qty > 0 THEN
                SELECT * INTO _prod FROM public.products WHERE id = _product_id FOR UPDATE;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'পণ্য (%) খুঁজে পাওয়া যায়নি।', _product_id;
                END IF;

                _size_inv := _prod.size_inventory;
                _has_sizes := false;
                IF _size_inv IS NOT NULL AND jsonb_typeof(_size_inv) = 'object' THEN
                    FOR _sz IN SELECT unnest(ARRAY['S','M','L','XL','XXL'])
                    LOOP
                        IF COALESCE((_size_inv->_sz->>'enabled')::BOOLEAN, false) THEN
                            _has_sizes := true;
                        END IF;
                    END LOOP;
                END IF;

                IF _has_sizes AND _selected_size IS NOT NULL AND _size_inv ? _selected_size THEN
                    _size_stock := GREATEST(0, COALESCE((_size_inv->_selected_size->>'stock')::INTEGER, 0));
                    IF _qty > _size_stock THEN
                        RAISE EXCEPTION '"%" (সাইজ: %) পর্যাপ্ত স্টক নেই।', _prod.name, _selected_size;
                    END IF;
                    _size_inv := jsonb_set(_size_inv, ARRAY[_selected_size, 'stock'], to_jsonb(_size_stock - _qty), true);

                    _total_stock := 0;
                    FOR _sz IN SELECT unnest(ARRAY['S','M','L','XL','XXL'])
                    LOOP
                        IF COALESCE((_size_inv->_sz->>'enabled')::BOOLEAN, false) THEN
                            _total_stock := _total_stock + GREATEST(0, COALESCE((_size_inv->_sz->>'stock')::INTEGER, 0));
                        END IF;
                    END LOOP;

                    UPDATE public.products
                    SET size_inventory = _size_inv,
                        stock = _total_stock,
                        updated_at = timezone('utc'::text, now())
                    WHERE id = _product_id;
                ELSE
                    IF _qty > _prod.stock THEN
                        RAISE EXCEPTION '"%" পর্যাপ্ত স্টক নেই।', _prod.name;
                    END IF;
                    UPDATE public.products
                    SET stock = _prod.stock - _qty,
                        updated_at = timezone('utc'::text, now())
                    WHERE id = _product_id;
                END IF;
            END IF;
        END LOOP;
        _next_stock_deducted := true;
    END IF;

    UPDATE public.orders
    SET status = p_status,
        payment_status = COALESCE(p_payment_status, payment_status),
        stock_deducted = _next_stock_deducted,
        updated_at = timezone('utc'::text, now())
    WHERE id = _order.id
    RETURNING * INTO _order;

    RETURN _order;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_with_stock_deduction(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_with_stock_deduction(JSONB) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.update_order_status_with_stock(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_status_with_stock(TEXT, TEXT, TEXT) TO authenticated;

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

DROP TRIGGER IF EXISTS on_orders_updated ON public.orders;
CREATE TRIGGER on_orders_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
