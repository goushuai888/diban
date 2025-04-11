// src/stores/teacherStore.ts
import { defineStore } from 'pinia';
import { fetchTeachersApi } from '@/services/api';
import type { Teacher } from '@/types/models';

interface TeacherState {
  teachers: Teacher[];
  loading: boolean;
  error: string | null;
}

export const useTeacherStore = defineStore('teacher', {
  state: (): TeacherState => ({
    teachers: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchTeachers() {
      this.loading = true;
      this.error = null;
      
      try {
        const teachers = await fetchTeachersApi();
        this.teachers = teachers;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch teacher list';
        console.error('Error fetching teacher list:', error);
      } finally {
        this.loading = false;
      }
    }
  },
  
  getters: {
    getTeacherName: (state) => (id: string | null): string => {
      if (!id) return 'Not Assigned';
      
      const teacher = state.teachers.find(t => t.id === id);
      return teacher ? teacher.name : 'Unknown Teacher';
    }
  }
});