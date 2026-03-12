/*
  # Add Account Type to Users

  1. Changes
    - Add `account_type` column to users table to distinguish between 'particulier' and 'professionnel'
    - This allows different registration flows and features based on account type
  
  2. Notes
    - Default value is 'particulier' for existing users
    - This field is used to enable SIRET requirements and business features for professionals
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE users ADD COLUMN account_type text DEFAULT 'particulier';
  END IF;
END $$;