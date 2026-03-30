import apiClient, { authlessClient } from '@api/axios-instance';
import {
  AuthResponse,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest
} from '@/types/auth.types';
import { UserDto } from '@/types/user.types';

export const authApi = {
  login: (data: LoginRequest) => authlessClient.post<AuthResponse>('/api/v1/identity/login', data),
  logout: (data: LogoutRequest) => apiClient.post<void>('/api/v1/identity/logout', data),
  refreshToken: (data: RefreshTokenRequest) =>
    authlessClient.post<AuthResponse>('/api/v1/identity/refresh-token', data),
  register: (data: RegisterRequest) => authlessClient.post<UserDto>('/api/v1/identity/register', data)
};
