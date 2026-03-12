/*
  # GardFlow Complete Database Schema

  1. New Tables
    
    ## Core User Tables
    - `users` - User profiles linked to auth.users
    - `communes` - Cities/communes in Gard Rhodanien
    
    ## Social Content
    - `posts` - User posts/discussions
    - `comments` - Comments on posts
    - `likes` - Likes on posts
    
    ## Group Communication
    - `salons` - Group chat rooms
    - `salon_members` - Membership in salons
    - `salon_messages` - Messages in salons
    
    ## Marketplace
    - `annonces` - Classified ads
    - `annonce_images` - Images for ads
    
    ## Business
    - `commerces` - Local businesses
    - `publicites` - Advertisements from businesses
    
    ## Events & Organizations
    - `evenements` - Local events
    - `associations` - Local associations
    
    ## Communication & Moderation
    - `messages` - Private messages between users
    - `notifications` - User notifications
    - `signalements` - Content reports
    - `sanctions` - User sanctions
    - `preinscriptions` - Pre-registration requests

  2. Security
    - RLS enabled on all tables
    - Appropriate policies for each table
    - User ownership validation
*/

-- Communes table
CREATE TABLE communes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code_postal text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE communes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view communes"
  ON communes FOR SELECT
  TO authenticated
  USING (true);

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  phone text,
  commune_id uuid REFERENCES communes(id),
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active users"
  ON users FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Posts table
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  image_url text,
  video_url text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Likes table
CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Salons table
CREATE TABLE salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_public boolean DEFAULT true,
  members_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public salons"
  ON salons FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create salons"
  ON salons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update own salons"
  ON salons FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Salon members table
CREATE TABLE salon_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, user_id)
);

ALTER TABLE salon_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view salon memberships"
  ON salon_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join salons"
  ON salon_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave salons"
  ON salon_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Salon messages table
CREATE TABLE salon_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE salon_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view salon messages"
  ON salon_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salon_members
      WHERE salon_members.salon_id = salon_messages.salon_id
      AND salon_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send salon messages"
  ON salon_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM salon_members
      WHERE salon_members.salon_id = salon_messages.salon_id
      AND salon_members.user_id = auth.uid()
    )
  );

-- Annonces table
CREATE TABLE annonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  price numeric,
  status text DEFAULT 'active',
  commune_id uuid REFERENCES communes(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active annonces"
  ON annonces FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Users can create own annonces"
  ON annonces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annonces"
  ON annonces FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own annonces"
  ON annonces FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Annonce images table
CREATE TABLE annonce_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id uuid REFERENCES annonces(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE annonce_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view annonce images"
  ON annonce_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add images to own annonces"
  ON annonce_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM annonces
      WHERE annonces.id = annonce_images.annonce_id
      AND annonces.user_id = auth.uid()
    )
  );

-- Commerces table
CREATE TABLE commerces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  address text,
  commune_id uuid REFERENCES communes(id),
  phone text,
  email text,
  website text,
  image_url text,
  opening_hours jsonb,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commerces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view commerces"
  ON commerces FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create commerces"
  ON commerces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commerces"
  ON commerces FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Publicites table
CREATE TABLE publicites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid REFERENCES commerces(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE publicites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active publicites"
  ON publicites FOR SELECT
  TO authenticated
  USING (is_active = true AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "Commerce owners can manage publicites"
  ON publicites FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM commerces
      WHERE commerces.id = publicites.commerce_id
      AND commerces.user_id = auth.uid()
    )
  );

-- Evenements table
CREATE TABLE evenements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  location text,
  commune_id uuid REFERENCES communes(id),
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  image_url text,
  max_attendees integer,
  attendees_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view evenements"
  ON evenements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create evenements"
  ON evenements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evenements"
  ON evenements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Associations table
CREATE TABLE associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  commune_id uuid REFERENCES communes(id),
  contact_email text,
  contact_phone text,
  website text,
  image_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view associations"
  ON associations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create associations"
  ON associations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own associations"
  ON associations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Signalements table
CREATE TABLE signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create signalements"
  ON signalements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own signalements"
  ON signalements FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Sanctions table
CREATE TABLE sanctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL,
  reason text NOT NULL,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sanctions"
  ON sanctions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Preinscriptions table
CREATE TABLE preinscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  commune_id uuid REFERENCES communes(id),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE preinscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create preinscriptions"
  ON preinscriptions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Insert initial communes
INSERT INTO communes (name, code_postal) VALUES
  ('Bagnols-sur-Cèze', '30200'),
  ('Pont-Saint-Esprit', '30130'),
  ('Laudun-l''Ardoise', '30290'),
  ('Saint-Gervais', '30200'),
  ('Chusclan', '30200'),
  ('Connaux', '30330'),
  ('Tresques', '30330'),
  ('Sabran', '30200'),
  ('Saint-Laurent-des-Arbres', '30126'),
  ('Vénéjan', '30200')
ON CONFLICT (name) DO NOTHING;