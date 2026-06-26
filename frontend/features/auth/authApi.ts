import api from '@/services/api';

export interface AuthUser {
  id: string;
  phone: string;
  publicKey: string;
  displayName: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface SendOtpResponse {
  success: boolean;
  isNewUser: boolean;
}

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const res = await api.post<SendOtpResponse>('/auth/send-otp', { phone });
  return res.data;
}

export async function verifyOtp(
  phone: string,
  code: string,
  publicKey: string,
  deviceToken?: string,
): Promise<VerifyOtpResponse> {
  const res = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
    phone,
    code,
    publicKey,
    deviceToken,
  });
  return res.data;
}

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<AuthUser>('/users/me');
  return res.data;
}
