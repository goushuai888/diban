// src/stores/studentStore.ts
import { defineStore } from 'pinia';
import { 
  fetchStudentsApi, 
  addStudentApi, 
  assignTeacherApi, 
  unassignTeacherApi,
  gradeStudentApi, 
  finalizeRecordApi,
  unfinalizeRecordApi,
  deleteStudentApi,
  searchStudentsApi
} from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Student } from '@/types/models';

interface StudentState {
  students: Student[];
  loading: boolean;
  error: string | null;
  processingIds: string[]; // Track student IDs currently being processed
}

export const useStudentStore = defineStore('student', {
  state: (): StudentState => ({
    students: [],
    loading: false,
    error: null,
    processingIds: []
  }),
  
  actions: {
    async fetchStudents() {
      this.loading = true;
      this.error = null;
      
      try {
        const students = await fetchStudentsApi();
        this.students = students;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch student list';
        console.error('Error fetching student list:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async addStudent(name: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const newStudent = await addStudentApi(name);
        this.students.push(newStudent);
        return newStudent;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to add student';
        console.error('Error adding student:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async assignTeacher(studentId: string, teacherId: string) {
      this.processingIds = [...this.processingIds, studentId];
      this.error = null;
      
      try {
        const updatedStudent = await assignTeacherApi(studentId, teacherId);
        
        // Update the student object in the list
        const index = this.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
          this.students[index] = updatedStudent;
        }
        
        return updatedStudent;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to assign teacher';
        console.error('Error assigning teacher:', error);
        throw error;
      } finally {
        this.processingIds = this.processingIds.filter(id => id !== studentId);
      }
    },

    async unassignTeacher(studentId: string) {
      this.processingIds = [...this.processingIds, studentId];
      this.error = null;

      try {
        const updatedStudent = await unassignTeacherApi(studentId);
        
        // Update the student object in the list
        const index = this.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
          this.students[index] = updatedStudent;
        }
        
        return updatedStudent;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to unassign teacher';
        console.error('Error unassigning teacher:', error);
        throw error;
      } finally {
        this.processingIds = this.processingIds.filter(id => id !== studentId);
      }
    }, 
    
    async gradeStudent(studentId: string, reportType: 'progress' | 'final', grade: number) {
      this.processingIds = [...this.processingIds, studentId];
      this.error = null;
      
      try {
        const updatedStudent = await gradeStudentApi(studentId, reportType, grade);
        
        // Update the student object in the list
        const index = this.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
          this.students[index] = updatedStudent;
        }
        
        return updatedStudent;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Grading failed';
        console.error('Error grading:', error);
        throw error;
      } finally {
        this.processingIds = this.processingIds.filter(id => id !== studentId);
      }
    },
    
    async finalizeRecord(studentId: string) {
      this.processingIds = [...this.processingIds, studentId];
      this.error = null;
      
      try {
        const updatedStudent = await finalizeRecordApi(studentId);
        
        // Update the student object in the list
        const index = this.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
          this.students[index] = updatedStudent;
        }
        
        return updatedStudent;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to finalize record';
        console.error('Error finalizing record:', error);
        throw error;
      } finally {
        this.processingIds = this.processingIds.filter(id => id !== studentId);
      }
    },

    async unfinalizeRecord(studentId: string) {
      this.processingIds = [...this.processingIds, studentId];
      this.error = null;
      
      try {
        const updatedStudent = await unfinalizeRecordApi(studentId);
        
        const index = this.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
          this.students[index] = updatedStudent;
        }
        
        return updatedStudent;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to unfinalize record';
        console.error('Error unfinalizing record:', error);
        throw error;
      } finally {
        this.processingIds = this.processingIds.filter(id => id !== studentId);
      }
    },
    
    async deleteStudent(studentId: string) {
      this.processingIds = [...this.processingIds, studentId];
      this.error = null;
      
      try {
        await deleteStudentApi(studentId);
        
        this.students = this.students.filter(s => s.id !== studentId);
        
        return true;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete student';
        console.error('Error deleting student:', error);
        throw error;
      } finally {
        this.processingIds = this.processingIds.filter(id => id !== studentId);
      }
    },

    async searchStudents(searchName: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const students = await searchStudentsApi(searchName);
        this.students = students; // Replace current students with search results
        return students;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to search students';
        console.error('Error searching students:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    }
  },
  
  getters: {
    // Get the appropriate student list based on user role
    getStudentsForCurrentUser: (state) => {
      const authStore = useAuthStore();
      
      if (authStore.role === 'admin') {
        return state.students; // Admin can see all students
      } else if (authStore.role === 'teacher') {
        // Teachers can only see students assigned to them
        return state.students.filter(student => student.assignedTeacherId === authStore.userId);
      }
      return []; // Return empty array if not logged in or role is unknown
    },
    
    // Check if a student with specified ID is currently being processed
    isProcessing: (state) => (id: string) => {
      return state.processingIds.includes(id);
    }
  }
});