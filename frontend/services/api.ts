import * as SecureStore from 'expo-secure-store';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { useAuthStore } from '@/features/auth/authStore';

const ACCESS_KEY = 'falar_access';
const REFRESH_KEY = 'falar_refresh';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const TIMEOUT = 15000;

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

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
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    const newAccessToken = data.accessToken as string;
    await SecureStore.setItemAsync(ACCESS_KEY, newAccessToken);
    return newAccessToken;
  } catch {
    return null;
  }
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
}

async function fetchWithTimeout(url: string, options: RequestConfig = {}, timeout = TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options: RequestConfig = {
    method: config.method || 'GET',
    headers,
    body: config.body ? JSON.stringify(config.body) : undefined,
    timeout: config.timeout,
  };

  let response: Response;
  try {
    response = await fetchWithTimeout(url, options);
  } catch (error) {
    throw new Error('Network error or timeout');
  }

  // Handle 401 - refresh token
  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }

    const newToken = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetchWithTimeout(url, { ...options, headers });
    } else {
      useCryptoStore.getState().clearKeys();
      useAuthStore.getState().logout();
      throw new Error('Session expired');
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw { response: { status: response.status, data } };
  }

  return { data, status: response.status, ok: response.ok };
}

const api = {
  get: <T = any>(endpoint: string, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'POST', body }),
  put: <T = any>(endpoint: string, body?: any, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'PUT', body }),
  patch: <T = any>(endpoint: string, body?: any, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'PATCH', body }),
  delete: <T = any>(endpoint: string, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'DELETE' }),
};

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
