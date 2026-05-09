'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User { id: number; name: string; email: string; role?: string; department?: string; }
interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('cg_token');
    const u = localStorage.getItem('cg_user');
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    setIsLoading(false);
  }, []);

  const login = (t: string, u: User) => {
    localStorage.setItem('cg_token', t);
    localStorage.setItem('cg_user', JSON.stringify(u));
    setToken(t); setUser(u);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('cg_token');
    localStorage.removeItem('cg_user');
    setToken(null); setUser(null);
    router.push('/login');
  };

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
