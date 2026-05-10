import apiClient from './client';

export const assignmentAPI = {
  // Teacher Assignments
  getTeacherAssignments: async () => {
    const { data } = await apiClient.get('/assignments/teacher');
    return data;
  },

  createAssignment: async (formData: FormData) => {
    const { data } = await apiClient.post('/assignments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getAssignmentDetails: async (id: string) => {
    const { data } = await apiClient.get(`/assignments/${id}`);
    return data;
  },

  deleteAssignment: async (id: string) => {
    const { data } = await apiClient.delete(`/assignments/${id}`);
    return data;
  },

  // Student Assignments
  getStudentAssignments: async () => {
    const { data } = await apiClient.get('/assignments/student');
    return data;
  },

  submitAssignment: async (formData: FormData) => {
    const { data } = await apiClient.post('/assignments/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Grading
  gradeSubmission: async (submissionId: string, gradeData: { grade: string; feedback: string }) => {
    const { data } = await apiClient.put(`/assignments/submissions/${submissionId}/grade`, gradeData);
    return data;
  },
};
