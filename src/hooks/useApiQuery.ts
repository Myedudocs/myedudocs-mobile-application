import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../service/api.service';

export interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: (updater: T | ((prev: T | null) => T)) => void;
}

/**
 * Tiny `useApiQuery` helper shared by every v2 hook. Keeps each hook small
 * while matching the same `{ data, loading, error, refresh }` shape used by
 * the web `student-dashboards/hooks/` folder.
 */
export const useApiQuery = <T = any>(
  url: string | null,
  options?: { skip?: boolean }
): UseApiQueryResult<T> => {
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!options?.skip);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const isInitialRef = useRef(true);

  const fetchOnce = useCallback(async () => {
    if (!url || options?.skip) {
      setLoading(false);
      return;
    }
    if (isInitialRef.current) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const result = await apiService.get<T>(url, { bypassCache: true });
      if (!cancelledRef.current) setDataState(result);
    } catch (e: any) {
      if (!cancelledRef.current) setError(e?.message || 'Failed to load');
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
        setRefreshing(false);
        isInitialRef.current = false;
      }
    }
  }, [url, options?.skip]);

  useEffect(() => {
    cancelledRef.current = false;
    fetchOnce();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchOnce]);

  const setData = useCallback(
    (updater: T | ((prev: T | null) => T)) => {
      setDataState((prev) =>
        typeof updater === 'function'
          ? (updater as (prev: T | null) => T)(prev)
          : updater
      );
    },
    []
  );

  return { data, loading, refreshing, error, refresh: fetchOnce, setData };
};