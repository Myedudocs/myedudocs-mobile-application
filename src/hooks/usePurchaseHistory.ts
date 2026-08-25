import { useApiQuery } from './useApiQuery';
import { ENDPOINTS } from '../service/api.service';

export interface PurchaseRecord {
  _id: string;
  purchase_type: 'course' | 'book' | 'test_series' | 'exam' | 'live_session';
  item_details: {
    name: string;
    category?: string;
    image?: string;
  };
  pricing: {
    final_amount: number;
    original_price?: number;
    tax_amount?: number;
    discount_amount?: number;
  };
  payment_gateway?: string;
  payment_completed_at?: string;
  createdAt: string;
  gateway_details?: {
    order_id?: string;
    payment_id?: string;
  };
}

export interface PurchaseHistoryResponse {
  success: boolean;
  data: PurchaseRecord[];
  total?: number;
  page?: number;
  pages?: number;
}

export const usePurchaseHistory = (page = 1) => {
  const url = ENDPOINTS.GET_STUDENT_PURCHASES(page);
  const result = useApiQuery<PurchaseHistoryResponse>(url);

  const purchases = (result.data?.data as PurchaseRecord[]) || [];

  return {
    purchases,
    total: result.data?.total ?? purchases.length,
    page: result.data?.page ?? page,
    pages: result.data?.pages ?? 1,
    loading: result.loading,
    refreshing: result.refreshing,
    error: result.error,
    refresh: result.refresh,
  };
};

export default usePurchaseHistory;