import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function isValidSupabaseUrl(value: string | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured =
  isValidSupabaseUrl(supabaseUrl) && Boolean(supabasePublishableKey);

// Valid placeholders keep static exports and type checks working before the
// developer has copied .env.example to .env.
export const supabase = createClient(
  isSupabaseConfigured
    ? supabaseUrl!
    : 'https://not-configured.supabase.co',
  isSupabaseConfigured ? supabasePublishableKey! : 'not-configured',
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export function requireSupabaseConfiguration() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and add your project URL and publishable key.'
    );
  }
}
