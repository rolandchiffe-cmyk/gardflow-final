/*
  # Create association_claims table

  1. New Tables
    - `association_claims`
      - `id` (uuid, primary key)
      - `association_id` (uuid, FK to associations)
      - `association_name` (text, name at time of claim)
      - `nom` (text, claimant last name)
      - `prenom` (text, claimant first name)
      - `email` (text)
      - `phone` (text, optional)
      - `role_in_association` (text, role of the claimant)
      - `message` (text, optional justification)
      - `status` (text: pending/approved/rejected)
      - `admin_note` (text, optional admin comment)
      - `user_id` (uuid, optional FK to users if logged in)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Authenticated users can insert (submit a claim)
    - Authenticated users can read their own claims
    - Admins can read/update all claims via service role
*/

CREATE TABLE IF NOT EXISTS association_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL,
  association_name text NOT NULL DEFAULT '',
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  role_in_association text NOT NULL DEFAULT '',
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text DEFAULT '',
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE association_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit claims"
  ON association_claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own claims"
  ON association_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all claims"
  ON association_claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update claims"
  ON association_claims FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_association_claims_status ON association_claims(status);
CREATE INDEX IF NOT EXISTS idx_association_claims_association_id ON association_claims(association_id);
