import axios from 'axios';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { logger } from '@lark-apaas/client-toolkit/logger';

const UNAUTHORIZED_EVENT = 'app:unauthorized';
const TOKEN_KEY = 'admin_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const dispatchUnauthorized = (): void => {
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
};

export const onUnauthorized = (handler: () => void): (() => void) => {
  window.addEventListener(UNAUTHORIZED_EVENT, handler);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
};

const apiClient = axios.create({
  baseURL: '/',
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401) {
      clearToken();
      dispatchUnauthorized();
    }
    const data = error.response?.data as { message?: string } | undefined;
    const message = data?.message || error.message || '请求失败';
    if (status !== 401) {
      toast.error(message);
    }
    logger.error('API request failed', String(error));
    return Promise.reject(error);
  },
);

export const axiosForBackend = apiClient;
export { toast };

export * as publicApi from './public';
