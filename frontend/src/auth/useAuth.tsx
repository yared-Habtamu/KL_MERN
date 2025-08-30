import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser } from '../services/authService';

// Define User type (customize as needed)
type User = {
  id: string;
  phonenumber: string;
  role: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginLoading: boolean;
  login: (phonenumber: string, password: string) => Promise<{ success: boolean; status?: any; message?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (phonenumber: string, password: string) => {
    setLoginLoading(true);
    try {
      const { data } = await loginUser(phonenumber, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setLoginLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoginLoading(false);
      return { success: false, status: err.status, message: err.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 

export function canDelete(user: { role?: string } | null | undefined): boolean {
  return !!user && user.role === 'admin';
} 