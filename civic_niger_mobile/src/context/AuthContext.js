import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, storeTokens, clearTokens, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté au démarrage
  useEffect(() => {
    checkAuthState();
  }, []);

  async function checkAuthState() {
    try {
      const token = await getAccessToken();
      if (token) {
        const userData = await api.getMe();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(telephone, password) {
    const response = await api.login(telephone, password);
    await storeTokens(response.access, response.refresh);

    const userData = await api.getMe();
    setUser(userData);
    setIsAuthenticated(true);

    return userData;
  }

  async function register(data) {
    const response = await api.register(data);
    return response;
  }

  async function logout() {
    await clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  }

  async function refreshUser() {
    try {
      const userData = await api.getMe();
      setUser(userData);
      return userData;
    } catch {
      return null;
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
