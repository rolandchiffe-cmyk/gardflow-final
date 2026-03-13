/*
  # Create agriculteur_claims table

  1. New Tables
    - `agriculteur_claims`
      - `id` (uuid, primary key)
      - `agriculteur_id` (uuid, reference to agriculteurs)
      - `agriculteur_name` (text, name at time of claim)
      - `nom` (text, claimant last name)
      - `prenom` (text, claimant first name)
      - `email` (text)
      - `phone` (text, optional)
      - `role_in_exploitation` (text, role/capacity of the claimant)
      - `message` (text, optional justification)
      - `status` (text: pending/approved/rejected)
      - `admin_note` (text, optional admin comment)
      - `user_id` (uuid, optional FK to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Authenticated users can insert a claim
    - Authenticated users can read their own claims
    - Admins can read and update all claims

  3. Indexes
    - On status for admin filtering
    - On agriculteur_id for lookup
*/

CREATE TABLE IF NOT EXISTS agriculteur_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agriculteur_id uuid NOT NULL,
  agriculteur_name text NOT NULL DEFAULT '',
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  role_in_exploitation text NOT NULL DEFAULT '',
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text DEFAULT '',
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agriculteur_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit agriculteur claims"
  ON agriculteur_claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own agriculteur claims"
  ON agriculteur_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all agriculteur claims"
  ON agriculteur_claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update agriculteur claims"
  ON agriculteur_claims FOR UPDATE
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

CREATE INDEX IF NOT EXISTS idx_agriculteur_claims_status ON agriculteur_claims(status);
CREATE INDEX IF NOT EXISTS idx_agriculteur_claims_agriculteur_id ON agriculteur_claims(agriculteur_id);
