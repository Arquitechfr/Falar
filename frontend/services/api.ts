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

interface XhrResponse {
  status: number;
  ok: boolean;
  data: any;
}

function fetchFormDataWithXhr(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: FormData,
  timeout = TIMEOUT,
): Promise<XhrResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.responseType = 'text';
    xhr.timeout = timeout;

    xhr.onload = () => {
      let data: any;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = xhr.responseText;
      }
      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        data,
      });
    };

    xhr.onerror = () => reject(new Error('Network error or timeout'));
    xhr.ontimeout = () => reject(new Error('Network error or timeout'));

    xhr.send(body);
  });
}

async function request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const token = await getAccessToken();

  const isFormData = config.body instanceof FormData;
  console.log('[api] request:', endpoint, '| isFormData:', isFormData, '| body type:', typeof config.body);

  const headers: Record<string, string> = {
    ...config.headers,
  };

  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  } else {
    delete headers['Content-Type'];
  }
  console.log('[api] headers:', JSON.stringify(headers));

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options: RequestConfig = {
    method: config.method || 'GET',
    headers,
    body: isFormData ? config.body : config.body ? JSON.stringify(config.body) : undefined,
    timeout: config.timeout,
  };

  if (isFormData) {
    console.log('[api] using XHR for FormData upload to:', url);
    let xhrRes: XhrResponse;
    try {
      xhrRes = await fetchFormDataWithXhr(url, options.method || 'POST', headers, config.body, options.timeout);
      console.log('[api] XHR response status:', xhrRes.status);
    } catch (error) {
      console.error('[api] XHR error:', error);
      throw error;
    }

    // Handle 401 - refresh token
    if (xhrRes.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }
      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        xhrRes = await fetchFormDataWithXhr(url, options.method || 'POST', headers, config.body, options.timeout);
      } else {
        useCryptoStore.getState().clearKeys();
        useAuthStore.getState().logout();
        throw new Error('Session expired');
      }
    }

    console.log('[api] XHR response data:', JSON.stringify(xhrRes.data).slice(0, 200));
    if (!xhrRes.ok) {
      throw { response: { status: xhrRes.status, data: xhrRes.data } };
    }
    return { data: xhrRes.data, status: xhrRes.status, ok: xhrRes.ok };
  }

  let response: Response;
  try {
    console.log('[api] fetching:', url, '| method:', options.method, '| body is FormData:', options.body instanceof FormData);
    response = await fetchWithTimeout(url, options);
    console.log('[api] response status:', response.status);
  } catch (error) {
    console.error('[api] fetch error:', error);
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
  console.log('[api] response data:', JSON.stringify(data).slice(0, 200));

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
