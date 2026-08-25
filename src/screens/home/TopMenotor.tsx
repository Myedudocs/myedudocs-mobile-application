import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ImageBackground,
  Dimensions
} from 'react-native';
import Animated, {
  FadeInRight,
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue
} from 'react-native-reanimated';
import { theme as staticTheme } from '../../styles/theme';
import { ENDPOINTS, apiClient } from '../../service/api.service';
import MentorSkeleton from '../../components/skeletons/MentorSkeleton';
import { Sparkles, Star, Award, GraduationCap } from 'lucide-react-native';
import { getImageUrl } from '../../utils/image.utils';

const { width } = Dimensions.get('window');

// --------------------------------------------------------
// 1. TYPES & FALLBACK DATA
// --------------------------------------------------------
// Mapped to your TeacherSchema
interface Teacher {
  _id: string;
  tname: string;
  tspecialization: string;
  tprofile: string;
}

const FALLBACK_MENTORS: Teacher[] = [
  { _id: '1', tname: 'Mainak B.', tspecialization: 'Computer Science', tprofile: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80' },
  { _id: '2', tname: 'Jatin S.', tspecialization: 'Economics Expert', tprofile: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80' },
  { _id: '3', tname: 'Anish V.', tspecialization: 'Mathematics', tprofile: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&q=80' },
];

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
const MentorCard = ({ mentor, index }: { mentor: Teacher, index: number }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }]
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(800)}
      style={[animatedStyle]}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPressIn={() => scale.value = 0.95}
        onPressOut={() => scale.value = 1}
        accessibilityRole="button"
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUrl(mentor.tprofile) }}
            style={styles.image}
          />
          <View style={styles.badgeContainer}>
            <Star color="#F59E0B" fill="#F59E0B" size={10} />
            <Text style={styles.badgeText}>Top Rated</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.name} numberOfLines={1}>{mentor.tname}</Text>
          <View style={styles.subjectRow}>
            <GraduationCap color={staticTheme.colors.primary} size={12} />
            <Text style={styles.subject} numberOfLines={1}>{mentor.tspecialization}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.expBox}>
            <Award size={10} color="#6366F1" />
            <Text style={styles.expText}>Expert</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Text style={styles.profileBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const TopMentors = React.memo(() => {
  const [mentors, setMentors] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const json = await apiClient(ENDPOINTS.GET_TOP_MENTORS);
        const list = json?.Teachers || [];

        if (list.length > 0) {
          const activeMentors = list
            .filter((t: any) => t.Status === 'approved' || t.isActive === true)
            .slice(0, 6);
          setMentors(activeMentors.length > 0 ? activeMentors : list.slice(0, 6));
        } else {
          setMentors(FALLBACK_MENTORS);
        }
      } catch (err) {
        console.error('Failed to load mentors:', err);
        setMentors(FALLBACK_MENTORS);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/images/mentor_bg.png')} // I'll assume I can save it or use a URL if I have one
        style={styles.bgImage}
        imageStyle={{ opacity: 0.1, tintColor: staticTheme.colors.primary }}
      >
        <Animated.View entering={FadeInDown.duration(1000)} style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              <Sparkles color="#F59E0B" size={18} />
              <Text style={styles.title}>Expert Spotlight</Text>
            </View>
            <Text style={styles.subtitle}>Learn from industry-leading mentors</Text>
          </View>
          <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </Animated.View>

        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {[1, 2, 3, 4].map((_, i) => <MentorSkeleton key={i} />)}
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            snapToInterval={180 + 16}
            decelerationRate="fast"
          >
            {mentors.map((mentor, index) => (
              <MentorCard key={mentor._id} mentor={mentor} index={index} />
            ))}
          </ScrollView>
        )}
      </ImageBackground>
    </View>
  );
});

// --------------------------------------------------------
// 4. EXACT STYLES (Unchanged)
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
  },
  bgImage: {
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  seeAllBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: staticTheme.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 16,
  },
  card: {
    width: 180,
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  cardContent: {
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subject: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  expBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  expText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
  },
  profileBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  profileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});