import { useCallback, useState } from 'react';
import { apiService } from '../service/api.service';
import { ENDPOINTS } from '../service/api.service';

export interface BlogDraftRequest {
  topic: string;
  outline?: string[];
  tone?: 'informative' | 'casual' | 'educational' | 'motivational';
  targetWordCount?: number;
}

export interface BlogDraft {
  title: string;
  introduction: string;
  body: string;
  conclusion: string;
  tags?: string[];
  estimatedReadMinutes?: number;
}

/**
 * Powers the Copilot modal in PublishBlogs. Wraps `AGENT_BLOG_GENERATE` and
 * tracks loading + error state for the UI.
 */
export const useBlogWriting = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDraft, setLastDraft] = useState<BlogDraft | null>(null);

  const generateDraft = useCallback(
    async (request: BlogDraftRequest): Promise<BlogDraft | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.post<{
          success: boolean;
          data: BlogDraft;
        }>(ENDPOINTS.AGENT_BLOG_GENERATE, request);
        const draft = res?.data;
        if (draft) {
          setLastDraft(draft);
          return draft;
        }
        return null;
      } catch (e: any) {
        setError(e?.message || 'Failed to generate blog draft');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { generateDraft, loading, error, lastDraft };
};

export default useBlogWriting;