/*
  # Update Users Table for New Registration System

  1. Changes to Users Table
    - Add `prenom` (first name) for particulier accounts
    - Add `nom` (last name) for particulier accounts
    - Add `telephone` (phone number) for all accounts
    - Add `autre_commune` (other commune) for custom commune entry
    - Add `geolocalisation_autorisee` (geolocation permission) for particulier accounts
    - Add `activite` (business activity) for professionnel accounts
    - Add `adresse` (address) for professionnel accounts
    - Add `site_internet` (website) for professionnel accounts
    - Add `photo_profil_url` (profile photo URL) for particulier accounts
    - Add `logo_url` (logo URL) for professionnel accounts
    
  2. Notes
    - All new fields are optional to maintain compatibility with existing data
    - Fields are differentiated by account_type (particulier vs professionnel)
*/

DO $$
BEGIN
  -- Add prenom for particulier
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'prenom'
  ) THEN
    ALTER TABLE users ADD COLUMN prenom text;
  END IF;

  -- Add nom for particulier
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'nom'
  ) THEN
    ALTER TABLE users ADD COLUMN nom text;
  END IF;

  -- Add telephone for all accounts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'telephone'
  ) THEN
    ALTER TABLE users ADD COLUMN telephone text;
  END IF;

  -- Add autre_commune for custom commune entry
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'autre_commune'
  ) THEN
    ALTER TABLE users ADD COLUMN autre_commune text;
  END IF;

  -- Add geolocalisation_autorisee for particulier
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'geolocalisation_autorisee'
  ) THEN
    ALTER TABLE users ADD COLUMN geolocalisation_autorisee boolean DEFAULT false;
  END IF;

  -- Add activite for professionnel
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'activite'
  ) THEN
    ALTER TABLE users ADD COLUMN activite text;
  END IF;

  -- Add adresse for professionnel
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'adresse'
  ) THEN
    ALTER TABLE users ADD COLUMN adresse text;
  END IF;

  -- Add site_internet for professionnel
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'site_internet'
  ) THEN
    ALTER TABLE users ADD COLUMN site_internet text;
  END IF;

  -- Add photo_profil_url for particulier
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'photo_profil_url'
  ) THEN
    ALTER TABLE users ADD COLUMN photo_profil_url text;
  END IF;

  -- Add logo_url for professionnel
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE users ADD COLUMN logo_url text;
  END IF;
END $$;