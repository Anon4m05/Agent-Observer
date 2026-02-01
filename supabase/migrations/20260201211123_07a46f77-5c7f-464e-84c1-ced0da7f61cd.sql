-- Fix overly permissive RLS policies on shared data tables
-- These tables should only be writable by the service role (used by scraper)
-- Regular authenticated users should only have SELECT access

-- Drop permissive INSERT/UPDATE policies on agents
DROP POLICY IF EXISTS "Authenticated users can insert agents" ON public.agents;
DROP POLICY IF EXISTS "Authenticated users can update agents" ON public.agents;

-- Drop permissive INSERT policy on posts  
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON public.posts;

-- Drop permissive INSERT/UPDATE policies on submolts
DROP POLICY IF EXISTS "Authenticated users can insert submolts" ON public.submolts;
DROP POLICY IF EXISTS "Authenticated users can update submolts" ON public.submolts;

-- Drop permissive INSERT policy on comments
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;

-- The SELECT policies with USING (true) are intentional for public read access
-- and are excluded from the security warning

-- Note: The scraper edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS,
-- so it can still insert/update data. Regular users can only read.