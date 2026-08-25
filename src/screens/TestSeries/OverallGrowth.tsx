import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Flame
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS, BASE_URL } from '../../service/api.service';
import { DetailsSkeleton } from '../../components/skeletons/DetailsSkeleton';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// --------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------
export const OverallGrowth = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchGrowthData = async () => {
      if (!user?.id || !user?.token) return;
      try {
        setLoading(true);

        // ─── Proactive Refresh ───
        // Trigger a backend refresh first to ensure we have the absolute latest test stats
        try {
          await fetch(ENDPOINTS.REFRESH_STUDENT_METRICS(user.id), {
            method: 'POST',
            headers: { Authorization: `Bearer ${user.token}` }
          });
          // console.log(" Metrics refreshed proactively");
        } catch (e) {
          console.warn("⚠️ Metrics refresh failed, showing cached data", e);
        }

        const res = await fetch(ENDPOINTS.GET_STUDENT_METRICS(user.id), {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const json = await res.json();
        if (json.success) {
          // Fetch actual attempts count to sync with profile and calculate real metrics
          const attemptsRes = await fetch(`${BASE_URL}/student/test-series/attempt/user/${user.id}/attempts?limit=50&page=1`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const attemptsJson = await attemptsRes.json();
          const attempts = attemptsJson?.attempts || attemptsJson?.data || [];

          let actualAttemptsCount = attemptsJson?.totalAttempts || attempts.length || 0;
          let calculatedAvg = 0;
          let calculatedBest = 0;
          let calculatedCompletion = 0;
          let calcLast30 = 0;
          let calcLast7 = 0;
          let calcStreak = 0;

          if (attempts.length > 0) {
            const scores = attempts.map((a: any) => a.percentage || 0);
            calculatedAvg = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
            calculatedBest = Math.max(...scores);
            const completed = attempts.filter((a: any) => a.status === 'completed' || a.status === 'submitted').length;
            calculatedCompletion = (completed / attempts.length) * 100;

            // --- Consistency Calcs ---
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);

            const uniqueDatesAll = new Set<string>();
            const uniqueDates30 = new Set<string>();

            attempts.forEach((a: any) => {
              const dTime = a.startTime || a.createdAt;
              if (!dTime) return;
              const aDate = new Date(dTime);
              const dateStr = aDate.toISOString().split('T')[0];
              uniqueDatesAll.add(dateStr);

              if (aDate >= thirtyDaysAgo) uniqueDates30.add(dateStr);
              if (aDate >= sevenDaysAgo) calcLast7++;
            });

            calcLast30 = uniqueDates30.size;

            let checkDate: Date | null = new Date(now);
            if (uniqueDatesAll.has(todayStr)) {
              checkDate = new Date(now);
            } else if (uniqueDatesAll.has(yesterdayStr)) {
              checkDate = new Date(yesterdayStr);
            } else {
              checkDate = null;
            }

            if (checkDate) {
              while (true) {
                const cStr = checkDate.toISOString().split('T')[0];
                if (uniqueDatesAll.has(cStr)) {
                  calcStreak++;
                  checkDate.setDate(checkDate.getDate() - 1);
                } else {
                  break;
                }
              }
            }
          }

          setData({
            ...json.data,
            testSeriesSummary: {
              ...json.data.testSeriesSummary,
              attempted: actualAttemptsCount > 0 ? actualAttemptsCount : (json.data.testSeriesSummary?.attempted || 0),
              averageScore: calculatedAvg > 0 ? calculatedAvg : (json.data.testSeriesSummary?.averageScore || 0),
              highestScore: calculatedBest > 0 ? calculatedBest : (json.data.testSeriesSummary?.highestScore || 0),
              completionRate: calculatedCompletion > 0 ? Math.round(calculatedCompletion) : (json.data.testSeriesSummary?.completionRate || 0)
            },
            activitySummary: {
              ...json.data.activitySummary,
              last30Days: calcLast30 > 0 ? calcLast30 : (json.data.activitySummary?.last30Days || 0),
              last7Days: calcLast7 > 0 ? calcLast7 : (json.data.activitySummary?.last7Days || 0),
            },
            achievementsSummary: {
              ...json.data.achievementsSummary,
              streak: {
                current: calcStreak > 0 ? calcStreak : (json.data.achievementsSummary?.streak?.current || 0)
              }
            },
            recentAttempts: attempts.slice(0, 5).reverse() // Earliest to latest for chart
          });
        }
      } catch (err) {
        console.error("Growth data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrowthData();
  }, [user]);

  if (loading) {
    return <DetailsSkeleton />;
  }

  const academic = data?.academicSummary || {};
  const testSeries = data?.testSeriesSummary || {};
  const achievements = data?.achievementsSummary || {};
  const activity = data?.activitySummary || {};

  return (
    <ScreenContainer
      header={{
        title: 'Overall Growth',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
      }}
      scroll={true}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ========================================== */}
        {/* 1. JOURNEY SNAPSHOT */}
        {/* ========================================== */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>Journey Snapshot</Text>

        <View style={styles.snapshotGrid}>
          {/* Top Row */}
          <View style={styles.snapshotRow}>
            <View style={[styles.snapshotCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.snapshotLabel, { color: theme.colors.textMuted }]}>TESTS ATTEMPTED</Text>
              <Text style={[styles.snapshotValue, { color: theme.colors.textMain }]}>{testSeries.attempted || 0}</Text>
            </View>
            <View style={[styles.snapshotCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.snapshotLabel, { color: theme.colors.textMuted }]}>COMPLETION RATE</Text>
              <Text style={[styles.snapshotValue, { color: theme.colors.textMain }]}>{testSeries.completionRate || 0}%</Text>
            </View>
          </View>
          {/* Bottom Row */}
          <View style={styles.snapshotRow}>
            <View style={[styles.snapshotCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.snapshotLabel, { color: theme.colors.textMuted }]}>AVERAGE SCORE</Text>
              <Text style={[styles.snapshotValue, { color: theme.colors.textMain }]}>{Math.round(testSeries.averageScore || 0)}%</Text>
            </View>
            <View style={[styles.snapshotCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.snapshotLabel, { color: theme.colors.textMuted }]}>BEST SCORE</Text>
              <Text style={[styles.snapshotValue, { color: theme.colors.textMain }]}>{Math.round(testSeries.highestScore || 0)}%</Text>
            </View>
          </View>
        </View>

        {/* ========================================== */}
        {/* 2. PERFORMANCE TREND CHART */}
        {/* ========================================== */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Performance Trend</Text>
            {data?.recentAttempts?.length > 1 && (
              <View style={[styles.trendBadge, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' }]}>
                <TrendingUp color="#10B981" size={12} strokeWidth={3} />
                <Text style={styles.trendBadgeText}>
                  {Math.round((data.recentAttempts[data.recentAttempts.length - 1].percentage || 0) - (data.recentAttempts[0].percentage || 0))}%
                </Text>
              </View>
            )}
          </View>

          {/* Custom Bar Chart */}
          <View style={styles.chartContainer}>
            {data?.recentAttempts && data.recentAttempts.length > 0 ? (
              data.recentAttempts.map((attempt: any, index: number) => {
                const isActive = index === data.recentAttempts.length - 1;
                const score = Math.round(attempt.percentage || 0);
                const barHeight: any = `${Math.max(10, score)}%`;
                return (
                  <View key={attempt.id || index} style={styles.barColumn}>
                    <Text style={isActive ? styles.barTopLabelActive : [styles.barTopLabel, { color: theme.colors.textSecondary }]}>{score}</Text>
                    <View style={[isActive ? styles.barFillActive : [styles.barFill, { backgroundColor: isDarkMode ? '#334155' : '#E0E7FF' }], { height: barHeight }]} />
                    <Text style={isActive ? styles.barBottomLabelActive : [styles.barBottomLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                      {isActive ? 'LATEST' : `T-${index + 1}`}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={{ color: theme.colors.textMuted, textAlign: 'center', flex: 1, alignSelf: 'center' }}>No recent attempts to show.</Text>
            )}
          </View>

          {data?.recentAttempts?.length > 1 && (
            <Text style={[styles.chartFooterText, { color: theme.colors.textSecondary }]}>
              Comparison based on your last {data.recentAttempts.length} tests.
            </Text>
          )}
        </View>

        {/* ========================================== */}
        {/* 3. STRENGTH VS WEAKNESS */}
        {/* ========================================== */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textMain, marginBottom: 20 }]}>Recent Focus Areas</Text>

          {data?.recentAttempts && data.recentAttempts.length > 0 ? (
            data.recentAttempts.slice().reverse().slice(0, 3).map((attempt: any, index: number) => {
              const score = Math.round(attempt.percentage || 0);
              const isWarning = score < 50;
              return (
                <View key={index} style={isWarning ? [styles.warningBox, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2' }] : styles.progressItem}>
                  <View style={styles.progressLabelRow}>
                    <Text style={[styles.topicText, { color: theme.colors.textMain }]} numberOfLines={1}>{attempt.testTitle || `Test ${index + 1}`}</Text>
                    <Text style={isWarning ? styles.topicValueWarning : styles.topicValueActive}>
                      {isWarning ? `! ${score}%` : `${score}%`}
                    </Text>
                  </View>
                  <View style={isWarning ? [styles.progressBarTrackWarning, { backgroundColor: isDarkMode ? '#334155' : '#FECACA' }] : [styles.progressBarTrack, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                    <View style={[isWarning ? styles.progressBarFillWarning : styles.progressBarFill, { width: `${score}%` }]} />
                  </View>
                  {isWarning && (
                    <Text style={[styles.warningDesc, { color: isDarkMode ? '#F87171' : '#DC2626' }]}>
                      Needs focus based on recent performance.
                    </Text>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>No test data available for analysis.</Text>
          )}
        </View>

        {/* ========================================== */}
        {/* 4. CONSISTENCY TRACKER */}
        {/* ========================================== */}
        <View style={styles.consistencyCard}>
          <Text style={styles.consistencyTitle}>Consistency Tracker</Text>

          <View style={styles.consistencyGrid}>
            <View style={styles.consistencyItem}>
              <Calendar color="#FFFFFF" size={24} style={{ marginBottom: 8 }} />
              <Text style={styles.consistencyValue}>{activity.last30Days || 0}</Text>
              <Text style={styles.consistencyLabel}>DAYS ACTIVE</Text>
            </View>

            <View style={styles.consistencyItem}>
              <CheckCircle2 color="#FFFFFF" size={24} style={{ marginBottom: 8 }} />
              <Text style={styles.consistencyValue}>{(activity.last7Days / 7).toFixed(1)}</Text>
              <Text style={styles.consistencyLabel}>AVG SESSIONS</Text>
            </View>

            <View style={styles.consistencyItem}>
              <Flame color="#FFFFFF" size={24} style={{ marginBottom: 8 }} />
              <Text style={styles.consistencyValue}>{achievements.streak?.current || 0}</Text>
              <Text style={styles.consistencyLabel}>DAY STREAK</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  headerIcon: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 16,
  },

  // 1. Snapshot Grid
  snapshotGrid: { gap: 12, marginBottom: 24 },
  snapshotRow: { flexDirection: 'row', gap: 12 },
  snapshotCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  snapshotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  snapshotValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Generic Card Style
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },

  // 2. Trend Chart
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7', // Light green bg
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160, // Fixed height for chart area
    marginBottom: 20,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopLabel: { fontSize: 10, color: '#64748B', marginBottom: 6, fontWeight: '600' },
  barTopLabelActive: { fontSize: 10, color: '#6366F6', marginBottom: 6, fontWeight: '700' },
  barFill: {
    width: '65%',
    backgroundColor: '#E0E7FF', // Light blue
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barFillActive: {
    width: '65%',
    backgroundColor: '#6366F6', // Solid brand blue
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barBottomLabel: { fontSize: 10, color: '#94A3B8', marginTop: 8, fontWeight: '600' },
  barBottomLabelActive: { fontSize: 10, color: '#6366F6', marginTop: 8, fontWeight: '800' },
  chartFooterText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },

  // 3. Strength vs Weakness
  progressItem: {
    marginBottom: 20,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  topicValueActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F6',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366F6',
    borderRadius: 3,
  },

  // Warning State (Topic 3)
  warningBox: {
    backgroundColor: '#FEF2F2', // Very faint red background
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  topicValueWarning: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
  progressBarTrackWarning: {
    height: 6,
    backgroundColor: '#FECACA',
    borderRadius: 3,
  },
  progressBarFillWarning: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 3,
  },
  warningDesc: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 8,
    fontWeight: '500',
  },

  // 4. Consistency Tracker
  consistencyCard: {
    backgroundColor: '#6366F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#6366F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  consistencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  consistencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consistencyItem: {
    alignItems: 'center',
    flex: 1,
  },
  consistencyValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  consistencyLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
});