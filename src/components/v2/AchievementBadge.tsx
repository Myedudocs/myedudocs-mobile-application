import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Trophy, Star, Award, Medal, Lock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export interface AchievementBadgeData {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt?: string;
}

export interface AchievementBadgeProps {
  badge: AchievementBadgeData;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  showDescription?: boolean;
  earned?: boolean;
  onClick?: () => void;
  style?: ViewStyle;
}

const sizeMap = {
  small: { icon: 22, font: 11 },
  medium: { icon: 36, font: 14 },
  large: { icon: 56, font: 18 },
};

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

const resolveBadgeIcon = (
  icon: string
): React.ComponentType<{ size: number; color: string }> => {
  const lower = icon.toLowerCase();
  if (lower.includes('star')) return Star;
  if (lower.includes('premium')) return Award;
  if (lower.includes('tech') || lower.includes('medal')) return Medal;
  return Trophy;
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  badge,
  size = 'medium',
  showName = true,
  showDescription = false,
  earned = true,
  onClick,
  style,
}) => {
  const { theme } = useTheme();
  const sizes = sizeMap[size];
  const bgColor = earned ? '#f59e0b' : '#94a3b8';
  const Icon = resolveBadgeIcon(badge.icon);

  const Container = onClick ? TouchableOpacity : View;

  return (
    <Container
      onPress={onClick}
      activeOpacity={0.85}
      style={[
        styles.wrap,
        {
          backgroundColor: earned
            ? hexToRgba(bgColor, 0.08)
            : theme.colors.surface,
          borderColor: earned ? hexToRgba(bgColor, 0.3) : theme.colors.border,
          opacity: earned ? 1 : 0.55,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            width: sizes.icon + 16,
            height: sizes.icon + 16,
            borderRadius: (sizes.icon + 16) / 2,
            backgroundColor: hexToRgba(bgColor, 0.15),
          },
        ]}
      >
        <Icon size={sizes.icon} color={bgColor} />
        {!earned ? (
          <View style={styles.lockOverlay}>
            <Lock size={sizes.icon * 0.45} color="#FFF" />
          </View>
        ) : null}
      </View>

      {showName ? (
        <Text
          numberOfLines={1}
          style={[
            styles.name,
            {
              fontSize: sizes.font,
              color: earned ? theme.colors.textMain : '#94A3B8',
            },
          ]}
        >
          {badge.name}
        </Text>
      ) : null}

      {showDescription && earned ? (
        <Text numberOfLines={2} style={styles.desc}>
          {badge.description}
        </Text>
      ) : null}

      {earned && badge.earnedAt ? (
        <Text style={styles.earnedAt}>
          {new Date(badge.earnedAt).toLocaleDateString()}
        </Text>
      ) : null}
    </Container>
  );
};

export interface BadgeGridProps {
  badges: AchievementBadgeData[];
  earnedBadges: AchievementBadgeData[];
  size?: 'small' | 'medium' | 'large';
  limit?: number;
  style?: ViewStyle;
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  badges,
  earnedBadges,
  size = 'medium',
  limit,
  style,
}) => {
  const displayed = limit ? badges.slice(0, limit) : badges;
  const flexBasis =
    size === 'small' ? 'auto' : size === 'medium' ? '32%' : '24%';

  return (
    <View style={[styles.grid, style]}>
      {displayed.map((badge) => {
        const isEarned = earnedBadges.some((b) => b.id === badge.id);
        return (
          <View key={badge.id} style={[styles.gridItem, { flexBasis }]}>
            <AchievementBadge badge={badge} size={size} earned={isEarned} />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontWeight: '700', textAlign: 'center' },
  desc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  earnedAt: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    flexGrow: 1,
  },
});

export default AchievementBadge;