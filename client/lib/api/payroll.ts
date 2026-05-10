import apiClient from './client';

export const payrollAPI = {
  getSalaryStructures: async () => {
    const { data } = await apiClient.get('/payroll/salary-structures');
    return data;
  },
  setSalaryStructure: async (payload: any) => {
    const { data } = await apiClient.post('/payroll/salary-structures', payload);
    return data;
  },
  getPayrollList: async (month: number, year: number) => {
    const { data } = await apiClient.get(`/payroll/${month}/${year}`);
    return data;
  },
  generatePayroll: async (month: number, year: number) => {
    const { data } = await apiClient.post(`/payroll/generate/${month}/${year}`);
    return data;
  },
  markPaid: async (id: string, remarks?: string) => {
    const { data } = await apiClient.patch(`/payroll/${id}/pay`, { remarks });
    return data;
  },
  updateDays: async (id: string, payload: any) => {
    const { data } = await apiClient.patch(`/payroll/${id}/days`, payload);
    return data;
  },
  getEmployeePayroll: async () => {
    const { data } = await apiClient.get('/payroll/my');
    return data;
  },
};
