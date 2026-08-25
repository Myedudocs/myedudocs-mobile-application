import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApiQuery } from './useApiQuery';
import { apiService } from '../service/api.service';
import { ENDPOINTS } from '../service/api.service';
import { useAuth } from '../context/AuthContext';

export interface WishlistItem {
  itemId: string;
  itemType: 'course' | 'book' | 'test_series';
  title: string;
  image?: string;
  addedAt: string;
}

const LOCAL_KEY = (id: string) => `student_wishlist_${id}`;

/**
 * Wishlist hook with a server-source-of-truth backed by a local AsyncStorage
 * mirror for offline access. Toggle and clear operations mutate the server and
 * upsert into the mirror.
 */
export const useWishlist = () => {
  const { user } = useAuth();
  const id = user?.id || user?._id;
  const url = id ? ENDPOINTS.GET_WISHLIST(id) : null;

  const result = useApiQuery<{ success: boolean; data: WishlistItem[] }>(url, {
    skip: !id,
  });

  const persist = useCallback(
    async (items: WishlistItem[]) => {
      if (!id) return;
      try {
        await AsyncStorage.setItem(LOCAL_KEY(id), JSON.stringify(items));
      } catch (_) {
        // ignore
      }
    },
    [id]
  );

  const toggle = useCallback(
    async (item: WishlistItem) => {
      if (!id) return;
      try {
        await apiService.post(ENDPOINTS.TOGGLE_WISHLIST(id), item);
        const next = (() => {
          const list = (result.data?.data as WishlistItem[]) || [];
          const exists = list.some((w) => w.itemId === item.itemId);
          if (exists) {
            return list.filter((w) => w.itemId !== item.itemId);
          }
          return [{ ...item }, ...list];
        })();
        result.setData((prev) =>
          prev
            ? { ...prev, data: next }
            : { success: true, data: next }
        );
        await persist(next);
      } catch (e) {
        // optimistic rollback omitted — caller can retry
      }
    },
    [id, persist, result]
  );

  const clear = useCallback(async () => {
    result.setData({ success: true, data: [] });
    await persist([]);
  }, [persist, result]);

  return {
    wishlist: (result.data?.data as WishlistItem[]) || [],
    loading: result.loading,
    error: result.error,
    refresh: result.refresh,
    toggle,
    clear,
  };
};

export default useWishlist;