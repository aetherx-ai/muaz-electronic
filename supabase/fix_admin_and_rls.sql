-- ==============================================================================
-- MUAZ ELECTRONIC: Supabase Admin Authorization & RLS Policy Fix
-- Exact admin_users schema: (user_id UUID, is_active BOOLEAN, created_at TIMESTAMPTZ)
-- No "id" column, No "email" column.
-- ==============================================================================

-- 1. Ensure admin_users table exists with ONLY the verified schema
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Non-recursive SECURITY DEFINER helper function
-- Strictly verifies the calling user's auth.uid() against admin_users.user_id
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

-- Grant execution to authenticated and anon
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 3. RLS Policies on public.admin_users
-- Requirement: An authenticated user can read ONLY their own admin_users record.
DROP POLICY IF EXISTS "Users can read own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view their own record" ON public.admin_users;
DROP POLICY IF EXISTS "Allow user to check own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Active admins manage admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON public.admin_users;

CREATE POLICY "Users can read own admin record"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 4. Setup / Repair public.categories table & RLS policies
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bengali_name TEXT,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'Layers',
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Clean up any outdated category policies
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Active admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Active admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Active admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admin full access on categories" ON public.categories;
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;

-- Policy 1: Public users can read active categories (and active admins can view all)
CREATE POLICY "Public can view active categories"
    ON public.categories
    FOR SELECT
    USING (is_active = true OR public.is_admin());

-- Policy 2: Only active authorized admins can create categories
CREATE POLICY "Active admins can insert categories"
    ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Policy 3: Only active authorized admins can update categories
CREATE POLICY "Active admins can update categories"
    ON public.categories
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policy 4: Only active authorized admins can delete categories
CREATE POLICY "Active admins can delete categories"
    ON public.categories
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 5. Seed / Ensure "Watch" ("ঘড়ি") exists in public.categories
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
