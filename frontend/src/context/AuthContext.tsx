import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { GeoVisionAPI } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, portalType?: 'user' | 'admin') => Promise<UserProfile>;
  signup: (fullName: string, email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('geovision_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('geovision_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await GeoVisionAPI.getMe();
        setUser(profile);
      } catch (err) {
        console.warn('Stored token is invalid or expired, resetting auth session');
        localStorage.removeItem('geovision_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string, portalType?: 'user' | 'admin'): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await GeoVisionAPI.login(email, password, portalType);
      localStorage.setItem('geovision_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await GeoVisionAPI.signup(fullName, email, password);
      localStorage.setItem('geovision_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('geovision_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAdmin, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
