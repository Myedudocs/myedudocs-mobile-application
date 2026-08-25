import { useAuth } from '../context/AuthContext';
import { useApiQuery } from './useApiQuery';
import { ENDPOINTS, BASE_URL } from '../service/api.service';

export interface ExamAttempt {
  _id: string;
  id?: string;
  testSeriesId: string;
  testSeriesName?: string;
  testTitle?: string;
  examName?: string;
  score: number;
  totalScore: number;
  totalMarks?: number;
  percentage: number;
  accuracy: number;
  status: 'passed' | 'failed' | 'completed' | 'ongoing' | 'in-progress';
  submittedAt: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  rank?: number;
  grade?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  subjects?: Array<{ name: string; score: number; accuracy: number }>;
}

export interface ResultsStats {
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalTimeSpent: number;
  passedTests: number;
  failedTests: number;
}

export const useExamResults = (page = 1, limit = 20) => {
  const { user } = useAuth();
  const id = user?.id || user?._id;
  const url = id ? ENDPOINTS.GET_STUDENT_ATTEMPTS(id, page, limit) : null;

  const result = useApiQuery<any>(url, { skip: !id });

  // Extract attempts from backend response structure:
  // Backend returns: { success: true, attempts: [...], totalAttempts: N, totalPages: N }
  const rawList: any[] = Array.isArray(result.data?.attempts)
    ? result.data.attempts
    : Array.isArray(result.data?.data)
    ? result.data.data
    : Array.isArray(result.data?.results)
    ? result.data.results
    : Array.isArray(result.data)
    ? result.data
    : [];

  const normalized: ExamAttempt[] = rawList.map((item: any) => {
    const rawScore = Number(item.score ?? item.totalScore ?? 0);
    const rawTotal = Number(item.totalMarks ?? item.maxScore ?? 100);
    const pct = item.percentage !== undefined
      ? Math.round(Number(item.percentage))
      : rawTotal > 0
      ? Math.round((rawScore / rawTotal) * 100)
      : 0;

    const acc = item.accuracy !== undefined
      ? Math.round(Number(item.accuracy))
      : pct;

    const isPassed = item.status === 'passed' || pct >= 40;

    let gradeCalc: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
    if (pct >= 90) gradeCalc = 'A+';
    else if (pct >= 80) gradeCalc = 'A';
    else if (pct >= 60) gradeCalc = 'B';
    else if (pct >= 45) gradeCalc = 'C';
    else if (pct >= 33) gradeCalc = 'D';
    else gradeCalc = 'F';

    return {
      _id: String(item._id || item.id || item.attemptId || `att-${Date.now()}`),
      id: String(item.id || item._id || item.attemptId || `att-${Date.now()}`),
      testSeriesId: String(item.testSeriesId || item.testId || item.testSeries?._id || item.testSeries?.id || ''),
      testSeriesName: item.testSeriesName || item.testTitle || item.testSeries?.title || item.title || 'UPSC GS Mock Test',
      examName: item.examName || item.testTitle || item.testSeries?.title || 'Civil Services Examination',
      score: rawScore,
      totalScore: rawTotal,
      totalMarks: rawTotal,
      percentage: pct,
      accuracy: acc,
      status: isPassed ? 'passed' : 'failed',
      submittedAt: item.submittedAt || item.endTime || item.createdAt || new Date().toISOString(),
      startTime: item.startTime,
      endTime: item.endTime,
      duration: item.duration || Math.round((new Date(item.endTime || 0).getTime() - new Date(item.startTime || 0).getTime()) / 60000) || 45,
      rank: item.rank || 1,
      grade: item.grade || gradeCalc,
    };
  });

  return {
    results: normalized,
    total: result.data?.totalAttempts || result.data?.total || normalized.length,
    loading: result.loading,
    refreshing: result.refreshing,
    error: result.error,
    refresh: result.refresh,
  };
};

export default useExamResults;