import { APP_CONFIG } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --------------------------------------------------------
// 1. BASE URL Configuration
// --------------------------------------------------------
export const BASE_URL = APP_CONFIG.BASE_URL;


// --------------------------------------------------------
// 2. ENDPOINTS DICTIONARY
// Group all API endpoints here to avoid hardcoding strings across the app
// --------------------------------------------------------
export const ENDPOINTS = {
  // --- CATEGORIES & COURSES (Updated to your exact backend routes) ---
  GET_CATEGORIES: `${BASE_URL}/course/categories`,
  GET_POPULAR_COURSES: `${BASE_URL}/course/allCourses`,
  GET_POPULAR_BOOKS: `${BASE_URL}/books/approved?page=1&limit=100`,
  GET_TEST_SERIES_CATEGORIES: `${BASE_URL}/test-series/navigation/examinations`,
  GET_COURSE_DETAILS: (id: string) => `${BASE_URL}/course/courseDetails/${id}`,
  GET_COURSE_REVIEWS: (id: string) => `${BASE_URL}/course/review/${id}`,
  GET_BOOK_DETAILS: (id: string) => `${BASE_URL}/books/${id}`,
  GET_BOOK_REVIEWS: (id: string) => `${BASE_URL}/books/review/book/${id}/reviews`,

  // --- REVIEWS & FEEDBACK ---
  SUBMIT_COURSE_REVIEW: `${BASE_URL}/course/review/submit`,
  SUBMIT_BOOK_REVIEW: (bookId: string) => `${BASE_URL}/books/review/book/${bookId}/review`,
  UPDATE_BOOK_REVIEW: (reviewId: string) => `${BASE_URL}/books/review/review/${reviewId}`,
  GET_TEST_SERIES_REVIEWS: (examId: string) => `${BASE_URL}/test-series/review/${examId}`,
  SUBMIT_TEST_SERIES_REVIEW: (examId: string) => `${BASE_URL}/test-series/review/${examId}/submit`,
  CAN_REVIEW_BOOK: (bookId: string) => `${BASE_URL}/books/review/book/${bookId}/can-review`,



  // --- AUTHENTICATION ---

  REGISTER: `${BASE_URL}/auth/register`,
  // VERIFY_OTP: `${BASE_URL}/auth/verify-otp`,
  GET_PROFILE: `${BASE_URL}/auth/profile`,
  SEND_REGISTRATION_OTP: `${BASE_URL}/users/send-registration-otp`,
  VERIFY_REGISTRATION_OTP: `${BASE_URL}/users/verify-registration-otp`,
  LOGIN: `${BASE_URL}/users/login`,
  VERIFY_OTP: `${BASE_URL}/users/verify-otp`,
  RESEND_LOGIN_OTP: `${BASE_URL}/users/resend-login-otp`,
  GOOGLE_AUTH: `${BASE_URL}/users/google-auth`,

  UPDATE_PROFILE: (userId: string) => `${BASE_URL}/users/profile/${userId}`,
  UPDATE_STUDENT_PROFILE: `${BASE_URL}/student/profile`,
  // --- TEST SERIES ---
  GET_TEST_SERIES: `${BASE_URL}/test-series`,
  GET_ENROLLED_TESTS: `${BASE_URL}/test-series/enrolled`,
  GET_EXAMINATIONS: `${BASE_URL}/test-series/navigation/examinations`,
  GET_SUBJECTS_BY_EXAM: (examId: string) => `${BASE_URL}/test-series/navigation/examinations/${examId}/subjects`,
  GET_TOPICS_BY_SUBJECT: (subjectId: string) => `${BASE_URL}/test-series/navigation/subjects/${subjectId}/topics`,
  GET_TESTS_BY_TOPIC: (topicId: string) => `${BASE_URL}/test-series/navigation/topics/${topicId}/test-series`,

  // --- BLOGS ---
  GET_BLOGS: `${BASE_URL}/course/allCourseContent`,
  GET_BLOG_DETAILS: (id: string) => `${BASE_URL}/course/courseContentDetails/${id}`,
  GET_REC_COURSES: `${BASE_URL}/course/allCourses?limit=3`,
  GET_REC_BOOKS: `${BASE_URL}/books/approved?limit=4`,



  // --- JOBS & PREVIOUS PAPERS ---
  GET_JOB_NOTIFICATIONS: `${BASE_URL}/jobs`,
  GET_JOB_DETAILS: (id: string) => `${BASE_URL}/jobs/details/${id}`,
  GET_PYQS: `${BASE_URL}/pyq/approved`,
  GET_SYLLABUS: `${BASE_URL}/syllabus/approved`,
  GET_TOP_MENTORS: `${BASE_URL}/count/getAllTeachers`,
  GET_STUDENT_LEADERBOARD: (id: string) => `${BASE_URL}/student-leaderboard/${id}`,
  GET_STUDENT_METRICS: (id: string) => `${BASE_URL}/student/metrics/analytics/${id}`,
  REFRESH_STUDENT_METRICS: (id: string) => `${BASE_URL}/student/metrics/refresh/${id}`,
  GET_WALLET_SUMMARY: `${BASE_URL}/student/wallet`,

  // --- CURRENT AFFAIRS ---
  GET_CURRENT_AFFAIRS: `${BASE_URL}/current-affairs/approved`,
  GET_CA_DETAILS: (idOrSlug: string) => `${BASE_URL}/current-affairs/details/${idOrSlug}`,

  // --- SUPPORT TICKETS & CHATBOT ---
  GET_TICKETS: `${BASE_URL}/support/list`,
  CREATE_TICKET: `${BASE_URL}/support/create`,
  GET_TICKET_DETAILS: (id: string) => `${BASE_URL}/support/${id}`,
  SEND_TICKET_MESSAGE: (id: string) => `${BASE_URL}/support/${id}/message`,
  MARK_TICKET_READ: (id: string) => `${BASE_URL}/support/${id}/read`,
  SUBMIT_FREE_RESOURCE: `${BASE_URL}/free-resources/submit`,
  GET_CHATBOT_PUBLIC: `${BASE_URL}/chatbot/public`,
  REQUEST_CHATBOT_CALLBACK: `${BASE_URL}/chatbot/callback`,

  // --- STUDENT DASHBOARD & ACTIVITIES ---
  GET_STUDENT_DASHBOARD_STATS: (id: string) => `${BASE_URL}/student/dashboard-stats/${id}`,
  GET_STUDENT_ACTIVITIES: (id: string) => `${BASE_URL}/student/activities/${id}`,
  GET_TOPPERS: `${BASE_URL}/student/toppers`,

  // --- NOTIFICATIONS ---
  GET_NOTIFICATIONS: `${BASE_URL}/notifications`,
  MARK_NOTIFICATIONS_READ: `${BASE_URL}/notifications/mark-read`,

  // --- LEADERBOARD & REWARDS ---
  GET_LEADERBOARD: (timeframe?: string) => `${BASE_URL}/student/leaderboard?timeframe=${timeframe || 'all'}`,
  GET_REWARDS_SUMMARY: `${BASE_URL}/student/rewards/summary`,
  GET_COUPONS: `${BASE_URL}/student/coupons`,
  GET_MY_COUPONS: `${BASE_URL}/coupons/my-coupons`,
  VERIFY_COUPON: `${BASE_URL}/coupons/verify`,
  CLAIM_DAILY_CHECKIN: `${BASE_URL}/student/daily-checkin`,

  // --- DEVICE MANAGEMENT & SECURITY ---
  GET_STUDENT_DEVICES: `${BASE_URL}/student/devices`,
  TERMINATE_OTHER_DEVICES: `${BASE_URL}/student/devices/terminate-others`,

  // --- STUDENT v2 DASHBOARD (Phase 3+) ---
  GET_DASHBOARD_STATS: (id: string) =>
    `${BASE_URL}/student/dashboard/analytics/stats/${id}`,
  GET_DASHBOARD_RECENT_ACTIVITY: (id: string, limit = 30) =>
    `${BASE_URL}/student/dashboard/analytics/recent-activity/${id}?limit=${limit}`,
  GET_STUDENT_METRICS_V2: (id: string) =>
    `${BASE_URL}/student/metrics/metrics/${id}`,
  GET_STUDENT_COURSES: (studentId: string) =>
    `${BASE_URL}/students/course/payment/my-courses/${studentId}`,
  GET_STUDENT_BOOKS: (studentId: string) =>
    `${BASE_URL}/student/books/purchase/my-books/${studentId}?limit=1`,
  GET_STUDENT_TESTS: (studentId: string) =>
    `${BASE_URL}/student/test-series/purchase/my-test-series/${studentId}?limit=1`,
  GET_STUDENT_PURCHASES: (page = 1) =>
    `${BASE_URL}/student/purchases?page=${page}`,
  GET_STUDENT_ATTEMPTS: (id: string, page = 1, limit = 20) =>
    `${BASE_URL}/student/test-series/attempt/user/${id}/attempts?limit=${limit}&page=${page}`,
  GET_TOPPERS_ALL: `${BASE_URL}/toppers/all`,
  AGENT_BLOG_GENERATE: `${BASE_URL}/agent/blog-generate`,
  GET_WISHLIST: (studentId: string) =>
    `${BASE_URL}/student/wishlist/${studentId}`,
  TOGGLE_WISHLIST: (studentId: string) =>
    `${BASE_URL}/student/wishlist/toggle/${studentId}`,
  GET_STUDENT_ORDERS: (studentId: string) =>
    `${BASE_URL}/student/orders/${studentId}`,
  TRACK_ORDER: (orderId: string) =>
    `${BASE_URL}/student/orders/${orderId}/track`,
};





