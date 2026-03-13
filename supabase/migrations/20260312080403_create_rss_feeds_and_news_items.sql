/*
  # Create RSS feeds and cached news items tables

  1. New Tables
    - `rss_feeds`
      - `id` (uuid, primary key)
      - `title` (text, display name for the feed)
      - `url` (text, RSS feed URL)
      - `category` (text, optional category tag)
      - `is_active` (boolean, whether to fetch this feed)
      - `last_fetched_at` (timestamptz, last fetch time)
      - `created_at` (timestamptz)
      - `created_by` (uuid, admin who added it)

    - `news_items`
      - `id` (uuid, primary key)
      - `feed_id` (uuid, FK to rss_feeds)
      - `title` (text)
      - `description` (text)
      - `url` (text, link to the original article)
      - `image_url` (text, optional)
      - `published_at` (timestamptz)
      - `guid` (text, unique identifier from the feed)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Admins can manage rss_feeds
    - All authenticated users can read active feeds and news items
    - Unauthenticated users can also read news items (public)
*/

CREATE TABLE IF NOT EXISTS rss_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  category text DEFAULT '',
  is_active boolean DEFAULT true,
  last_fetched_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active rss feeds"
  ON rss_feeds FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can read all rss feeds"
  ON rss_feeds FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins can insert rss feeds"
  ON rss_feeds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins can update rss feeds"
  ON rss_feeds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins can delete rss feeds"
  ON rss_feeds FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE TABLE IF NOT EXISTS news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES rss_feeds(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  url text NOT NULL,
  image_url text DEFAULT '',
  published_at timestamptz,
  guid text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(feed_id, guid)
);

ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news items"
  ON news_items FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert news items"
  ON news_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Service role can delete news items"
  ON news_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_news_items_feed_id ON news_items(feed_id);
CREATE INDEX IF NOT EXISTS idx_news_items_published_at ON news_items(published_at DESC);
