/*
  # Add prenom and commune columns to preinscriptions table

  1. Changes
    - Add `prenom` column (text)
    - Add `commune` column (text)
    - Add `date_inscription` column (timestamptz)
    - These columns are needed for the new pre-registration form

  2. Notes
    - Existing rows will have NULL for new columns, which is acceptable for legacy data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'preinscriptions' AND column_name = 'prenom'
  ) THEN
    ALTER TABLE preinscriptions ADD COLUMN prenom text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'preinscriptions' AND column_name = 'commune'
  ) THEN
    ALTER TABLE preinscriptions ADD COLUMN commune text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'preinscriptions' AND column_name = 'date_inscription'
  ) THEN
    ALTER TABLE preinscriptions ADD COLUMN date_inscription timestamptz DEFAULT now();
  END IF;
END $$;
