import { useApiQuery } from './useApiQuery';
import { ENDPOINTS } from '../service/api.service';

export type LeaderboardTimeframe = 'all' | 'weekly' | 'monthly';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  points: number;
  streak?: number;
  avgScore?: number;
  coursesCompleted?: number;
  level?: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
}

/**
 * Returns the global student leaderboard. The same endpoint supports a
 * `timeframe` query string (`all` | `weekly` | `monthly`).
 */
export const useStudentLeaderboard = (timeframe: LeaderboardTimeframe = 'all') => {
  const url = ENDPOINTS.GET_LEADERBOARD(timeframe);
  const result = useApiQuery<LeaderboardResponse>(url);

  return {
    leaderboard: (result.data?.data as LeaderboardEntry[]) || [],
    loading: result.loading,
    error: result.error,
    refresh: result.refresh,
  };
};

export default useStudentLeaderboard;