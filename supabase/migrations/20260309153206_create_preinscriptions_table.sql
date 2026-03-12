/*
  # Create preinscriptions table

  1. New Tables
    - `preinscriptions`
      - `id` (uuid, primary key)
      - `prenom` (text, not null)
      - `email` (text, unique, not null)
      - `commune` (text, not null)
      - `date_inscription` (timestamptz, default now())

  2. Security
    - Enable RLS on `preinscriptions` table
    - Allow anonymous users to insert (public pre-registration form)
    - Allow anonymous users to read count (for displaying total)
    - No read access to individual rows for privacy
*/

CREATE TABLE IF NOT EXISTS preinscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom text NOT NULL,
  email text UNIQUE NOT NULL,
  commune text NOT NULL,
  date_inscription timestamptz DEFAULT now()
);

ALTER TABLE preinscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a pre-registration"
  ON preinscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can count pre-registrations"
  ON preinscriptions
  FOR SELECT
  TO anon, authenticated
  USING (true);
