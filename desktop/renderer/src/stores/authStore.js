import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        error: null 
      }),

      setToken: (token) => set({ token }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const electronAPI = window.electronAPI;
          if (!electronAPI?.auth) {
            throw new Error('Electron API not available');
          }

          const result = await electronAPI.auth.login(credentials);
          
          if (result.success) {
            set({
              user: result.user,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return { success: true };
          } else {
            set({
              error: result.error,
              isLoading: false
            });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error.message || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          const electronAPI = window.electronAPI;
          if (electronAPI?.auth) {
            await electronAPI.auth.logout();
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      clearError: () => set({ error: null }),

      // Getters
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        
        if (user.role === 'admin') return true;
        
        const permissions = user.permissions || [];
        return permissions.includes(permission) || permissions.includes('all');
      },

      getUserRole: () => {
        const { user } = get();
        return user?.role || 'guest';
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
