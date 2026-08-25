import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Trophy,
  Flame,
  Target,
  Clock,
  Trophy as TrophyIcon,
  BookOpen,
  ClipboardList,
  CheckCircle,
  ChevronRight,
  RefreshCcw,
  Rocket,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiService, ENDPOINTS } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { MetricsCard } from '../../components/v2/MetricsCard';
import { ProgressRing } from '../../components/v2/ProgressRing';
import { DashboardLoader } from '../../components/v2/DashboardLoader';

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const value =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((c) => c + c)
          .join('')
      : sanitized;
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface MetricsData {
  academic: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    totalExamsTaken: number;
    examsPassed: number;
    examsFailed: number;
    passRate: number;
    gradeDistribution: { A: number; B: number; C: number; D: number; F: number };
    improvementRate: number;
    totalStudyTime: number;
  };
  courses: {
    totalEnrolled: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    averageProgress: number;
  };
  testSeries: {
    totalPurchased: number;
    attempted: number;
    averageScore: number;
    accuracyRate: number;
    questionsAnswered: number;
  };
  books: {
    totalPurchased: number;
    readBooks: number;
    readingProgress: number;
  };
  achievements: {
    totalPoints: number;
    rank: number;
    totalStudents?: number;
    percentile?: number;
    level: number;
    streak: { current: number; longest: number };
  };
  activity: {
    activitiesLast30Days: number;
    weeklyTrend: string;
    preferredStudyTime: string;
  };
  monthlyProgress: Array<{
    month: string;
    totalActivities: number;
    averageScore: number;
  }>;
  recentActivity: Array<any>;
}

