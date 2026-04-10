import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { UserDto } from '@/types/user.types';
import { Role } from '@/types/enums';

type JwtPayload = {
  sub?: number | string;
  exp?: number;
};

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  authInitialized: boolean;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setUser: (user: UserDto | null) => void;
  markInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
  logout: () => void;
  isAdmin: () => boolean;
  getUserIdFromToken: () => number | null;
  isTokenExpired: () => boolean;
};

const parseToken = (token?: string | null): JwtPayload | null => {
  if (!token) return null;
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
};

const resolveAdminMode = (user: UserDto | null) => user?.role === Role.ADMIN;

const resolveCurrentUserId = (accessToken: string | null) => {
  const payload = parseToken(accessToken);
  if (!payload?.sub) return null;
  const id = Number(payload.sub);
  return Number.isFinite(id) ? id : null;
};

export const selectAuthFlags = (state: AuthState) => ({
  isAuthenticated: state.isAuthenticated,
  authInitialized: state.authInitialized
});

export const selectCurrentUser = (state: AuthState) => state.user;

export const selectAdminMode = (state: AuthState) => resolveAdminMode(state.user);

export const selectCurrentUserId = (state: AuthState) => resolveCurrentUserId(state.accessToken);

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      authInitialized: false,
      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: Boolean(accessToken)
        }),
      setUser: (user) => set({ user }),
      markInitialized: (authInitialized) => set({ authInitialized }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          authInitialized: true
        }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          authInitialized: true
        }),
      isAdmin: () => resolveAdminMode(get().user),
      getUserIdFromToken: () => resolveCurrentUserId(get().accessToken),
      isTokenExpired: () => {
        const payload = parseToken(get().accessToken);
        if (!payload?.exp) return true;
        return payload.exp * 1000 <= Date.now();
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export const useAuthFlags = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authInitialized = useAuthStore((state) => state.authInitialized);

  return {
    isAuthenticated,
    authInitialized
  };
};

export const useCurrentUser = () => useAuthStore(selectCurrentUser);

export const useAdminMode = () => useAuthStore(selectAdminMode);

export const useCurrentUserId = () => useAuthStore(selectCurrentUserId);
