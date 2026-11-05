
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * US04 - Log out
 * Ends the authenticated user's session.
 */
export async function logout(
  supabase: SupabaseClient,
): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
}
