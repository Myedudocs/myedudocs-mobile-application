import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Image,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import {
  Flame,
  Award,
  BookOpen,
  GraduationCap,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  Video,
  Gift,
  Heart,
  Target,
  Trophy,
  ShieldCheck,
  Compass,
  X,
  ArrowUpRight,
  BookMarked,
  ClipboardList,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiService, ENDPOINTS } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { MetricsCard } from '../../components/v2/MetricsCard';
import { ToppersWidget } from '../../components/v2/ToppersWidget';
import { DashboardLoader } from '../../components/v2/DashboardLoader';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { localizeActivityText, localizeRelativeTime } from '../../i18n/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

const SectionLabel = ({ text }: { text: string }) => {
  const { isDarkMode } = useTheme();
  return (
    <Text
      style={[
        styles.sectionLabel,
        { color: isDarkMode ? '#CBD5E1' : '#64748B' },
      ]}
    >
      {text}
    </Text>
  );
};

const QuickAction = ({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
}) => {
  const { theme, isDarkMode } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.quickAction,
        {
          backgroundColor: isDarkMode ? 'rgba(20, 26, 40, 0.9)' : hexToRgba(color, 0.08),
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : hexToRgba(color, 0.18),
        },
      ]}
    >
      <View
        style={[
          styles.quickActionIconWrap,
          { backgroundColor: hexToRgba(color, isDarkMode ? 0.22 : 0.15) },
        ]}
      >
        {icon}
      </View>
      <Text
        style={[styles.quickActionLabel, { color: theme.colors.textMain }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const StudentDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { user, token } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const isHindi = currentLang.startsWith('hi');

  const { stats, courseCount, bookCount, testCount, loading, error, refresh } =
    useDashboardStats();

  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [testChooserOpen, setTestChooserOpen] = useState(false);
  const [learningPathOpen, setLearningPathOpen] = useState(false);
  const [fullActivities, setFullActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [coinAnim, setCoinAnim] = useState<number | null>(null);

  const handleViewAllActivities = useCallback(async () => {
    setActivitiesOpen(true);
    if (fullActivities.length > 0) return;
    const studentId = user?.id ?? user?._id;
    if (!studentId) return;
    try {
      setLoadingActivities(true);
      const res: any = await apiService.get(
        ENDPOINTS.GET_DASHBOARD_RECENT_ACTIVITY(studentId as string, 30)
      );
      if (res?.success) setFullActivities(res.data || []);
    } catch (_) {
      // silent
    } finally {
      setLoadingActivities(false);
    }
  }, [fullActivities.length, user]);

  const handleClaimCheckin = useCallback(async () => {
    setClaiming(true);
    try {
      const res: any = await apiService.post(ENDPOINTS.CLAIM_DAILY_CHECKIN, {});
      if (res?.success) {
        setCoinAnim(res.data?.coinsEarned || 25);
        setTimeout(() => setCoinAnim(null), 1800);
        refresh();
      }
    } catch (_) {
      // silent
    } finally {
      setClaiming(false);
    }
  }, [refresh]);

  const firstName = user?.name?.split(' ')[0] || t('sidebar.portal', { defaultValue: 'Student' });

  if (loading && !stats) {
    return (
      <View
        style={[
          styles.fullScreen,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <GlobalSafeHeader
          title={t('sidebar.dashboard', { defaultValue: 'Dashboard' })}
          showMenu
        />
        <View style={styles.loaderWrap}>
          <DashboardLoader />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.fullScreen,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <GlobalSafeHeader
          title={t('sidebar.dashboard', { defaultValue: 'Dashboard' })}
          showMenu
        />
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: theme.colors.textMain }]}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={refresh}
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.retryBtnText}>
              {t('common.retry', { defaultValue: 'Retry' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!stats) return null;

  const today = new Date().toLocaleDateString(
    isHindi ? 'hi-IN' : 'en-IN',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  const mainStats = [
    {
      label: t('courses.title', { defaultValue: 'Courses' }),
      value: courseCount,
      icon: <BookOpen size={22} color="#6366f1" />,
      color: '#6366f1',
      sub: t('dashboard.enrolledCourses', { defaultValue: 'Enrolled' }),
      onClick: () => navigation.navigate('MyCourses'),
    },
    {
      label: t('dashboard.accuracy', { defaultValue: 'Accuracy' }),
      value: `${stats.exams.averageScore}%`,
      icon: <TrendingUp size={22} color="#f59e0b" />,
      color: '#f59e0b',
      sub: t('results.title', { defaultValue: 'Results' }),
      onClick: () => navigation.navigate('ResultsList'),
    },
    {
      label: t('dashboard.hoursStudied', { defaultValue: 'Hours Studied' }),
      value: `${stats.courses.totalHours}h`,
      icon: <Clock size={22} color="#ec4899" />,
      color: '#ec4899',
      sub: t('metrics.studyHours', { defaultValue: 'Study hours' }),
    },
    {
      label: t('dashboard.streak', { defaultValue: 'Streak' }),
      value: `${stats.learningStreak.currentStreak}d`,
      icon: <Flame size={22} color="#ef4444" />,
      color: '#ef4444',
      sub: t('dashboard.days', { defaultValue: 'Days' }),
      onClick: () => navigation.navigate('StudentMetrics'),
    },
  ];

  const quickActions = [
    {
      label: t('courses.browseCourses', { defaultValue: 'Browse Courses' }),
      icon: <BookOpen size={20} color="#6366f1" />,
      color: '#6366f1',
      onPress: () => navigation.navigate('Courses'),
    },
    {
      label: t('dashboard.startTest', { defaultValue: 'Start Test' }),
      icon: <FileText size={20} color="#10b981" />,
      color: '#10b981',
      onPress: () => setTestChooserOpen(true),
    },
    {
      label: t('sidebar.liveSessions', { defaultValue: 'Live Sessions' }),
      icon: <Video size={20} color="#f59e0b" />,
      color: '#f59e0b',
      onPress: () => navigation.navigate('LiveClasses'),
    },
    {
      label: t('sidebar.results', { defaultValue: 'Results' }),
      icon: <ClipboardList size={20} color="#8b5cf6" />,
      color: '#8b5cf6',
      onPress: () => navigation.navigate('ResultsList'),
    },
    {
      label: t('sidebar.rewards', { defaultValue: 'Rewards' }),
      icon: <Gift size={20} color="#ec4899" />,
      color: '#ec4899',
      onPress: () => navigation.navigate('MainTabs', { screen: 'RewardsTab' }),
    },
    {
      label: t('sidebar.wishlist', { defaultValue: 'Wishlist' }),
      icon: <Heart size={20} color="#ef4444" />,
      color: '#ef4444',
      onPress: () => navigation.navigate('MyWishlist'),
    },
  ];

  const recent = (stats.recentActivity || []).slice(0, 5);
  const deadlines = stats.upcomingDeadlines || [];

  return (
    <View
      style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}
    >
      <GlobalSafeHeader
        title={t('sidebar.dashboard', { defaultValue: 'Dashboard' })}
        showMenu
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Welcome + streak chip */}
        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.welcomeText, { color: theme.colors.textMain }]}>
              {t('dashboard.welcome', { defaultValue: 'Welcome' })}, {firstName}!
            </Text>
            <Text style={[styles.welcomeSub, { color: theme.colors.textMuted }]}>
              {today} · {t('courses.progress', { defaultValue: 'Progress' })}:{' '}
              <Text style={{ color: '#818cf8', fontWeight: '800' }}>
                {stats.courses.completionRate}%
              </Text>
            </Text>
          </View>
          <View
            style={[
              styles.streakChip,
              {
                backgroundColor: hexToRgba('#ef4444', 0.08),
                borderColor: hexToRgba('#ef4444', 0.2),
              },
            ]}
          >
            <Flame size={12} color="#ef4444" />
            <Text style={styles.streakChipText}>
              {stats.learningStreak.currentStreak} {t('dashboard.days', { defaultValue: 'days' })}{' '}
              {t('dashboard.streak', { defaultValue: 'Streak' })}
            </Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.heroBadge,
              {
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderColor: 'rgba(255,255,255,0.3)',
              },
            ]}
          >
            <Compass size={12} color="#FFF" />
            <Text style={styles.heroBadgeText}>
              {t('dashboard.overview', { defaultValue: 'Dashboard Overview' })}
            </Text>
          </View>
          <Text style={styles.heroHeading}>
            {t('dashboard.heroHeading', {
              defaultValue: 'Master Your Future with MyEduDocs',
            })}
          </Text>
          <View style={styles.heroStreakCallout}>
            <ShieldCheck size={14} color="#FBBF24" />
            <Text style={styles.heroStreakText}>
              {stats.learningStreak.currentStreak}-day streak ·{' '}
              {stats.courses.totalHours}h studied
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setLearningPathOpen(true)}
            style={styles.heroCta}
          >
            <Text style={styles.heroCtaText}>
              {t('dashboard.viewLearningPath', {
                defaultValue: 'View Learning Path',
              })}
            </Text>
            <ArrowUpRight size={14} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.heroAvatarWrap}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.heroAvatarImage}
              />
            ) : (
              <Text style={styles.heroAvatarText}>
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </Text>
            )}
            <View style={styles.heroVerifiedBadge}>
              <ShieldCheck size={10} color="#10b981" />
            </View>
          </View>
        </View>

        {/* Stat cards grid */}
        <View style={styles.statsGrid}>
          {mainStats.map((s) => (
            <View key={s.label} style={styles.statsCol}>
              <MetricsCard
                title={s.label}
                value={s.value}
                subtitle={s.sub}
                icon={s.icon}
                color={s.color}
                onClick={s.onClick}
              />
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <SectionLabel text={t('dashboard.quickActions', { defaultValue: 'Quick Actions' }).toUpperCase()} />
        <View style={styles.quickActionsGrid}>
          {quickActions.map((q) => (
            <View key={q.label} style={styles.quickActionCol}>
              <QuickAction
                label={q.label}
                icon={q.icon}
                color={q.color}
                onPress={q.onPress}
              />
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeaderRow}>
          <SectionLabel text={t('dashboard.recentActivity', { defaultValue: 'Recent Activity' }).toUpperCase()} />
          <TouchableOpacity
            onPress={handleViewAllActivities}
            style={styles.viewAllBtn}
          >
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
              {t('common.viewAll', { defaultValue: 'View All' })}
            </Text>
            <ChevronRight size={14} color={theme.colors.primary} />
          </TouchableOpacity>
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
          {recent.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              {t('common.noData', { defaultValue: 'No recent activity yet' })}
            </Text>
          ) : (
            recent.map((a: any, i: number) => (
              <View
                key={a.id || `${a.title}-${i}`}
                style={[
                  styles.activityRow,
                  i < recent.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.activityDot,
                    { backgroundColor: '#6366f1' },
                  ]}
                >
                  <Sparkles size={12} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityTitle, { color: theme.colors.textMain }]}>
                    {localizeActivityText(a.title, isHindi)}
                  </Text>
                  <Text style={[styles.activityDesc, { color: theme.colors.textMuted }]} numberOfLines={1}>
                    {localizeActivityText(a.description, isHindi)}
                  </Text>
                </View>
                <Text style={[styles.activityTime, { color: theme.colors.textMuted }]}>
                  {localizeRelativeTime(a.relativeTime, isHindi)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Deadlines */}
        {deadlines.length > 0 ? (
          <>
            <SectionLabel text={t('dashboard.upcomingDeadlines', { defaultValue: 'Upcoming Deadlines' }).toUpperCase()} />
            <View style={styles.deadlinesRow}>
              {deadlines.slice(0, 3).map((d: any) => (
                <View
                  key={d.id}
                  style={[
                    styles.deadlineCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.priorityChip,
                      {
                        backgroundColor:
                          d.priority === 'high'
                            ? hexToRgba('#ef4444', 0.15)
                            : d.priority === 'medium'
                            ? hexToRgba('#f59e0b', 0.15)
                            : hexToRgba('#10b981', 0.15),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        {
                          color:
                            d.priority === 'high'
                              ? '#ef4444'
                              : d.priority === 'medium'
                              ? '#f59e0b'
                              : '#10b981',
                        },
                      ]}
                    >
                      {d.priority?.toUpperCase() || 'LOW'}
                    </Text>
                  </View>
                  <Text style={[styles.deadlineTitle, { color: theme.colors.textMain }]} numberOfLines={2}>
                    {d.title}
                  </Text>
                  <Text style={[styles.deadlineDate, { color: theme.colors.textMuted }]}>
                    {new Date(d.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Digital Library */}
        <View style={styles.digitalLibraryCard}>
          <View style={styles.dlRow}>
            <View style={styles.dlIconWrap}>
              <BookMarked size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dlTitle}>
                {t('dashboard.digitalLibrary', { defaultValue: 'Digital Library' })}
              </Text>
              <Text style={styles.dlSub}>
                {bookCount} {t('books.title', { defaultValue: 'books' })} · 75%{' '}
                {t('common.avgRead', { defaultValue: 'avg read' })}
              </Text>
            </View>
            <ChevronRight size={18} color="#FFF" />
          </View>
          <View style={styles.dlProgressTrack}>
            <View style={styles.dlProgressFill} />
          </View>
        </View>

        {/* Toppers widget */}
        <View style={{ marginTop: 18 }}>
          <ToppersWidget />
        </View>

        {/* Daily check-in */}
        <TouchableOpacity
          onPress={handleClaimCheckin}
          disabled={claiming}
          activeOpacity={0.85}
          style={[
            styles.checkinCard,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#FEF3C7',
              borderColor: isDarkMode ? '#334155' : '#FDE68A',
            },
          ]}
        >
          <Sparkles size={20} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.checkinTitle, { color: theme.colors.textMain }]}>
              {t('dashboard.dailyCheckIn', { defaultValue: 'Daily Check-In' })}
            </Text>
            <Text style={[styles.checkinSub, { color: theme.colors.textMuted }]}>
              {t('dashboard.checkInSub', {
                defaultValue: 'Earn coins + streak bonus',
              })}
            </Text>
          </View>
          {claiming ? (
            <ActivityIndicator color="#D97706" />
          ) : coinAnim != null ? (
            <Text style={styles.checkinCoin}>+{coinAnim} 🪙</Text>
          ) : (
            <Text style={styles.checkinCoin}>+25 🪙</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ACTIVITY TIMELINE MODAL */}
      <Modal
        visible={activitiesOpen}
        onRequestClose={() => setActivitiesOpen(false)}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: isDarkMode ? '#0F172A' : '#FFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textMain }]}>
                {t('dashboard.recentActivity', { defaultValue: 'Recent Activity' })}
              </Text>
              <TouchableOpacity onPress={() => setActivitiesOpen(false)}>
                <X size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingActivities ? (
                <View style={styles.modalLoader}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              ) : fullActivities.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  {t('common.noData', { defaultValue: 'No activity' })}
                </Text>
              ) : (
                fullActivities.map((a: any, i: number) => (
                  <View
                    key={`full-${i}`}
                    style={[
                      styles.activityRow,
                      i < fullActivities.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[styles.activityDot, { backgroundColor: '#6366f1' }]}
                    >
                      <Sparkles size={12} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activityTitle, { color: theme.colors.textMain }]}>
                        {localizeActivityText(a.title, isHindi)}
                      </Text>
                      <Text
                        style={[styles.activityDesc, { color: theme.colors.textMuted }]}
                        numberOfLines={2}
                      >
                        {localizeActivityText(a.description, isHindi)}
                      </Text>
                    </View>
                    <Text style={[styles.activityTime, { color: theme.colors.textMuted }]}>
                      {localizeRelativeTime(a.relativeTime, isHindi)}
                    </Text>
                  </View>
                ))
              )}
              <View style={{ height: 28 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* TEST CHOOSER MODAL */}
      <Modal
        visible={testChooserOpen}
        onRequestClose={() => setTestChooserOpen(false)}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setTestChooserOpen(false)}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: isDarkMode ? '#0F172A' : '#FFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textMain }]}>
                {t('dashboard.startTest', { defaultValue: 'Start Test' })}
              </Text>
              <TouchableOpacity onPress={() => setTestChooserOpen(false)}>
                <X size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.testChooserGrid}>
              <TouchableOpacity
                onPress={() => {
                  setTestChooserOpen(false);
                  navigation.navigate('MyTestSeries');
                }}
                style={[
                  styles.testChooserCard,
                  {
                    backgroundColor: hexToRgba('#6366f1', 0.08),
                    borderColor: hexToRgba('#6366f1', 0.2),
                  },
                ]}
              >
                <ClipboardList size={28} color="#6366f1" />
                <Text style={[styles.testChooserTitle, { color: theme.colors.textMain }]}>
                  {t('myTestSeries.title', { defaultValue: 'My Test Series' })}
                </Text>
                <Text style={[styles.testChooserSub, { color: theme.colors.textMuted }]}>
                  {t('dashboard.testChooserSub1', {
                    defaultValue: 'Practice tests you have enrolled in',
                  })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setTestChooserOpen(false);
                  navigation.navigate('Exams');
                }}
                style={[
                  styles.testChooserCard,
                  {
                    backgroundColor: hexToRgba('#ec4899', 0.08),
                    borderColor: hexToRgba('#ec4899', 0.2),
                  },
                ]}
              >
                <GraduationCap size={28} color="#ec4899" />
                <Text style={[styles.testChooserTitle, { color: theme.colors.textMain }]}>
                  {t('exams.title', { defaultValue: 'Course Exams' })}
                </Text>
                <Text style={[styles.testChooserSub, { color: theme.colors.textMuted }]}>
                  {t('dashboard.testChooserSub2', {
                    defaultValue: 'Live and upcoming examinations',
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* LEARNING PATH MODAL */}
      <Modal
        visible={learningPathOpen}
        onRequestClose={() => setLearningPathOpen(false)}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLearningPathOpen(false)}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: isDarkMode ? '#0F172A' : '#FFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textMain }]}>
                {t('dashboard.learningPath', { defaultValue: 'Your Learning Path' })}
              </Text>
              <TouchableOpacity onPress={() => setLearningPathOpen(false)}>
                <X size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 12 }}>
              {[
                {
                  icon: <ClipboardList size={22} color="#6366f1" />,
                  title: t('sidebar.myTestSeries', { defaultValue: 'Test Series' }),
                  sub: t('dashboard.lpTestSeries', {
                    defaultValue: 'Attempt topic-wise practice tests',
                  }),
                  color: '#6366f1',
                  onPress: () => {
                    setLearningPathOpen(false);
                    navigation.navigate('MyTestSeries');
                  },
                },
                {
                  icon: <GraduationCap size={22} color="#ec4899" />,
                  title: t('sidebar.exams', { defaultValue: 'Exams' }),
                  sub: t('dashboard.lpExams', {
                    defaultValue: 'Sit for live, scheduled examinations',
                  }),
                  color: '#ec4899',
                  onPress: () => {
                    setLearningPathOpen(false);
                    navigation.navigate('Exams');
                  },
                },
                {
                  icon: <Video size={22} color="#f59e0b" />,
                  title: t('sidebar.liveSessions', { defaultValue: 'Live Sessions' }),
                  sub: t('dashboard.lpLive', {
                    defaultValue: 'Join interactive live classes',
                  }),
                  color: '#f59e0b',
                  onPress: () => {
                    setLearningPathOpen(false);
                    navigation.navigate('LiveClasses');
                  },
                },
                {
                  icon: <Trophy size={22} color="#10b981" />,
                  title: t('sidebar.results', { defaultValue: 'Results' }),
                  sub: t('dashboard.lpResults', {
                    defaultValue: 'Review scores and analytics',
                  }),
                  color: '#10b981',
                  onPress: () => {
                    setLearningPathOpen(false);
                    navigation.navigate('ResultsList');
                  },
                },
              ].map((m) => (
                <TouchableOpacity
                  key={m.title}
                  onPress={m.onPress}
                  activeOpacity={0.85}
                  style={[
                    styles.lpRow,
                    {
                      backgroundColor: hexToRgba(m.color, 0.06),
                      borderColor: hexToRgba(m.color, 0.2),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.lpIconWrap,
                      { backgroundColor: hexToRgba(m.color, 0.18) },
                    ]}
                  >
                    {m.icon}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.lpTitle, { color: theme.colors.textMain }]}>
                      {m.title}
                    </Text>
                    <Text style={[styles.lpSub, { color: theme.colors.textMuted }]}>
                      {m.sub}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={m.color} />
                </TouchableOpacity>
              ))}
              <View style={{ height: 12 }} />
            </View>
          </View>
        </Pressable>
      </Modal>
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
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  welcomeText: { fontSize: 22, fontWeight: '800' },
  welcomeSub: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  streakChipText: { color: '#ef4444', fontWeight: '800', fontSize: 10 },

  heroCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#1e1b4b',
    position: 'relative',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroHeading: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 12,
  },
  heroStreakCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  heroStreakText: { color: '#FCD34D', fontWeight: '700', fontSize: 12 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroCtaText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  heroAvatarWrap: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  heroAvatarImage: { width: '100%', height: '100%' },
  heroAvatarText: { color: '#FFF', fontWeight: '800', fontSize: 22 },
  heroVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statsCol: { flexBasis: '48%', flexGrow: 1 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: '#6366f1', fontWeight: '800', fontSize: 12 },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  quickActionCol: { flexBasis: '31%', flexGrow: 1 },
  quickAction: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: 6,
  },
  quickActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: { fontSize: 11, fontWeight: '800', lineHeight: 14 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  activityDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: { fontWeight: '700', fontSize: 13 },
  activityDesc: { fontSize: 11, marginTop: 2 },
  activityTime: { fontSize: 10, fontWeight: '600' },
  emptyText: { textAlign: 'center', padding: 18, fontSize: 13 },

  deadlinesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  deadlineCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  priorityChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  priorityText: { fontSize: 9, fontWeight: '800' },
  deadlineTitle: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  deadlineDate: { fontSize: 10, fontWeight: '500' },

  digitalLibraryCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#4338CA',
    marginBottom: 8,
  },
  dlRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  dlIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dlTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  dlSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  dlProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dlProgressFill: { width: '75%', height: '100%', backgroundColor: '#FBBF24' },

  checkinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  checkinTitle: { fontSize: 14, fontWeight: '800' },
  checkinSub: { fontSize: 11, marginTop: 2 },
  checkinCoin: { fontWeight: '800', color: '#D97706', fontSize: 14 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalLoader: { padding: 24, alignItems: 'center' },
  testChooserGrid: { flexDirection: 'row', gap: 10 },
  testChooserCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
  },
  testChooserTitle: { fontSize: 15, fontWeight: '800', marginTop: 8 },
  testChooserSub: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  lpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  lpIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lpTitle: { fontSize: 14, fontWeight: '800' },
  lpSub: { fontSize: 12, marginTop: 2 },
});

export default StudentDashboard;