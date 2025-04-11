//src/services/api.ts
import axios from 'axios';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include user role and ID in every request (if available)
api.interceptors.request.use(config => {
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  
  if (role) {
    config.headers['X-User-Role'] = role;
  }
  
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  
  return config;
});

// Login API
export const loginApi = async (credentials: { username: string; password: string }) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

// Fetch teachers list API (Admin only)
export const fetchTeachersApi = async () => {
  const response = await api.get('/api/teachers');
  return response.data;
};

// Fetch students list API (Admin/Teacher, filtered by permissions and role)
export const fetchStudentsApi = async () => {
  const response = await api.get('/api/students');
  return response.data;
};

// Add new student API (Admin only)
export const addStudentApi = async (name: string) => {
  const response = await api.post('/api/students', { name });
  return response.data;
};

// Assign teacher to student API (Admin only)
export const assignTeacherApi = async (studentId: string, teacherId: string) => {
  const response = await api.put(`/api/students/${studentId}/assign`, { teacherId });
  return response.data;
};

// Unassign teacher from student API (Admin only)
export const unassignTeacherApi = async (studentId: string) => {
  const response = await api.put(`/api/students/${studentId}/unassign`);
  return response.data;
};

// Grade student API (Teacher only)
export const gradeStudentApi = async (studentId: string, reportType: 'progress' | 'final', grade: number) => {
  const response = await api.put(`/api/students/${studentId}/grade`, { reportType, grade });
  return response.data;
};

// Finalize student record API (Teacher only)
export const finalizeRecordApi = async (studentId: string) => {
  const response = await api.put(`/api/students/${studentId}/finalize`);
  return response.data;
};

// Unfinalize student record API (Admin only)
export const unfinalizeRecordApi = async (studentId: string) => {
  const response = await api.put(`/api/students/${studentId}/unfinalize`);
  return response.data;
}

// Delete student API (Admin only)
export const deleteStudentApi = async (studentId: string) => {
  const response = await api.delete(`/api/students/${studentId}`);
  return response.data;
}

// Search students API (Admin/Teacher)
export const searchStudentsApi = async (searchName: string) => {
  const response = await api.get('/api/students/search', {
    params: { name: searchName }
  });
  return response.data;
};