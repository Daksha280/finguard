import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, extractErrorMessage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('finguard_token');
    const cachedUser = localStorage.getItem('finguard_user');

    if (token && cachedUser) {
      setUser(JSON.parse(cachedUser));
      // Verify token is still valid in the background
      authApi
        .me()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('finguard_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('finguard_token');
          localStorage.removeItem('finguard_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    try {
      const res = await authApi.login(email, password);
      const { user: loggedInUser, token } = res.data;
      localStorage.setItem('finguard_token', token);
      localStorage.setItem('finguard_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return { success: true };
    } catch (err) {
      return { success: false, error: extractErrorMessage(err) };
    }
  }

  function logout() {
    localStorage.removeItem('finguard_token');
    localStorage.removeItem('finguard_user');
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAdmin: user?.role === 'admin',
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
