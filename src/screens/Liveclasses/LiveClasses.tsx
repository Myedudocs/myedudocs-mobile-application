import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import {
  Video,
  Clock,
  Users,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Radio,
  PlayCircle,
  BellRing,
  Award,
  ShieldCheck,
  Zap,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL, apiService, ENDPOINTS } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { useTheme } from '../../context/ThemeContext';
import { CourseSkeleton } from '../../components/skeletons/CourseSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

const formatSessionTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const formatSessionDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getSessionStatus = (startTime: string, durationMinutes: number = 60) => {
  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  const end = start + durationMinutes * 60 * 1000;

  if (now < start) {
    const diffInMinutes = (start - now) / 60000;
    return diffInMinutes < 60
      ? { label: 'Starting Soon', color: '#F59E0B', bg: '#FEF3C7', isLive: false }
      : { label: 'Scheduled', color: '#6366F1', bg: '#EEF2FF', isLive: false };
  }
  if (now >= start && now <= end) {
    return { label: 'LIVE NOW', color: '#EF4444', bg: '#FEE2E2', isLive: true };
  }
  return { label: 'Ended', color: '#9CA3AF', bg: '#F3F4F6', isLive: false };
};

export const LiveClasses: React.FC<{ hideHeader?: boolean; hideBottomNav?: boolean }> = ({
  hideHeader = false,
  hideBottomNav = false,
}) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'masterclasses' | 'recordings'>('upcoming');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState<string[]>([]);

  const fetchContent = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (user?.id && user?.token) {
        // 1. Fetch user's purchased courses
        const courseRes = await fetch(
          `${BASE_URL}/students/course/payment/my-courses/${user.id}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        const courseData = await courseRes.json();
        const purchasedCourseIds = (courseData.courses || []).map((c: any) => c.courseId);

        // 2. Fetch live sessions
        const sessionRes = await fetch(`${BASE_URL}/live-sessions`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const sessionData = await sessionRes.json();
        const allSessions = sessionData.meetings || sessionData || [];

        const mySessions = allSessions.filter((s: any) =>
          purchasedCourseIds.includes(s.courseId?._id)
        );

        mySessions.sort(
          (a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        setSessions(mySessions);
      } else {
        setSessions([]);
      }
    } catch (err) {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleJoin = (session: any) => {
    const status = getSessionStatus(session.startTime, session.duration);
    if (status.label === 'Ended') {
      Alert.alert('Session Ended', 'This session has ended. Recording will be available shortly.');
      return;
    }
    if (session.joinUrl) {
      Linking.openURL(session.joinUrl);
    } else {
      Alert.alert('Notice', 'Join link will become active 10 minutes before the scheduled start time.');
    }
  };

  const handleToggleReminder = (id: string, title: string) => {
    if (reminders.includes(id)) {
      setReminders((prev) => prev.filter((r) => r !== id));
      Alert.alert('Reminder Removed', `Notification cancelled for "${title}".`);
    } else {
      setReminders((prev) => [...prev, id]);
      Alert.alert('Reminder Set! 🔔', `We will notify you 15 minutes before "${title}" goes live.`);
    }
  };

  const liveCount = useMemo(() => {
    return sessions.filter((s) => getSessionStatus(s.startTime, s.duration).isLive).length;
  }, [sessions]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Global Safe Header */}
      {!hideHeader && (
        <GlobalSafeHeader
          title={t('liveSessions.title', { defaultValue: 'Live Classes' })}
          subtitle={t('liveSessions.subtitle', { defaultValue: 'Interactive lectures & workshops' })}
          showBack
          showMenu
          showSearch
          showThemeToggle
          showNotifications
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchContent(true)}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Top Hero Banner */}
        <View
          style={[
            styles.heroBannerCard,
            {
              backgroundColor: isDarkMode ? '#131A2E' : '#312E81',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            },
          ]}
        >
          {/* Top Status Row */}
          <View style={styles.bannerTopRow}>
            <View style={styles.liveStatusPill}>
              <Radio size={12} color={liveCount > 0 ? '#EF4444' : '#4ADE80'} />
              <Text style={styles.liveStatusText}>
                {liveCount > 0 ? `${liveCount} SESSIONS LIVE NOW` : 'LIVE LEARNING HUB'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs', { screen: 'CoursesTab' })}
              activeOpacity={0.85}
              style={styles.browseCoursesBtn}
            >
              <Text style={styles.browseCoursesBtnText}>Browse Courses</Text>
              <ArrowRight size={11} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>Live Interactive Classes & Workshops</Text>
          <Text style={styles.heroSubtitle}>
            Join real-time lectures, participate in live Q&A with top mentors, and access recorded replays anytime.
          </Text>

          {/* Segmented Filter Pills */}
          <View
            style={[
              styles.tabCapsule,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(15, 23, 42, 0.8)'
                  : 'rgba(255, 255, 255, 0.15)',
              },
            ]}
          >
            {[
              { key: 'upcoming', label: `My Schedule (${sessions.length})` },
              { key: 'masterclasses', label: 'Open Masterclasses' },
              { key: 'recordings', label: 'Past Replays' },
            ].map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  activeOpacity={0.85}
                  style={[
                    styles.tabBtn,
                    isSelected && {
                      backgroundColor: isDarkMode ? '#6366F1' : '#FFFFFF',
                      shadowColor: '#000',
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      {
                        color: isSelected
                          ? isDarkMode
                            ? '#FFFFFF'
                            : '#312E81'
                          : isDarkMode
                          ? '#94A3B8'
                          : 'rgba(255, 255, 255, 0.8)',
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── TAB 1: MY SCHEDULE (ENROLLED SESSIONS) ─── */}
        {activeTab === 'upcoming' && (
          <>
            {loading && !refreshing ? (
              <View style={{ gap: 14 }}>
                <CourseSkeleton />
                <CourseSkeleton />
              </View>
            ) : sessions.length === 0 ? (
              /* Rich Empty State Card */
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyIconCircle,
                    {
                      backgroundColor: isDarkMode
                        ? 'rgba(99, 102, 241, 0.15)'
                        : '#EEF2FF',
                    },
                  ]}
                >
                  <Video size={36} color="#6366F1" />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>
                  No Live Classes Scheduled Today
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                  You don't have any active live sessions for your enrolled courses right now. Explore upcoming masterclasses or enroll in a live course batch below.
                </Text>

                <TouchableOpacity
                  onPress={() => navigation.navigate('MainTabs', { screen: 'CoursesTab' })}
                  activeOpacity={0.85}
                  style={[styles.emptyActionBtn, { backgroundColor: theme.colors.primary }]}
                >
                  <BookOpen size={15} color="#FFFFFF" />
                  <Text style={styles.emptyActionBtnText}>Explore Live Batches & Courses</Text>
                </TouchableOpacity>
              </View>
            ) : (
              sessions.map((item) => {
                const status = getSessionStatus(item.startTime, item.duration);
                const isLive = status.isLive;

                return (
                  <View
                    key={item._id}
                    style={[
                      styles.sessionCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: isLive
                          ? '#EF4444'
                          : theme.colors.border,
                      },
                    ]}
                  >
                    {/* Top Status Header */}
                    <View style={styles.cardStatusRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isLive
                              ? isDarkMode
                                ? 'rgba(239, 68, 68, 0.2)'
                                : '#FEE2E2'
                              : isDarkMode
                              ? 'rgba(99, 102, 241, 0.15)'
                              : '#EEF2FF',
                          },
                        ]}
                      >
                        {isLive && <View style={styles.liveBlinkDot} />}
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isLive ? '#EF4444' : '#6366F1' },
                          ]}
                        >
                          {status.label}
                        </Text>
                      </View>
                      <Text style={[styles.timeText, { color: theme.colors.primary }]}>
                        {formatSessionTime(item.startTime)}
                      </Text>
                    </View>

                    {/* Topic & Course Info */}
                    <Text
                      style={[styles.topicTitle, { color: theme.colors.textMain }]}
                      numberOfLines={2}
                    >
                      {item.topic}
                    </Text>
                    <Text
                      style={[styles.courseSubtitle, { color: theme.colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {item.courseId?.title || 'Interactive Masterclass'}
                    </Text>

                    {/* Meta Row */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaChip}>
                        <Calendar size={12} color={theme.colors.textLight} />
                        <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                          {formatSessionDate(item.startTime)}
                        </Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Clock size={12} color={theme.colors.textLight} />
                        <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                          {item.duration || 60} Mins
                        </Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Users size={12} color={theme.colors.textLight} />
                        <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                          Live Q&A
                        </Text>
                      </View>
                    </View>

                    {/* Join Button */}
                    <TouchableOpacity
                      onPress={() => handleJoin(item)}
                      activeOpacity={0.85}
                      style={[
                        styles.joinBtn,
                        {
                          backgroundColor: isLive
                            ? '#EF4444'
                            : isDarkMode
                            ? '#334155'
                            : '#0F172A',
                        },
                      ]}
                    >
                      <Text style={styles.joinBtnText}>
                        {isLive ? '🔴 Join Live Class Now' : 'View Class Details'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

          </>
        )}

        {/* ─── TAB 2: OPEN MASTERCLASSES ─── */}
        {activeTab === 'masterclasses' && (
          <View style={{ gap: 14 }}>
            {OPEN_MASTERCLASSES.map((cls) => {
              const hasReminder = reminders.includes(cls.id);
              return (
                <View
                  key={cls.id}
                  style={[
                    styles.masterclassCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.mcHeaderRow}>
                    <View
                      style={[
                        styles.mcBadge,
                        {
                          backgroundColor: isDarkMode
                            ? 'rgba(245, 158, 11, 0.15)'
                            : '#FEF3C7',
                        },
                      ]}
                    >
                      <Text style={styles.mcBadgeText}>{cls.badge}</Text>
                    </View>
                    <Text style={[styles.mcTiming, { color: theme.colors.primary }]}>
                      {cls.timing}
                    </Text>
                  </View>

                  <Text style={[styles.mcTitle, { color: theme.colors.textMain }]}>
                    {cls.title}
                  </Text>
                  <Text style={[styles.mcDesc, { color: theme.colors.textMuted }]}>
                    {cls.description}
                  </Text>

                  <View style={styles.mcBottomRow}>
                    <View style={styles.mentorRow}>
                      <View
                        style={[
                          styles.mentorAvatar,
                          {
                            backgroundColor: isDarkMode
                              ? 'rgba(99, 102, 241, 0.2)'
                              : '#EEF2FF',
                          },
                        ]}
                      >
                        <Text style={styles.mentorInitial}>{cls.mentor.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text
                          style={[styles.mentorName, { color: theme.colors.textMain }]}
                        >
                          {cls.mentor}
                        </Text>
                        <Text
                          style={[styles.mentorRole, { color: theme.colors.textLight }]}
                        >
                          {cls.mentorRole}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleToggleReminder(cls.id, cls.title)}
                      activeOpacity={0.8}
                      style={[
                        styles.reminderBtn,
                        {
                          backgroundColor: hasReminder
                            ? '#10B981'
                            : isDarkMode
                            ? 'rgba(255, 255, 255, 0.06)'
                            : '#F1F5F9',
                        },
                      ]}
                    >
                      <BellRing
                        size={13}
                        color={hasReminder ? '#FFFFFF' : theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.reminderBtnText,
                          {
                            color: hasReminder
                              ? '#FFFFFF'
                              : theme.colors.primary,
                          },
                        ]}
                      >
                        {hasReminder ? 'Reminded' : 'Set Reminder'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ─── TAB 3: PAST RECORDINGS ─── */}
        {activeTab === 'recordings' && (
          <View style={{ gap: 12 }}>
            {PAST_RECORDINGS.map((rec) => (
              <View
                key={rec.id}
                style={[
                  styles.recordingCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.recIconWrap,
                    {
                      backgroundColor: isDarkMode
                        ? 'rgba(99, 102, 241, 0.15)'
                        : '#EEF2FF',
                    },
                  ]}
                >
                  <PlayCircle size={22} color="#6366F1" />
                </View>
                <View style={styles.recInfoCol}>
                  <Text
                    style={[styles.recTitle, { color: theme.colors.textMain }]}
                    numberOfLines={1}
                  >
                    {rec.title}
                  </Text>
                  <Text style={[styles.recSub, { color: theme.colors.textMuted }]}>
                    {rec.course} · {rec.duration}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert('Playback', 'Loading full HD lecture recording...')}
                  style={[styles.watchBtn, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={styles.watchBtnText}>Watch</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Live Learning Perks Banner */}
        <View
          style={[
            styles.perksCard,
            {
              backgroundColor: isDarkMode
                ? 'rgba(15, 23, 42, 0.6)'
                : '#F8FAFC',
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.perksTitleRow}>
            <Zap size={14} color={theme.colors.primary} />
            <Text
              style={[
                styles.perksTitle,
                { color: isDarkMode ? '#CBD5E1' : '#475569' },
              ]}
            >
              MYEDUDOCS LIVE CLASS PERKS
            </Text>
          </View>
          <Text style={[styles.perkItem, { color: theme.colors.textMuted }]}>
            • Direct real-time audio/chat interaction with top educators.
          </Text>
          <Text style={[styles.perkItem, { color: theme.colors.textMuted }]}>
            • Automated instant HD replays available within 2 hours of class end.
          </Text>
          <Text style={[styles.perkItem, { color: theme.colors.textMuted }]}>
            • Free downloadable lecture notes and whiteboard solution PDFs.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const OPEN_MASTERCLASSES = [
  {
    id: 'mc-1',
    badge: 'FREE WORKSHOP',
    timing: 'TODAY · 7:00 PM IST',
    title: 'UPSC 2026: Complete 1-Year Roadmap & Strategy Session',
    description: 'Master the right resource mapping, answer writing framework, and daily schedule planning with Rankers.',
    mentor: 'Dr. Vikramjit Sharma',
    mentorRole: 'Senior UPSC Faculty & Ex-Civil Servant',
  },
  {
    id: 'mc-2',
    badge: 'DOUBT CLEARING',
    timing: 'TOMORROW · 5:30 PM IST',
    title: 'Indian Polity & Constitution: High-Yield Articles Crash Course',
    description: 'Live interactive session covering landmark constitutional amendments and frequently asked prelims MCQs.',
    mentor: 'Ananya Iyer',
    mentorRole: 'Constitutional Law Specialist',
  },
  {
    id: 'mc-3',
    badge: 'LIVE WORKSHOP',
    timing: 'FRIDAY · 8:00 PM IST',
    title: 'Current Affairs Weekly Analysis & Mains Answer Linking',
    description: 'Connect this week’s burning national and global events to Static General Studies papers.',
    mentor: 'Rohan Deshmukh',
    mentorRole: 'Chief Current Affairs Editor',
  },
];

const PAST_RECORDINGS = [
  {
    id: 'rec-1',
    title: 'Modern Indian History: Governor Generals & Key Reforms',
    course: 'UPSC GS Paper 1 Foundation',
    duration: '1h 24m',
  },
  {
    id: 'rec-2',
    title: 'Macroeconomics: Monetary Policy & Inflation Control',
    course: 'Banking & UPSC Combined Batch',
    duration: '58m',
  },
  {
    id: 'rec-3',
    title: 'Ethics, Integrity & Case Studies Masterclass',
    course: 'UPSC Mains GS Paper 4',
    duration: '1h 45m',
  },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 16, paddingBottom: 32 },

  /* Hero Banner Card */
  heroBannerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  liveStatusText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  browseCoursesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  browseCoursesBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 14,
  },

  /* Segmented Filter Pills */
  tabCapsule: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },

  /* Empty State Card */
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
    gap: 8,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* Session Card */
  sessionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBlinkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 3,
  },
  courseSubtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  joinBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* Masterclass Card */
  masterclassCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mcHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mcBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  mcBadgeText: {
    color: '#D97706',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  mcTiming: {
    fontSize: 11,
    fontWeight: '800',
  },
  mcTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
    marginBottom: 3,
  },
  mcDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  mcBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mentorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorInitial: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '800',
  },
  mentorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  mentorRole: {
    fontSize: 10,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reminderBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Past Recordings */
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  recIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  recSub: {
    fontSize: 11,
    marginTop: 2,
  },
  watchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  watchBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Perks Card */
  perksCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
    gap: 4,
  },
  perksTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  perksTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  perkItem: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});

export default LiveClasses;