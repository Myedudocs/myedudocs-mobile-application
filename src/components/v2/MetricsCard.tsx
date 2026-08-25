import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  progress?: number;
  progressLabel?: string;
  onClick?: () => void;
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

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = '#6366f1',
  trend,
  trendValue,
  progress,
  progressLabel,
  onClick,
  style,
}) => {
  const { theme, isDarkMode } = useTheme();

  const trendColor =
    trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#94a3b8';

  const Container = onClick ? TouchableOpacity : View;

  return (
    <Container
      onPress={onClick}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: color,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.contentCol}>
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? '#CBD5E1' : '#64748B' },
            ]}
          >
            {title}
          </Text>
          <View style={styles.valueRow}>
            <Text style={[styles.value, { color }]}>{value}</Text>
            {trend ? (
              <View style={styles.trendRow}>
                {trend === 'up' ? (
                  <TrendingUp size={14} color={trendColor} />
                ) : trend === 'down' ? (
                  <TrendingDown size={14} color={trendColor} />
                ) : (
                  <Minus size={14} color={trendColor} />
                )}
                {trendValue ? (
                  <Text style={[styles.trendText, { color: trendColor }]}>
                    {trendValue}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { color: isDarkMode ? '#94A3B8' : '#64748B' },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}

          {progress !== undefined ? (
            <View style={styles.progressWrap}>
              <View style={styles.progressLabelRow}>
                <Text
                  style={[
                    styles.progressLabel,
                    { color: isDarkMode ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {progressLabel || 'Progress'}
                </Text>
                <Text style={[styles.progressValue, { color }]}>
                  {progress}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: hexToRgba(color, 0.12) },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: color,
                      width: `${Math.max(0, Math.min(100, progress))}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.iconWrap,
            { backgroundColor: hexToRgba(color, 0.12) },
          ]}
        >
          {icon}
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  contentCol: { flex: 1 },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: { fontSize: 24, fontWeight: '800', lineHeight: 28 },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: { fontSize: 11, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 4 },
  progressWrap: { marginTop: 10 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: { fontSize: 11, fontWeight: '600' },
  progressValue: { fontSize: 11, fontWeight: '700' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MetricsCard;
