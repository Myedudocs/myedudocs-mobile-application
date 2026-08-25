import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Users, BookOpen, GraduationCap, Download, CheckCircle, Briefcase } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const STATS = [
  { label: 'Active Students', value: '13K+', icon: Users, color: '#6366F1' },
  { label: 'Expert Educators', value: '8+', icon: GraduationCap, color: '#A855F7' },
  { label: 'Online Courses', value: '450+', icon: BookOpen, color: '#22C55E' },
  { label: 'Study Resources', value: '15K+', icon: Download, color: '#F59E0B' },
  { label: 'Job Listings', value: '220+', icon: Briefcase, color: '#EC4899' },
  { label: 'Success Rate', value: '94%', icon: CheckCircle, color: '#06B6D4' },
];

export const PlatformStats = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textMain }]}>Numbers That Speak</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Trusted by thousands of students across India
        </Text>
      </View>
      
      <View style={styles.grid}>
        {STATS.map((stat, index) => (
          <Animated.View 
            key={index}
            entering={FadeInDown.delay(index * 80).duration(500)}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDarkMode ? `${stat.color}25` : `${stat.color}15`,
                },
              ]}
            >
              <stat.icon color={stat.color} size={20} />
            </View>
            <Text style={[styles.value, { color: theme.colors.textMain }]}>{stat.value}</Text>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>{stat.label}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 10,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default PlatformStats;
