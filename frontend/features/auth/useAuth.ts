import { useEffect } from 'react';
import { useAuthStore } from './authStore';
import { getMe } from './authApi';
import { getAccessToken, clearTokens } from '@/services/api';
import { useCryptoStore } from '@/features/crypto/cryptoStore';

export function useAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          if (mounted) setLoading(false);
          return;
        }
        const me = await getMe();
        if (mounted) login(me);
      } catch {
        await clearTokens();
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [login, setLoading]);

  const handleLogout = async () => {
    await clearTokens();
    useCryptoStore.getState().clearKeys();
    logout();
  };

  return { user, isAuthenticated, isLoading, logout: handleLogout };
}
