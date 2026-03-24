
-- Drop old policies that use PUBLIC role
DROP POLICY IF EXISTS "Users can insert own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can view own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON public.collections;

DROP POLICY IF EXISTS "Users can insert own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can view own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.entries;

-- Recreate with authenticated role
CREATE POLICY "Users can view own collections" ON public.collections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collections" ON public.collections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON public.collections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own entries" ON public.entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON public.entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON public.entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
