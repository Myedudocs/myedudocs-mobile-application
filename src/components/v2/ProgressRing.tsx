import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

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

export interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  showValue?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#6366f1',
  label,
  sublabel,
  showValue = true,
  backgroundColor,
  style,
}) => {
  const { isDarkMode } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const trackColor = backgroundColor || (isDarkMode ? '#1E293B' : 'rgba(0,0,0,0.1)');

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg
        width={size}
        height={size}
        style={StyleSheet.absoluteFill}
        // rotate -90deg by applying a transform on a group
      >
        <G originX={size / 2} originY={size / 2} rotation={-90}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>

      <View style={styles.center}>
        {showValue ? (
          <Text style={[styles.value, { color }]}>{Math.round(clamped)}%</Text>
        ) : null}
        {label ? (
          <Text
            style={[
              styles.label,
              { color: isDarkMode ? '#94A3B8' : '#64748B' },
            ]}
          >
            {label}
          </Text>
        ) : null}
        {sublabel ? (
          <Text
            style={[
              styles.sublabel,
              { color: isDarkMode ? '#64748B' : '#94A3B8' },
            ]}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export interface CompactProgressRingProps {
  value: number;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const CompactProgressRing: React.FC<CompactProgressRingProps> = ({
  value,
  size = 40,
  color = '#6366f1',
  style,
}) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const trackColor = hexToRgba(color, 0.15);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <G originX={size / 2} originY={size / 2} rotation={-90}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>
      <Text style={[styles.compactValue, { color }]}>{Math.round(clamped)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    inset: 0 as unknown as number,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  sublabel: {
    fontSize: 10,
  },
  compactValue: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -8 }, { translateY: -7 }],
    fontSize: 10,
    fontWeight: '700',
  },
});

export default ProgressRing;