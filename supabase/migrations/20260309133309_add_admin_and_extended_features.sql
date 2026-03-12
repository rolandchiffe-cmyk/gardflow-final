/*
  # Add Admin and Extended Features

  1. Schema Changes
    
    ## Update Users Table
    - Add `is_admin` field for admin users
    - Add `siret` field for business users
    
    ## Update Salons Table
    - Add `is_approved` field for admin validation
    - Add `approved_by` field
    - Add `approved_at` field
    
    ## Create Event Attendees Table
    - Track users attending events
    
    ## Create Association Volunteers Table
    - Track volunteer opportunities and sign-ups
    
    ## Create Shares Table
    - Track post shares
    
  2. New Features
    - Admin role management
    - Salon approval workflow
    - Event attendance tracking
    - Volunteer management
    - Post sharing
*/

-- Update users table with admin and business fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'siret'
  ) THEN
    ALTER TABLE users ADD COLUMN siret text;
  END IF;
END $$;

-- Update salons table for approval workflow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salons' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE salons ADD COLUMN is_approved boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salons' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE salons ADD COLUMN approved_by uuid REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salons' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE salons ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

-- Update commerces table with SIRET
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commerces' AND column_name = 'siret'
  ) THEN
    ALTER TABLE commerces ADD COLUMN siret text;
  END IF;
END $$;

-- Create event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES evenements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'attending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event attendees"
  ON event_attendees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can register for events"
  ON event_attendees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel event registration"
  ON event_attendees FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create volunteer opportunities table
CREATE TABLE IF NOT EXISTS volunteer_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid REFERENCES associations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  skills_needed text,
  time_commitment text,
  start_date timestamptz,
  end_date timestamptz,
  max_volunteers integer,
  volunteers_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE volunteer_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view volunteer opportunities"
  ON volunteer_opportunities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Association owners can manage opportunities"
  ON volunteer_opportunities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM associations
      WHERE associations.id = volunteer_opportunities.association_id
      AND associations.user_id = auth.uid()
    )
  );

-- Create volunteer sign-ups table
CREATE TABLE IF NOT EXISTS volunteer_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES volunteer_opportunities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(opportunity_id, user_id)
);

ALTER TABLE volunteer_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view volunteer signups"
  ON volunteer_signups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can sign up as volunteers"
  ON volunteer_signups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel volunteer signups"
  ON volunteer_signups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create shares table
CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shares"
  ON shares FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can share posts"
  ON shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add shares_count to posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'shares_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN shares_count integer DEFAULT 0;
  END IF;
END $$;

-- Update salon policies to only show approved salons
DROP POLICY IF EXISTS "Anyone can view public salons" ON salons;

CREATE POLICY "Anyone can view approved public salons"
  ON salons FOR SELECT
  TO authenticated
  USING (
    (is_public = true AND is_approved = true) OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM salon_members
      WHERE salon_members.salon_id = salons.id
      AND salon_members.user_id = auth.uid()
    )
  );

-- Add admin policies
CREATE POLICY "Admins can view all salons"
  ON salons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update salons"
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