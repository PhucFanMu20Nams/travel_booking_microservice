import { PassengerType } from '@/types/enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  passportNumber: string;
  age: number;
  passengerType: PassengerType;
}

export interface TokenDto {
  token: string;
  expires: string | Date;
  userId?: number;
}

export interface AuthResponse {
  access: TokenDto;
  refresh?: TokenDto;
}

export interface LogoutRequest {
  accessToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
