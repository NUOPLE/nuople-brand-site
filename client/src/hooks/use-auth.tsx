import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { axiosForBackend, onUnauthorized, setToken, clearToken } from '@client/src/api';
import type { Admin } from '@shared/api.interface';

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<Admin>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      const res = await axiosForBackend.get('/api/auth/me');
      setAdmin(res.data as Admin);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void checkAuth();
  }, []);

  useEffect(() => {
    const cleanup = onUnauthorized(() => {
      setAdmin(null);
      navigate('/login', { replace: true });
    });
    return cleanup;
  }, [navigate]);

  const login = async (username: string, password: string): Promise<Admin> => {
    const res = await axiosForBackend.post('/api/auth/login', {
      username,
      password,
    });
    const data = res.data as { admin: Admin; token: string };
    setToken(data.token);
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = async () => {
    try {
      await axiosForBackend.post('/api/auth/logout');
    } catch {
      // ignore
    } finally {
      clearToken();
      setAdmin(null);
      navigate('/login', { replace: true });
    }
  };

  const refresh = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};
