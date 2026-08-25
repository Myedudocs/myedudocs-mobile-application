import { useAuth } from '../context/AuthContext';
import { useApiQuery } from './useApiQuery';
import { ENDPOINTS } from '../service/api.service';

export interface StudentBook {
  _id: string;
  bookId: string;
  title: string;
  coverImage?: string;
  purchasedAt?: string;
  format: 'pdf' | 'physical';
  deliveryStatus?: 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';
  trackingId?: string;
  courier?: { name: string; url?: string };
  progress?: number;
}

export const useStudentBooks = () => {
  const { user } = useAuth();
  const id = user?.id || user?._id;
  const url = id ? ENDPOINTS.GET_STUDENT_BOOKS(id) : null;

  const result = useApiQuery<{ success: boolean; data: StudentBook[] }>(url, {
    skip: !id,
  });

  return {
    books: (result.data?.data as StudentBook[]) || [],
    loading: result.loading,
    error: result.error,
    refresh: result.refresh,
  };
};

export default useStudentBooks;