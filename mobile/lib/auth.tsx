import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, authApi, registerSessionExpiredHandler } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from AsyncStorage on app boot
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Optionally verify token in background
          authApi.getProfile()
            .then(({ user: freshUser }) => {
              setUser(freshUser);
              AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
            })
            .catch((err) => {
              console.warn('Session verification error:', err.message);
            });
        }
      } catch (e) {
        console.error('Failed to restore session from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Register callback for 401 auto logout
    registerSessionExpiredHandler(() => {
      setUser(null);
      setToken(null);
    });
  }, []);

  const login = async (newToken: string, newUser: User) => {
    try {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (e) {
      console.error('Failed to persist auth session', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to clear auth session', e);
    }
  };

  const refreshProfile = async () => {
    try {
      const { user: freshUser } = await authApi.getProfile();
      setUser(freshUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
    } catch (e) {
      console.error('Failed to refresh profile', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
