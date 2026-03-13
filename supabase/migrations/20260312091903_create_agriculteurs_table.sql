
/*
  # Create agriculteurs table

  1. New Tables
    - `agriculteurs`
      - `id` (uuid, primary key)
      - `name` (text) - nom de l'exploitation (GAEC, EARL, Mas, Ferme, etc.)
      - `commune` (text) - nom de la commune
      - `address` (text) - adresse
      - `postal_code` (text) - code postal
      - `phone` (text) - téléphone
      - `email` (text) - email
      - `production_type` (text) - type de production (Viticulture, Maraîchage, etc.)
      - `vente_directe` (boolean) - vente directe à la ferme, false par défaut
      - `type` (text) - type fixe: 'agriculteur'
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Public read access (annuaire public)
    - Authenticated users can insert/update

  3. Notes
    - Le champ vente_directe permet d'afficher un badge "Vente Directe" sur la fiche
    - Les types de production incluent: Viticulture, Maraîchage, Arboriculture, Élevage bovin,
      Élevage ovin, Élevage caprin, Apiculture, Oléiculture, Céréales, Plantes aromatiques
*/

CREATE TABLE IF NOT EXISTS agriculteurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  commune text NOT NULL,
  address text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  production_type text NOT NULL DEFAULT '',
  vente_directe boolean NOT NULL DEFAULT false,
  type text NOT NULL DEFAULT 'agriculteur',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agriculteurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agriculteurs"
  ON agriculteurs
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert agriculteurs"
  ON agriculteurs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update agriculteurs"
  ON agriculteurs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_agriculteurs_commune ON agriculteurs(commune);
CREATE INDEX IF NOT EXISTS idx_agriculteurs_production_type ON agriculteurs(production_type);
CREATE INDEX IF NOT EXISTS idx_agriculteurs_vente_directe ON agriculteurs(vente_directe);
CREATE INDEX IF NOT EXISTS idx_agriculteurs_postal_code ON agriculteurs(postal_code);
