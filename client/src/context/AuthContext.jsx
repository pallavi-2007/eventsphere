import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('eventsphere_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('eventsphere_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('eventsphere_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('eventsphere_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out...');
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success && res.data.data) {
        const { user: userData, token: userToken } = res.data.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('eventsphere_token', userToken);
        localStorage.setItem('eventsphere_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, error: 'Failed to authenticate' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  const register = async (name, email, password, role = 'user') => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.data?.success && res.data.data) {
        const { user: userData, token: userToken } = res.data.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('eventsphere_token', userToken);
        localStorage.setItem('eventsphere_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Registration failed';
      return { success: false, error: errorMsg };
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('eventsphere_user', JSON.stringify(merged));
      return merged;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eventsphere_token');
    localStorage.removeItem('eventsphere_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
