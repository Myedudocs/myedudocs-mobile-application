import { useApiQuery } from './useApiQuery';
import { APP_CONFIG } from '../config';

export interface LiveSession {
  _id: string;
  title: string;
  subject?: string;
  mentorName?: string;
  mentorAvatar?: string;
  startTime: string;
  duration?: number;
  isLive?: boolean;
  attendees?: number;
  thumbnail?: string;
  joinUrl?: string;
}

/**
 * Reads live sessions. The mobile backend exposes them through the legacy
 * `current-affairs` listing pattern at `${BASE_URL}/live-sessions/upcoming` —
 * we expose the helper without burning a cached endpoint key so it stays
 * resilient if the API path changes server-side.
 */
export const useLiveSessions = () => {
  const url = `${APP_CONFIG.BASE_URL}/live-sessions/upcoming`;
  const result = useApiQuery<{ success: boolean; data: LiveSession[] }>(url);

  return {
    sessions: (result.data?.data as LiveSession[]) || [],
    loading: result.loading,
    error: result.error,
    refresh: result.refresh,
  };
};

export default useLiveSessions;