-- Fix PUBLIC_DATA_EXPOSURE: Replace public read policies with authenticated-only policies

-- 1. Drop public read policy on accounts
DROP POLICY IF EXISTS "Allow public read on accounts" ON public.accounts;

-- 2. Create authenticated-only read policy on accounts
CREATE POLICY "Authenticated users can read accounts"
ON public.accounts FOR SELECT
TO authenticated
USING (true);

-- 3. Drop public read policy on deals
DROP POLICY IF EXISTS "Allow public read on deals" ON public.deals;

-- 4. Create authenticated-only read policy on deals
CREATE POLICY "Authenticated users can read deals"
ON public.deals FOR SELECT
TO authenticated
USING (true);

-- 5. Drop public read policy on emails_sent
DROP POLICY IF EXISTS "Allow public read on emails_sent" ON public.emails_sent;

-- 6. Create authenticated-only read policy on emails_sent
CREATE POLICY "Authenticated users can read emails"
ON public.emails_sent FOR SELECT
TO authenticated
USING (true);

-- 7. Drop public read policy on titles
DROP POLICY IF EXISTS "Allow public read on titles" ON public.titles;

-- 8. Create authenticated-only read policy on titles
CREATE POLICY "Authenticated users can read titles"
ON public.titles FOR SELECT
TO authenticated
USING (true);