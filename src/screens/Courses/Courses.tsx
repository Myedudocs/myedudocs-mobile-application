import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Share,
  Modal,
  FlatList,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  Globe,
  Download,
  Share as ShareIcon,
  Heart,
  Video,
  CircleDot,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  BookOpen
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';
import { Header } from '../home/Header';
import { ENDPOINTS, apiClient, BASE_URL } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';
import RatingBadge from '../../components/RatingBadge';
import CourseSkeleton from '../../components/skeletons/CourseSkeleton';
import { NotFound } from '../../components/NotFound';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { getImageUrl } from '../../utils/image.utils';

// --------------------------------------------------------
// 1. TYPES & CONSTANTS
// --------------------------------------------------------
const FILTERS = ['All Exams', 'NEET', 'JEE', 'SSC', 'UPSC', 'BANKING'];

type AlertType = 'success' | 'error' | 'warning' | 'info';
interface CustomAlertConfig {
  visible: boolean; title: string; message: string; type: AlertType;
  onConfirm?: () => void; confirmText?: string;
}

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const Courses = () => {
  const navigation = useNavigation<any>(); 
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  
  const [activeFilter, setActiveFilter] = useState('All Exams');
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- WISHLIST & ALERT STATES ---
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({ 
    visible: false, title: '', message: '', type: 'info' 
  });

  const triggerAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm, confirmText: 'OK' });
  };
  const hideAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Courses
        const json = await apiClient(ENDPOINTS.GET_POPULAR_COURSES);
        const list = json?.data?.courses || [];
        setCourses(Array.isArray(list) ? list : []);

        // 2. Sync Wishlist if logged in
        if (user?.token) {
          const wishlistRes = await fetch(`${BASE_URL}/wishlist/my`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const wishlistData = await wishlistRes.json();
          if (wishlistData?.data?.items) {
            const ids = new Set<string>(
              wishlistData.data.items
                .filter((i: any) => i.item_type === 'course')
                .map((i: any) => i.item_id)
            );
            setWishlistedIds(ids);
          }
        }
      } catch (err) {
        console.error('Failed to load courses', err);
        setCourses([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // --- ACTIONS ---
  const toggleWishlist = async (course: any) => {
    if (!user?.token) {
      triggerAlert("Login Required", "Please login to save courses to your wishlist ❤️", "info");
      return;
    }
    if (wishlistLoadingId) return;

    const isSaved = wishlistedIds.has(course._id);
    setWishlistLoadingId(course._id);

    try {
      const res = await fetch(`${BASE_URL}/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          item_type: 'course',
          item_id: course._id,
          snapshot: {
            title: course.title,
            teacher: { name: course.teacher?.name || 'Academic Expert' },
            coverphoto: course.coverphoto,
            image: course.coverphoto,
            price: course.discounted_price || course.price,
            discounted_price: course.discounted_price,
            actual_price: course.actual_price,
            discount_percentage: course.discount_percentage,
            language: course.language,
            category: course.course_category,
            video_count: course.video_count,
            pdf_count: course.pdf_count,
            rating: course.rating,
            ratingCount: course.ratingCount,
          }
        })
      });
      if (res.ok) {
        setWishlistedIds(prev => {
          const n = new Set(prev);
          isSaved ? n.delete(course._id) : n.add(course._id);
          return n;
        });
        triggerAlert(isSaved ? "Removed" : "Saved", isSaved ? "Removed from wishlist" : "Added to your wishlist!", "success");
      }
    } catch (err) {
      triggerAlert("Error", "Failed to update wishlist", "error");
    } finally {
      setWishlistLoadingId(null);
    }
  };

  const handleShare = async (courseTitle: string, courseId: string) => {
    try {
      await Share.share({
        message: `Check out this course: ${courseTitle}\nhttps://myedudocs.in/course-details/${courseId}`,
      });
    } catch (error) {
      console.log('Error sharing course:', error);
    }
  };

  const formatPrice = (price: number) => `₹${Number(price).toLocaleString('en-IN')}`;

  // --- FILTERING LOGIC ---
  const displayedCourses = useMemo(() => {
    const filtered = activeFilter === 'All Exams' 
      ? courses 
      : courses.filter(c => c.course_category?.toUpperCase() === activeFilter.toUpperCase());

    return filtered.filter(c => 
      c.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, activeFilter, searchQuery]);

  // --- RENDER ITEM ---
  const renderCourseItem = useCallback(({ item: course }: any) => {
    const isSaved = wishlistedIds.has(course._id);
    const isItemLoading = wishlistLoadingId === course._id;

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Image source={{ uri: getImageUrl(course.coverphoto) || '' }} style={styles.courseImage} />

        <View style={styles.tagsRow}>
          <View style={styles.leftTags}>
            <Text style={styles.tagPrimary}>{course.course_category || 'GENERAL'}</Text>
            <View style={styles.languageWrap}>
              <Globe color={theme.colors.textMuted} size={12} strokeWidth={2} />
              <Text style={[styles.tagMuted, { color: theme.colors.textMuted }]}>{course.language || 'English'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.syllabusBtn, { backgroundColor: isDarkMode ? theme.colors.border : '#F5F8FF', borderColor: theme.colors.border }]} 
            activeOpacity={0.7} 
            onPress={() => {
              const url = getImageUrl(course.syllabus);
              if (url) Linking.openURL(url);
            }}
          >
            <Download color={theme.colors.primary} size={12} strokeWidth={2.5} />
            <Text style={[styles.syllabusText, { color: theme.colors.primary }]}>Free Syllabus</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.courseTitle, { color: theme.colors.textMain }]} numberOfLines={2}>{course.title || 'Untitled Course'}</Text>
          <View style={styles.titleIcons}>
            <TouchableOpacity activeOpacity={0.7} style={{ marginRight: 12 }} onPress={() => handleShare(course.title, course._id)}>
              <ShareIcon color={theme.colors.textMuted} size={18} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => toggleWishlist(course)} disabled={isItemLoading}>
              {isItemLoading ? <ActivityIndicator size="small" color="#EF4444" /> : <Heart color={isSaved ? "#EF4444" : theme.colors.textMuted} fill={isSaved ? "#EF4444" : "transparent"} size={18} strokeWidth={2} />}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.mentorText, { color: theme.colors.textMuted }]}>Mentor: {course.teacher?.name || 'Academic Expert'}</Text>

        {/* ★ REAL RATING from backend — auto-updated when students submit reviews */}
        <RatingBadge
          itemId={course._id}
          itemType="course"
          preloadedRating={course.rating}
          preloadedCount={course.ratingCount || course.reviewsCount}
          size="sm"
          token={user?.token}
        />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Video color={theme.colors.textMuted} size={14} strokeWidth={2} style={styles.statIcon} />
            <Text style={[styles.statText, { color: theme.colors.textMuted }]}>{course.video_count || 0} Videos</Text>
          </View>
          <View style={styles.statItem}>
            <CircleDot color="#EF4444" size={14} strokeWidth={2.5} style={styles.statIcon} />
            <Text style={[styles.statText, { color: theme.colors.textMuted }]}>{course.practice_set_count || 0} Live</Text>
          </View>
          <View style={styles.statItem}>
            <FileText color={theme.colors.textMuted} size={14} strokeWidth={2} style={styles.statIcon} />
            <Text style={[styles.statText, { color: theme.colors.textMuted }]}>{course.pdf_count || 0} PDFs</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.priceContainer}>
            <Text style={[styles.currentPrice, { color: theme.colors.primary }]}>{formatPrice(course.discounted_price || course.price)}</Text>
            <View style={styles.oldPriceRow}>
              <Text style={[styles.oldPrice, { color: theme.colors.textLight }]}>{formatPrice(course.actual_price)}</Text>
              <Text style={styles.discount}>{course.discount_percentage}% Off</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.enrollBtn, { backgroundColor: theme.colors.primary }]} activeOpacity={0.8} onPress={() => navigation.navigate('CourseDetails', { id: course._id })}>
            <Text style={styles.enrollBtnText}>Enroll Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [wishlistedIds, wishlistLoadingId, user?.token, navigation]);

  return (
    <ScreenContainer
      header={{ title: 'Explore Courses', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
      contentStyle={styles.listContent}
    >

      {/* --- COURSE LIST (with search/filter as ListHeaderComponent) --- */}
      {loading ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {[1, 2, 3].map((key) => <CourseSkeleton key={key} />)}
        </ScrollView>
      ) : (
        <FlatList
          data={displayedCourses}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={renderCourseItem}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListHeaderComponent={
            <View>
              {/* --- SEARCH BAR --- */}
              <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Search color={theme.colors.textLight} size={18} strokeWidth={2.5} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.textMain }]}
                  placeholder="Search courses..."
                  placeholderTextColor={theme.colors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* --- HORIZONTAL FILTERS --- */}
              <View style={styles.filtersWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
                  {FILTERS.map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.filterPill,
                        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                        activeFilter === filter && [styles.filterPillActive, { backgroundColor: isDarkMode ? theme.colors.border : '#EEF2FF', borderColor: isDarkMode ? theme.colors.primary : '#EEF2FF' }]
                      ]}
                      onPress={() => setActiveFilter(filter)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterText, { color: theme.colors.textMuted }, activeFilter === filter && [styles.filterTextActive, { color: theme.colors.primary }]]}>
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          }
          ListEmptyComponent={
            <NotFound
              type={searchQuery || activeFilter !== 'All Exams' ? 'search' : 'course'}
              title={searchQuery || activeFilter !== 'All Exams' ? "No Courses Found" : "No Courses Available"}
              subtitle={
                searchQuery
                  ? `We couldn't find any courses matching "${searchQuery}".`
                  : activeFilter !== 'All Exams'
                  ? `No courses available in category "${activeFilter}".`
                  : "New courses and live batches are coming soon! Check back later."
              }
              buttonText={searchQuery || activeFilter !== 'All Exams' ? "Clear Filters" : undefined}
              onButtonPress={searchQuery || activeFilter !== 'All Exams' ? () => { setSearchQuery(''); setActiveFilter('All Exams'); } : undefined}
              fullScreen={false}
            />
          }
        />
      )}

      {/* --- CUSTOM ALERT MODAL --- */}
      <Modal visible={customAlert.visible} transparent={true} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={[styles.alertBox, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.alertIconBox,
              customAlert.type === 'success' && { backgroundColor: '#ECFDF5' },
              customAlert.type === 'error' && { backgroundColor: '#FEF2F2' },
              customAlert.type === 'info' && { backgroundColor: isDarkMode ? theme.colors.border : '#EEF2FF' },
            ]}>
              {customAlert.type === 'success' && <CheckCircle2 color="#10B981" size={32} />}
              {customAlert.type === 'error' && <XCircle color="#EF4444" size={32} />}
              {customAlert.type === 'warning' && <AlertTriangle color="#F59E0B" size={32} />}
              {customAlert.type === 'info' && <Info color={theme.colors.primary} size={32} />}
            </View>
            <Text style={[styles.alertTitle, { color: theme.colors.textMain }]}>{customAlert.title}</Text>
            <Text style={[styles.alertMsg, { color: theme.colors.textMuted }]}>{customAlert.message}</Text>
            <TouchableOpacity style={[styles.alertBtn, { backgroundColor: theme.colors.primary }]} onPress={hideAlert}>
              <Text style={styles.alertBtnText}>{customAlert.confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 4. EXACT STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: staticTheme.colors.background },
  container: { flex: 1, paddingTop: staticTheme.spacing.lg },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, color: staticTheme.colors.textMuted, fontSize: 14 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: staticTheme.colors.border, borderRadius: 8, paddingHorizontal: 12, height: 44, marginBottom: 16, backgroundColor: staticTheme.colors.surface },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: staticTheme.colors.textMain, height: '100%' },

  filtersWrapper: { marginBottom: 20 },
  filtersScrollContent: { gap: 12 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: staticTheme.colors.border, backgroundColor: staticTheme.colors.surface },
  filterPillActive: { backgroundColor: staticTheme.colors.primaryLight, borderColor: staticTheme.colors.primaryLight },
  filterText: { fontSize: 13, fontWeight: '600', color: staticTheme.colors.textMuted },
  filterTextActive: { color: staticTheme.colors.primary },

  listContent: { paddingBottom: 100, gap: 16 },

  card: { borderWidth: 1, borderColor: staticTheme.colors.border, borderRadius: 16, padding: 14, backgroundColor: staticTheme.colors.surface },
  courseImage: { width: '100%', height: 140, borderRadius: 10, marginBottom: 16, backgroundColor: '#1E3A5F', resizeMode: 'cover' },

  tagsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leftTags: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagPrimary: { color: staticTheme.colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  languageWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagMuted: { color: staticTheme.colors.textMuted, fontSize: 12, fontWeight: '500' },
  syllabusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: staticTheme.colors.border, backgroundColor: staticTheme.colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  syllabusText: { color: staticTheme.colors.primary, fontSize: 10, fontWeight: '600' },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  courseTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: staticTheme.colors.textMain, lineHeight: 22, marginRight: 12 },
  titleIcons: { flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
  mentorText: { fontSize: 12, color: staticTheme.colors.textMuted, marginBottom: 16 },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statIcon: { marginRight: 6 },
  statText: { fontSize: 11, color: staticTheme.colors.textMuted, fontWeight: '600' },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: staticTheme.colors.border },
  priceContainer: { flexDirection: 'column' },
  currentPrice: { fontSize: 16, fontWeight: '700', color: staticTheme.colors.primary },
  oldPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  oldPrice: { fontSize: 11, color: staticTheme.colors.textLight, textDecorationLine: 'line-through' },
  discount: { fontSize: 11, fontWeight: '700', color: staticTheme.colors.success },
  enrollBtn: { backgroundColor: staticTheme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  enrollBtnText: { color: staticTheme.colors.surface, fontSize: 13, fontWeight: '600' },

  alertOverlay: { flex: 1, backgroundColor: staticTheme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: staticTheme.colors.surface, width: '100%', maxWidth: 340, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
  alertIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 18, fontWeight: '800', color: staticTheme.colors.textMain, marginBottom: 8 },
  alertMsg: { fontSize: 14, color: staticTheme.colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  alertBtn: { backgroundColor: staticTheme.colors.primary, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  alertBtnText: { color: staticTheme.colors.surface, fontWeight: '700', fontSize: 15 }
});