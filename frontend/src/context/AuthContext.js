import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const clearStoredAuth = () => {
  localStorage.removeItem('tf_token');
  localStorage.removeItem('tf_user');
};

const getStoredUser = () => {
  const savedUser = localStorage.getItem('tf_user');
  if (!savedUser || savedUser === 'undefined' || savedUser === 'null') return null;

  try {
    return JSON.parse(savedUser);
  } catch (err) {
    clearStoredAuth();
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    const savedUser = getStoredUser();
    if (token && savedUser) {
      setUser(savedUser);
      api.get('/auth/me').then(res => {
        setUser(res.data.user);
        localStorage.setItem('tf_user', JSON.stringify(res.data.user));
      }).catch(() => {
        clearStoredAuth();
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      clearStoredAuth();
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('tf_token', res.data.token);
    if (res.data.user) localStorage.setItem('tf_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const signup = async (name, email, password) => {
    const res = await api.post('/auth/signup', { name, email, password });
    localStorage.setItem('tf_token', res.data.token);
    if (res.data.user) localStorage.setItem('tf_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
