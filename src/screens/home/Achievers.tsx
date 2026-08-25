import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Award, Trophy } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const ACHIEVERS = [
  { id: '1', name: 'Rahul Sharma', rank: 'AIR 12', exam: 'SSC CGL 2023', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80' },
  { id: '2', name: 'Priya Verma', rank: 'Rank 5', exam: 'Bank PO 2023', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { id: '3', name: 'Amit Patel', rank: 'Selected', exam: 'Railway NTPC', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' },
  { id: '4', name: 'Sneha Gupta', rank: 'AIR 85', exam: 'UPSC CSE', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
];

export const Achievers = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Award color={theme.colors.primary} size={20} />
          <Text style={[styles.title, { color: theme.colors.textMain }]}>Our Achievers</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Success stories that inspire</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {ACHIEVERS.map((item, index) => (
          <Animated.View 
            key={item.id}
            entering={FadeInRight.delay(index * 120).duration(600)}
          >
            <TouchableOpacity 
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }
              ]} 
              activeOpacity={0.9}
            >
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item.image }} 
                  style={[
                    styles.image,
                    {
                      borderColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                    }
                  ]} 
                />
                <View style={[styles.rankBadge, { borderColor: isDarkMode ? theme.colors.surface : '#FFFFFF' }]}>
                  <Trophy color="#FFFFFF" size={10} fill="#FFFFFF" />
                  <Text style={styles.rankText}>{item.rank}</Text>
                </View>
              </View>
              <Text style={[styles.name, { color: theme.colors.textMain }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.exam, { color: theme.colors.textMuted }]} numberOfLines={1}>{item.exam}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
    paddingBottom: 10,
  },
  card: {
    width: 140,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    borderWidth: 2,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  name: {
    fontSize: 13,
    fontWeight: '800',
  },
  exam: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default Achievers;
