import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ImageBackground 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  useSharedValue,
  FadeInUp,
  FadeInRight
} from 'react-native-reanimated';
import { Zap, Target, Trophy, ChevronRight, Star } from 'lucide-react-native';
import { theme as staticTheme } from '../../styles/theme';

const { width } = Dimensions.get('window');

const QuestCard = ({ title, sub, icon: Icon, color, delay }: any) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View 
      entering={FadeInRight.delay(delay).duration(800)}
      style={[styles.questCard, floatingStyle]}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Icon color={color} size={24} />
      </View>
      <View style={styles.questInfo}>
        <Text style={styles.questTitle}>{title}</Text>
        <Text style={styles.questSub}>{sub}</Text>
      </View>
      <ChevronRight color="#CBD5E1" size={16} />
    </Animated.View>
  );
};

export const LearningHub = () => {
  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'file:///C:/Users/rickb/.gemini/antigravity/brain/5a5b54d7-420f-42f0-896c-6fc85db630dd/learning_quest_hub_1778844025024.png' }}
        style={styles.bgContainer}
        imageStyle={styles.bgImage}
      >
        <View style={styles.overlay}>
          <Animated.View entering={FadeInUp.duration(1000)} style={styles.header}>
            <View style={styles.badge}>
              <Zap color="#F59E0B" size={14} fill="#F59E0B" />
              <Text style={styles.badgeText}>ACTIVE MISSION</Text>
            </View>
            <Text style={styles.title}>Your Learning Quest</Text>
            <Text style={styles.subtitle}>Complete daily goals to unlock rewards</Text>
          </Animated.View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>1,250</Text>
              <Text style={styles.statLab}>EXP EARNED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>#42</Text>
              <Text style={styles.statLab}>GLOBAL RANK</Text>
            </View>
          </View>

          <View style={styles.questList}>
            <QuestCard 
              title="Daily Challenge" 
              sub="15 Questions • 200 XP" 
              icon={Target} 
              color="#6366F1"
              delay={200}
            />
            <QuestCard 
              title="Global Rank" 
              sub="Beat your best score" 
              icon={Trophy} 
              color="#F59E0B"
              delay={400}
            />
          </View>

          <TouchableOpacity style={styles.mainBtn} activeOpacity={0.8}>
            <Text style={styles.mainBtnText}>Continue Quest</Text>
            <ChevronRight color="#FFF" size={20} />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    elevation: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  bgContainer: {
    width: '100%',
  },
  bgImage: {
    opacity: 0.4,
    transform: [{ scale: 1.2 }, { translateX: 20 }],
  },
  overlay: {
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  header: {
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLab: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  questList: {
    gap: 12,
    marginBottom: 24,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  questSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  mainBtn: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  mainBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
