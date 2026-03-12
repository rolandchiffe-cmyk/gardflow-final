/*
  # Allow anonymous users to read communes
  
  1. Changes
    - Drop existing restrictive policy
    - Add new policy allowing both authenticated and anonymous users to read communes
    - This is needed for the registration form where users are not yet authenticated
  
  2. Security
    - Safe to allow public read access to communes (list of towns)
    - No sensitive data in the communes table
    - Still maintains RLS protection (only SELECT is allowed)
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Anyone can view communes" ON communes;

-- Create new policy allowing both authenticated and anonymous users
CREATE POLICY "Public can view communes"
  ON communes
  FOR SELECT
  TO anon, authenticated
  USING (true);
