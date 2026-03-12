/*
  # Add Role System to Users (v2)

  1. Changes
    - Add `role` column to public.users table with values 'user' or 'admin'
    - Default value is 'user'
    - Migrate existing `is_admin` data to new `role` column

  2. Security
    - No RLS changes needed as users table already has proper policies
*/

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));

UPDATE public.users SET role = 'admin' WHERE is_admin = true;
UPDATE public.users SET role = 'user' WHERE (is_admin = false OR is_admin IS NULL) AND role IS NULL;