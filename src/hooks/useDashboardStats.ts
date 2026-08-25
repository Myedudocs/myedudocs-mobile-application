import { useAuth } from '../context/AuthContext';
import { useApiQuery } from './useApiQuery';
import { ENDPOINTS } from '../service/api.service';

export interface DashboardStats {
  courses: {
    total: number;
    completed: number;
    inProgress: number;
    totalHours: number;
    completionRate: number;
  };
  books: { total: number };
  testSeries: { total: number };
  exams: { total: number; averageScore: number };
  achievements: { total: number };
  performance: { averageScore: number; totalAttempts: number };
  learningStreak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
  };
  monthlyProgress: Array<{
    month: string;
    averageScore: number;
    totalActivities: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    relativeTime: string;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    type: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardStats;
}

/**
 * Fetches `GET_DASHBOARD_STATS(studentId)` for the authenticated student.
 * Returns the stats payload along with extracted convenience counts (book,
 * course, test) that the dashboard hero expects.
 */
export const useDashboardStats = () => {
  const { user } = useAuth();
  const studentId = user?.id || user?._id;
  const url = studentId ? ENDPOINTS.GET_DASHBOARD_STATS(studentId) : null;

  const result = useApiQuery<DashboardResponse>(url, { skip: !studentId });

  const stats = (result.data?.data as DashboardStats) || null;
  const courseCount = stats?.courses?.total ?? 0;
  const bookCount = stats?.books?.total ?? 0;
  const testCount = stats?.testSeries?.total ?? 0;

  return {
    stats,
    courseCount,
    bookCount,
    testCount,
    loading: result.loading,
    error: result.error,
    refresh: result.refresh,
  };
};

export default useDashboardStats;