import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, dataApi, getAuthToken, setAuthToken, type AuthUser } from '@/lib/supabase';

type AuthContextType = {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getUser(token)
      .then((res) => {
        setUser({ id: res.data.id, email: res.data.email });
        return dataApi.checkAdmin();
      })
      .then((res) => {
        setIsAdmin(res.data.length > 0);
      })
      .catch(() => {
        setAuthToken(null);
        setUser(null);
        setIsAdmin(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await authApi.signIn(email, password);
      setAuthToken(res.data.access_token);
      setUser({ id: res.data.user.id, email: res.data.user.email });

      try {
        const adminRes = await dataApi.checkAdmin();
        setIsAdmin(adminRes.data.length > 0);
      } catch {
        setIsAdmin(false);
      }

      return { error: null };
    } catch (err) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { msg?: string; error_description?: string } } }).response?.data?.msg ??
            (err as { response?: { data?: { msg?: string; error_description?: string } } }).response?.data?.error_description ??
            'Failed to sign in'
          : 'Failed to sign in';
      return { error: message };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const res = await authApi.signUp(email, password);
      const token = res.data.access_token;
      if (token) {
        setAuthToken(token);
        setUser({ id: res.data.user.id, email: res.data.user.email });
      }
      return { error: null };
    } catch (err) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { msg?: string; error_description?: string } } }).response?.data?.msg ??
            (err as { response?: { data?: { msg?: string; error_description?: string } } }).response?.data?.error_description ??
            'Failed to sign up'
          : 'Failed to sign up';
      return { error: message };
    }
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch {
    }
    setAuthToken(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
