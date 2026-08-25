import React, { useState, useEffect, useCallback } from 'react';
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
  Award,
  Star,
  Zap,
  BookOpen,
  Flame,
  Trophy,
  Target,
  GraduationCap,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS, apiService } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';

interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
  category: 'learner' | 'expert' | 'achiever' | 'dedicated' | 'special';
  requirement: string;
}

interface AchievementStats {
  totalEarned: number;
  totalBadges: number;
  certificates: number;
  totalPoints: number;
  rank: number;
  streak: number;
  longestStreak: number;
}

const ALL_BADGES: Badge[] = [
  // Learner
  { id: 'b1', name: 'First Step', emoji: '👶', category: 'learner', description: 'Completed your first course lesson', requirement: 'Complete 1 lesson', earned: false },
  { id: 'b2', name: 'Bookworm', emoji: '📚', category: 'learner', description: 'Read 3 purchased books', requirement: 'Read 3 eBooks', earned: false },
  { id: 'b3', name: 'Curious Mind', emoji: '🧠', category: 'learner', description: 'Enrolled in 3 courses', requirement: 'Enrol in 3 courses', earned: false },
  { id: 'b4', name: 'Fast Learner', emoji: '⚡', category: 'learner', description: 'Completed a course in under 7 days', requirement: 'Finish course in 7 days', earned: false },
  { id: 'b5', name: 'Knowledge Hunter', emoji: '🔍', category: 'learner', description: 'Accessed 5 different subjects', requirement: '5 different subjects', earned: false },
  // Expert
  { id: 'b6', name: 'Test Warrior', emoji: '⚔️', category: 'expert', description: 'Attempted 10 practice tests', requirement: 'Attempt 10 tests', earned: false },
  { id: 'b7', name: 'High Scorer', emoji: '🎯', category: 'expert', description: 'Scored above 90% in any test', requirement: 'Score 90%+ in a test', earned: false },
  { id: 'b8', name: 'Perfect Score', emoji: '💯', category: 'expert', description: 'Achieved 100% in any test', requirement: 'Score 100% in a test', earned: false },
  { id: 'b9', name: 'PYQ Master', emoji: '📜', category: 'expert', description: 'Completed a full PYQ set', requirement: 'Finish 1 PYQ set', earned: false },
  { id: 'b10', name: 'Exam Pro', emoji: '🏆', category: 'expert', description: 'Passed 5 graded exams', requirement: 'Pass 5 exams', earned: false },
  // Achiever
  { id: 'b11', name: 'Early Bird', emoji: '🌅', category: 'achiever', description: 'Studied before 7 AM for 3 days', requirement: 'Study before 7 AM (3 days)', earned: false },
  { id: 'b12', name: 'Night Owl', emoji: '🦉', category: 'achiever', description: 'Studied after 10 PM for 3 days', requirement: 'Study after 10 PM (3 days)', earned: false },
  { id: 'b13', name: 'Weekend Warrior', emoji: '🔥', category: 'achiever', description: 'Active on both Saturday and Sunday', requirement: 'Study on weekend', earned: false },
  { id: 'b14', name: 'Top Ranker', emoji: '👑', category: 'achiever', description: 'Reached top 10 on leaderboard', requirement: 'Rank in top 10', earned: false },
  // Dedicated
  { id: 'b15', name: '7-Day Streak', emoji: '🗓️', category: 'dedicated', description: 'Maintained a 7-day learning streak', requirement: '7-day streak', earned: false },
  { id: 'b16', name: '30-Day Legend', emoji: '🌟', category: 'dedicated', description: 'Maintained a 30-day learning streak', requirement: '30-day streak', earned: false },
  { id: 'b17', name: 'Consistent', emoji: '📅', category: 'dedicated', description: 'Logged in for 14 consecutive days', requirement: '14-day login streak', earned: false },
  { id: 'b18', name: 'Community Voice', emoji: '✍️', category: 'dedicated', description: 'Published 3 blogs', requirement: 'Publish 3 blogs', earned: false },
  // Special
  { id: 'b19', name: 'Live Learner', emoji: '📡', category: 'special', description: 'Attended 5 live classes', requirement: 'Attend 5 live classes', earned: false },
  { id: 'b20', name: 'Coin Collector', emoji: '🪙', category: 'special', description: 'Earned 500 EduCoins', requirement: 'Earn 500 coins', earned: false },
];

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  learner:   { label: 'Learner',   color: '#6366F1', bg: '#EEF2FF' },
  expert:    { label: 'Expert',    color: '#10B981', bg: '#ECFDF5' },
  achiever:  { label: 'Achiever',  color: '#F59E0B', bg: '#FFFBEB' },
  dedicated: { label: 'Dedicated', color: '#EF4444', bg: '#FEF2F2' },
  special:   { label: 'Special',   color: '#8B5CF6', bg: '#F5F3FF' },
};

