import { PropsWithChildren, useEffect } from 'react';
import { authApi } from '@api/auth.api';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@stores/auth.store';
import { redirectToLogin } from '@utils/navigation';

const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const markInitialized = useAuthStore((state) => state.markInitialized);

  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      const {
        accessToken: initialAccessToken,
        refreshToken: initialRefreshToken,
        isTokenExpired
      } = useAuthStore.getState();

      if (!initialAccessToken || !initialRefreshToken) {
        markInitialized(true);
        return;
      }

      try {
        if (isTokenExpired()) {
          const refreshResponse = await authApi.refreshToken({ refreshToken: initialRefreshToken });
          const nextAccessToken = refreshResponse.data?.access?.token || null;
          const nextRefreshToken = refreshResponse.data?.refresh?.token || initialRefreshToken;
          setTokens(nextAccessToken, nextRefreshToken);
        }

        const userResponse = await userApi.getMe();

        if (cancelled) return;

        setUser(userResponse.data);
        markInitialized(true);
      } catch {
        if (cancelled) return;
        clearAuth();
        redirectToLogin();
      }
    };

    void bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, [clearAuth, markInitialized, setTokens, setUser]);

  useEffect(() => {
    if (!refreshToken) return;

    let cancelled = false;

    const refreshSession = async () => {
      try {
        const refreshResponse = await authApi.refreshToken({ refreshToken });
        const nextAccessToken = refreshResponse.data?.access?.token;
        const nextRefreshToken = refreshResponse.data?.refresh?.token || refreshToken;

        if (cancelled) return;

        setTokens(nextAccessToken, nextRefreshToken);
      } catch {
        if (cancelled) return;
        clearAuth();
        redirectToLogin();
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshToken, setTokens, clearAuth]);

  return <>{children}</>;
};