// --------------------------------------------------------
// 3. PRODUCTION-GRADE API CLIENT with In-Memory Caching
// --------------------------------------------------------
interface ApiClientOptions extends RequestInit {
  data?: any;         // Automatically stringifies JSON bodies
  bypassCache?: boolean; // Force fresh fetch
  cacheTTL?: number;     // Custom expiry in ms
}

export const apiCache: Record<string, { data: any; expiry: number }> = {};
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const clearApiCache = () => {
  for (const key in apiCache) {
    delete apiCache[key];
  }
};

export const apiClient = async <T = any>(
  url: string, 
  options: ApiClientOptions = {}
): Promise<T> => {
  const method = options.method || 'GET';
  const isCacheable = method === 'GET' && !options.bypassCache;
  const resolvedUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

  // 1. Check Cache
  if (isCacheable && apiCache[resolvedUrl]) {
    const { data, expiry } = apiCache[resolvedUrl];
    if (Date.now() < expiry) {
      // console.log(`[Cache Hit] ${resolvedUrl}`);
      return data as T;
    }
    // Expired
    delete apiCache[resolvedUrl];
  }

  try {
    const { data, headers, bypassCache, cacheTTL, ...customConfig } = options;

    const authHeaders: Record<string, string> = {};
    const hasAuth = headers && Object.keys(headers).some(k => k.toLowerCase() === 'authorization');
    if (!hasAuth) {
      try {
        const storedUser = await AsyncStorage.getItem('edudocs');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.token) {
            authHeaders['Authorization'] = `Bearer ${parsed.token}`;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const config: RequestInit = {
      ...customConfig,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders,
        ...headers,
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    // console.log(`[API Fetch] ${method} ${resolvedUrl}`);
    const response = await fetch(resolvedUrl, config);
    const text = await response.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Not JSON
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      throw new Error('Invalid JSON response from server');
    }
    
    if (!response.ok) {
      throw new Error(json.message || `API Error: ${response.status}`);
    }

    // 2. Save to Cache if GET
    if (isCacheable) {
      apiCache[resolvedUrl] = {
        data: json,
        expiry: Date.now() + (cacheTTL || DEFAULT_CACHE_TTL),
      };
    }

    return json as T;

  } catch (error: any) {
    console.warn(`[API] ${method} ${url}:`, error.message);
    throw error;
  }
};

export const apiService = {
  get: <T = any>(url: string, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'GET' }),
  post: <T = any>(url: string, data?: any, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'POST', data }),
  put: <T = any>(url: string, data?: any, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'PUT', data }),
  delete: <T = any>(url: string, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
};

export default BASE_URL;