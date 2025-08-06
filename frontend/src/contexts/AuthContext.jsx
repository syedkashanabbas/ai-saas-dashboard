import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';
import { authAPI } from '../services/api';

// Zustand store for auth state
const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Actions
  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (!token || !storedUser) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      // Verify token with backend
      const response = await authAPI.getProfile();
      const user = response.data.user;

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Token is invalid, clear storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  updateUser: (userData) => {
    const currentUser = get().user;
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  clearError: () => set({ error: null }),
}));

// React Context for providing auth state
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const authStore = useAuthStore();

  useEffect(() => {
    authStore.checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={authStore}>
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

// Hook for checking permissions
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (resource, action) => {
    if (!user || !user.permissions) return false;
    
    // Super Admin has all permissions
    if (user.role_name === 'Super Admin') return true;
    
    const resourcePermissions = user.permissions[resource];
    return resourcePermissions && resourcePermissions.includes(action);
  };

  const canAccess = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role_name);
  };

  return {
    hasPermission,
    canAccess,
    user,
    isAdmin: user?.role_name === 'Admin' || user?.role_name === 'Super Admin',
    isSuperAdmin: user?.role_name === 'Super Admin',
  };
};

