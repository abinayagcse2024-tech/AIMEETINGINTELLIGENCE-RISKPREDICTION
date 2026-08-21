import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setToken(res.access_token);
      setUser(res.user);
      sessionStorage.setItem('token', res.access_token);
      sessionStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('user', JSON.stringify(res.user));
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.auth.register(userData);
      setToken(res.access_token);
      setUser(res.user);
      sessionStorage.setItem('token', res.access_token);
      sessionStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('user', JSON.stringify(res.user));
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove Google authentication tokens and cookies if they exist
    localStorage.removeItem('google_token');
    sessionStorage.removeItem('google_token');
    document.cookie = "g_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedData };
      sessionStorage.setItem('user', JSON.stringify(updated));
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const googleLogin = async (credential) => {
    setLoading(true);
    try {
      const res = await api.auth.googleLogin(credential);
      setToken(res.access_token);
      setUser(res.user);
      sessionStorage.setItem('token', res.access_token);
      sessionStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('user', JSON.stringify(res.user));
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, googleLogin, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
