import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Share
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  CornerUpRight, 
  Clock, 
  Coins, 
  CalendarDays,
  Share2,
  BookOpen,
  Zap,
  Globe,
  Briefcase,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';
import { ENDPOINTS, apiClient } from '../../service/api.service';
import BlogSkeleton from '../../components/skeletons/BlogSkeleton';

// --------------------------------------------------------
// 1. TYPES & FALLBACK DATA (Prevents UI breaking)
// --------------------------------------------------------
interface BlogPost {
  _id: string;
  content_subject: string;
  content_category: string;
  content: string;
  createdAt: string;
  approved: boolean;
  featured_image?: string;
  schema_image?: string;
  featured_images?: string[];
  earnCoins?: number; // Added to match your UI mockup logic
}

const FALLBACK_BLOGS: BlogPost[] = [
  {
    _id: '1',
    content_category: 'Exam Strategy',
    content_subject: 'How to Crack UPSC Prelims in 6 Months',
    content: 'Discover the proven roadmap, study materials, and daily routines followed by top rankers to clear the exam.',
    createdAt: new Date().toISOString(),
    approved: true,
    featured_image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    earnCoins: 50,
  },
  {
    _id: '2',
    content_category: 'Study Tips',
    content_subject: 'Top 10 Memory Hacks for Medical Students',
    content: 'Struggling to remember complex anatomical terms? Try these scientifically proven retention techniques today.',
    createdAt: new Date().toISOString(),
    approved: true,
    featured_image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',
    earnCoins: 30,
  },
];

// --------------------------------------------------------
// 2. HELPER FUNCTIONS
// --------------------------------------------------------
const getCoverImage = (blog: BlogPost): string => {
  let imgPath = null;
  if (blog.featured_image) imgPath = blog.featured_image;
  else if (blog.schema_image) imgPath = blog.schema_image;
  else if (blog.featured_images?.length) imgPath = blog.featured_images[0];

  if (!imgPath) return FALLBACK_BLOGS[0].featured_image!;
  if (imgPath.startsWith('http')) return imgPath;
  return `https://api.myedudocs.in/${imgPath}`;
};

const getReadingTime = (content: string) => {
  if (!content) return '5 min read';
  const text = content.replace(/<[^>]*>/g, ""); // Strip HTML tags
  const words = text.trim().split(/\s+/).length;
  return `${Math.ceil(words / 200)} min read`;
};

