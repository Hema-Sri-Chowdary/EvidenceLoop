import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Validate session on initial mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = authService.getToken();
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const res = await authService.getMe();
        if (isMounted && res.user) {
          setUser(res.user);
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        authService.clearAuth();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // Listen for unauthorized 401 events from api client
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    return authService.login(email, password);
  }, []);

  const verifyMfa = useCallback(async (otpSessionToken, otp) => {
    const data = await authService.verifyMfa(otpSessionToken, otp);
    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const resendOtp = useCallback(async (otpSessionToken) => {
    return authService.resendOtp(otpSessionToken);
  }, []);

  const register = useCallback(async (payload) => {
    return authService.register(payload);
  }, []);

  const updateProfile = useCallback(async ({ name, org, role }) => {
    const data = await authService.updateProfile({ name, org, role });
    if (data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  const deleteAccount = useCallback(async () => {
    const data = await authService.deleteAccount();
    setUser(null);
    setToken(null);
    return data;
  }, []);

  const logout = useCallback(() => {
    authService.clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  const role = user?.role === 'Auditor' ? 'Auditor' : 'Viewer';
  const isAuditor = role === 'Auditor';
  const isViewer = role === 'Viewer';
  const canMutate = isAuditor;
  const canDelete = isAuditor;

  const value = {
    user,
    token,
    role,
    isAuthenticated: !!token && !!user,
    isLoading,
    isAdmin: false,
    isAuditor,
    isViewer,
    canMutate,
    canDelete,
    login,
    verifyMfa,
    resendOtp,
    register,
    updateProfile,
    deleteAccount,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
