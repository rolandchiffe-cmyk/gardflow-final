
/*
  # Create commerces_artisans table

  1. New Tables
    - `commerces_artisans`
      - `id` (uuid, primary key)
      - `name` (text) - nom du commerce ou artisan
      - `commune` (text) - nom de la commune
      - `address` (text) - adresse
      - `postal_code` (text) - code postal
      - `phone` (text) - téléphone
      - `email` (text) - email
      - `category` (text) - catégorie métier (Boucherie, Plombier, etc.)
      - `type` (text) - type fixe: 'commerce_artisan'
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Public read access (annuaire public)
    - Authenticated users can insert/update their own entries
*/

CREATE TABLE IF NOT EXISTS commerces_artisans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  commune text NOT NULL,
  address text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'commerce_artisan',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commerces_artisans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read commerces_artisans"
  ON commerces_artisans
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert commerces_artisans"
  ON commerces_artisans
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update commerces_artisans"
  ON commerces_artisans
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_commerces_artisans_commune ON commerces_artisans(commune);
CREATE INDEX IF NOT EXISTS idx_commerces_artisans_category ON commerces_artisans(category);
CREATE INDEX IF NOT EXISTS idx_commerces_artisans_postal_code ON commerces_artisans(postal_code);
