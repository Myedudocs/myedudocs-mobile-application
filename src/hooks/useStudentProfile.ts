import { useAuth } from '../context/AuthContext';
import { useApiQuery } from './useApiQuery';
import { ENDPOINTS } from '../service/api.service';

export interface StudentProfile {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  authProvider?: 'local' | 'google';
  googleId?: string;
  avatar?: string;
  examTarget?: string;
  classLevel?: string;
  language?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt?: string;
}

/**
 * Reads the currently-authenticated student from AuthContext and surfaces a
 * `useApiQuery`-shaped object against `GET_PROFILE`. Auto-refreshes when the
 * auth user changes (login/logout).
 */
export const useStudentProfile = () => {
  const { user, token } = useAuth();
  const url = user?.id || user?._id ? ENDPOINTS.GET_PROFILE : null;
  const result = useApiQuery<{ data: StudentProfile; success: boolean }>(url, {
    skip: !user,
  });

  const profile = (result.data?.data as StudentProfile) || (user as any) || null;

  return {
    profile,
    token,
    loading: result.loading,
    error: result.error,
    refresh: result.refresh,
  };
};

export default useStudentProfile;