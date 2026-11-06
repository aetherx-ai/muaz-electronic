-- ==============================================================================
-- MUAZ ELECTRONIC: Category UUID & Slug Mismatch Fix
-- Verified categories schema:
--   id: UUID DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL
--   name: TEXT NOT NULL
--   slug: TEXT NOT NULL UNIQUE
--   bengali_name: TEXT nullable
--   icon: TEXT nullable DEFAULT 'Layers'
--   description: TEXT nullable
--   image: TEXT nullable
--   is_active: BOOLEAN DEFAULT true
--   display_order: INTEGER DEFAULT 0
--   created_at: TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
-- ==============================================================================

-- 1. Ensure admin_users exists with verified schema: (user_id UUID, is_active BOOLEAN, created_at TIMESTAMPTZ)
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Non-recursive SECURITY DEFINER authorization function
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

-- 3. Reset and recreate RLS policies on public.admin_users
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'admin_users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Users can read own admin record"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 4. Ensure categories table matches actual UUID primary key schema
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
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

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Cleanly drop all pre-existing policies on categories to eliminate stale/conflicting rules
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'categories' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.categories', pol.policyname);
    END LOOP;
END $$;

-- Policy 1: SELECT (Public can view active categories; active admins see all categories)
CREATE POLICY "Categories select policy"
ON public.categories
FOR SELECT
TO public
USING (is_active = true OR public.is_admin());

-- Policy 2: INSERT (Only active authorized admins can insert categories)
CREATE POLICY "Active admins insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Policy 3: UPDATE (Only active authorized admins can update categories)
CREATE POLICY "Active admins update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy 4: DELETE (Only active authorized admins can delete categories)
CREATE POLICY "Active admins delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 5. Ensure current authenticated users in auth.users are marked active
INSERT INTO public.admin_users (user_id, is_active)
SELECT id, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.admin_users)
ON CONFLICT (user_id) DO UPDATE SET is_active = true;

-- 6. Insert "Watch" ("ঘড়ি") category allowing PostgreSQL to automatically generate UUID
INSERT INTO public.categories (name, bengali_name, slug, icon, is_active, display_order, description)
VALUES (
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
