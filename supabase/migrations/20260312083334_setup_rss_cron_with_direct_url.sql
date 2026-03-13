/*
  # Update RSS cron job with direct URL

  - Removes the previous cron job
  - Creates a new one using the direct Supabase project URL
  - Runs every 60 minutes using pg_net to call the fetch-rss edge function
*/

SELECT cron.unschedule('fetch-rss-every-hour');

SELECT cron.schedule(
  'fetch-rss-every-hour',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rhqetvqtgqtezrzdpgou.supabase.co/functions/v1/fetch-rss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJocWV0dnF0Z3F0ZXpyemRwZ291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTk3NTEsImV4cCI6MjA4ODYzNTc1MX0.Z83xsREIWiJ97afM4BzxuOFP1gQFqBt6H_UCCX3SARg'
    ),
    body := '{}'::jsonb
  );
  $$
);
