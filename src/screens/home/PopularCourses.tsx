import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  InteractionManager
} from 'react-native';
import Animated, {
  FadeInDown,
  Layout,
  FadeInRight
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { CornerUpRight, Download, Heart, Video, CircleDot, FileText } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';
import { ENDPOINTS, apiClient, BASE_URL } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import RatingBadge from '../../components/RatingBadge';
import CourseSkeleton from '../../components/skeletons/CourseSkeleton';
import { getImageUrl } from '../../utils/image.utils';

// --------------------------------------------------------
// 1. FALLBACK DATA
// --------------------------------------------------------
const FALLBACK_COURSES = [
  {
    _id: '1',
    course_category: 'PHYSICS',
    language: 'English',
    title: 'Stock Market Fundamentals & Analysis',
    teacher: { name: 'Atul Biswas' },
    video_count: 8,
    practice_set_count: 2,
    pdf_count: 4,
    discounted_price: 1999,
    actual_price: 3400,
    discount_percentage: 40,
    coverphoto: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
  }
];

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const PopularCourses = React.memo(() => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- WISHLIST STATES ---
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);

  // Initial Fetch: Courses + User's Wishlist
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Popular Courses
        const json = await apiClient(ENDPOINTS.GET_POPULAR_COURSES);
        const list = json?.data?.courses || [];
        setCourses(list.length > 0 ? list.slice(0, 4) : FALLBACK_COURSES);

        // 2. Fetch User Wishlist if logged in
        if (user?.token) {
          const wishlistRes = await fetch(`${BASE_URL}/wishlist/my`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const wishlistData = await wishlistRes.json();
          if (wishlistData?.data?.items) {
            // Filter only course type IDs
            const ids = new Set<string>(
              wishlistData.data.items
                .filter((item: any) => item.item_type === 'course')
                .map((item: any) => item.item_id)
            );
            setWishlistedIds(ids);
          }
        }
      } catch (err) {
        console.error('Failed to load data', err);
        setCourses(FALLBACK_COURSES);
      } finally {
        setLoading(false);
      }
    };
    const task = InteractionManager.runAfterInteractions(() => {
      fetchData();
    });
    return () => task.cancel();
  }, [user]);

  // Handle Toggle Wishlist (Add/Remove)
  const toggleWishlist = async (course: any) => {
    if (!user?.token) {
      showAlert("Login Required", "Please login to save courses to your wishlist! ❤️", [], "info");
      return;
    }

    if (wishlistLoadingId) return; // Prevent double clicks

    const isAlreadyWishlisted = wishlistedIds.has(course._id);
    setWishlistLoadingId(course._id);

    try {
      const res = await fetch(`${BASE_URL}/wishlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          item_type: 'course',
          item_id: course._id,
          snapshot: {
            title: course.title,
            teacher: course.teacher?.name || 'Atul Biswas',
            coverphoto: course.coverphoto,
            price: course.discounted_price || course.price
          }
        })
      });
      if (res.ok) {
        setWishlistedIds(prev => {
          const newSet = new Set(prev);
          isAlreadyWishlisted ? newSet.delete(course._id) : newSet.add(course._id);
          return newSet;
        });
        showAlert(isAlreadyWishlisted ? "Removed" : "Saved", isAlreadyWishlisted ? "Removed from wishlist" : "Added to wishlist! ❤️", [], "success");
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      showAlert("Error", "Failed to update wishlist", [], "error");
    } finally {
      setWishlistLoadingId(null);
    }
  };

  const formatPrice = (price: number) => `₹${Number(price).toLocaleString('en-IN')}`;

  const handleShare = async (courseTitle: string, courseId: string) => {
    try {
      await Share.share({
        message: `Check out this course: ${courseTitle}\nhttps://myedudocs.in/course-details/${courseId}`,
      });
    } catch (error) {
      console.log('Error sharing course:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Popular Courses</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Courses')}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {[1, 2, 3, 4].map((i) => <CourseSkeleton key={i} />)}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {courses.map((course, index) => {
            const isSaved = wishlistedIds.has(course._id);
            const isItemLoading = wishlistLoadingId === course._id;

            return (
              <Animated.View
                entering={FadeInRight.delay(index * 150).springify()}
                key={course._id}
                style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                {/* 1. Image & Share Button */}
                <View style={[styles.imageContainer, { backgroundColor: theme.colors.border }]}>
                  <Image source={{ uri: getImageUrl(course.coverphoto) }} style={styles.courseImage} />
                  <TouchableOpacity
                    style={[styles.shareButton, { backgroundColor: theme.colors.surface }]}
                    activeOpacity={0.8}
                    onPress={() => handleShare(course.title, course._id)}
                  >
                    <CornerUpRight color={theme.colors.primary} size={14} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* 2. Tags Row */}
                <View style={styles.tagsRow}>
                  <View style={styles.leftTags}>
                    <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? theme.colors.primaryLight : '#EEF2FF' }]}>
                      <Text style={[styles.categoryTag, { color: theme.colors.primary }]}>{course.course_category || 'GENERAL'}</Text>
                    </View>
                    <View style={[styles.vectorPill, { backgroundColor: isDarkMode ? theme.colors.surface : '#F8FAFC', borderColor: theme.colors.border }]}>
                      <Text style={[styles.langTag, { color: theme.colors.textMuted }]}>🌐 {course.language || 'English'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.syllabusBtn, { backgroundColor: isDarkMode ? theme.colors.primaryLight : '#F0FDF4', borderColor: isDarkMode ? theme.colors.primary : '#DCFCE7' }]} activeOpacity={0.7}>
                    <Download color={isDarkMode ? theme.colors.primary : '#10B981'} size={12} strokeWidth={3} />
                    <Text style={[styles.syllabusText, { color: isDarkMode ? theme.colors.primary : '#10B981' }]}>Syllabus</Text>
                  </TouchableOpacity>
                </View>

                {/* 3. Title & Wishlist */}
                <View style={styles.titleRow}>
                  <Text style={[styles.courseTitle, { color: theme.colors.textMain }]} numberOfLines={2}>{course.title || 'Untitled Course'}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleWishlist(course)}
                    disabled={isItemLoading}
                  >
                    {isItemLoading ? (
                      <ActivityIndicator size="small" color={theme.colors.danger} />
                    ) : (
                      <Heart
                        color={isSaved ? theme.colors.danger : theme.colors.textLight}
                        fill={isSaved ? theme.colors.danger : "transparent"}
                        size={20}
                        strokeWidth={2}
                      />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={[styles.mentorText, { color: theme.colors.textMuted }]}>
                  Mentor: {course.teacher?.name || course.teacher?.tname || 'Atul Biswas'}
                </Text>

                {/* ★ REAL RATINGS – course.rating is updated by the review system automatically */}
                <RatingBadge
                  itemId={course._id}
                  itemType="course"
                  preloadedRating={course.rating}
                  preloadedCount={course.ratingCount || course.reviewsCount}
                  size="sm"
                  token={user?.token}
                />

                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                {/* 4. Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Video color="#64748B" size={16} strokeWidth={2} style={styles.statIconSpacing} />
                    <Text style={styles.statText}>{course.video_count || 0} Videos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <CircleDot color="#EF4444" size={16} strokeWidth={2.5} style={styles.statIconSpacing} />
                    <Text style={styles.statText}>{course.practice_set_count || 0} Live</Text>
                  </View>
                  <View style={styles.statItem}>
                    <FileText color="#64748B" size={16} strokeWidth={2} style={styles.statIconSpacing} />
                    <Text style={styles.statText}>{course.pdf_count || 0} PDFs</Text>
                  </View>
                </View>

                {/* 5. Footer (Pricing & Enroll) */}
                <View style={styles.footerRow}>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.currentPrice, { color: theme.colors.primary }]}>{formatPrice(course.discounted_price || course.price || 1999)}</Text>
                    <View style={styles.oldPriceRow}>
                      <Text style={[styles.oldPrice, { color: theme.colors.textLight }]}>{formatPrice(course.actual_price || course.price || 3400)}</Text>
                      <Text style={[styles.discount, { color: theme.colors.success }]}>{course.discount_percentage || 40}% Off</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.enrollBtn, { backgroundColor: theme.colors.primary }]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('CourseDetails', { id: course._id })}
                  >
                    <Text style={styles.enrollBtnText}>Enroll Now</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
});

// --------------------------------------------------------
// 3. EXACT STYLES (Unchanged)
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: { marginTop: 24 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  seeAllText: { fontSize: 15, fontWeight: '600' },
  loaderContainer: { height: 320, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  card: {
    width: 280,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
  },
  imageContainer: { width: '100%', height: 140, borderRadius: 16, marginBottom: 16, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  courseImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  shareButton: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, backgroundColor: '#FFFFFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...staticTheme.shadows.medium },
  tagsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  leftTags: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTag: { fontSize: 10, fontWeight: '800', color: '#6366F6', textTransform: 'uppercase' },
  vectorPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langTag: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  syllabusBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#DCFCE7' },
  syllabusText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  courseTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 10, lineHeight: 22 },
  mentorText: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  statItem: { alignItems: 'center', justifyContent: 'center' },
  statIconSpacing: { marginBottom: 6 },
  statText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceContainer: { flexDirection: 'column' },
  currentPrice: { fontSize: 18, fontWeight: '700', color: '#6366F6' },
  oldPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  oldPrice: { fontSize: 11, color: '#94A3B8', textDecorationLine: 'line-through' },
  discount: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  enrollBtn: { backgroundColor: '#6366F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  enrollBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});