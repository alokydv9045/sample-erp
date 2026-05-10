'use client';

import { useQuery } from '@tanstack/react-query';
import { attendanceAPI } from '@/lib/api/attendance';
import { hrAPI } from '@/lib/api/hr';
import { payrollAPI } from '@/lib/api/payroll';
import { serviceAPI } from '@/lib/api/service';

export function useTeacherProfile() {
    // 1. Fetch Attendance History
    const attendanceQuery = useQuery({
        queryKey: ['my-attendance'],
        queryFn: () => attendanceAPI.getMyAttendance(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // 2. Fetch Leave Balances
    const leaveBalancesQuery = useQuery({
        queryKey: ['my-leave-balances'],
        queryFn: () => hrAPI.getMyLeaveBalances(),
        staleTime: 10 * 60 * 1000,
    });

    // 3. Fetch Payroll History
    const payrollQuery = useQuery({
        queryKey: ['my-payroll'],
        queryFn: () => payrollAPI.getEmployeePayroll(),
        staleTime: 30 * 60 * 1000,
    });

    // 4. Fetch Leave Requests (Filtered service requests)
    const leaveRequestsQuery = useQuery({
        queryKey: ['my-leave-requests'],
        queryFn: () => serviceAPI.getAll({ type: 'LEAVE' }),
        staleTime: 5 * 60 * 1000,
    });

    return {
        attendance: {
            data: {
                records: attendanceQuery.data?.records || [],
                stats: attendanceQuery.data?.stats || { present: 0, absent: 0, late: 0, percentage: 0 }
            },
            isLoading: attendanceQuery.isLoading,
            error: attendanceQuery.error as Error | null,
            refetch: attendanceQuery.refetch,
        },
        leaveBalances: {
            data: leaveBalancesQuery.data?.balances || [],
            isLoading: leaveBalancesQuery.isLoading,
            error: leaveBalancesQuery.error as Error | null,
            refetch: leaveBalancesQuery.refetch,
        },
        payroll: {
            data: payrollQuery.data?.payrolls || [],
            isLoading: payrollQuery.isLoading,
            error: payrollQuery.error as Error | null,
            refetch: payrollQuery.refetch,
        },
        leaveRequests: {
            data: (leaveRequestsQuery.data as any) || [],
            isLoading: leaveRequestsQuery.isLoading,
            error: leaveRequestsQuery.error as Error | null,
            refetch: leaveRequestsQuery.refetch,
        },
        isLoadingAny: attendanceQuery.isLoading || leaveBalancesQuery.isLoading || payrollQuery.isLoading || leaveRequestsQuery.isLoading,
        refetchAll: () => {
            attendanceQuery.refetch();
            leaveBalancesQuery.refetch();
            payrollQuery.refetch();
            leaveRequestsQuery.refetch();
        }
    };
}
