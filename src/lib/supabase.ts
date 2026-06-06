import { createClient } from '@supabase/supabase-js';

const rawRestUrl =
  import.meta.env.VITE_SUPABASE_REST_URL ||
  'https://caeryvarccoucdxvuarw.supabase.co/rest/v1/';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  rawRestUrl.replace(/\/rest\/v1\/?$/, '');

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_pEIxr2BdjBABhFXIn010Aw_6kVVtAtg';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export { supabaseUrl, supabasePublishableKey };
