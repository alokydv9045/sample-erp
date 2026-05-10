import apiClient from './client';
import { CalendarEvent } from './calendar';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  attendanceToday: number;
  feesCollected: number;
  studentsChange: number;
  teachersChange: number;
  attendanceChange: number;
  feesChange: number;

  activeStudents?: number;
  totalClasses?: number;
  recentAdmissions?: number;
  pendingFeeCount?: number;
  upcomingExamCount?: number;
  overdueBooks?: number;
  attendanceDetails?: {
    marked: number;
    total: number;
  };

  role?: string;
  attendancePercentage?: number;
  pendingFees?: number;
  nextExam?: { name: string; date: string } | null;
  booksDue?: number;
  studentId?: string;
  todayEvent?: CalendarEvent | null;

  isClassTeacher?: boolean;
  myClassId?: string | null;
  myClassName?: string | null;
  myClassStudents?: number;
  subjectCount?: number;
  classesToday?: number;
  pendingAttendance?: number;

  // Admission Manager Stats
  admissionsToday?: number;
  admissionsThisMonth?: number;
  funnelStats?: {
    pending: number;
    followUp: number;
    converted: number;
  };
  classDistribution?: {
    name: string;
    count: number;
  }[];
  recentEnquiries?: {
    id: string;
    studentName: string;
    parentName: string;
    class: string;
    phone: string;
    status: string;
  }[];
  transport?: {
    totalVehicles?: number;
    activeTrips?: number;
    totalAllocations?: number;
    onRoad?: boolean;
    route?: string;
    stop?: string;
    time?: string;
  };
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
}

export interface UpcomingExam {
  id: string;
  name: string;
  class: string;
  date: string;
  subject: string;
}

export interface FeeCollectionSummary {
  totalExpected: number;
  collected: number;
  pending: number;
  collectionRate: number;
}

export const dashboardAPI = {
  getStats: async (): Promise<{ success: boolean; stats: DashboardStats }> => {
    const { data } = await apiClient.get('/dashboard/stats');
    return data;
  },

  getRecentActivities: async (limit?: number): Promise<{ success: boolean; activities: RecentActivity[] }> => {
    const { data } = await apiClient.get('/dashboard/activities', { params: { limit } });
    return data;
  },

  getUpcomingExams: async (limit?: number): Promise<{ success: boolean; exams: UpcomingExam[] }> => {
    const { data } = await apiClient.get('/dashboard/upcoming-exams', { params: { limit } });
    return data;
  },

  getFeeCollectionSummary: async (): Promise<{ success: boolean; summary: FeeCollectionSummary }> => {
    const { data } = await apiClient.get('/dashboard/fee-summary');
    return data;
  },

  getInventoryAlerts: async (): Promise<{ success: boolean; lowStockCount: number; items: any[] }> => {
    const { data } = await apiClient.get('/dashboard/inventory-alerts');
    return data;
  },

  getAccountantStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/dashboard/accountant-stats');
    return data;
  },

  getLibraryStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/dashboard/library-stats');
    return data;
  },

  getHRStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/dashboard/hr-stats');
    return data;
  },

  getFinanceStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/dashboard/finance-stats');
    return data;
  },

  getExamStats: async (classId?: string): Promise<any> => {
    const { data } = await apiClient.get('/dashboard/exam-stats', { params: { classId } });
    return data;
  },

  getInventoryStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/dashboard/inventory-stats');
    return data;
  },

  getNotificationStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/notifications/dashboard');
    return data;
  },
};
