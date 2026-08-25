import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Trophy, Flame } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { getImageUrl } from '../../utils/image.utils';

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

const getRankColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return '#ffd700'; // Gold
    case 2:
      return '#c0c0c0'; // Silver
    case 3:
      return '#cd7f32'; // Bronze
    default:
      return '#94a3b8';
  }
};

export interface LeaderboardRowProps {
  rank: number;
  name: string;
  avatar?: string;
  points: number;
  streak?: number;
  avgScore?: number;
  coursesCompleted?: number;
  isCurrentUser?: boolean;
  level?: number;
  onClick?: () => void;
  style?: ViewStyle;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  rank,
  name,
  avatar,
  points,
  streak = 0,
  avgScore = 0,
  coursesCompleted = 0,
  isCurrentUser = false,
  level = 1,
  onClick,
  style,
}) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const isTopThree = rank <= 3;
  const rankColor = getRankColor(rank);
  const initials = (name?.[0] || 'U').toUpperCase();
  const resolvedAvatar = avatar ? getImageUrl(avatar) : null;

  const Container = onClick ? TouchableOpacity : View;

  return (
    <Container
      onPress={onClick}
      activeOpacity={0.85}
      style={[
        styles.wrap,
        {
          backgroundColor: isCurrentUser
            ? hexToRgba('#6366f1', 0.06)
            : isTopThree
            ? hexToRgba(rankColor, 0.06)
            : theme.colors.surface,
          borderColor: isCurrentUser
            ? hexToRgba('#6366f1', 0.5)
            : isTopThree
            ? hexToRgba(rankColor, 0.3)
            : theme.colors.border,
          shadowColor: rankColor,
        },
        style,
      ]}
    >
      {isTopThree ? (
        <View
          style={[
            styles.bgDecoration,
            { backgroundColor: hexToRgba(rankColor, 0.1) },
          ]}
        />
      ) : null}

      <View style={styles.row}>
        {/* Rank badge */}
        <View
          style={[
            styles.rankBadge,
            {
              backgroundColor: isTopThree
                ? hexToRgba(rankColor, 0.2)
                : hexToRgba('#94a3b8', 0.1),
              borderColor: rankColor,
            },
          ]}
        >
          {rank <= 3 ? (
            <Trophy size={20} color={rankColor} />
          ) : (
            <Text style={[styles.rankText, { color: rankColor }]}>#{rank}</Text>
          )}
        </View>

        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            {
              borderColor: isCurrentUser ? '#6366f1' : 'transparent',
            },
          ]}
        >
          {resolvedAvatar ? (
            <Image
              source={{ uri: resolvedAvatar }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarInitial}>{initials}</Text>
          )}
        </View>

        {/* Name and stats */}
        <View style={styles.contentCol}>
          <View style={styles.nameRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                {
                  color: isCurrentUser
                    ? '#6366f1'
                    : theme.colors.textMain,
                },
              ]}
            >
              {name}
            </Text>
            {isCurrentUser ? (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>
                  {t('leaderboard.you', { defaultValue: 'You' })}
                </Text>
              </View>
            ) : null}
            {level > 1 ? (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>Lv.{level}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.statRow}>
            {streak > 0 ? (
              <View style={styles.statItem}>
                <Flame size={12} color="#f59e0b" />
                <Text style={styles.statText}>{streak}</Text>
              </View>
            ) : null}
            {avgScore > 0 ? (
              <Text style={styles.statText}>
                {t('leaderboard.avg', { defaultValue: 'Avg' })} {avgScore}%
              </Text>
            ) : null}
            {coursesCompleted > 0 ? (
              <Text style={styles.statText}>
                {coursesCompleted}{' '}
                {t('leaderboard.coursesLower', { defaultValue: 'courses' })}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Points */}
        <View style={styles.pointsCol}>
          <Text
            style={[
              styles.pointsValue,
              { color: isTopThree ? rankColor : '#6366f1' },
            ]}
          >
            {points.toLocaleString()}
          </Text>
          <Text style={styles.pointsLabel}>
            {t('leaderboard.pointsLower', { defaultValue: 'pts' })}
          </Text>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  bgDecoration: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  rankText: { fontWeight: '800', fontSize: 14 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#475569' },
  contentCol: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: {
    fontWeight: '700',
    fontSize: 15,
    flexShrink: 1,
  },
  youBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  youBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  levelBadge: {
    backgroundColor: hexToRgba('#10b981', 0.15),
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  levelBadgeText: { color: '#10b981', fontSize: 10, fontWeight: '700' },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
    gap: 8,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  pointsCol: { alignItems: 'flex-end' },
  pointsValue: { fontSize: 17, fontWeight: '800' },
  pointsLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
});

export default LeaderboardRow;