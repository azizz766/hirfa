-- Migration: Dual-Role System
-- Date: 2026-05-27

-- 1. Add secondary_role to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS secondary_role TEXT DEFAULT NULL
CHECK (secondary_role IN ('artist', 'client', NULL));

-- 2. Add active_role to track current session role
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS active_role TEXT DEFAULT NULL
CHECK (active_role IN ('artist', 'client', NULL));

-- 3. Role history table
CREATE TABLE IF NOT EXISTS public.role_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_role TEXT NOT NULL,
  to_role TEXT NOT NULL,
  switched_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT DEFAULT NULL
);

-- 4. Index for role history lookups
CREATE INDEX IF NOT EXISTS idx_role_history_user_id ON public.role_history(user_id);
CREATE INDEX IF NOT EXISTS idx_users_secondary_role ON public.users(secondary_role);

-- 5. RLS for role_history
ALTER TABLE public.role_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role history"
ON public.role_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role history"
ON public.role_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. Function to switch role
CREATE OR REPLACE FUNCTION public.switch_user_role(
  p_user_id UUID,
  p_new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_role TEXT;
BEGIN
  SELECT role INTO v_current_role FROM public.users WHERE id = p_user_id;

  IF v_current_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_role = p_new_role THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already in this role');
  END IF;

  IF p_new_role = 'artist' THEN
    IF NOT EXISTS (SELECT 1 FROM public.artist_profiles WHERE user_id = p_user_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'requires_artist_profile');
    END IF;
  END IF;

  INSERT INTO public.role_history (user_id, from_role, to_role)
  VALUES (p_user_id, v_current_role, p_new_role);

  UPDATE public.users
  SET role = p_new_role, secondary_role = v_current_role
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'new_role', p_new_role, 'previous_role', v_current_role);
END;
$$;
