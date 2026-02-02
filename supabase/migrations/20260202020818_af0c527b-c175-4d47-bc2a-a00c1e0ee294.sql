-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a stricter policy that ONLY allows viewing your own profile
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update the existing policies to use PERMISSIVE instead of RESTRICTIVE
-- First drop and recreate with proper permissive mode
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);