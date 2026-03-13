/*
  # Add address and postal_code to associations, make user_id nullable

  1. Changes
    - Add `address` column (text, nullable) to associations
    - Add `postal_code` column (text, nullable) to associations
    - Add `commune_name` column (text, nullable) to store commune name directly
    - Make `user_id` nullable to allow seeding data without a user
  2. Security
    - Add public read policy for associations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'associations' AND column_name = 'address'
  ) THEN
    ALTER TABLE associations ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'associations' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE associations ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'associations' AND column_name = 'commune_name'
  ) THEN
    ALTER TABLE associations ADD COLUMN commune_name text;
  END IF;
END $$;

ALTER TABLE associations ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'associations' AND policyname = 'Anyone can read associations'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can read associations" ON associations FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;
