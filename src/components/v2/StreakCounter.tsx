import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { Flame, Flame as FlameOutline } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

export interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  goal?: number;
  compact?: boolean;
  showDetails?: boolean;
  style?: ViewStyle;
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
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak,
  longestStreak,
  goal = 7,
  compact = false,
  showDetails = true,
  style,
}) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();

  const isOnFire = currentStreak >= 7;
  const isMilestone = [7, 14, 30, 100].includes(currentStreak);

  // Flicker animation for the flame icon
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isOnFire) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.85,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isOnFire, opacity, scale]);

  const accent = isOnFire ? '#f59e0b' : '#94a3b8';

  if (compact) {
    return (
      <View
        style={[
          styles.compactWrap,
          {
            backgroundColor: hexToRgba(accent, 0.1),
            borderColor: hexToRgba(accent, 0.25),
          },
          style,
        ]}
      >
        <Flame size={16} color={accent} />
        <Text style={[styles.compactValue, { color: accent }]}>
          {currentStreak}
        </Text>
        <Text
          style={[
            styles.compactLabel,
            { color: isDarkMode ? '#94A3B8' : '#64748B' },
          ]}
        >
          {t('dashboard.streak')}
        </Text>
      </View>
    );
  }

  const progressToGoal = Math.min((currentStreak / goal) * 100, 100);
  const toNextGoal = Math.max(goal - currentStreak, 0);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isOnFire
            ? 'rgba(245,158,11,0.12)'
            : theme.colors.surface,
          borderColor: hexToRgba(accent, 0.25),
        },
        style,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        {isOnFire ? (
          <Flame
            size={64}
            color="#f59e0b"
          />
        ) : (
          <FlameOutline size={64} color={accent} style={{ opacity: 0.5 }} />
        )}
      </Animated.View>

      <Text
        style={[
          styles.bigValue,
          { color: isOnFire ? '#f59e0b' : theme.colors.textMain },
        ]}
      >
        {currentStreak}
      </Text>

      <Text
        style={[
          styles.subtitle,
          { color: isDarkMode ? '#94A3B8' : '#64748B' },
        ]}
      >
        {t('dashboard.streak')}
      </Text>

      {isMilestone ? (
        <View style={styles.milestoneBadge}>
          <Text style={styles.milestoneText}>🏆 MILESTONE!</Text>
        </View>
      ) : null}

      {showDetails ? (
        <View style={styles.detailsBlock}>
          <View style={styles.progressRow}>
            <Text
              style={[
                styles.progressLabel,
                { color: isDarkMode ? '#94A3B8' : '#64748B' },
              ]}
            >
              {t('dashboard.goalDays', { defaultValue: `Goal: ${goal} days` })}
            </Text>
            <Text style={styles.progressValue}>
              {Math.round(progressToGoal)}%
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: hexToRgba('#f59e0b', 0.15) },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: '#f59e0b',
                  width: `${progressToGoal}%`,
                },
              ]}
            />
          </View>

          <View style={styles.streakStatsRow}>
            <View style={styles.streakStat}>
              <Text style={[styles.streakStatValue, { color: theme.colors.textMain }]}>
                {longestStreak}
              </Text>
              <Text
                style={[
                  styles.streakStatLabel,
                  { color: isDarkMode ? '#94A3B8' : '#64748B' },
                ]}
              >
                {t('dashboard.bestStreak', { defaultValue: 'Best Streak' })}
              </Text>
            </View>
            <View
              style={[
                styles.streakStatDivider,
                { backgroundColor: theme.colors.border },
              ]}
            />
            <View style={styles.streakStat}>
              <Text style={[styles.streakStatValue, { color: '#10b981' }]}>
                {toNextGoal}
              </Text>
              <Text
                style={[
                  styles.streakStatLabel,
                  { color: isDarkMode ? '#94A3B8' : '#64748B' },
                ]}
              >
                {t('dashboard.toNextGoal', { defaultValue: 'To Next Goal' })}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  bigValue: {
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 60,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  milestoneBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  milestoneText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  detailsBlock: { width: '100%', marginTop: 18 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressValue: { fontSize: 12, fontWeight: '800', color: '#f59e0b' },
  progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  streakStatsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-around',
  },
  streakStat: { alignItems: 'center' },
  streakStatValue: { fontSize: 20, fontWeight: '800' },
  streakStatLabel: { fontSize: 11, marginTop: 2 },
  streakStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  compactWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  compactValue: { fontSize: 14, fontWeight: '800' },
  compactLabel: { fontSize: 12 },
});

export default StreakCounter;