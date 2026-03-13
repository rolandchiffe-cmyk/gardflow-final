/*
  # Add is_local column to news_items

  Adds a boolean column `is_local` to news_items to flag articles that
  mention at least one of the 44 communes of the Gard Rhodanien.
  Defaults to false; the fetch-rss edge function will set it to true
  when a commune name is found in the title or description.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news_items' AND column_name = 'is_local'
  ) THEN
    ALTER TABLE news_items ADD COLUMN is_local boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_news_items_is_local ON news_items(is_local);
