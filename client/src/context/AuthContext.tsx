import { createContext, useContext, useState, type ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: number;
  email: string;
  referralCode: string;
  role?: 'user' | 'admin';
  photos?: { url: string; public_id: string }[];
  profile?: {
    full_name: string | null;
    bio: string | null;
    age: number | null;
    gender: string | null;
    location: string | null;
    is_verified: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, referralCode?: string, code?: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: userData } = data.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, referralCode?: string, code?: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { email, password, referralCode, code });
      const { accessToken, refreshToken, user: userData } = data.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (accessToken: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', { accessToken });
      const { accessToken: jwtAccessToken, refreshToken, user: userData } = data.data;
      
      localStorage.setItem('accessToken', jwtAccessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      loginWithGoogle,
      logout, 
      loading,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
