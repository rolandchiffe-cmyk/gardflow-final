/*
  # Add commune_id and images support to posts

  1. Changes
    - Add `commune_id` column to posts table to track which commune a post belongs to
    - Add `images` JSONB column to posts table to support multiple images (stored as array)
    
  2. Security
    - Maintain existing RLS policies on posts table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'commune_id'
  ) THEN
    ALTER TABLE posts ADD COLUMN commune_id uuid REFERENCES communes(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'images'
  ) THEN
    ALTER TABLE posts ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;