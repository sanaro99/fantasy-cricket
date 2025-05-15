import { createClient } from '@supabase/supabase-js';

// Server-side (API route) Supabase client factory (service role key)
export function createServerSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, serviceKey);
}

// Do NOT export a service role client for client-side use!