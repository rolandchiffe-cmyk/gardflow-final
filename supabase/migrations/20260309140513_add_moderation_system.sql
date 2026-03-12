/*
  # Add Moderation System

  1. Changes to Tables
    - `posts`
      - Add `status` column (enum: 'published', 'pending', 'rejected')
      - Add `rejection_reason` column (text)
      - Add `validated_by` column (foreign key to users)
      - Add `validated_at` column (timestamp)
    
    - `salons`
      - Add `status` column (enum: 'en_attente', 'actif', 'refuse')
      - Add `rejection_reason` column (text)
      - Add `validated_by` column (foreign key to users)
      - Add `validated_at` column (timestamp)
    
    - `publicites`
      - Add `status` column (enum: 'en_attente_validation', 'valide', 'refuse')
      - Add `rejection_reason` column (text)
      - Add `validated_by` column (foreign key to users)
      - Add `validated_at` column (timestamp)

  2. Security
    - Update RLS policies to respect moderation status
    - Only show published/validated content to regular users
    - Allow admins to see all content
*/

-- Add status columns to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'status'
  ) THEN
    ALTER TABLE posts ADD COLUMN status text DEFAULT 'published' CHECK (status IN ('published', 'pending', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE posts ADD COLUMN rejection_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'validated_by'
  ) THEN
    ALTER TABLE posts ADD COLUMN validated_by uuid REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'validated_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN validated_at timestamptz;
  END IF;
END $$;

-- Add status columns to salons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salons' AND column_name = 'status'
  ) THEN
    ALTER TABLE salons ADD COLUMN status text DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'actif', 'refuse'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salons' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE salons ADD COLUMN rejection_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salons' AND column_name = 'validated_by'
  ) THEN
    ALTER TABLE salons ADD COLUMN validated_by uuid REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salons' AND column_name = 'validated_at'
  ) THEN
    ALTER TABLE salons ADD COLUMN validated_at timestamptz;
  END IF;
END $$;

-- Add status columns to publicites table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'publicites' AND column_name = 'status'
  ) THEN
    ALTER TABLE publicites ADD COLUMN status text DEFAULT 'en_attente_validation' CHECK (status IN ('en_attente_validation', 'valide', 'refuse'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'publicites' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE publicites ADD COLUMN rejection_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'publicites' AND column_name = 'validated_by'
  ) THEN
    ALTER TABLE publicites ADD COLUMN validated_by uuid REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'publicites' AND column_name = 'validated_at'
  ) THEN
    ALTER TABLE publicites ADD COLUMN validated_at timestamptz;
  END IF;
END $$;

-- Update existing posts to set proper status based on account type
UPDATE posts
SET status = 'published'
WHERE status IS NULL;

-- Update RLS policies for posts to filter by status
DROP POLICY IF EXISTS "Users can view published posts" ON posts;
CREATE POLICY "Users can view published posts"
  ON posts FOR SELECT
  TO authenticated
  USING (
    status = 'published' OR 
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Update RLS policies for salons to filter by status
DROP POLICY IF EXISTS "Users can view active salons" ON salons;
CREATE POLICY "Users can view active salons"
  ON salons FOR SELECT
  TO authenticated
  USING (
    status = 'actif' OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Update RLS policies for publicites to filter by status
DROP POLICY IF EXISTS "Users can view active publicites" ON publicites;
CREATE POLICY "Users can view active publicites"
  ON publicites FOR SELECT
  TO authenticated
  USING (
    (status = 'valide' AND is_active = true) OR
    EXISTS (
      SELECT 1 FROM commerces
      WHERE commerces.id = publicites.commerce_id
      AND commerces.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Add policies for admins to update validation status
DROP POLICY IF EXISTS "Admins can update post status" ON posts;
CREATE POLICY "Admins can update post status"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update salon status" ON salons;
CREATE POLICY "Admins can update salon status"
  ON salons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update publicite status" ON publicites;
CREATE POLICY "Admins can update publicite status"
  ON publicites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Add policy for admins to delete content
DROP POLICY IF EXISTS "Admins can delete posts" ON posts;
CREATE POLICY "Admins can delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete salons" ON salons;
CREATE POLICY "Admins can delete salons"
  ON salons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete publicites" ON publicites;
CREATE POLICY "Admins can delete publicites"
  ON publicites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );