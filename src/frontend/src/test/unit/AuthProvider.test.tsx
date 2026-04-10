import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@components/auth/AuthProvider';
import { authApi } from '@api/auth.api';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@stores/auth.store';
import { redirectToLogin } from '@utils/navigation';
import { makeUser } from '@/test/frontend.fixtures';

vi.mock('@api/auth.api', () => ({
  authApi: {
    refreshToken: vi.fn()
  }
}));

vi.mock('@api/user.api', () => ({
  userApi: {
    getMe: vi.fn()
  }
}));

vi.mock('@utils/navigation', () => ({
  redirectToLogin: vi.fn()
}));

const createToken = (payload: Record<string, unknown>) => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.`;
};
const AUTH_REFRESH_INTERVAL_MS = 25 * 60 * 1000;

const renderAuthProvider = () =>
  render(
    <AuthProvider>
      <div>auth-ready</div>
    </AuthProvider>
  );

const captureRefreshInterval = () => {
  const setIntervalSpy = vi.spyOn(window, 'setInterval').mockImplementation(() => {
    return 1 as ReturnType<typeof window.setInterval>;
  });
  vi.spyOn(window, 'clearInterval').mockImplementation(() => undefined);

  return {
    setIntervalSpy,
    trigger: () => {
      const latestHandler = [...setIntervalSpy.mock.calls]
        .reverse()
        .find(([, delay]) => delay === AUTH_REFRESH_INTERVAL_MS)?.[0];
      if (typeof latestHandler === 'function') {
        latestHandler();
      }
    }
  };
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      authInitialized: false
    });
  });

  it('bootstraps the initial session by fetching getMe once', async () => {
    useAuthStore.setState({
      accessToken: createToken({ sub: 42, exp: Math.floor(Date.now() / 1000) + 3600 }),
      refreshToken: 'refresh-token',
      isAuthenticated: true,
      authInitialized: false
    });

    vi.mocked(userApi.getMe).mockResolvedValue(
      { data: makeUser() } as Awaited<ReturnType<typeof userApi.getMe>>
    );

    renderAuthProvider();

    await waitFor(() => expect(userApi.getMe).toHaveBeenCalledTimes(1));
    expect(authApi.refreshToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.id).toBe(42);
    expect(useAuthStore.getState().authInitialized).toBe(true);
  });

  it('background token refresh updates tokens without calling getMe again', async () => {
    const interval = captureRefreshInterval();
    const nextAccessToken = createToken({ sub: 42, exp: Math.floor(Date.now() / 1000) + 7200 });

    useAuthStore.setState({
      accessToken: createToken({ sub: 42, exp: Math.floor(Date.now() / 1000) + 3600 }),
      refreshToken: 'refresh-token',
      isAuthenticated: true,
      authInitialized: false
    });

    vi.mocked(userApi.getMe).mockResolvedValue(
      { data: makeUser() } as Awaited<ReturnType<typeof userApi.getMe>>
    );
    vi.mocked(authApi.refreshToken).mockResolvedValue(
      {
        data: {
          access: { token: nextAccessToken },
          refresh: { token: 'refresh-token-next' }
        }
      } as Awaited<ReturnType<typeof authApi.refreshToken>>
    );

    renderAuthProvider();

    await waitFor(() => expect(userApi.getMe).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(interval.setIntervalSpy.mock.calls.some(([, delay]) => delay === AUTH_REFRESH_INTERVAL_MS)).toBe(true)
    );

    interval.trigger();

    await waitFor(() => expect(authApi.refreshToken).toHaveBeenCalledTimes(1));
    expect(userApi.getMe).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBe(nextAccessToken);
    expect(useAuthStore.getState().refreshToken).toBe('refresh-token-next');
  });

  it('clears auth and redirects to /login when background refresh fails', async () => {
    const interval = captureRefreshInterval();

    useAuthStore.setState({
      accessToken: createToken({ sub: 42, exp: Math.floor(Date.now() / 1000) + 3600 }),
      refreshToken: 'refresh-token',
      isAuthenticated: true,
      authInitialized: false
    });

    vi.mocked(userApi.getMe).mockResolvedValue(
      { data: makeUser() } as Awaited<ReturnType<typeof userApi.getMe>>
    );
    vi.mocked(authApi.refreshToken).mockRejectedValue(new Error('refresh failed'));

    renderAuthProvider();

    await waitFor(() => expect(userApi.getMe).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(interval.setIntervalSpy.mock.calls.some(([, delay]) => delay === AUTH_REFRESH_INTERVAL_MS)).toBe(true)
    );

    interval.trigger();

    await waitFor(() => expect(authApi.refreshToken).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
  });
});
