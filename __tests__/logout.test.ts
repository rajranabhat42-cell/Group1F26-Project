
import type { SupabaseClient } from '@supabase/supabase-js';
import { logout } from '../src/auth/logout';

describe('US04 - Log out', () => {
  const signOut = jest.fn();

  const supabase = {
    auth: { signOut },
  } as unknown as SupabaseClient;

  beforeEach(() => {
    signOut.mockReset();
  });

  it('ends the current session', async () => {
    signOut.mockResolvedValue({ error: null });

    await logout(supabase);

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('reports an error when logout fails', async () => {
    signOut.mockResolvedValue({
      error: { message: 'Network error' },
    });

    await expect(logout(supabase)).rejects.toThrow(
      'Logout failed: Network error',
    );
  });
});
