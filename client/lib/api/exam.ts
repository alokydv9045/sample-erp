import apiClient from './client';

export const examAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/exams', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/exams/${id}`);
    return data;
  },

  create: async (examData: any) => {
    const { data } = await apiClient.post('/exams', examData);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/exams/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/exams/${id}`);
    return data;
  },

  addSubject: async (examId: string, subjectData: any) => {
    const { data } = await apiClient.post(`/exams/${examId}/subjects`, subjectData);
    return data;
  },

  // Marks entry (subject teacher)
  enterMarks: async (examId: string, marksData: any) => {
    const { data } = await apiClient.post(`/exams/${examId}/marks`, marksData);
    return data;
  },

  // Consolidated marks (class teacher view)
  getConsolidated: async (examId: string) => {
    const { data } = await apiClient.get(`/exams/${examId}/consolidated`);
    return data;
  },

  // Freeze / Unfreeze
  freeze: async (examId: string) => {
    const { data } = await apiClient.put(`/exams/${examId}/freeze`);
    return data;
  },

  unfreeze: async (examId: string) => {
    const { data } = await apiClient.put(`/exams/${examId}/unfreeze`);
    return data;
  },

  // Legacy results
  submitResults: async (resultsData: any) => {
    const { data } = await apiClient.post('/exams/results', resultsData);
    return data;
  },

  getStudentResults: async (studentId: string, params?: any) => {
    const { data } = await apiClient.get(`/exams/students/${studentId}/results`, { params });
    return data;
  },

  getReport: async (examId: string, params?: any) => {
    const { data } = await apiClient.get(`/exams/${examId}/report`, { params });
    return data;
  },
  getTeacherTasks: async () => {
    const { data } = await apiClient.get('/exams/teacher-tasks');
    return data;
  },
  getClassTeacherReview: async (examId: string) => {
    const { data } = await apiClient.get(`/exams/${examId}/consolidated`);
    return { students: data.results || [] };
  },
  getReportCard: async (examId: string, studentId: string) => {
    const { data } = await apiClient.get(`/exams/${examId}/report`, { params: { studentId } });
    const studentResult = data.results?.find((r: any) => r.studentId === studentId);

    if (!studentResult) throw new Error('Report card not found');

    return {
      reportCard: {
        school: { name: 'EduSphere ERP' },
        exam: {
          name: studentResult.exam?.name,
          academicYear: studentResult.exam?.academicYear?.name || studentResult.exam?.academicYear
        },
        student: {
          name: studentResult.studentName,
          class: studentResult.student?.currentClass?.name || studentResult.student?.class,
          section: studentResult.student?.section?.name || studentResult.student?.section,
          rollNumber: studentResult.student?.rollNumber,
          admissionNumber: studentResult.admissionNo,
        },
        subjects: studentResult.marks?.map((m: any) => ({
          name: m.subjectName,
          totalMarks: m.totalMarks,
          obtainedMarks: m.obtainedMarks,
          grade: m.grade,
          isAbsent: m.isAbsent,
          passed: m.obtainedMarks >= (m.totalMarks * 0.4),
        })),
        summary: {
          totalMarks: studentResult.totalMarks,
          obtainedMarks: studentResult.obtainedMarks,
          percentage: studentResult.percentage,
          grade: studentResult.grade,
          rank: studentResult.rank,
          totalStudents: data.stats?.totalStudents || 0,
          result: studentResult.result,
          remarks: studentResult.remarks,
        },
        classTeacher: studentResult.exam?.classTeacher || '',
      }
    };
  }
};
