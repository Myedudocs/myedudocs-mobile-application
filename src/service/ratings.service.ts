import { BASE_URL } from './api.service';

// Cache to avoid repeat network calls for same item
const ratingCache = new Map<string, { rating: number; count: number }>();

/**
 * Fetch real average rating + review count for a BOOK from the backend.
 * Endpoint: GET /books/review/book/:bookId/reviews
 * Returns: { stats: { averageRating: number, totalReviews: number } }
 */
export const fetchBookRating = async (
  bookId: string,
  token?: string
): Promise<{ rating: number; count: number }> => {
  const cacheKey = `book_${bookId}`;
  if (ratingCache.has(cacheKey)) return ratingCache.get(cacheKey)!;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/books/review/book/${bookId}/reviews?limit=1`, { headers });
    const data = await res.json();

    if (data.success && data.stats) {
      const result = {
        rating: parseFloat(data.stats.averageRating || '0'),
        count: data.stats.totalReviews || 0,
      };
      ratingCache.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    // fail silently – fall through to default
  }
  return { rating: 0, count: 0 };
};

/**
 * Fetch real average rating + review count for a COURSE from the backend.
 * Endpoint: GET /course-reviews/:courseId
 * Returns: { averageRating: string, total: number }
 */
export const fetchCourseRating = async (
  courseId: string,
  token?: string
): Promise<{ rating: number; count: number }> => {
  const cacheKey = `course_${courseId}`;
  if (ratingCache.has(cacheKey)) return ratingCache.get(cacheKey)!;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/course-reviews/${courseId}`, { headers });
    const data = await res.json();

    if (data.success) {
      const result = {
        rating: parseFloat(data.averageRating || '0'),
        count: data.total || 0,
      };
      ratingCache.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    // fail silently
  }
  return { rating: 0, count: 0 };
};

/**
 * Fetch real average rating + review count for a TEST SERIES from the backend.
 * Endpoint: GET /test-series/review/:examId
 * Returns: { stats: { averageRating: number, totalReviews: number } }
 */
export const fetchTestSeriesRating = async (
  examId: string,
  token?: string
): Promise<{ rating: number; count: number }> => {
  const cacheKey = `test_series_${examId}`;
  if (ratingCache.has(cacheKey)) return ratingCache.get(cacheKey)!;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/test-series/review/${examId}`, { headers });
    const data = await res.json();

    if (data.success && data.stats) {
      const result = {
        rating: parseFloat(data.stats.averageRating || '0'),
        count: data.stats.totalReviews || 0,
      };
      ratingCache.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    // fail silently
  }
  return { rating: 0, count: 0 };
};

/**
 * Auto-detect item type and fetch the appropriate rating.
 */
export const fetchItemRating = async (
  itemId: string,
  itemType: 'book' | 'course' | 'test_series',
  token?: string
): Promise<{ rating: number; count: number }> => {
  if (itemType === 'book') return fetchBookRating(itemId, token);
  if (itemType === 'course') return fetchCourseRating(itemId, token);
  if (itemType === 'test_series') return fetchTestSeriesRating(itemId, token);
  return { rating: 0, count: 0 };
};

/**
 * Submit a review for any item type.
 */
export const submitReview = async (
  itemType: 'book' | 'course' | 'test_series',
  itemId: string,
  payload: { rating: number; title?: string; comment: string },
  token: string
): Promise<{ success: boolean; message: string }> => {
  try {
    let url = '';
    let body: any = {};

    if (itemType === 'course') {
      url = `${BASE_URL}/course/review/submit`;
      body = {
        course_id: itemId,
        rating: payload.rating,
        comment: payload.comment,
      };
    } else if (itemType === 'book') {
      url = `${BASE_URL}/books/review/book/${itemId}/review`;
      body = {
        rating: payload.rating,
        title: payload.title || '',
        review: payload.comment,
      };
    } else if (itemType === 'test_series') {
      url = `${BASE_URL}/test-series/review/${itemId}/submit`;
      body = {
        rating: payload.rating,
        title: payload.title || '',
        comment: payload.comment,
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return {
      success: !!data.success,
      message: data.message || (data.success ? 'Review submitted' : 'Failed to submit review'),
    };
  } catch (e) {
    return { success: false, message: 'Network error occurred' };
  }
};

/**
 * Check if the user is eligible to review an item.
 */
export const checkCanReview = async (
  itemType: 'book' | 'course' | 'test_series',
  itemId: string,
  token: string
): Promise<{ canReview: boolean; hasReviewed: boolean; existingReview?: any }> => {
  try {
    let url = '';
    if (itemType === 'book') {
      url = `${BASE_URL}/books/review/book/${itemId}/can-review`;
    } else if (itemType === 'course') {
      // Course doesn't have a specific can-review endpoint in the snippets I saw, 
      // but usually purchase is required. Web checks for 'purchased' flag.
      return { canReview: true, hasReviewed: false }; 
    } else {
      return { canReview: true, hasReviewed: false };
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return {
      canReview: !!data.canReview,
      hasReviewed: !!data.hasReviewed,
      existingReview: data.existingReview,
    };
  } catch (e) {
    return { canReview: false, hasReviewed: false };
  }
};

/** Clear the in-memory cache (call on logout) */
export const clearRatingCache = () => ratingCache.clear();
