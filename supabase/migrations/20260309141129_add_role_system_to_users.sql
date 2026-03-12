/*
  # Add Role System to Users

  1. Changes
    - Add `role` column to `users` table with values 'user' or 'admin'
    - Default value is 'user'
    - Migrate existing `is_admin` data to new `role` column
    - Keep `is_admin` for backward compatibility temporarily

  2. Security
    - No RLS changes needed as users table already has proper policies
*/

-- Add role column with default value if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text DEFAULT 'user';
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
    
    -- Migrate existing is_admin values to role
    UPDATE users SET role = 'admin' WHERE is_admin = true;
    UPDATE users SET role = 'user' WHERE is_admin = false OR is_admin IS NULL;
  END IF;
END $$;