-- Add DELETE policy for moltbook_credentials so users can remove their credentials
CREATE POLICY "Users can delete their own credentials"
ON public.moltbook_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);