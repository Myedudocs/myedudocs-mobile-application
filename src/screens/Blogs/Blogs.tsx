import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Clock,
  ArrowRight,
  Coins,
  Edit3 // <-- Imported Edit icon for the Write & Earn button
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ENDPOINTS, apiClient } from '../../service/api.service';
import { BlogSkeleton } from '../../components/skeletons/BlogSkeleton';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// --------------------------------------------------------
// 1. FALLBACK DATA (Prevents UI breaking)
// --------------------------------------------------------
const FALLBACK_BLOGS = [
  {
    _id: 'b1',
    content_category: 'EXAM PREPARATION',
    content: 'Lorem ipsum...',
    createdAt: new Date().toISOString(),
    content_subject: 'How to Master Indian Polity for UPSC 2026',
    isCompleted: false,
    earnCoins: 20,
    featured_image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80',
  },
  {
    _id: 'b2',
    content_category: 'TIPS & TRICKS',
    content: 'Lorem ipsum...',
    createdAt: new Date().toISOString(),
    content_subject: '10 Time Management Hacks for NEET',
    isCompleted: true,
    earnCoins: 20,
    featured_image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80',
  },
];

// --------------------------------------------------------
// 2. HELPER FUNCTIONS
// --------------------------------------------------------
const getCoverImage = (blog: any): string => {
  let imgPath = blog.featured_image || blog.schema_image || blog.featured_images?.[0];
  if (!imgPath) return 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80';
  if (imgPath.startsWith('http')) return imgPath;
  return `https://api.myedudocs.in/${imgPath.replace(/\\/g, '/')}`;
};

const getReadingTime = (content: string) => {
  if (!content) return '5 min read';
  const text = content.replace(/<[^>]*>/g, ""); // Strip HTML tags
  const words = text.trim().split(/\s+/).length;
  return `${Math.ceil(words / 200)} min read`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Recently';
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// --------------------------------------------------------
// 3. MAIN COMPONENT
// --------------------------------------------------------
export const Blogs = () => {
  const navigation = useNavigation<any>();
  const { theme, isDarkMode } = useTheme();
  const [activeFilter, setActiveFilter] = useState('All Blogs');
  
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await apiClient(ENDPOINTS.GET_BLOGS);
        const blogPosts = data.result || data.data || [];

        const approvedBlogs = blogPosts
          .filter((blog: any) => blog.approved === true)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (approvedBlogs.length > 0) {
          setBlogs(approvedBlogs);
        } else {
          setBlogs(FALLBACK_BLOGS);
        }
      } catch (err) {
        console.error('Failed to load blogs', err);
        setBlogs(FALLBACK_BLOGS);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // --- DYNAMIC FILTERS ---
  // Automatically generate category pills based on the blogs fetched
  const dynamicFilters = useMemo(() => {
    if (!blogs || blogs.length === 0) return ['All Blogs'];
    const categories = blogs
      .map(b => b.content_category)
      .filter((value, index, self) => value && self.indexOf(value) === index);
    return ['All Blogs', ...categories];
  }, [blogs]);

  // --- FILTERING LOGIC ---
  const displayedBlogs = useMemo(() => {
    if (activeFilter === 'All Blogs') return blogs;
    return blogs.filter(b => b.content_category === activeFilter);
  }, [blogs, activeFilter]);

  // --- RENDER CARD ---
  const renderBlogCard = ({ item }: { item: any }) => {
    const isCompleted = item.isCompleted || false;
    const earnedCoins = item.earnCoins || item.coins || 20;

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('BlogDetails', { id: item._id })}
      >
        {/* Card Image */}
        <Image source={{ uri: getCoverImage(item) }} style={styles.cardImage} />

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={[styles.tagWrap, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.12)' : '#F5F8FF', borderColor: isDarkMode ? 'rgba(99,102,241,0.3)' : '#E0E7FF' }]}>
            <Text style={styles.tagText}>{item.content_category || 'GENERAL'}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock color={theme.colors.textMuted} size={10} strokeWidth={2.5} />
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{getReadingTime(item.content)}</Text>
            </View>
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
          </View>

          <Text style={[styles.cardTitle, { color: theme.colors.textMain }]} numberOfLines={2}>
            {item.content_subject || 'Untitled Insight'}
          </Text>

          <View style={styles.readMoreRow}>
            <Text style={styles.readMoreText}>
              {isCompleted ? 'Read Again' : 'Read More'}
            </Text>
            <ArrowRight color="#6366F6" size={14} strokeWidth={2.5} />
          </View>
        </View>

      </TouchableOpacity>
    );
  };

  const writeEarnButton = (
    <TouchableOpacity
      style={[styles.publishBtn, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('PublishBlogs')}
    >
      <Edit3 color="#6366F6" size={14} strokeWidth={2.5} />
      <Text style={styles.publishBtnText}>Write & Earn</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer
      header={{
        title: 'Blogs',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
        rightElement: writeEarnButton,
      }}
      scroll={false}
    >
      {/* --- HORIZONTAL FILTERS --- */}
      <View style={[styles.filtersWrapper, { backgroundColor: theme.colors.surface }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {dynamicFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill, 
                { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: theme.colors.border },
                activeFilter === filter && styles.filterPillActive
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText, 
                { color: theme.colors.textSecondary },
                activeFilter === filter && styles.filterTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* --- GRID LIST --- */}
      {loading ? (
        <View style={styles.listContent}>
          <View style={styles.columnWrapper}>
            <BlogSkeleton />
            <BlogSkeleton />
          </View>
          <View style={styles.columnWrapper}>
            <BlogSkeleton />
            <BlogSkeleton />
          </View>
        </View>
      ) : displayedBlogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No blogs found in this category.</Text>
        </View>
      ) : (
        <FlatList
          data={displayedBlogs}
          keyExtractor={(item) => item._id}
          numColumns={2}
          renderItem={renderBlogCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 4. EXACT STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIcon: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  
  // NEW: Publish Button Styles
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  publishBtnText: {
    color: '#6366F6',
    fontSize: 12,
    fontWeight: '700',
  },

  // Filters
  filtersWrapper: {
    marginBottom: 16,
  },
  filtersScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 4,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: '#6366F6',
    borderColor: '#6366F6',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // FlatList Config
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16, 
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 16, 
  },

  // Card Styles
  card: {
    width: '47.5%', 
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 110,
    backgroundColor: '#1E3A5F', 
    resizeMode: 'cover',
  },
  cardBody: {
    padding: 10,
  },
  tagWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    backgroundColor: '#F5F8FF',
    marginBottom: 10,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6366F6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#94A3B8',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 8,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F6',
  },
});