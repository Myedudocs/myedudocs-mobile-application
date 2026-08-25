import { useAuth } from '../context/AuthContext';
import { useApiQuery } from './useApiQuery';
import { ENDPOINTS } from '../service/api.service';

export interface StudentTestSeries {
  _id: string;
  testSeriesId: string;
  title: string;
  examName?: string;
  attemptsRemaining?: number;
  lastScore?: number;
  enrolledAt?: string;
  progress?: number;
}

export const useStudentTestSeries = () => {
  const { user } = useAuth();
  const id = user?.id || user?._id;
  const url = id ? ENDPOINTS.GET_STUDENT_TESTS(id) : null;

  const result = useApiQuery<{
    success: boolean;
    data: StudentTestSeries[];
  }>(url, { skip: !id });

  return {
    testSeries: (result.data?.data as StudentTestSeries[]) || [],
    loading: result.loading,
    error: result.error,
    refresh: result.refresh,
  };
};

export default useStudentTestSeries;