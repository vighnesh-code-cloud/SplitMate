import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder')
);

// Fallback dummy URL so createClient does not throw on module initialization if env vars are unset
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);

/**
 * Initiates Google OAuth Sign-In with Supabase using the application's current origin.
 */
export async function signInWithGoogleOAuth(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      error: new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment variables.'
      ),
    };
  }

  // Use configured origin for OAuth redirect
  const redirectOrigin = window.location.origin;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectOrigin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { error };
}

/**
 * Signs the user out of Supabase auth.
 */
export async function signOutSupabase(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { error: null };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}
