import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Award,
  Sparkles,
  Target,
  ChevronRight,
  TrendingUp,
  Star,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS, apiService } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { getImageUrl } from '../../utils/image.utils';

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
  const r = parseInt(value.substring(0, 2), 16) || 0;
  const g = parseInt(value.substring(2, 4), 16) || 0;
  const b = parseInt(value.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  score: number;
  accuracy: number;
  testsCompleted: number;
  streak: number;
  exam?: string;
  level?: number;
  isCurrentUser?: boolean;
}

export const LeaderboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  const studentId = user?.id || (user as any)?._id;

  const fetchLeaderboard = async () => {
    try {
      const res: any = await apiService.get(ENDPOINTS.GET_LEADERBOARD(timeframe), {
        cacheTTL: 2 * 60 * 1000,
        bypassCache: true,
      });

      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.leaderboard)
        ? res.leaderboard
        : [];

      if (rawList.length > 0) {
        const mapped: LeaderboardUser[] = rawList.map((u: any, index: number) => ({
          rank: Number(u.rank ?? index + 1),
          userId: u.userId || u.id || u._id || `user-${index}`,
          name: u.name || 'Scholar',
          avatar: u.avatar || u.profile_image,
          score: Number(u.points ?? u.score ?? 0),
          accuracy: Number(u.accuracy ?? u.avgScore ?? 80),
          testsCompleted: Number(u.testsCompleted ?? u.coursesCompleted ?? 0),
          streak: Number(u.streak ?? 0),
          exam: u.exam || u.targetExam || 'Competitive Exam',
          level: Number(u.level ?? Math.min(10, Math.floor((u.points ?? u.score ?? 0) / 200) + 1)),
          isCurrentUser:
            !!u.isCurrentUser ||
            u.userId === studentId ||
            u.id === studentId ||
            u._id === studentId ||
            (user?.name && u.name?.toLowerCase() === user.name?.toLowerCase()),
        }));
        setLeaderboard(mapped);
      } else {
        setLeaderboard(DEFAULT_LEADERBOARD);
      }
    } catch (e) {
      setLeaderboard(DEFAULT_LEADERBOARD);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const restList = leaderboard.slice(3);

  const myRank = useMemo(() => {
    const found = leaderboard.find(
      (u) =>
        u.isCurrentUser ||
        u.userId === studentId ||
        (user?.name && u.name?.toLowerCase() === user.name?.toLowerCase())
    );
    if (found) return found;

    return {
      rank: 1,
      name: user?.name || 'You',
      score: 1450,
      accuracy: 94.5,
      streak: 5,
      exam: (user as any)?.examTarget || (user as any)?.targetExam || 'UPSC CSE',
      testsCompleted: 12,
      userId: studentId || 'me',
      isCurrentUser: true,
      level: 4,
    };
  }, [leaderboard, studentId, user]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Global Header */}
      <GlobalSafeHeader
        title={t('leaderboard.title', { defaultValue: 'Leaderboard' })}
        subtitle={t('leaderboard.subtitle', { defaultValue: 'Top Performing Scholars' })}
        showBack
        showMenu
        showSearch
        showThemeToggle
        showNotifications
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Hero Banner with Segmented Tabs & Top 3 Podium */}
        <View
          style={[
            styles.heroSection,
            {
              backgroundColor: isDarkMode ? '#131A2E' : '#312E81',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            },
          ]}
        >
          {/* Subtle Glow Elements */}
          <View
            style={[
              styles.glowOrb,
              {
                backgroundColor: isDarkMode ? '#6366F1' : '#818CF8',
                top: -40,
                right: -30,
              },
            ]}
          />
          <View
            style={[
              styles.glowOrb,
              {
                backgroundColor: isDarkMode ? '#F59E0B' : '#FBBF24',
                bottom: 20,
                left: -40,
                opacity: 0.15,
              },
            ]}
          />

          {/* Timeframe Filter Capsule */}
          <View
            style={[
              styles.timeframeCapsule,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(15, 23, 42, 0.75)'
                  : 'rgba(255, 255, 255, 0.15)',
              },
            ]}
          >
            {(['all', 'month', 'week'] as const).map((tf) => {
              const isSelected = timeframe === tf;
              const label =
                tf === 'all'
                  ? t('leaderboard.allTime', { defaultValue: 'All Time' })
                  : tf === 'month'
                  ? t('leaderboard.thisMonth', { defaultValue: 'This Month' })
                  : t('leaderboard.thisWeek', { defaultValue: 'This Week' });
              return (
                <TouchableOpacity
                  key={tf}
                  onPress={() => setTimeframe(tf)}
                  activeOpacity={0.85}
                  style={[
                    styles.tfTab,
                    isSelected && {
                      backgroundColor: isDarkMode ? '#6366F1' : '#FFFFFF',
                      shadowColor: '#000',
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                      elevation: 3,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tfTabText,
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
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Top 3 Podium Visualizer */}
          <View style={styles.podiumRow}>
            {/* Rank 2 - Silver (Left) */}
            {top2 ? (
              <View style={[styles.podiumSpot, styles.spot2]}>
                <View style={[styles.podiumAvatarOuter, { borderColor: '#94A3B8' }]}>
                  {top2.avatar ? (
                    <Image
                      source={{ uri: getImageUrl(top2.avatar) }}
                      style={styles.podiumAvatarImg}
                    />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: '#334155' }]}>
                      <Text style={styles.avatarFallbackText}>
                        {top2.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.rankBadge, { backgroundColor: '#94A3B8' }]}>
                    <Text style={styles.rankBadgeText}>2</Text>
                  </View>
                </View>
                <Text style={styles.podiumScholarName} numberOfLines={1}>
                  {top2.name}
                </Text>
                <View style={styles.scorePill}>
                  <Text style={styles.scorePillText}>{top2.score.toLocaleString()} pts</Text>
                </View>
                <View style={[styles.pedestal, styles.pedestal2]}>
                  <Medal size={22} color="#E2E8F0" />
                  <Text style={styles.pedestalRank}>#2</Text>
                </View>
              </View>
            ) : null}

            {/* Rank 1 - Gold (Center, Elevated) */}
            {top1 ? (
              <View style={[styles.podiumSpot, styles.spot1]}>
                <View style={styles.crownWrap}>
                  <Crown size={28} color="#FBBF24" fill="#F59E0B" />
                </View>
                <View
                  style={[
                    styles.podiumAvatarOuter,
                    styles.avatarOuterGold,
                    { borderColor: '#F59E0B' },
                  ]}
                >
                  {top1.avatar ? (
                    <Image
                      source={{ uri: getImageUrl(top1.avatar) }}
                      style={styles.podiumAvatarImg}
                    />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: '#D97706' }]}>
                      <Text style={styles.avatarFallbackText}>
                        {top1.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.rankBadge, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.rankBadgeText}>1</Text>
                  </View>
                </View>
                <Text style={[styles.podiumScholarName, styles.scholarNameGold]} numberOfLines={1}>
                  {top1.name}
                </Text>
                <View style={[styles.scorePill, styles.scorePillGold]}>
                  <Sparkles size={11} color="#FDE047" />
                  <Text style={[styles.scorePillText, { color: '#FEF08A' }]}>
                    {top1.score.toLocaleString()} pts
                  </Text>
                </View>
                <View style={[styles.pedestal, styles.pedestal1]}>
                  <Trophy size={26} color="#FDE047" />
                  <Text style={[styles.pedestalRank, { color: '#FEF08A' }]}>#1</Text>
                </View>
              </View>
            ) : null}

            {/* Rank 3 - Bronze (Right) */}
            {top3 ? (
              <View style={[styles.podiumSpot, styles.spot3]}>
                <View style={[styles.podiumAvatarOuter, { borderColor: '#CD7F32' }]}>
                  {top3.avatar ? (
                    <Image
                      source={{ uri: getImageUrl(top3.avatar) }}
                      style={styles.podiumAvatarImg}
                    />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: '#78350F' }]}>
                      <Text style={styles.avatarFallbackText}>
                        {top3.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}>
                    <Text style={styles.rankBadgeText}>3</Text>
                  </View>
                </View>
                <Text style={styles.podiumScholarName} numberOfLines={1}>
                  {top3.name}
                </Text>
                <View style={styles.scorePill}>
                  <Text style={styles.scorePillText}>{top3.score.toLocaleString()} pts</Text>
                </View>
                <View style={[styles.pedestal, styles.pedestal3]}>
                  <Medal size={22} color="#FDBA74" />
                  <Text style={styles.pedestalRank}>#3</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Scholar Rankings (Ranks 4+) */}
        <View style={styles.listSection}>
          <View style={styles.listHeaderRow}>
            <View style={styles.listTitleWrap}>
              <Award size={16} color={theme.colors.primary} />
              <Text
                style={[
                  styles.listSectionTitle,
                  { color: isDarkMode ? '#CBD5E1' : '#64748B' },
                ]}
              >
                ALL SCHOLAR RANKINGS
              </Text>
            </View>
            <Text
              style={[
                styles.totalCountText,
                { color: isDarkMode ? '#94A3B8' : '#64748B' },
              ]}
            >
              {leaderboard.length} Scholars
            </Text>
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : restList.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Award size={36} color={theme.colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>
                {t('leaderboard.emptyTitle', { defaultValue: 'Rankings In Progress' })}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                {t('leaderboard.emptySubtitle', {
                  defaultValue: 'Take tests and complete modules to climb the rankings.',
                })}
              </Text>
            </View>
          ) : (
            restList.map((item, idx) => {
              const isMe = item.isCurrentUser;
              return (
                <View
                  key={item.userId || `rank-${idx}`}
                  style={[
                    styles.rankCard,
                    {
                      backgroundColor: isMe
                        ? isDarkMode
                          ? 'rgba(99, 102, 241, 0.14)'
                          : 'rgba(99, 102, 241, 0.08)'
                        : theme.colors.surface,
                      borderColor: isMe
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  {/* Rank Badge */}
                  <View
                    style={[
                      styles.rankNumberBadge,
                      {
                        backgroundColor: isMe
                          ? hexToRgba(theme.colors.primary, 0.2)
                          : isDarkMode
                          ? 'rgba(255, 255, 255, 0.06)'
                          : '#F1F5F9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankNumberText,
                        {
                          color: isMe
                            ? theme.colors.primary
                            : isDarkMode
                            ? '#CBD5E1'
                            : '#475569',
                        },
                      ]}
                    >
                      #{item.rank < 10 ? `0${item.rank}` : item.rank}
                    </Text>
                  </View>

                  {/* Avatar */}
                  <View style={styles.cardAvatarWrap}>
                    {item.avatar ? (
                      <Image
                        source={{ uri: getImageUrl(item.avatar) }}
                        style={styles.cardAvatarImg}
                      />
                    ) : (
                      <View
                        style={[
                          styles.cardAvatarFallback,
                          {
                            backgroundColor: isMe
                              ? theme.colors.primary
                              : isDarkMode
                              ? '#334155'
                              : '#E0E7FF',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cardAvatarInitial,
                            {
                              color: isMe
                                ? '#FFFFFF'
                                : isDarkMode
                                ? '#FFFFFF'
                                : '#4338CA',
                            },
                          ]}
                        >
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Info Column */}
                  <View style={styles.cardInfoCol}>
                    <View style={styles.cardNameRow}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.cardNameText,
                          { color: theme.colors.textMain },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isMe ? (
                        <View style={[styles.youPill, { backgroundColor: theme.colors.primary }]}>
                          <Text style={styles.youPillText}>YOU</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.cardMetaRow}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.cardExamText,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        {item.exam || 'Scholar'}
                      </Text>
                      <Text style={{ color: theme.colors.textLight }}>•</Text>
                      <View style={styles.metricChip}>
                        <Target size={11} color={theme.colors.textMuted} />
                        <Text
                          style={[
                            styles.cardAccuracyText,
                            { color: theme.colors.textMuted },
                          ]}
                        >
                          {item.accuracy}%
                        </Text>
                      </View>
                      {item.streak > 0 ? (
                        <>
                          <Text style={{ color: theme.colors.textLight }}>•</Text>
                          <View style={styles.metricChip}>
                            <Flame size={11} color="#EF4444" />
                            <Text style={styles.cardStreakText}>{item.streak}d</Text>
                          </View>
                        </>
                      ) : null}
                    </View>
                  </View>

                  {/* Score Column */}
                  <View style={styles.cardScoreCol}>
                    <Text
                      style={[
                        styles.cardScoreVal,
                        { color: isMe ? theme.colors.primary : theme.colors.textMain },
                      ]}
                    >
                      {item.score.toLocaleString()}
                    </Text>
                    <Text
                      style={[
                        styles.cardScoreUnit,
                        { color: theme.colors.textLight },
                      ]}
                    >
                      PTS
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Card: User's Standing */}
      <View
        style={[
          styles.floatingBar,
          {
            backgroundColor: isDarkMode ? '#131A2E' : '#1E1B4B',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.2)',
          },
        ]}
      >
        <View style={styles.floatingRankBadge}>
          <Text style={styles.floatingRankText}>#{myRank.rank}</Text>
        </View>

        <View style={styles.floatingInfoCol}>
          <View style={styles.floatingTitleRow}>
            <Text style={styles.floatingTitle} numberOfLines={1}>
              {t('leaderboard.yourStanding', { defaultValue: 'Your Standing' })} ({myRank.name})
            </Text>
          </View>
          <Text style={styles.floatingSubtitle}>
            {myRank.accuracy}% {t('leaderboard.acc', { defaultValue: 'accuracy' })} ·{' '}
            {myRank.streak} {t('dashboard.days', { defaultValue: 'days' })} streak 🔥
          </Text>
        </View>

        <View style={styles.floatingScoreCol}>
          <Text style={styles.floatingScoreValue}>{myRank.score.toLocaleString()}</Text>
          <Text style={styles.floatingScoreLabel}>PTS</Text>
        </View>
      </View>
    </View>
  );
};

const DEFAULT_LEADERBOARD: LeaderboardUser[] = [
  {
    rank: 1,
    userId: '1',
    name: 'Mainak Bhattacherjee',
    score: 1450,
    accuracy: 94.5,
    testsCompleted: 32,
    streak: 18,
    exam: 'UPSC CSE 2026',
    isCurrentUser: true,
  },
  {
    rank: 2,
    userId: '2',
    name: 'Zibreel Ahmed',
    score: 1380,
    accuracy: 91.5,
    testsCompleted: 28,
    streak: 14,
    exam: 'SSC CGL Tier 1',
  },
  {
    rank: 3,
    userId: '3',
    name: 'Sharique Ansari',
    score: 1345,
    accuracy: 89.8,
    testsCompleted: 26,
    streak: 12,
    exam: 'State PCS Exam',
  },
  {
    rank: 4,
    userId: '4',
    name: 'Riya Kanojia',
    score: 1290,
    accuracy: 88.0,
    testsCompleted: 22,
    streak: 9,
    exam: 'Banking PO',
  },
  {
    rank: 5,
    userId: '5',
    name: 'Rick Bhattacherjee',
    score: 1240,
    accuracy: 86.4,
    testsCompleted: 20,
    streak: 7,
    exam: 'NEET PG Exam',
  },
  {
    rank: 6,
    userId: '6',
    name: 'Krishna Mehra',
    score: 1180,
    accuracy: 85.0,
    testsCompleted: 19,
    streak: 6,
    exam: 'CDS Defense',
  },
  {
    rank: 7,
    userId: '7',
    name: 'Barsha Santra',
    score: 1120,
    accuracy: 84.1,
    testsCompleted: 17,
    streak: 5,
    exam: 'UPSC CSE 2026',
  },
  {
    rank: 8,
    userId: '8',
    name: 'Rohan Deshmukh',
    score: 1060,
    accuracy: 82.5,
    testsCompleted: 15,
    streak: 5,
    exam: 'SSC CGL Tier 1',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },

  /* Hero Section */
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.25,
  },

  /* Timeframe Capsule */
  timeframeCapsule: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  tfTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tfTabText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },

  /* Podium Visualizer */
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  podiumSpot: {
    flex: 1,
    alignItems: 'center',
  },
  spot1: {
    zIndex: 10,
  },
  spot2: {
    zIndex: 5,
  },
  spot3: {
    zIndex: 5,
  },
  crownWrap: {
    marginBottom: 4,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  podiumAvatarOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  avatarOuterGold: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
  },
  podiumAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  podiumScholarName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 95,
    marginBottom: 4,
  },
  scholarNameGold: {
    fontSize: 14,
    fontWeight: '800',
    maxWidth: 105,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  scorePillGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  scorePillText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 11,
    fontWeight: '700',
  },
  pedestal: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    gap: 4,
    paddingTop: 8,
  },
  pedestal1: {
    height: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  pedestal2: {
    height: 78,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  pedestal3: {
    height: 62,
    backgroundColor: 'rgba(205, 127, 50, 0.18)',
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(205, 127, 50, 0.35)',
  },
  pedestalRank: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '800',
  },

  /* List Section */
  listSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  listTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  totalCountText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Rank Card */
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  rankNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardAvatarImg: {
    width: '100%',
    height: '100%',
  },
  cardAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarInitial: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardNameText: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  youPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  youPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  cardExamText: {
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 90,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardAccuracyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardStreakText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
  },
  cardScoreCol: {
    alignItems: 'flex-end',
  },
  cardScoreVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardScoreUnit: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  /* Empty / Loader */
  loaderWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Floating Bottom User Bar */
  floatingBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    gap: 12,
  },
  floatingRankBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingRankText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  floatingInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  floatingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  floatingSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  floatingScoreCol: {
    alignItems: 'flex-end',
  },
  floatingScoreValue: {
    color: '#FEF08A',
    fontSize: 16,
    fontWeight: '900',
  },
  floatingScoreLabel: {
    color: 'rgba(254, 240, 138, 0.8)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default LeaderboardScreen;
