-- ==============================================================================
-- MUAZ ELECTRONIC: Supabase Admin Authorization & RLS Policy Fix
-- Target Admin: kl6544340@gmail.com
-- ==============================================================================

-- 1. Create or ensure the `admin_users` table exists
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Define a SECURITY DEFINER helper function to bypass RLS recursion
-- This guarantees that checking admin status never triggers 42501 permission errors
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
        WHERE (
            user_id = auth.uid()
            OR (auth.uid() IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
        )
        AND is_active = true
    );
$$;

-- 3. RLS Policies for `admin_users`
DROP POLICY IF EXISTS "Admins can view their own record" ON public.admin_users;
DROP POLICY IF EXISTS "Active admins manage admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Allow user to check own admin status" ON public.admin_users;

CREATE POLICY "Allow user to check own admin status"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR lower(email) = lower(auth.jwt() ->> 'email')
        OR public.is_admin()
    );

CREATE POLICY "Active admins manage admin records"
    ON public.admin_users
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Automatically link or authorize kl6544340@gmail.com
-- Insert or update admin record
INSERT INTO public.admin_users (email, role, is_active)
VALUES ('kl6544340@gmail.com', 'admin', true)
ON CONFLICT (email)
DO UPDATE SET
    is_active = true,
    role = 'admin',
    updated_at = timezone('utc'::text, now());

-- Map user_id if kl6544340@gmail.com already exists in auth.users
UPDATE public.admin_users au
SET user_id = u.id,
    updated_at = timezone('utc'::text, now())
FROM auth.users u
WHERE lower(u.email) = lower(au.email)
  AND lower(au.email) = 'kl6544340@gmail.com'
  AND (au.user_id IS NULL OR au.user_id != u.id);

-- 5. Trigger on auth.users for automatic future linking upon signup/login
CREATE OR REPLACE FUNCTION public.handle_admin_auth_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF lower(NEW.email) = 'kl6544340@gmail.com' THEN
        INSERT INTO public.admin_users (user_id, email, role, is_active)
        VALUES (NEW.id, lower(NEW.email), 'admin', true)
        ON CONFLICT (email)
        DO UPDATE SET
            user_id = NEW.id,
            is_active = true,
            updated_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin_sync ON auth.users;
CREATE TRIGGER on_auth_user_created_admin_sync
    AFTER INSERT OR UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_admin_auth_sync();

-- 6. Setup / Repair `categories` table and RLS policies
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bengali_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'Layers',
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop all outdated/conflicting category policies
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admin full access on categories" ON public.categories;
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;

-- Recreate strict, bulletproof category policies using public.is_admin()
CREATE POLICY "Public can view active categories"
    ON public.categories
    FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert categories"
    ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
    ON public.categories
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete categories"
    ON public.categories
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 7. Ensure "Watch" ("ঘড়ি") category exists in categories table
INSERT INTO public.categories (id, name, bengali_name, slug, icon, is_active, display_order, description)
VALUES (
    'cat-watch',
    'Watch',
    'ঘড়ি',
    'watch',
    'Layers',
    true,
    7,
    'স্মার্টওয়াচ, ফিটনেস ব্যান্ড ও প্রিমিয়াম হাতঘড়ি কালেকশন'
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    bengali_name = EXCLUDED.bengali_name,
    is_active = true,
    updated_at = timezone('utc'::text, now());
