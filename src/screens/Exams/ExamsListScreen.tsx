import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  GraduationCap,
  Clock,
  Calendar,
  Radio,
  PlayCircle,
  Search,
  X,
  Trophy,
  Star,
  Flame,
  ChevronRight,
  Sparkles,
  BookOpen,
  History,
  CheckCircle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useStudentExams, StudentExam, getExamStatus } from '../../hooks/useStudentExams';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { DashboardLoader } from '../../components/v2/DashboardLoader';
import { EmptyState } from '../../components/v2/EmptyState';

const { width } = Dimensions.get('window');

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const value =
    sanitized.length === 3
      ? sanitized.split('').map((c) => c + c).join('')
      : sanitized;
  const r = parseInt(value.substring(0, 2), 16) || 0;
  const g = parseInt(value.substring(2, 4), 16) || 0;
  const b = parseInt(value.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const ExamsListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { exams, loading, refreshing, refresh, stats } = useStudentExams();

  const ongoingCount = stats.ongoing;

  // Filtered exams
  const filteredExams = useMemo(() => {
    let result = [...exams];

    if (activeTab === 'live') {
      result = result.filter(
        (e) => getExamStatus(e.scheduledAt, e.durationMinutes) === 'Ongoing'
      );
    } else if (activeTab === 'upcoming') {
      result = result.filter(
        (e) => getExamStatus(e.scheduledAt, e.durationMinutes) === 'Upcoming'
      );
    } else if (activeTab === 'expired') {
      result = result.filter(
        (e) => getExamStatus(e.scheduledAt, e.durationMinutes) === 'Expired'
      );
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.subject || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [exams, activeTab, searchQuery]);

  const getDifficultyColor = (diff?: string) => {
    const d = (diff || 'medium').toLowerCase();
    if (d === 'hard') return '#EF4444';
    if (d === 'easy') return '#10B981';
    return '#F59E0B';
  };

  if (loading && !refreshing && exams.length === 0) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
        <GlobalSafeHeader
          title={t('exams.title', { defaultValue: 'My Exams' })}
          subtitle="Live, upcoming & scheduled examinations"
          showBack
          showMenu
        />
        <View style={styles.loaderWrap}>
          <DashboardLoader />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
      <GlobalSafeHeader
        title={t('exams.title', { defaultValue: 'My Exams' })}
        subtitle="Live, upcoming & scheduled examinations"
        showBack
        showMenu
        showSearch
        showThemeToggle
        showNotifications
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Live Active Exams Hero Banner (if any ongoing exams) */}
        {ongoingCount > 0 && (
          <View style={styles.liveBanner}>
            <View style={styles.liveBannerLeft}>
              <View style={styles.liveIconBox}>
                <Radio size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.liveBannerTitle}>
                  {ongoingCount === 1 ? '1 Live Exam Active Now' : `${ongoingCount} Live Exams Active Now`}
                </Text>
                <Text style={styles.liveBannerSub}>
                  Complete and submit your exam before the countdown timer expires.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('live')}
              style={styles.viewLiveBtn}
            >
              <Text style={styles.viewLiveBtnText}>Enter Live Room</Text>
              <PlayCircle size={14} color="#065F46" />
            </TouchableOpacity>
          </View>
        )}

        {/* Top Horizontal Stats Bar (Matching Web v2) */}
        <View
          style={[
            styles.statsPaper,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
            {[
              { label: 'All Scheduled', value: stats.total, color: '#6366F1' },
              { label: 'Live Active', value: ongoingCount, color: '#10B981' },
              { label: 'Upcoming', value: stats.upcoming, color: '#F59E0B' },
              { label: 'Completed', value: stats.expired, color: '#94A3B8' },
            ].map((st, i) => (
              <View key={i} style={styles.statCol}>
                <View style={[styles.statDot, { backgroundColor: st.color }]} />
                <View>
                  <Text style={[styles.statNumber, { color: theme.colors.textMain }]}>
                    {st.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                    {st.label}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Search size={16} color={theme.colors.textMuted} />
            <TextInput
              placeholder="Search exams by title or subject..."
              placeholderTextColor={theme.colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.colors.textMain }]}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Segmented Status Tabs (Web Parity) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {[
              { id: 'all', label: 'All Exams', count: stats.total },
              { id: 'live', label: 'Live Active', count: ongoingCount, pulse: true },
              { id: 'upcoming', label: 'Upcoming', count: stats.upcoming },
              { id: 'expired', label: 'Completed', count: stats.expired },
            ].map((tb) => {
              const isSelected = activeTab === tb.id;
              return (
                <TouchableOpacity
                  key={tb.id}
                  activeOpacity={0.85}
                  onPress={() => setActiveTab(tb.id as any)}
                  style={[
                    styles.tabPill,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  {tb.pulse && tb.count > 0 && (
                    <View style={styles.livePulseDot} />
                  )}
                  <Text
                    style={[
                      styles.tabPillText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isDarkMode
                          ? '#CBD5E1'
                          : '#475569',
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {tb.label}
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(255, 255, 255, 0.25)'
                          : isDarkMode
                          ? '#334155'
                          : '#EEF2FF',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countBadgeText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : theme.colors.primary,
                        },
                      ]}
                    >
                      {tb.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Exams Cards Grid */}
        {filteredExams.length === 0 ? (
          <EmptyState
            type="no-exams"
            title="No Scheduled Exams"
            description="You don't have any exams in this section right now. Explore test series to enroll in new mock tests."
            actionLabel="Explore Test Series"
            onAction={() => navigation.navigate('MainTabs', { screen: 'TestSeriesTab' })}
            style={styles.emptyContainer}
          />
        ) : (
          <View style={styles.cardsList}>
            {filteredExams.map((exam) => {
              const status = getExamStatus(exam.scheduledAt, exam.durationMinutes);
              const isLive = status === 'Ongoing';
              const isExpired = status === 'Expired';
              const diffColor = getDifficultyColor(exam.difficulty);

              const formattedDate = exam.scheduledAt
                ? new Date(exam.scheduledAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Flexible Schedule';

              return (
                <View
                  key={exam._id}
                  style={[
                    styles.examCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: isLive ? '#10B981' : theme.colors.border,
                      borderWidth: isLive ? 1.8 : 1,
                    },
                  ]}
                >
                  {/* Top Live Bar indicator */}
                  {isLive && <View style={styles.liveTopIndicator} />}

                  {/* Header: Status + Difficulty */}
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: isLive
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isExpired
                            ? 'rgba(100, 116, 139, 0.12)'
                            : 'rgba(245, 158, 11, 0.15)',
                        },
                      ]}
                    >
                      {isLive && <View style={styles.blinkingLiveDot} />}
                      <Text
                        style={[
                          styles.statusChipText,
                          {
                            color: isLive
                              ? '#10B981'
                              : isExpired
                              ? '#64748B'
                              : '#F59E0B',
                          },
                        ]}
                      >
                        {status.toUpperCase()}
                      </Text>
                    </View>

                    {exam.difficulty && (
                      <Text
                        style={[
                          styles.difficultyTag,
                          { color: diffColor },
                        ]}
                      >
                        {exam.difficulty.toUpperCase()}
                      </Text>
                    )}
                  </View>

                  {/* Exam Title & Subject */}
                  <Text
                    style={[styles.cardTitle, { color: theme.colors.textMain }]}
                    numberOfLines={2}
                  >
                    {exam.title}
                  </Text>
                  <Text
                    style={[styles.cardSubject, { color: theme.colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {exam.subject || 'Comprehensive Test'}
                  </Text>

                  {/* 3 Metrics: Duration, Marks, Passing */}
                  <View style={styles.metricsBoxRow}>
                    <View
                      style={[
                        styles.miniMetricBox,
                        {
                          backgroundColor: isDarkMode
                            ? '#1E293B'
                            : 'rgba(99, 102, 241, 0.05)',
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Clock size={15} color={theme.colors.primary} />
                      <Text style={[styles.miniMetricValue, { color: theme.colors.textMain }]}>
                        {exam.durationMinutes}m
                      </Text>
                      <Text style={[styles.miniMetricLabel, { color: theme.colors.textLight }]}>
                        DURATION
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.miniMetricBox,
                        {
                          backgroundColor: isDarkMode
                            ? '#1E293B'
                            : 'rgba(245, 158, 11, 0.05)',
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Star size={15} color="#F59E0B" />
                      <Text style={[styles.miniMetricValue, { color: theme.colors.textMain }]}>
                        {exam.totalMarks}
                      </Text>
                      <Text style={[styles.miniMetricLabel, { color: theme.colors.textLight }]}>
                        TOTAL MARKS
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.miniMetricBox,
                        {
                          backgroundColor: isDarkMode
                            ? '#1E293B'
                            : 'rgba(16, 185, 129, 0.05)',
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Trophy size={15} color="#10B981" />
                      <Text style={[styles.miniMetricValue, { color: theme.colors.textMain }]}>
                        {exam.passingMarks || Math.floor(exam.totalMarks * 0.4)}
                      </Text>
                      <Text style={[styles.miniMetricLabel, { color: theme.colors.textLight }]}>
                        PASS MARKS
                      </Text>
                    </View>
                  </View>

                  {/* Scheduled date box */}
                  <View
                    style={[
                      styles.scheduleBox,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.03)'
                          : '#F8FAFC',
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Calendar size={13} color={theme.colors.textLight} />
                    <Text style={[styles.scheduleText, { color: theme.colors.textMuted }]}>
                      Scheduled: <Text style={{ color: theme.colors.textMain, fontWeight: '700' }}>{formattedDate}</Text>
                    </Text>
                  </View>

                  {/* Action button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      if (isLive) {
                        navigation.navigate('TestTaking', { testId: exam._id, examTitle: exam.title });
                      } else if (isExpired) {
                        navigation.navigate('ResultsList');
                      } else {
                        navigation.navigate('TestSeriesTab');
                      }
                    }}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: isLive
                          ? '#10B981'
                          : isExpired
                          ? isDarkMode
                            ? '#334155'
                            : '#F1F5F9'
                          : theme.colors.primary,
                      },
                    ]}
                  >
                    {isLive ? (
                      <>
                        <PlayCircle size={16} color="#FFFFFF" />
                        <Text style={styles.actionBtnTextWhite}>ENTER LIVE EXAM</Text>
                      </>
                    ) : isExpired ? (
                      <>
                        <History size={16} color={theme.colors.textMain} />
                        <Text style={[styles.actionBtnTextMuted, { color: theme.colors.textMain }]}>
                          VIEW PAST RESULTS
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.actionBtnTextWhite}>VIEW DETAILS / SYLLABUS</Text>
                        <ChevronRight size={15} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, paddingTop: 14 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Live Banner */
  liveBanner: {
    backgroundColor: '#047857',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  liveBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  liveIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  liveBannerSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  viewLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewLiveBtnText: {
    color: '#065F46',
    fontSize: 12.5,
    fontWeight: '900',
  },

  /* Stats Paper */
  statsPaper: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 4,
  },
  statCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 90,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Search & Tabs */
  searchSection: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  tabScroll: {
    flexDirection: 'row',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  tabPillText: {
    fontSize: 12,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
  },

  /* Cards List */
  cardsList: {
    gap: 14,
  },
  examCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  liveTopIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#10B981',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  blinkingLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '900',
  },
  difficultyTag: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardSubject: {
    fontSize: 12,
    marginBottom: 12,
  },

  /* 3 Metric Boxes */
  metricsBoxRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  miniMetricBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMetricValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },
  miniMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },

  /* Schedule Box */
  scheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  scheduleText: {
    fontSize: 11,
  },

  /* Action Btn */
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  actionBtnTextWhite: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  actionBtnTextMuted: {
    fontSize: 12,
    fontWeight: '800',
  },

  /* Empty Container */
  emptyContainer: {
    marginTop: 20,
  },
});

export default ExamsListScreen;