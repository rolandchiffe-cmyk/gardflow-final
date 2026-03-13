/*
  # Setup automatic RSS fetch every 60 minutes

  1. Extensions
    - Enable pg_cron for scheduled jobs
    - Enable pg_net for HTTP requests from the database

  2. Cron Job
    - Creates a job that calls the fetch-rss edge function every 60 minutes
    - Uses pg_net to make an async HTTP POST to the edge function
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'fetch-rss-every-hour',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/fetch-rss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
