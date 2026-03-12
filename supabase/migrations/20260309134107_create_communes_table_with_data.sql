/*
  # Create Communes Table with Gard Rhodanien Data

  1. New Tables
    - `communes`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `code_postal` (text)
      - `created_at` (timestamptz)
  
  2. Data
    - Insert all 44 communes of Gard Rhodanien
  
  3. Security
    - Enable RLS on communes table
    - Add policy for public read access (anyone can view communes for registration)
*/

CREATE TABLE IF NOT EXISTS communes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code_postal text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE communes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'communes' AND policyname = 'Anyone can view communes'
  ) THEN
    CREATE POLICY "Anyone can view communes"
      ON communes
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Insert all 44 communes of Gard Rhodanien
INSERT INTO communes (name, code_postal) VALUES
  ('Aiguèze', '30760'),
  ('Bagnols-sur-Cèze', '30200'),
  ('Carsan', '30130'),
  ('Cavillargues', '30330'),
  ('Chusclan', '30200'),
  ('Codolet', '30200'),
  ('Connaux', '30330'),
  ('Cornillon', '30630'),
  ('Gaujac', '30330'),
  ('Goudargues', '30630'),
  ('Issirac', '30760'),
  ('La Roque-sur-Cèze', '30200'),
  ('Laudun-l''Ardoise', '30290'),
  ('Laval-Saint-Roman', '30760'),
  ('Le Garn', '30760'),
  ('Le Pin', '30330'),
  ('Lirac', '30126'),
  ('Montclus', '30630'),
  ('Montfaucon', '30150'),
  ('Orsan', '30200'),
  ('Pont-Saint-Esprit', '30130'),
  ('Sabran', '30200'),
  ('Saint-Alexandre', '30130'),
  ('Saint-André de Roquepertuis', '30630'),
  ('Saint-André d''Olérargues', '30330'),
  ('Saint-Christol de Rodières', '30760'),
  ('Saint-Etienne des Sorts', '30200'),
  ('Saint-Geniès de Comolas', '30150'),
  ('Saint-Gervais', '30200'),
  ('Saint-Julien de Peyrolas', '30760'),
  ('Saint-Laurent des Arbres', '30126'),
  ('Saint-Laurent de Carnols', '30200'),
  ('Saint-Marcel de Careiret', '30330'),
  ('Saint-Michel d''Euzet', '30200'),
  ('Saint-Nazaire', '30200'),
  ('Saint-Paul-les-Fonts', '30330'),
  ('Saint-Paulet de Caisson', '30130'),
  ('Saint-Pons la Calm', '30330'),
  ('Saint-Victor-La-Coste', '30290'),
  ('Salazac', '30760'),
  ('Tavel', '30126'),
  ('Tresques', '30330'),
  ('Vénéjan', '30200'),
  ('Verfeuil', '30630')
ON CONFLICT (name) DO NOTHING;