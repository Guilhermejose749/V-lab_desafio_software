import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// 1. Adicionamos o ID na interface
interface User {
  id: number;
  email: string;
}

interface AuthContextData {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('@CourseSphere:token');
    if (token) {
      try {
        // 2. Ensinamos o jwtDecode que o token agora tem 'sub' (email) e 'id'
        const decoded = jwtDecode<{ sub: string; id: number }>(token);
        setUser({ email: decoded.sub, id: decoded.id });
      } catch (error) {
        logout();
      }
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('@CourseSphere:token', token);
    const decoded = jwtDecode<{ sub: string; id: number }>(token);
    setUser({ email: decoded.sub, id: decoded.id });
  };

  const logout = () => {
    localStorage.removeItem('@CourseSphere:token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};