export const AchievementsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AchievementStats>({
    totalEarned: 0,
    totalBadges: ALL_BADGES.length,
    certificates: 0,
    totalPoints: 0,
    rank: 0,
    streak: 0,
    longestStreak: 0,
  });
  const [badges, setBadges] = useState<Badge[]>(ALL_BADGES);
  const [activeFilter, setActiveFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const studentId = user?.id || (user as any)?._id;

  const loadAchievements = useCallback(async () => {
    if (!studentId) { setLoading(false); return; }
    try {
      const res: any = await apiService.get(
        ENDPOINTS.GET_STUDENT_DASHBOARD_STATS(studentId),
        { bypassCache: true }
      );
      const data = res?.data || res || {};

      const earned = data.achievements?.badges || 0;
      const updatedBadges = ALL_BADGES.map((b, i) => ({
        ...b,
        earned: i < earned, // seed earned from count
      }));
      setBadges(updatedBadges);

      setStats({
        totalEarned: earned,
        totalBadges: ALL_BADGES.length,
        certificates: data.achievements?.certificates || 0,
        totalPoints: data.achievements?.totalPoints || 0,
        rank: data.achievements?.rank || 0,
        streak: data.learningStreak?.currentStreak || 0,
        longestStreak: data.learningStreak?.longestStreak || 0,
      });
    } catch {
      // use defaults
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => { loadAchievements(); }, [loadAchievements]);

  const onRefresh = () => { setRefreshing(true); loadAchievements(); };

  const filtered = badges.filter(b => {
    const catOk = activeCategory === 'all' || b.category === activeCategory;
    const earnedOk =
      activeFilter === 'all' ? true :
      activeFilter === 'earned' ? b.earned :
      !b.earned;
    return catOk && earnedOk;
  });

  const earnedCount = badges.filter(b => b.earned).length;
  const pct = Math.round((earnedCount / badges.length) * 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GlobalSafeHeader
        title="Achievements"
        showBack={true}
        showSearch={false}
        showThemeToggle={true}
        showNotifications={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Hero banner */}
        <View style={[styles.heroBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#4338CA' }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTitle}>Your Achievements</Text>
              <Text style={styles.heroSub}>Keep learning to unlock more badges</Text>
            </View>
            <View style={styles.heroTrophyWrap}>
              <Trophy size={36} color="#FCD34D" />
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.heroPbarWrap}>
            <View style={styles.heroPbarBg}>
              <View style={[styles.heroPbarFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={styles.heroPbarLabel}>{earnedCount}/{badges.length} badges earned</Text>
          </View>

          {/* Mini stat row */}
          <View style={styles.heroStatRow}>
            {[
              { icon: <Award size={16} color="#FCD34D" />, label: 'Badges', val: earnedCount },
              { icon: <Shield size={16} color="#6EE7B7" />, label: 'Certs', val: stats.certificates },
              { icon: <Star size={16} color="#C4B5FD" />, label: 'Points', val: stats.totalPoints },
              { icon: <Flame size={16} color="#FCA5A5" />, label: 'Streak', val: `${stats.streak}d` },
            ].map(s => (
              <View key={s.label} style={styles.heroStat}>
                {s.icon}
                <Text style={styles.heroStatVal}>{s.val}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Leaderboard rank card */}
        {stats.rank > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Leaderboard')}
            style={[styles.rankCard, { backgroundColor: theme.colors.surface, borderColor: '#F59E0B' }]}
            activeOpacity={0.85}
          >
            <View style={[styles.rankIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Trophy size={22} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rankTitle, { color: theme.colors.textMain }]}>Your Rank</Text>
              <Text style={[styles.rankSub, { color: theme.colors.textMuted }]}>
                You're ranked #{stats.rank} on the leaderboard
              </Text>
            </View>
            <Text style={styles.rankBadge}>#{stats.rank}</Text>
            <ArrowUpRight size={18} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catScrollContent}
        >
          {['all', 'learner', 'expert', 'achiever', 'dedicated', 'special'].map(cat => {
            const meta = cat === 'all' ? { color: '#6366F1', bg: '#EEF2FF', label: 'All' } : { ...CATEGORY_META[cat] };
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: isActive ? meta.color : (isDarkMode ? theme.colors.surface : '#F1F5F9'),
                    borderColor: isActive ? meta.color : theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.catPillText, { color: isActive ? '#FFF' : theme.colors.textMuted }]}>
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Earned / Locked filter */}
        <View style={[styles.filterRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {(['all', 'earned', 'locked'] as const).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterBtn,
                activeFilter === f && { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={[styles.filterBtnText, { color: activeFilter === f ? '#FFF' : theme.colors.textMuted }]}>
                {f === 'all' ? `All (${badges.length})` : f === 'earned' ? `Earned (${earnedCount})` : `Locked (${badges.length - earnedCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        )}

        {/* Badges grid */}
        {!loading && (
          <View style={styles.badgesGrid}>
            {filtered.map(badge => {
              const meta = CATEGORY_META[badge.category];
              return (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: badge.earned ? meta.color + '60' : theme.colors.border,
                      opacity: badge.earned ? 1 : 0.6,
                    },
                  ]}
                >
                  {/* Earned indicator */}
                  {badge.earned && (
                    <View style={styles.earnedCheckWrap}>
                      <CheckCircle2 size={14} color="#10B981" />
                    </View>
                  )}
                  {!badge.earned && (
                    <View style={styles.lockedIconWrap}>
                      <Lock size={12} color={theme.colors.textLight} />
                    </View>
                  )}

                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>

                  <View style={[styles.badgeCatPill, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.badgeCatText, { color: meta.color }]}>{meta.label}</Text>
                  </View>

                  <Text style={[styles.badgeName, { color: theme.colors.textMain }]} numberOfLines={1}>
                    {badge.name}
                  </Text>
                  <Text style={[styles.badgeDesc, { color: theme.colors.textMuted }]} numberOfLines={2}>
                    {badge.earned ? badge.description : badge.requirement}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {!loading && filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 40 }}>🏅</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textMain }]}>No badges here yet</Text>
            <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
              Keep learning to unlock achievements!
            </Text>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  heroBanner: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 3,
  },
  heroTrophyWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPbarWrap: { marginBottom: 14 },
  heroPbarBg: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 6,
  },
  heroPbarFill: {
    height: '100%',
    backgroundColor: '#FCD34D',
    borderRadius: 99,
  },
  heroPbarLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  heroStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStat: {
    alignItems: 'center',
    gap: 4,
  },
  heroStatVal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '600',
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  rankIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTitle: { fontSize: 14, fontWeight: '800' },
  rankSub: { fontSize: 12, marginTop: 1 },
  rankBadge: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F59E0B',
  },
  catScroll: { marginBottom: 12 },
  catScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catPillText: { fontSize: 12, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
  },
  filterBtnText: { fontSize: 12, fontWeight: '700' },
  loadingWrap: { paddingTop: 40, alignItems: 'center' },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },
  badgeCard: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  earnedCheckWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  lockedIconWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  badgeEmoji: { fontSize: 32, marginBottom: 8, marginTop: 4 },
  badgeCatPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeCatText: { fontSize: 9, fontWeight: '800' },
  badgeName: { fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  badgeDesc: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  emptyWrap: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 12 },
});
