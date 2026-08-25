import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Search, CornerUpRight, PlayCircle, BookOpen } from 'lucide-react-native';
import { DirectorySkeleton } from '../../components/skeletons/DirectorySkeleton';
import { NotFound } from '../../components/NotFound';

// --- IMPORT GLOBAL AUTH & API ---
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';
import { Header } from '../home/Header';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../service/api.service';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// --------------------------------------------------------
// 1. TYPES & HELPERS
// --------------------------------------------------------
interface CourseItem {
  id: string;
  category: string;
  title: string;
  mentor: string;
  image: string;
  progress?: number; // undefined means not started
}

const getImageUrl = (path?: string) => {
  if (!path) return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80';
  if (path.startsWith('http')) return path;
  return `https://api.myedudocs.in/${path.replace(/\\/g, '/')}`;
};

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const MyCourses: React.FC<{ hideHeader?: boolean; hideBottomNav?: boolean }> = ({
  hideHeader = false,
  hideBottomNav = false,
}) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth(); // Access global user
  const { theme, isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState<'My Courses' | 'Explore Courses'>('My Courses');
  const [searchQuery, setSearchQuery] = useState('');

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH COURSES & PROGRESS LOGIC ---
  useEffect(() => {
    const loadCoursesAndProgress = async () => {
      if (!user?.id || !user?.token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Fetch Purchased Courses
        const res = await fetch(`${BASE_URL}/students/course/payment/my-courses/${user?.id}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        const data = await res.json();

        if (data.success && data.courses) {
          const fetchedCourses = data.courses;

          // 2. Fetch Progress for each course
          const coursesWithProgress: CourseItem[] = await Promise.all(
            fetchedCourses.map(async (c: any) => {
              let progressVal = undefined;

              try {
                // Same query parameters as your web version
                const queryParams = new URLSearchParams({
                  student_name: user?.name || "",
                  student_email: user?.email || "",
                  course_title: c.course?.title || "",
                  course_duration: c.course?.duration?.toString() || "0",
                  total_chapters: c.course?.chapters?.length?.toString() || "0"
                }).toString();

                const progRes = await fetch(
                  `${BASE_URL}/student/courses/progress/${user?.id}/${c.courseId}?${queryParams}`,
                  { headers: { Authorization: `Bearer ${user?.token}` } }
                );

                const progData = await progRes.json();
                if (progData?.success) {
                  progressVal = progData?.data?.overall_progress?.completion_percentage;
                }
              } catch (e) {
                console.log(`Failed to fetch progress for ${c.courseId}`);
              }

              return {
                id: c.courseId,
                category: c.course?.skill_level || c.course?.category || 'COURSE',
                title: c.course?.title || 'Untitled Course',
                mentor: c.course?.teacher_details?.tname || 'Expert Faculty',
                image: c.course?.coverphoto,
                progress: progressVal,
              };
            })
          );

          setCourses(coursesWithProgress);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'My Courses') {
      loadCoursesAndProgress();
    }
  }, [user, activeTab]);

  // --- FILTERING ---
  const displayedCourses = useMemo(() => {
    if (!searchQuery) return courses;
    return courses.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mentor.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  // --- RENDER ITEM ---
  const renderCourseItem = useCallback(({ item: course, index }: { item: CourseItem; index: number }) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        <View style={styles.cardHeader}>
          <Image source={{ uri: getImageUrl(course.image) }} style={styles.courseImage} />
          <View style={styles.courseInfo}>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryText}>{course.category}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('CourseDetails', { id: course.id })}>
                <CornerUpRight color={theme.colors.primary} size={16} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.courseTitle, { color: theme.colors.textMain }]} numberOfLines={2}>{course.title}</Text>
            <Text style={[styles.mentorText, { color: theme.colors.textMuted }]}>Mentor: {course.mentor}</Text>
          </View>
        </View>

        {course.progress !== undefined && course.progress > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressTextRow}>
              <Text style={[styles.progressLabel, { color: theme.colors.textMuted }]}>Progress</Text>
              <Text style={[styles.progressValue, { color: theme.colors.primary }]}>{course.progress}% Completed</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
              <View style={[styles.progressBarFill, { backgroundColor: theme.colors.primary, width: `${course.progress}%` }]} />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CourseLearning', { id: course.id })}
        >
          <PlayCircle color="#FFFFFF" size={16} strokeWidth={2.5} />
          <Text style={styles.actionBtnText}>
            {course.progress !== undefined && course.progress > 0 ? "Resume Learning" : "Start Learning"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [navigation]);

  return (
    <ScreenContainer
      header={hideHeader ? undefined : { title: 'My Courses', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      noSafeArea={hideHeader}
      scroll={false}
    >
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: 'transparent' }, activeTab === 'My Courses' && [styles.activeTab, { backgroundColor: theme.colors.surface }]]}
          onPress={() => setActiveTab('My Courses')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: theme.colors.textMuted }, activeTab === 'My Courses' && [styles.activeTabText, { color: theme.colors.primary }]]}>My Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: 'transparent' }, activeTab === 'Explore Courses' && [styles.activeTab, { backgroundColor: theme.colors.surface }]]}
          onPress={() => {
            setActiveTab('Explore Courses');
            navigation.navigate('Courses');
            setTimeout(() => setActiveTab('My Courses'), 500);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: theme.colors.textMuted }, activeTab === 'Explore Courses' && [styles.activeTabText, { color: theme.colors.primary }]]}>Explore Courses</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Search color={theme.colors.textLight} size={18} strokeWidth={2.5} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.textMain }]}
          placeholder="Search by course or mentor..."
          placeholderTextColor={theme.colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <DirectorySkeleton type="card" count={3} />
      ) : (
        <FlatList
          data={displayedCourses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourseItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <NotFound
              type={searchQuery ? 'search' : 'course'}
              title={searchQuery ? "No Courses Found" : "No Enrolled Courses"}
              subtitle={
                searchQuery
                  ? `No enrolled courses match "${searchQuery}".`
                  : "You haven't enrolled in any courses yet. Explore our course catalog to find live classes, test series, and notes!"
              }
              buttonText={searchQuery ? "Clear Search" : "Explore Courses"}
              onButtonPress={searchQuery ? () => setSearchQuery('') : () => navigation.navigate('Courses')}
              fullScreen={false}
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 3. EXACT STYLES (100% Untouched)
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background,
  },

  // --- TABS ---
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: staticTheme.colors.border,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: staticTheme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: staticTheme.colors.textMuted,
  },
  activeTabText: {
    color: staticTheme.colors.primary,
  },

  // --- SEARCH BAR ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 20,
    backgroundColor: staticTheme.colors.surface,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: staticTheme.colors.textMain,
    height: '100%',
  },

  // --- LIST ---
  listContent: {
    paddingBottom: 100,
    gap: 16,
  },

  // --- COURSE CARD ---
  card: {
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },

  // Header: Image + Info
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  courseImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#1E3A5F',
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: staticTheme.colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: staticTheme.colors.textMain,
    lineHeight: 18,
    marginBottom: 4,
  },
  mentorText: {
    fontSize: 11,
    color: staticTheme.colors.textMuted,
  },

  // Progress Section
  progressSection: {
    marginBottom: 16,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: staticTheme.colors.textMuted,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: staticTheme.colors.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: staticTheme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: staticTheme.colors.primary,
    borderRadius: 3,
  },

  // Action Button
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticTheme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionBtnText: {
    color: staticTheme.colors.surface,
    fontSize: 13,
    fontWeight: '600',
  },
});