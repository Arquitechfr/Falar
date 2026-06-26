import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { useAuthStore } from '@/features/auth/authStore';

const ACCESS_KEY = 'falar_access';
const REFRESH_KEY = 'falar_refresh';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_KEY);
  } catch {
    return null;
  }
}

async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await axios.post(
      `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
      { refreshToken },
    );
    const newAccessToken = res.data.accessToken as string;
    await SecureStore.setItemAsync(ACCESS_KEY, newAccessToken);
    return newAccessToken;
  } catch {
    return null;
  }
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (newToken) {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      }

      useCryptoStore.getState().clearKeys();
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export { getAccessToken, getRefreshToken };
export default api;
