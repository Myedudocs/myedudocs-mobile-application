import { useAuth } from '../context/AuthContext';
import { useApiQuery } from './useApiQuery';
import { ENDPOINTS } from '../service/api.service';

export interface StudentCourse {
  _id: string;
  courseId: string;
  title: string;
  thumbnail?: string;
  progress?: number;
  status?: 'in-progress' | 'completed' | 'enrolled';
  lastAccessedAt?: string;
  mentor?: { name: string; avatar?: string };
  enrolledAt?: string;
}

export const useStudentCourses = () => {
  const { user } = useAuth();
  const id = user?.id || user?._id;
  const url = id ? ENDPOINTS.GET_STUDENT_COURSES(id) : null;

  const result = useApiQuery<{ success: boolean; data: StudentCourse[] }>(url, {
    skip: !id,
  });

  return {
    courses: (result.data?.data as StudentCourse[]) || [],
    loading: result.loading,
    error: result.error,
    refresh: result.refresh,
  };
};

export default useStudentCourses;