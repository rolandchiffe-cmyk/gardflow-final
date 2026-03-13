/*
  # Create commerce_claims table

  1. New Tables
    - `commerce_claims`
      - `id` (uuid, primary key)
      - `commerce_id` (uuid, FK reference to commerces_artisans)
      - `commerce_name` (text, name at time of claim)
      - `nom` (text, claimant last name)
      - `prenom` (text, claimant first name)
      - `email` (text)
      - `phone` (text, optional)
      - `role_in_commerce` (text, role/capacity of the claimant)
      - `message` (text, optional justification)
      - `status` (text: pending/approved/rejected)
      - `admin_note` (text, optional admin comment)
      - `user_id` (uuid, optional FK to auth.users if logged in)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on commerce_claims
    - Authenticated users can insert a claim
    - Authenticated users can read their own claims
    - Admins can read and update all claims

  3. Indexes
    - On status for admin filtering
    - On commerce_id for lookup
*/

CREATE TABLE IF NOT EXISTS commerce_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL,
  commerce_name text NOT NULL DEFAULT '',
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  role_in_commerce text NOT NULL DEFAULT '',
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text DEFAULT '',
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commerce_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit commerce claims"
  ON commerce_claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own commerce claims"
  ON commerce_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all commerce claims"
  ON commerce_claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update commerce claims"
  ON commerce_claims FOR UPDATE
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

CREATE INDEX IF NOT EXISTS idx_commerce_claims_status ON commerce_claims(status);
CREATE INDEX IF NOT EXISTS idx_commerce_claims_commerce_id ON commerce_claims(commerce_id);
