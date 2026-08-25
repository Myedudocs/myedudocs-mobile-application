import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Crown,
  Flame,
  Target,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL, apiService, ENDPOINTS } from '../../service/api.service';
import { getImageUrl } from '../../utils/image.utils';

export interface LeaderboardPerformer {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  score: number;
  accuracy?: number;
  streak?: number;
  testsCompleted?: number;
  exam?: string;
  quote?: string;
}

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

export interface ToppersWidgetProps {
  style?: ViewStyle;
  onPressTopper?: (performer: LeaderboardPerformer) => void;
}

export const ToppersWidget: React.FC<ToppersWidgetProps> = ({
  style,
  onPressTopper,
}) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [performers, setPerformers] = useState<LeaderboardPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 1. Fetch Dynamic Leaderboard Performers (Weekly / All-Time)
  useEffect(() => {
    let isMounted = true;

    const fetchLeaderboardPerformers = async () => {
      try {
        setLoading(true);
        let list: LeaderboardPerformer[] = [];

        // Attempt 1: Fetch from student leaderboard endpoint
        try {
          const res: any = await apiService.get(ENDPOINTS.GET_LEADERBOARD('week'), {
            headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
            bypassCache: true,
          });

          const rawList = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.leaderboard)
            ? res.leaderboard
            : [];

          if (rawList.length > 0) {
            list = rawList.slice(0, 5).map((u: any, idx: number) => ({
              rank: Number(u.rank ?? idx + 1),
              userId: u.userId || u.id || u._id || `ranker-${idx}`,
              name: u.name || 'Top Scholar',
              avatar: u.avatar || u.profile_image,
              score: Number(u.points ?? u.score ?? 0),
              accuracy: Number(u.accuracy ?? u.avgScore ?? 85),
              streak: Number(u.streak ?? 1),
              testsCompleted: Number(u.testsCompleted ?? u.coursesCompleted ?? 1),
              exam: u.exam || u.targetExam || 'Competitive Exam',
              quote:
                u.quote ||
                `Rank #${idx + 1} with ${Number(u.points ?? u.score ?? 0).toLocaleString()} points this week.`,
            }));
          }
        } catch (e) {
          // Fallback to toppers API
        }

        // Attempt 2: If leaderboard returned empty, fetch from /toppers/all
        if (list.length === 0) {
          try {
            const res = await fetch(`${BASE_URL}/toppers/all`);
            const json = await res.json();
            if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
              list = json.data.map((item: any, idx: number) => ({
                rank: idx + 1,
                userId: item._id || `topper-${idx}`,
                name: item.name,
                avatar: item.imageUrl,
                score: item.score ? parseInt(item.score.split('/')[0]) || 650 : 650,
                accuracy: 92,
                streak: 7,
                testsCompleted: 15,
                exam: `${item.examName || 'Exam'} ${item.year || ''}`.trim(),
                quote: item.quote || "Top ranker in weekly mock challenge. You're next!",
              }));
            }
          } catch (e) {
            console.warn('Toppers fallback error:', e);
          }
        }

        if (isMounted && list.length > 0) {
          setPerformers(list);
        }
      } catch (err) {
        console.warn('Failed to load leaderboard toppers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLeaderboardPerformers();
    return () => {
      isMounted = false;
    };
  }, [user?.token]);

  // 2. Auto-advance carousel every 4.5 seconds
  useEffect(() => {
    if (performers.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % performers.length;
        animateTo(next);
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [performers.length]);

  const animateTo = (idx: number) => {
    fadeAnim.setValue(0.35);
    slideAnim.setValue(10);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (performers.length <= 1) return;
    const next = (activeIndex + 1) % performers.length;
    setActiveIndex(next);
    animateTo(next);
  };

  const handlePrev = () => {
    if (performers.length <= 1) return;
    const prev = (activeIndex - 1 + performers.length) % performers.length;
    setActiveIndex(prev);
    animateTo(prev);
  };

  const handleCardPress = (performer: LeaderboardPerformer) => {
    if (onPressTopper) {
      onPressTopper(performer);
    } else {
      navigation.navigate('Leaderboard');
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.wrap,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          style,
        ]}
      >
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#F59E0B" size="small" />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
            Loading leaderboard rankers…
          </Text>
        </View>
      </View>
    );
  }

  if (performers.length === 0) return null;

  const current = performers[activeIndex] || performers[0];
  const isRank1 = current.rank === 1;
  const isRank2 = current.rank === 2;
  const isRank3 = current.rank === 3;

  const rankBadgeColor = isRank1 ? '#F59E0B' : isRank2 ? '#94A3B8' : isRank3 ? '#D97706' : '#6366F1';
  const rankBadgeBg = isRank1
    ? hexToRgba('#F59E0B', 0.15)
    : isRank2
    ? hexToRgba('#94A3B8', 0.15)
    : isRank3
    ? hexToRgba('#D97706', 0.15)
    : hexToRgba('#6366F1', 0.12);

  const resolvedImg = current.avatar
    ? current.avatar.startsWith('http')
      ? current.avatar
      : `${BASE_URL.replace('/api/v1', '')}${current.avatar}`
    : null;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
          borderColor: isDarkMode ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.3)',
        },
        style,
      ]}
    >
      {/* Ambient background glow */}
      <View
        style={[
          styles.bgCircle,
          { backgroundColor: hexToRgba('#F59E0B', isDarkMode ? 0.08 : 0.05) },
        ]}
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.trophyWrap, { backgroundColor: isRank1 ? '#FEF3C7' : '#F1F5F9' }]}>
            {isRank1 ? <Crown size={14} color="#D97706" /> : <Trophy size={14} color="#6366F1" />}
          </View>
          <Text style={styles.headerTitle}>
            {t('dashboard.toppersTitle', { defaultValue: 'TOP PERFORMERS THIS WEEK' })}
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={handlePrev}
            disabled={performers.length <= 1}
            style={[styles.controlBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={15} color={theme.colors.textMain} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            disabled={performers.length <= 1}
            style={[styles.controlBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
            activeOpacity={0.7}
          >
            <ChevronRight size={15} color={theme.colors.textMain} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Dynamic Leaderboard Card */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleCardPress(current)}
          style={styles.topperInner}
        >
          {/* Avatar with dynamic photo or initial + rank crown badge */}
          <View style={styles.avatarWrap}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: isDarkMode ? '#312E81' : '#FEF3C7',
                  borderColor: rankBadgeColor,
                },
              ]}
            >
              {resolvedImg ? (
                <Image source={{ uri: resolvedImg }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarInitial, { color: rankBadgeColor }]}>
                  {current.name ? current.name.charAt(0).toUpperCase() : '★'}
                </Text>
              )}
            </View>
            <View style={[styles.miniRankBadge, { backgroundColor: rankBadgeColor }]}>
              <Text style={styles.miniRankText}>#{current.rank}</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.topperInfo}>
            <View style={styles.nameRow}>
              <Text
                numberOfLines={1}
                style={[styles.topperName, { color: theme.colors.textMain }]}
              >
                {current.name}
              </Text>
              <View style={[styles.rankPill, { backgroundColor: rankBadgeBg }]}>
                <Text style={[styles.rankPillText, { color: rankBadgeColor }]}>
                  AIR {current.rank}
                </Text>
              </View>
            </View>

            {/* Target Exam */}
            <Text style={[styles.examSubText, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {current.exam || 'Competitive Exam'}
            </Text>

            {/* Metric Pills (Points / Streak / Accuracy) */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricChip, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }]}>
                <Sparkles size={11} color="#6366F1" />
                <Text style={[styles.metricChipText, { color: theme.colors.textMain }]}>
                  {current.score.toLocaleString()} PTS
                </Text>
              </View>

              {current.streak ? (
                <View style={[styles.metricChip, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }]}>
                  <Flame size={11} color="#EF4444" />
                  <Text style={[styles.metricChipText, { color: theme.colors.textMain }]}>
                    {current.streak}d streak
                  </Text>
                </View>
              ) : null}

              {current.accuracy ? (
                <View style={[styles.metricChip, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }]}>
                  <Target size={11} color="#10B981" />
                  <Text style={[styles.metricChipText, { color: theme.colors.textMain }]}>
                    {current.accuracy}%
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        {/* Motivational Dynamic Quote */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Leaderboard')}
          style={[
            styles.quoteBox,
            {
              backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.quoteText, { color: theme.colors.textMuted }]} numberOfLines={2}>
            {current.quote ||
              "Top performer this week on MyEduDocs. Tap to view full leaderboard rankings!"}
          </Text>
          <ArrowRight size={13} color="#6366F1" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </Animated.View>

      {/* Progress / Indicator Dots */}
      {performers.length > 1 && (
        <View style={styles.dotsRow}>
          {performers.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                setActiveIndex(idx);
                animateTo(idx);
              }}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx === activeIndex
                      ? '#F59E0B'
                      : isDarkMode
                      ? '#334155'
                      : '#E2E8F0',
                  width: idx === activeIndex ? 16 : 5,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  bgCircle: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trophyWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  controlBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topperInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '900',
  },
  miniRankBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  miniRankText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  topperInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  topperName: {
    fontWeight: '900',
    fontSize: 15,
    flex: 1,
  },
  rankPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  examSubText: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  quoteText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    fontStyle: 'italic',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ToppersWidget;