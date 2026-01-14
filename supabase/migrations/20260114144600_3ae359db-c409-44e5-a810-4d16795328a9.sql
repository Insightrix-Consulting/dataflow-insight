-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop the overly permissive audit log policy and create a proper one
DROP POLICY IF EXISTS "System can insert audit entries" ON public.audit_log;

-- Create a proper audit log insert policy - only allow users to insert their own audit entries
CREATE POLICY "Users can insert own audit entries" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);