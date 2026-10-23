import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Loan, LoanSummary, CreateLoanPayload, User } from '../types';

export const TOKEN_STORAGE_KEY = '@miniledger_jwt_token';
export const USER_STORAGE_KEY = '@miniledger_user_profile';

// Determine default API URL based on platform
const getDefaultBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Android emulator loopback to host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  // iOS simulator or Web
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getDefaultBaseUrl();

// Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Callback when session expires
let onSessionExpiredCallback: (() => void) | null = null;
export const registerSessionExpiredHandler = (callback: () => void) => {
  onSessionExpiredCallback = callback;
};

// Request interceptor: inject JWT Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to retrieve token from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401) {
      console.warn('Authentication token expired or invalid');
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
      if (onSessionExpiredCallback) {
        onSessionExpiredCallback();
      }
    }
    return Promise.reject(error);
  }
);

// Formatted error message helper
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (error.message === 'Network Error') {
      return `Cannot reach server at ${API_BASE_URL}. Ensure the backend is running and the IP address is reachable.`;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

// Auth API Calls
export const authApi = {
  sendOtp: async (phone: string): Promise<{ success: boolean; message: string; cooldownSeconds?: number }> => {
    const res = await apiClient.post('/auth/send-otp', { phone });
    return res.data;
  },

  verifyOtp: async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; token: string; user: User }> => {
    const res = await apiClient.post('/auth/verify-otp', { phone, otp });
    return res.data;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

// Loans API Calls
export const loansApi = {
  getSummary: async (): Promise<LoanSummary> => {
    const res = await apiClient.get('/loans/summary');
    return res.data;
  },

  getLoans: async (status?: string): Promise<{ loans: Loan[]; count: number }> => {
    const params = status && status !== 'ALL' ? { status } : {};
    const res = await apiClient.get('/loans', { params });
    return res.data;
  },

  getLoan: async (id: string): Promise<{ loan: Loan }> => {
    const res = await apiClient.get(`/loans/${id}`);
    return res.data;
  },

  createLoan: async (payload: CreateLoanPayload): Promise<{ loan: Loan }> => {
    const res = await apiClient.post('/loans', payload);
    return res.data;
  },

  repayLoan: async (id: string): Promise<{ loan: Loan }> => {
    const res = await apiClient.patch(`/loans/${id}/repay`);
    return res.data;
  },
};
