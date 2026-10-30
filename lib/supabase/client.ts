import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eicforalejjzquoucbxp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpY2ZvcmFsZWpqenF1b3VjYnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjI2MjMsImV4cCI6MjEwNjIzODYyM30.HUwFCmJ4qVx0fr1c7BOHPtefdfAjVkFhSw-CojXm-zs';
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'synchro_production_tracking';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: schema,
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const getBrowserSupabaseClient = () => supabase;