const getExcerpt = (content: string) => {
  if (!content) return 'Read this comprehensive guide to boost your preparation.';
  const text = content.replace(/<[^>]*>/g, ""); // Strip HTML
  return text.length > 85 ? text.slice(0, 85) + '...' : text;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Recently';
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const generateSlug = (title: string, id: string): string => {
  const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${slug}-${id}`;
};

// --------------------------------------------------------
// 3. MAIN COMPONENT
// --------------------------------------------------------
const CategoryPill = ({ label, icon: Icon, active, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.pill, active && styles.pillActive]} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Icon size={14} color={active ? '#FFFFFF' : '#64748B'} />
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export const PopularBlogs = React.memo(() => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await apiClient(ENDPOINTS.GET_BLOGS);
        const blogPosts = data.result || data.data || [];

        const approvedBlogs = blogPosts
          .filter((blog: BlogPost) => blog.approved === true)
          .sort((a: BlogPost, b: BlogPost) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        if (approvedBlogs.length > 0) {
          setBlogs(approvedBlogs);
          setFilteredBlogs(approvedBlogs.slice(0, 6));
        } else {
          setBlogs(FALLBACK_BLOGS);
          setFilteredBlogs(FALLBACK_BLOGS);
        }
      } catch (err) {
        console.error('Failed to load blogs', err);
        setBlogs(FALLBACK_BLOGS);
        setFilteredBlogs(FALLBACK_BLOGS);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    if (activeCategory === 'All') {
      setFilteredBlogs(blogs.slice(0, 6));
    } else {
      setFilteredBlogs(blogs.filter(b => b.content_category?.toUpperCase() === activeCategory.toUpperCase()).slice(0, 6));
    }
  }, [activeCategory, blogs]);

  const handleShare = async (title: string, id: string) => {
    try {
      const slug = generateSlug(title, id);
      await Share.share({
        message: `Check out this insight: ${title}\nhttps://myedudocs.in/blog-details/${slug}`,
      });
    } catch (error) {
      console.log('Error sharing blog:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. Header with Browse All Button */}
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>Popular Blogs</Text>
          <Text style={styles.sectionSub}>Read the most highly insightful blogs</Text>
        </View>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Blogs')}>
          <Text style={styles.browseBtnText}>Browse All</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
        <CategoryPill label="All Blogs" icon={BookOpen} active={activeCategory === 'All'} onPress={() => setActiveCategory('All')} />
        <CategoryPill label="CORE SECTOR" icon={Briefcase} active={activeCategory === 'CORE SECTOR'} onPress={() => setActiveCategory('CORE SECTOR')} />
        <CategoryPill label="IT" icon={Zap} active={activeCategory === 'IT'} onPress={() => setActiveCategory('IT')} />
        <CategoryPill label="LAW" icon={Award} active={activeCategory === 'LAW'} onPress={() => setActiveCategory('LAW')} />
      </ScrollView>

      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {[1, 2, 3].map((_, i) => <BlogSkeleton key={i} />)}
        </ScrollView>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          snapToInterval={280 + 16}
          decelerationRate="fast"
        >
          {filteredBlogs.map((blog) => (
            <TouchableOpacity 
              key={blog._id} 
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('BlogDetails', { id: blog._id })}
            >
              
              {/* Image Area */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: getCoverImage(blog) }} style={styles.blogImage} />
                
                {/* Floating Category Tag */}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{blog.content_category?.toUpperCase() || "UPDATES"}</Text>
                </View>

                {/* Floating Share Button */}
                <TouchableOpacity 
                  style={styles.floatingShare} 
                  onPress={() => handleShare(blog.content_subject, blog._id)}
                >
                  <Share2 color="#64748B" size={14} />
                </TouchableOpacity>
              </View>

              {/* Title & Info */}
              <View style={styles.cardInfo}>
                <Text style={[styles.blogTitle, { color: theme.colors.textMain }]} numberOfLines={2}>
                  {blog.content_subject}
                </Text>
                <Text style={[styles.blogExcerpt, { color: theme.colors.textMuted }]} numberOfLines={2}>
                  {getExcerpt(blog.content)}
                </Text>
              </View>

              {/* Footer */}
              <View style={styles.footerRow}>
                <View style={styles.metaRow}>
                   <CalendarDays color="#94A3B8" size={12} />
                   <Text style={styles.dateText}>{formatDate(blog.createdAt)}</Text>
                </View>
                <TouchableOpacity style={styles.readBtn}>
                   <Text style={styles.readText}>Read Full</Text>
                   <ChevronRight color="#6366F1" size={12} />
                </TouchableOpacity>
              </View>

            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
});

// --------------------------------------------------------
// 4. EXACT STYLES (Unchanged)
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: { marginTop: 30 },
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    paddingHorizontal: 20, 
    marginBottom: 16,
    gap: 12
  },
  titleContainer: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
  sectionSub: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
  browseBtn: { backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  browseBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Category Pills
  pillsContainer: { paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  pill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    backgroundColor: '#F8FAFC' 
  },
  pillActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  pillTextActive: { color: '#FFFFFF' },

  scrollContent: { paddingHorizontal: 20, gap: 16, paddingBottom: 20 },
  card: { 
    width: 280, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: { 
    width: '100%', 
    height: 160, 
    borderRadius: 16, 
    marginBottom: 16, 
    overflow: 'hidden', 
    backgroundColor: '#F8FAFC',
    position: 'relative'
  },
  blogImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryBadge: { 
    position: 'absolute', 
    top: 12, 
    left: 12, 
    backgroundColor: 'rgba(99, 102, 241, 0.9)', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 6 
  },
  categoryBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  floatingShare: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    width: 32, 
    height: 32, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  cardInfo: { marginBottom: 16 },
  blogTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', lineHeight: 22, marginBottom: 8 },
  blogExcerpt: { fontSize: 12, color: '#64748B', lineHeight: 18 },

  footerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9' 
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  readBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readText: { fontSize: 12, fontWeight: '800', color: '#6366F1' },
});