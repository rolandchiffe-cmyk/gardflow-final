import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');

  const missingVars = [];
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. Please configure them in your Vercel project settings.`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  postsImages: 'posts-images',
  postsVideos: 'posts-videos',
  events: 'events',
  business: 'business',
} as const;
