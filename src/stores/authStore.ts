// src/stores/authStore.ts
import { defineStore } from 'pinia';
import { loginApi } from '@/services/api';

interface AuthState {
  isLoggedIn: boolean;
  role: 'admin' | 'teacher' | null;
  userId: string | null;
  userName: string | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isLoggedIn: !!localStorage.getItem('role'),
    role: localStorage.getItem('role') as 'admin' | 'teacher' | null,
    userId: localStorage.getItem('userId'),
    userName: localStorage.getItem('userName'),
    loading: false,
    error: null
  }),
  
  actions: {
    async login(username: string, password: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await loginApi({ username, password });
        
        this.isLoggedIn = true;
        this.role = response.role;
        this.userId = response.userId;
        this.userName = response.userName || '';
        
        // Store login information in local storage
        localStorage.setItem('role', response.role);
        localStorage.setItem('userId', response.userId);
        if (response.userName) {
          localStorage.setItem('userName', response.userName);
        }
        
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Login failed, please check username and password';
        console.error('Login error:', error);
      } finally {
        this.loading = false;
      }
    },
    
    logout() {
      this.isLoggedIn = false;
      this.role = null;
      this.userId = null;
      this.userName = null;
      this.error = null;
      
      // Clear local storage
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');

      // Reset document title
      document.title = 'hesis Management System';
    }
  }
});