export const StudentMetricsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const fetchMetrics = useCallback(async () => {
    const studentId = user?.id ?? user?._id;
    if (!studentId) return;
    try {
      setLoading(true);
      const res: any = await apiService.get(
        ENDPOINTS.GET_STUDENT_METRICS_V2(studentId as string)
      );
      if (res?.success) setMetrics(res.data);
      else setError(t('common.loadError', { defaultValue: 'Failed to fetch metrics' }));
    } catch (e: any) {
      setError(t('common.loadError', { defaultValue: 'Failed to load metrics data' }));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  const refreshMetrics = useCallback(async () => {
    const studentId = user?.id ?? user?._id;
    if (!studentId) return;
    setRefreshing(true);
    try {
      await apiService.post(
        ENDPOINTS.REFRESH_STUDENT_METRICS(studentId as string),
        {}
      );
      await fetchMetrics();
    } catch (e) {
      // silent
    } finally {
      setRefreshing(false);
    }
  }, [user, fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading || (!metrics && !error)) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
        <GlobalSafeHeader
          title={t('metrics.title', { defaultValue: 'My Metrics' })}
          showBack
          showMenu
        />
        <View style={styles.loaderWrap}>
          <DashboardLoader />
        </View>
      </View>
    );
  }

  if (error || !metrics) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
        <GlobalSafeHeader
          title={t('metrics.title', { defaultValue: 'My Metrics' })}
          showBack
          showMenu
        />
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: theme.colors.textMain }]}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchMetrics}
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.retryBtnText}>{t('common.retry', { defaultValue: 'Retry' })}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const rank = metrics.achievements?.rank;
  const totalStudents = metrics.achievements?.totalStudents;
  const topPercent =
    rank && totalStudents
      ? `${Math.max(1, Math.round((rank / totalStudents) * 100))}%`
      : '—';
  const improvement = metrics.academic?.improvementRate;
  const streakCurrent = metrics.achievements?.streak?.current ?? 0;
  const streakLongest = metrics.achievements?.streak?.longest ?? 0;
  const totalStudyTime = metrics.academic?.totalStudyTime ?? 0;
  const averageScore = metrics.academic?.averageScore ?? 0;

  const topStats = [
    {
      title: t('metrics.globalRank', { defaultValue: 'Global Rank' }),
      value: rank ? `#${rank}` : '—',
      subtitle:
        rank && totalStudents
          ? t('metrics.topStudents', {
              percent: topPercent,
              total: totalStudents,
              defaultValue: `Top ${topPercent} of ${totalStudents}`,
            })
          : t('metrics.earnPointsHint', { defaultValue: 'Earn points to rank' }),
      icon: <Trophy size={22} color={theme.colors.primary} />,
      color: theme.colors.primary,
      trend: rank ? 'up' : 'stable',
      trendValue: t('metrics.ofStudents', {
        total: totalStudents ?? '—',
        defaultValue: `of ${totalStudents ?? '—'}`,
      }),
    },
    {
      title: t('metrics.currentStreak', { defaultValue: 'Current Streak' }),
      value: `${streakCurrent}${t('dashboard.days', { defaultValue: 'd' })}`,
      subtitle: t('metrics.bestStreak', {
        count: streakLongest,
        defaultValue: `Best: ${streakLongest} days`,
      }),
      icon: <Flame size={22} color="#f59e0b" />,
      color: '#f59e0b',
      trend: streakCurrent > 0 ? 'up' : 'stable',
      trendValue:
        streakCurrent > 0
          ? t('metrics.keepItUp', { defaultValue: 'Keep it up!' })
          : t('metrics.startToday', { defaultValue: 'Start today' }),
    },
    {
      title: t('metrics.masteryScore', { defaultValue: 'Mastery Score' }),
      value: `${averageScore}%`,
      subtitle: t('metrics.acrossAllSubjects', {
        defaultValue: 'Across all subjects',
      }),
      icon: <Target size={22} color="#ec4899" />,
      color: '#ec4899',
      trend:
        typeof improvement === 'number'
          ? improvement >= 0
            ? 'up'
            : 'down'
          : 'stable',
      trendValue:
        typeof improvement === 'number'
          ? `${improvement > 0 ? '+' : ''}${improvement}%`
          : '—',
    },
    {
      title: t('metrics.learningHours', { defaultValue: 'Learning Hours' }),
      value: `${totalStudyTime}h`,
      subtitle: t('metrics.totalFocusTime', { defaultValue: 'Total focus time' }),
      icon: <Clock size={22} color="#10b981" />,
      color: '#10b981',
      trend: totalStudyTime > 0 ? 'up' : 'stable',
      trendValue:
        totalStudyTime > 0
          ? t('metrics.logged', { defaultValue: 'Logged' })
          : t('metrics.startNow', { defaultValue: 'Start now' }),
    },
  ];

  const monthly = metrics.monthlyProgress || [];
  const maxScore = Math.max(80, ...monthly.map((m) => m.averageScore || 0));
  const maxActivities = Math.max(20, ...monthly.map((m) => m.totalActivities || 0));
  const hasMonthlyData = monthly.some(
    (m) => (m.averageScore ?? 0) > 0 || (m.totalActivities ?? 0) > 0
  );

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
      <GlobalSafeHeader
        title={t('metrics.title', { defaultValue: 'My Metrics' })}
        showBack
        showMenu
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshMetrics}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.eyebrow, { color: theme.colors.primary }]}
            >
              {t('metrics.myPerformance', { defaultValue: 'MY PERFORMANCE' })}
            </Text>
            <Text style={[styles.title, { color: theme.colors.textMain }]}>
              {t('metrics.title', { defaultValue: 'My Metrics' })}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {t('metrics.subtitle', {
                defaultValue: 'Detailed analytics of your learning journey',
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={refreshMetrics}
              disabled={refreshing}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                  opacity: refreshing ? 0.6 : 1,
                },
              ]}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <RefreshCcw size={16} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Leaderboard')}
              style={[styles.leaderboardBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Trophy size={14} color="#FFF" />
              <Text style={styles.leaderboardBtnText}>
                {t('metrics.globalLeaderboard', { defaultValue: 'Leaderboard' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Highlight cards */}
        <View style={styles.statsGrid}>
          {topStats.map((s, i) => (
            <View key={i} style={styles.statsCol}>
              <MetricsCard
                title={s.title}
                value={s.value}
                subtitle={s.subtitle}
                icon={s.icon}
                color={s.color}
                trend={s.trend as 'up' | 'down' | 'stable'}
                trendValue={s.trendValue}
              />
            </View>
          ))}
        </View>

        {/* Growth Trajectory */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>
                {t('metrics.growthTrajectory', { defaultValue: 'Growth Trajectory' })}
              </Text>
              <Text style={[styles.cardSub, { color: theme.colors.textMuted }]}>
                {t('metrics.growthSubtitle', {
                  defaultValue: 'Your monthly performance trend',
                })}
              </Text>
            </View>
            <View
              style={[
                styles.tabGroup,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                },
              ]}
            >
              {([0, 1] as const).map((idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveTab(idx)}
                  style={[
                    styles.tabBtn,
                    activeTab === idx && {
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === idx
                            ? '#FFF'
                            : isDarkMode
                            ? '#94A3B8'
                            : '#64748B',
                      },
                    ]}
                  >
                    {idx === 0
                      ? t('metrics.performanceTab', { defaultValue: 'Performance' })
                      : t('metrics.activityTab', { defaultValue: 'Activity' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {hasMonthlyData ? (
            <View style={styles.chartWrap}>
              {/* Simple SVG-like bars (no extra chart dep) */}
              <View style={styles.bars}>
                {monthly.map((m, i) => {
                  const value =
                    activeTab === 0
                      ? m.averageScore || 0
                      : m.totalActivities || 0;
                  const max = activeTab === 0 ? maxScore : maxActivities;
                  const h = Math.max(2, (value / Math.max(1, max)) * 140);
                  return (
                    <View key={i} style={styles.barCol}>
                      <Text
                        style={[
                          styles.barValue,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {value}
                      </Text>
                      <View
                        style={[
                          styles.barTrack,
                          { backgroundColor: hexToRgba(theme.colors.primary, 0.12) },
                        ]}
                      >
                        <View
                          style={[
                            styles.barFill,
                            {
                              backgroundColor: theme.colors.primary,
                              height: h,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: theme.colors.textMuted }]}>
                        {m.month}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <View
                style={[
                  styles.emptyChartIcon,
                  { backgroundColor: hexToRgba(theme.colors.primary, 0.12) },
                ]}
              >
                <TrendingUp size={28} color={theme.colors.primary} />
              </View>
              <Text style={[styles.emptyChartTitle, { color: theme.colors.textMain }]}>
                {t('metrics.noActivity', { defaultValue: 'No activity yet' })}
              </Text>
              <Text style={[styles.emptyChartDesc, { color: theme.colors.textMuted }]}>
                {t('metrics.noActivityDesc', {
                  defaultValue: 'Take a test to see your stats here',
                })}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Exams')}
                style={[styles.takeTestBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Rocket size={14} color="#FFF" />
                <Text style={styles.takeTestBtnText}>
                  {t('metrics.takeATest', { defaultValue: 'Take a Test' })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Course completion + Test breakdown */}
        <View style={styles.twoCol}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>
              {t('metrics.courseCompletion', { defaultValue: 'Course Completion' })}
            </Text>
            <View style={styles.ringCenter}>
              <ProgressRing
                value={metrics.courses?.completionRate || 0}
                size={140}
                strokeWidth={10}
                color={theme.colors.primary}
                label={t('metrics.done', { defaultValue: 'Done' })}
              />
            </View>
            <View style={styles.rowList}>
              <RowItem
                label={t('metrics.completedCourses', {
                  defaultValue: 'Completed',
                })}
                value={metrics.courses?.completed ?? 0}
                color="#10b981"
              />
              <RowItem
                label={t('courses.inProgress', { defaultValue: 'In progress' })}
                value={metrics.courses?.inProgress ?? 0}
                color="#f59e0b"
              />
              <RowItem
                label={t('metrics.totalEnrolled', {
                  defaultValue: 'Total enrolled',
                })}
                value={metrics.courses?.totalEnrolled ?? 0}
                color="#6366f1"
              />
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>
              {t('metrics.testSeriesBreakdown', {
                defaultValue: 'Test Series Breakdown',
              })}
            </Text>
            <View style={styles.dualPill}>
              <Pill
                label={t('metrics.accuracy', { defaultValue: 'Accuracy' })}
                value={`${metrics.testSeries?.accuracyRate ?? 0}%`}
                color="#10b981"
              />
              <Pill
                label={t('metrics.avgScore', { defaultValue: 'Avg Score' })}
                value={`${metrics.testSeries?.averageScore ?? 0}%`}
                color="#6366f1"
              />
            </View>
            <View style={{ marginTop: 14 }}>
              <Bar
                label={t('metrics.questionsAnswered', {
                  defaultValue: 'Questions Answered',
                })}
                value={metrics.testSeries?.questionsAnswered ?? 0}
                color="#6366f1"
                isDarkMode={isDarkMode}
              />
              <Bar
                label={t('metrics.testsAttempted', {
                  defaultValue: 'Tests Attempted',
                })}
                value={metrics.testSeries?.attempted ?? 0}
                max={Math.max(1, metrics.testSeries?.totalPurchased ?? 1)}
                color="#10b981"
                isDarkMode={isDarkMode}
              />
            </View>
          </View>
        </View>

        {/* Academic Highlights */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>
            {t('metrics.academicHighlights', {
              defaultValue: 'Academic Highlights',
            })}
          </Text>
          <HighlightRow
            label={t('metrics.examsPassed', { defaultValue: 'Exams Passed' })}
            value={`${metrics.academic?.examsPassed ?? 0}${
              metrics.academic?.totalExamsTaken
                ? ` / ${metrics.academic.totalExamsTaken}`
                : ''
            }`}
            icon={<CheckCircle size={20} color="#10b981" />}
            bgColor={hexToRgba('#10b981', 0.12)}
          />
          <HighlightRow
            label={t('metrics.averagePerformance', {
              defaultValue: 'Average Performance',
            })}
            value={`${averageScore}%`}
            icon={<BookOpen size={20} color="#6366f1" />}
            bgColor={hexToRgba('#6366f1', 0.12)}
          />
          <HighlightRow
            label={t('metrics.highestAchievement', {
              defaultValue: 'Highest Achievement',
            })}
            value={`${metrics.academic?.highestScore ?? 0}%`}
            icon={<TrophyIcon size={20} color="#f59e0b" />}
            bgColor={hexToRgba('#f59e0b', 0.12)}
          />
          <HighlightRow
            label={t('metrics.totalLearningAssets', {
              defaultValue: 'Total Learning Assets',
            })}
            value={`${(metrics.courses?.totalEnrolled ?? 0) +
              (metrics.books?.totalPurchased ?? 0)}`}
            icon={<ClipboardList size={20} color="#ec4899" />}
            bgColor={hexToRgba('#ec4899', 0.12)}
            last
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('ResultsList')}
            style={[
              styles.viewResultsBtn,
              {
                backgroundColor: hexToRgba(theme.colors.primary, 0.08),
                borderColor: hexToRgba(theme.colors.primary, 0.2),
              },
            ]}
          >
            <Text style={[styles.viewResultsText, { color: theme.colors.primary }]}>
              {t('metrics.viewDetailedResults', {
                defaultValue: 'View Detailed Results',
              })}
            </Text>
            <ChevronRight size={14} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const RowItem = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => {
  const { theme, isDarkMode } = useTheme();
  return (
    <View style={styles.rowItem}>
      <View style={[styles.rowDot, { backgroundColor: color }]} />
      <Text style={[styles.rowLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: theme.colors.textMain }]}>
        {value}
      </Text>
    </View>
  );
};

const Pill = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <View
    style={[
      styles.pill,
      {
        backgroundColor: hexToRgba(color, 0.1),
        borderColor: hexToRgba(color, 0.2),
      },
    ]}
  >
    <Text style={[styles.pillLabel, { color }]}>{label}</Text>
    <Text style={[styles.pillValue, { color }]}>{value}</Text>
  </View>
);

const Bar = ({
  label,
  value,
  color,
  max,
  isDarkMode,
}: {
  label: string;
  value: number;
  color: string;
  max?: number;
  isDarkMode: boolean;
}) => {
  const { theme } = useTheme();
  const target = max || Math.max(1, value);
  const pct = Math.min(100, (value / target) * 100);
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.barLabelRow}>
        <Text style={[styles.barLabelText, { color: theme.colors.textMain }]}>
          {label}
        </Text>
        <Text style={[styles.barLabelValue, { color: theme.colors.textMain }]}>
          {value}
        </Text>
      </View>
      <View
        style={[
          styles.barTrack2,
          { backgroundColor: hexToRgba(color, 0.12) },
        ]}
      >
        <View
          style={[
            styles.barFill2,
            {
              backgroundColor: color,
              width: `${pct}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

const HighlightRow = ({
  label,
  value,
  icon,
  bgColor,
  last,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  last?: boolean;
}) => {
  const { theme, isDarkMode } = useTheme();
  return (
    <View
      style={[
        styles.highlightRow,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? '#1E293B' : '#F1F5F9',
        },
      ]}
    >
      <View style={[styles.highlightIconWrap, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <Text style={[styles.highlightLabel, { color: theme.colors.textMain }]}>
        {label}
      </Text>
      <Text style={[styles.highlightValue, { color: theme.colors.textMain }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 6 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#FFF', fontWeight: '800' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  headerActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  leaderboardBtnText: { color: '#FFF', fontWeight: '800', fontSize: 11 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statsCol: { flexBasis: '48%', flexGrow: 1 },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardSub: { fontSize: 12, marginTop: 2 },

  tabGroup: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tabText: { fontSize: 11, fontWeight: '800' },

  chartWrap: { marginTop: 4 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 180,
  },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 10, fontWeight: '800', marginBottom: 4 },
  barTrack: {
    width: '70%',
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, marginTop: 6, fontWeight: '700' },

  emptyChart: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyChartIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyChartTitle: { fontSize: 15, fontWeight: '800' },
  emptyChartDesc: { fontSize: 12, textAlign: 'center', maxWidth: 280 },
  takeTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  takeTestBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

  twoCol: { gap: 0 },
  ringCenter: { alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
  rowList: { gap: 8, marginTop: 6 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowDot: { width: 8, height: 8, borderRadius: 4 },
  rowLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  rowValue: { fontSize: 14, fontWeight: '800' },

  dualPill: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  pillLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  pillValue: { fontSize: 22, fontWeight: '900', marginTop: 6 },

  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabelText: { fontSize: 12, fontWeight: '700' },
  barLabelValue: { fontSize: 12, fontWeight: '800' },
  barTrack2: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill2: { height: '100%', borderRadius: 4 },

  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  highlightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: { flex: 1, fontSize: 13, fontWeight: '700' },
  highlightValue: { fontSize: 14, fontWeight: '900' },

  viewResultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  viewResultsText: { fontSize: 13, fontWeight: '800' },
});

export default StudentMetricsScreen;