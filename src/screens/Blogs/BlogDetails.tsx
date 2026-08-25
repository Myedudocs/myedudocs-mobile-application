import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Share,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Clock,
  Coins,
  Youtube,
  CornerUpRight,
  Heart,
  Download,
  Video,
  CircleDot,
  FileText,
  Book as BookIcon,
  ShoppingCart,
  Share2,
  ClipboardCheck,
  BookOpen,
  HelpCircle,
  ArrowRight,
} from 'lucide-react-native';
import { ENDPOINTS, apiClient, BASE_URL } from '../../service/api.service';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { getImageUrl } from '../../utils/image.utils';

// --------------------------------------------------------
// 1. FALLBACK DATA & HELPERS
// --------------------------------------------------------
const FALLBACK_BLOG = {
  content_subject: 'How to Crack NEET 2025: A Complete Guide',
  seo: { meta_description: 'Master the biology section with these proven strategies and time management tips from toppers.' },
  content: 'Preparing for NEET requires more than just hard work; it requires a strategic approach...',
  createdAt: new Date().toISOString(),
  schema_image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
  content_category: 'Exam Strategy'
};

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
};

const getFinalPrice = (price?: number, discount?: number) => {
  if (!price || price <= 0) return 0;
  if (!discount || discount <= 0) return price;
  return Math.round(price - (price * discount) / 100);
};

const formatCurrency = (amount: number) => {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const BlogDetails = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params || {};
  const { theme: activeTheme, isDarkMode } = useTheme();
  const { user } = useAuth();

  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (user?.token) {
        try {
          const wishlistRes = await fetch(`${BASE_URL}/wishlist/my`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const wishlistData = await wishlistRes.json();
          if (wishlistData?.data?.items) {
            const ids = new Set<string>(
              wishlistData.data.items
                .filter((i: any) => i.item_type === "book")
                .map((i: any) => i.item_id)
            );
            setWishlistedIds(ids);
          }
        } catch (err) {
          console.error('Failed to load wishlist', err);
        }
      }
    };
    fetchWishlist();
  }, [user]);

  const toggleWishlist = async (book: any) => {
    if (!user?.token) {
      Alert.alert("Login Required", "Please login to save this book to your wishlist ❤️", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("Login") }
      ]);
      return;
    }
    if (wishlistLoadingId) return;
    setWishlistLoadingId(book._id);
    const isSaved = wishlistedIds.has(book._id);

    try {
      const res = await fetch(`${BASE_URL}/wishlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          item_type: "book",
          item_id: book._id,
          snapshot: { title: book.title, author: book.author, coverImage: book.coverImage, price: book.digitalPrice || book.physicalPrice || 0 }
        })
      });
      if (res.ok) {
        setWishlistedIds(prev => {
          const n = new Set(prev);
          isSaved ? n.delete(book._id) : n.add(book._id);
          return n;
        });
        Alert.alert(isSaved ? "Removed" : "Saved", isSaved ? "Removed from wishlist" : "Added to your wishlist ❤️");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update wishlist");
    } finally {
      setWishlistLoadingId(null);
    }
  };

  const addBookToCart = async (book: any) => {
    const cartKey = user?.id ? `myedudocs-cart-${user.id}` : "myedudocs-guest-cart";
    try {
      const cartStr = await AsyncStorage.getItem(cartKey);
      let cart = cartStr ? JSON.parse(cartStr) : [];
      const existing = cart.find((i: any) => i.bookId === book._id && i.bookType === 'paperback');

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          bookId: book._id, 
          bookType: 'paperback',         
          title: book.title,
          author: book.author,
          coverImage: book.coverImage,
          finalPrice: getFinalPrice(book.physicalPrice, book.physicalDiscountPercentage),
          quantity: 1,
        });
      }
      await AsyncStorage.setItem(cartKey, JSON.stringify(cart));
      Alert.alert("Added to Cart 🛒", `${book.title} added to your cart.`);
    } catch (e) {
      Alert.alert("Error", "Failed to add to cart");
    }
  };

  const handleBuyNow = (book: any) => {
    const format = selectedFormats[book._id];
    navigation.navigate('BookDetails', { id: book._id, selectedFormat: format });
  };

  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<any>(null);
  const [recCourses, setRecCourses] = useState<any[]>([]);
  const [recBooks, setRecBooks] = useState<any[]>([]);
  const [recExamCats, setRecExamCats] = useState<any[]>([]);
  
  // Track selected format per book for the Book Cards
  const [selectedFormats, setSelectedFormats] = useState<Record<string, 'digital' | 'physical'>>({});

  // Fake progress state for the top bar (35% filled)
  const [readingProgress] = useState(35); 

  useEffect(() => {
    const fetchPageData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const actualId = id?.includes("-") ? id.split("-").pop() : id;

        // 1. Fetch Blog Details
        const blogRes = await apiClient(ENDPOINTS.GET_BLOG_DETAILS(actualId));
        if (blogRes?.contents) setBlog(blogRes.contents);

        // 2. Fetch Recommended Courses & Books
        const [cRes, bRes] = await Promise.all([
          apiClient(ENDPOINTS.GET_REC_COURSES),
          apiClient(ENDPOINTS.GET_REC_BOOKS)
        ]);

        if (cRes?.data?.courses) setRecCourses(cRes.data.courses);
        
        if (bRes?.books) {
          const fetchedBooks = bRes.books;
          // shuffle and pick 4
          const shuffled = [...fetchedBooks].sort(() => 0.5 - Math.random()).slice(0, 4);
          setRecBooks(shuffled);
          
          // Setup default formats for books
          const formatMap: Record<string, 'digital' | 'physical'> = {};
          shuffled.forEach((b: any) => {
            if (typeof b.physicalPrice === "number" && b.physicalPrice > 0) {
              formatMap[b._id] = "physical";
            } else if (typeof b.digitalPrice === "number" && b.digitalPrice > 0) {
              formatMap[b._id] = "digital";
            } else {
              formatMap[b._id] = "digital"; 
            }
          });
          setSelectedFormats(formatMap);
        }

        // 3. Fetch Exam Categories
        try {
          const exRes = await apiClient(ENDPOINTS.GET_EXAMINATIONS);
          if (exRes?.success) {
            const all: any[] = exRes.data?.examinationCategories || [];
            const shuffledEx = [...all].sort(() => 0.5 - Math.random()).slice(0, 4);
            setRecExamCats(shuffledEx);
          }
        } catch (exErr) {
          console.error('Exam categories fetch error:', exErr);
        }

      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [id]);

  const openYouTube = (url: string) => {
    if (url) Linking.openURL(url);
  };

  const handleShare = async (title: string, linkId: string, type: 'course' | 'book') => {
    try {
      await Share.share({
        message: `Check out "${title}" on MyEduDocs!\nhttps://myedudocs.in/${type}-details/${linkId}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleBlogShare = async () => {
    try {
      await Share.share({
        message: `Interesting Read: "${meta.content_subject}"\nRead more on MyEduDocs: https://myedudocs.in/blog-details/${id}`,
      });
    } catch (error) {
      console.log('Error sharing blog:', error);
    }
  };

  if (loading) {
    return (
      <ScreenContainer
        header={{ title: 'Blog', showBack: true, showThemeToggle: false, showCoins: false, showNotifications: false }}
        scroll={false}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6366F6" />
        </View>
      </ScreenContainer>
    );
  }

  const meta = blog || FALLBACK_BLOG;
  const cleanBodyText = stripHtmlTags(meta.content);

  const shareButton = (
    <TouchableOpacity onPress={handleBlogShare} activeOpacity={0.7} style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-end' }}>
      <Share2 color={isDarkMode ? '#FFFFFF' : '#0F172A'} size={22} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer
      header={{
        title: meta.content_subject || 'Blog',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
        rightElement: shareButton,
      }}
    >
      {/* --- PROGRESS BAR SECTION --- */}
      {/* <View style={styles.progressContainer}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${readingProgress}%` }]} />
        </View>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressEarnText}>Keep reading Earn 20 Coins 🪙</Text>
          <Text style={styles.progressTimer}>04:23</Text>
        </View>
      </View> */}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- ARTICLE HEADER --- */}
        <View style={styles.articleHeader}>
          <Text style={styles.mainTitle}>{meta.content_subject}</Text>
          <Text style={styles.excerpt}>{meta.seo?.meta_description || "Expert insights to help you master the latest exam patterns."}</Text>
          
          <View style={styles.authorRow}>
            <Image source={{ uri: 'https://ui-avatars.com/api/?name=MyEduDocs&background=0D8ABC&color=fff' }} style={styles.authorAvatar} />
            <Text style={styles.authorName}>MyEduDocs Editorial</Text>
            <Text style={styles.authorDot}>•</Text>
            <Text style={styles.authorDate}>
              {meta.createdAt ? new Date(meta.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
            </Text>
          </View>

          <View style={styles.readTimeRow}>
            <Clock color="#94A3B8" size={14} />
            <Text style={styles.readTimeText}>8 min read</Text>
          </View>
        </View>

        {/* --- ARTICLE BODY --- */}
        <View style={styles.articleBody}>
          <Image source={{ uri: getImageUrl(meta.schema_image) }} style={styles.bodyImage} />
          
          <Text style={styles.paragraph}>
            {cleanBodyText}
          </Text>

          {/* YouTube Video Link */}
          {meta.youtube_url && (
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, marginTop: 16 }}
              onPress={() => openYouTube(meta.youtube_url)}
            >
              <Youtube color="#EF4444" size={24} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#991B1B' }}>Watch Video Lesson</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- RECOMMENDED COURSES (Exact PopularCourses Style) --- */}
        {recCourses.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Recommended Courses</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScrollContent}
            >
              {recCourses.map((course) => (
                <View key={course._id} style={styles.courseCard}>
                  
                  {/* Image & Share */}
                  <View style={styles.courseImageContainer}>
                    <Image source={{ uri: getImageUrl(course.coverphoto) }} style={styles.courseImage} />
                    <TouchableOpacity 
                      style={styles.courseShareBtn} 
                      activeOpacity={0.8}
                      onPress={() => handleShare(course.title, course._id, 'course')}
                    >
                      <CornerUpRight color="#6366F6" size={14} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  {/* Tags */}
                  <View style={styles.courseTagsRow}>
                    <View style={styles.courseLeftTags}>
                      <Text style={styles.courseCategoryTag}>{course.course_category || 'GENERAL'}</Text>
                      <Text style={styles.courseLangTag}>🌐 {course.language || 'English'}</Text>
                    </View>
                    <TouchableOpacity style={styles.courseSyllabusBtn} activeOpacity={0.7}>
                      <Download color="#6366F6" size={12} strokeWidth={2.5} />
                      <Text style={styles.courseSyllabusText}>Syllabus</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Title & Wishlist */}
                  <View style={styles.courseTitleRow}>
                    <Text style={styles.courseTitleText} numberOfLines={2}>
                      {course.title || 'Untitled Course'}
                    </Text>
                    <TouchableOpacity activeOpacity={0.7}>
                      <Heart color="#94A3B8" size={20} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.courseMentorText}>
                    Mentor: {course.teacher?.name || course.teacher?.tname || 'Atul Biswas'}
                  </Text>

                  <View style={styles.courseDivider} />

                  {/* Stats */}
                  <View style={styles.courseStatsRow}>
                    <View style={styles.courseStatItem}>
                      <Video color="#64748B" size={16} strokeWidth={2} style={styles.courseStatIcon} />
                      <Text style={styles.courseStatText}>{course.video_count || 0} Videos</Text>
                    </View>
                    <View style={styles.courseStatItem}>
                      <CircleDot color="#EF4444" size={16} strokeWidth={2.5} style={styles.courseStatIcon} />
                      <Text style={styles.courseStatText}>{course.practice_set_count || 0} Live Classes</Text>
                    </View>
                    <View style={styles.courseStatItem}>
                      <FileText color="#64748B" size={16} strokeWidth={2} style={styles.courseStatIcon} />
                      <Text style={styles.courseStatText}>{course.pdf_count || 0} PDFs</Text>
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.courseFooterRow}>
                    <View style={styles.coursePriceContainer}>
                      <Text style={styles.courseCurrentPrice}>
                        {formatCurrency(course.discounted_price || course.price || 1999)}
                      </Text>
                      <View style={styles.courseOldPriceRow}>
                        <Text style={styles.courseOldPrice}>
                          {formatCurrency(course.actual_price || course.price || 3400)}
                        </Text>
                        <Text style={styles.courseDiscount}>
                          {course.discount_percentage || 40}% Off
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.courseEnrollBtn} 
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('CourseDetails', { id: course._id })}
                    >
                      <Text style={styles.courseEnrollBtnText}>Enroll Now</Text>
                    </TouchableOpacity>
                  </View>

                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* --- HANDPICKED BOOKS (Exact PopularBooks Style) --- */}
        {recBooks.length > 0 && (
          <View style={[styles.relatedSection, { marginTop: 24 }]}>
            <Text style={styles.relatedTitle}>Handpicked Books</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScrollContent}
            >
              {recBooks.map((book) => {
                const currentFormat = selectedFormats[book._id];
                const isSaved = wishlistedIds.has(book._id);

                return (
                  <View key={book._id} style={styles.bookCard}>
                    
                    {/* Image Area */}
                    <View style={styles.bookImageContainer}>
                      <Image source={{ uri: getImageUrl(book.coverImage) }} style={styles.bookImage} />
                      {book.isPopular && (
                        <View style={styles.bookBestSellerBadge}>
                          <Text style={styles.bookBestSellerText}>BEST SELLER</Text>
                        </View>
                      )}
                      
                      {/* Floating Actions inside cover */}
                      <TouchableOpacity 
                        style={styles.bookShareButton} 
                        activeOpacity={0.8}
                        onPress={() => handleShare(book.title, book._id, 'book')}
                      >
                        <CornerUpRight color="#6366F6" size={14} strokeWidth={2.5} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.bookWishlistFloatBtn}
                        activeOpacity={0.8} 
                        onPress={() => toggleWishlist(book)}
                        disabled={wishlistLoadingId === book._id}
                      >
                        {wishlistLoadingId === book._id ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Heart 
                            color={isSaved ? "#EF4444" : "#94A3B8"} 
                            fill={isSaved ? "#EF4444" : "transparent"} 
                            size={16} 
                          />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Tags & Wishlist */}
                    <View style={styles.bookTagsRow}>
                      <View style={styles.bookLeftTags}>
                        <Text style={styles.bookCategoryTag}>{book.category?.name?.toUpperCase() || 'GENERAL'}</Text>
                        <Text style={styles.bookLangTag}>🌐 {book.language || 'English'}</Text>
                      </View>
                    </View>

                    {/* Title & Author */}
                    <Text style={styles.bookTitleText} numberOfLines={2}>
                      {book.title || 'Untitled Book'}
                    </Text>
                    <Text style={styles.bookAuthorText}>
                      Author: {book.author || 'Unknown'}
                    </Text>

                    {/* Formats Selection (Side-by-Side cells) */}
                    <View style={styles.bookFormatContainer}>
                      {/* Ebook */}
                      {book.digitalPrice > 0 && (
                        <TouchableOpacity 
                          style={currentFormat === 'digital' ? styles.bookFormatBoxActive : styles.bookFormatBoxInactive} 
                          activeOpacity={0.9}
                          onPress={() => setSelectedFormats(p => ({...p, [book._id]: 'digital'}))}
                        >
                          <View style={styles.bookFormatLeft}>
                            <FileText color={currentFormat === 'digital' ? "#6366F6" : "#94A3B8"} size={12} />
                            <Text style={currentFormat === 'digital' ? styles.bookFormatTextActive : styles.bookFormatTextInactive}>EBOOK</Text>
                          </View>
                          <Text style={styles.bookNewPrice}>{formatCurrency(getFinalPrice(book.digitalPrice, book.digitalDiscountPercentage))}</Text>
                        </TouchableOpacity>
                      )}

                      {/* Hardcover */}
                      {book.physicalPrice > 0 && (
                        <TouchableOpacity 
                          style={currentFormat === 'physical' ? styles.bookFormatBoxActive : styles.bookFormatBoxInactive} 
                          activeOpacity={0.7}
                          onPress={() => setSelectedFormats(p => ({...p, [book._id]: 'physical'}))}
                        >
                          <View style={styles.bookFormatLeft}>
                            <BookIcon color={currentFormat === 'physical' ? "#6366F6" : "#94A3B8"} size={12} />
                            <Text style={currentFormat === 'physical' ? styles.bookFormatTextActive : styles.bookFormatTextInactive}>PAPERBACK</Text>
                          </View>
                          <Text style={styles.bookNewPrice}>{formatCurrency(getFinalPrice(book.physicalPrice, book.physicalDiscountPercentage))}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Bottom Actions */}
                    <View style={styles.bookActionButtonsRow}>
                      <TouchableOpacity 
                        style={styles.bookBuyNowBtn} 
                        activeOpacity={0.8}
                        onPress={() => handleBuyNow(book)}
                      >
                        <Text style={styles.bookBuyNowText}>Buy Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.bookAddCartBtn} 
                        activeOpacity={0.8}
                        onPress={() => addBookToCart(book)}
                      >
                        <Text style={styles.bookAddCartText}>Add</Text>
                        <ShoppingCart color="#6366F6" size={14} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>

                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* --- PRACTICE TESTS (Exam Categories) --- */}
        {recExamCats.length > 0 && (
          <View style={[styles.relatedSection, { marginTop: 28 }]}>
            <Text style={styles.relatedTitle}>🎯 Practice Tests</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScrollContent}
            >
              {recExamCats.map((exam: any) => (
                <TouchableOpacity
                  key={exam._id}
                  style={styles.examCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('ExamTopics', { id: exam._id })}
                >
                  {/* Badge Row */}
                  <View style={styles.examBadgeRow}>
                    <View style={styles.examCodeBadge}>
                      <Text style={styles.examCodeText}>{exam.code}</Text>
                    </View>
                    <View style={styles.examYearBadge}>
                      <Text style={styles.examYearText}>{exam.year}/{exam.year + 1}</Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={styles.examName} numberOfLines={2}>{exam.name}</Text>
                  <Text style={styles.examDesc} numberOfLines={3}>
                    {exam.description || 'Updated questions based on latest exam pattern & negative marking'}
                  </Text>

                  {/* Divider */}
                  <View style={styles.examDivider} />

                  {/* Stats Row */}
                  <View style={styles.examStatsRow}>
                    <View style={styles.examStatItem}>
                      <ClipboardCheck color="#6366F1" size={20} />
                      <Text style={styles.examStatVal}>{exam.statistics?.totalTestSeries || 25}</Text>
                      <Text style={styles.examStatLabel}>TESTS</Text>
                    </View>
                    <View style={[styles.examStatItem, styles.examStatBorderX]}>
                      <BookOpen color="#6366F1" size={20} />
                      <Text style={styles.examStatVal}>{exam.statistics?.totalSubjects || 12}</Text>
                      <Text style={styles.examStatLabel}>SUBJECTS</Text>
                    </View>
                    <View style={styles.examStatItem}>
                      <HelpCircle color="#6366F1" size={20} />
                      <Text style={styles.examStatVal}>{exam.examPattern?.totalQuestions || '3750+'}</Text>
                      <Text style={styles.examStatLabel}>QUESTIONS</Text>
                    </View>
                  </View>

                  {/* CTA */}
                  <TouchableOpacity
                    style={styles.examCTABtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('ExamTopics', { id: exam._id })}
                  >
                    <Text style={styles.examCTAText}>Explore Test Series</Text>
                    <ArrowRight color="#fff" size={16} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 3. EXACT STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerTitle: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#0F172A', 
    textAlign: 'center',
    marginHorizontal: 16
  },

  // Progress Bar Area
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366F6',
    borderRadius: 2,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressEarnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F6',
  },
  progressTimer: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // Article Header
  articleHeader: {
    padding: 20,
    paddingBottom: 0,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 32,
    marginBottom: 12,
  },
  excerpt: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#E2E8F0',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  authorDot: {
    marginHorizontal: 6,
    color: '#94A3B8',
  },
  authorDate: {
    fontSize: 12,
    color: '#64748B',
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readTimeText: {
    fontSize: 11,
    color: '#64748B',
  },

  // Article Body
  articleBody: {
    padding: 20,
  },
  paragraph: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    marginBottom: 20,
  },
  bodyImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    resizeMode: 'cover',
    backgroundColor: '#F1F5F9',
  },

  // Related Sections
  relatedSection: {
    marginTop: 10,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  relatedScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },

  // ==========================================
  // COURSES CARD STYLES (From PopularCourses)
  // ==========================================
  courseCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  courseImageContainer: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  courseImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  courseShareBtn: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28, 
    backgroundColor: '#FFFFFF', borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  courseTagsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  courseLeftTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  courseCategoryTag: { fontSize: 11, fontWeight: '700', color: '#6366F6', textTransform: 'uppercase' },
  courseLangTag: { fontSize: 11, fontWeight: '500', color: '#64748B' },
  courseSyllabusBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E0E7FF', backgroundColor: '#F5F8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  courseSyllabusText: { fontSize: 10, fontWeight: '600', color: '#6366F6' },
  courseTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  courseTitleText: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 10, lineHeight: 22 },
  courseMentorText: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  courseDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  courseStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  courseStatItem: { alignItems: 'center', justifyContent: 'center' },
  courseStatIcon: { marginBottom: 6 },
  courseStatText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  courseFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coursePriceContainer: { flexDirection: 'column' },
  courseCurrentPrice: { fontSize: 18, fontWeight: '700', color: '#6366F6' },
  courseOldPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  courseOldPrice: { fontSize: 11, color: '#94A3B8', textDecorationLine: 'line-through' },
  courseDiscount: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  courseEnrollBtn: { backgroundColor: '#6366F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  courseEnrollBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  // ==========================================
  // BOOKS CARD STYLES (From PopularBooks)
  // ==========================================
  bookCard: {
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
  bookImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    position: 'relative',
  },
  bookImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  bookBestSellerBadge: { 
    position: 'absolute', 
    top: 12, 
    left: 12, 
    backgroundColor: '#6366F1', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 6 
  },
  bookBestSellerText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  bookShareButton: { 
    width: 32, 
    height: 32, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 5,
  },
  bookTagsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bookLeftTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookCategoryTag: { fontSize: 11, fontWeight: '900', color: '#6366F1' },
  bookLangTag: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  bookTitleText: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  bookAuthorText: { fontSize: 12, color: '#94A3B8', marginBottom: 16 },

  // Format Grid
  bookFormatContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  bookFormatBoxActive: { 
    flex: 1, 
    padding: 10, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: '#6366F1', 
    backgroundColor: '#F5F8FF',
    alignItems: 'center'
  },
  bookFormatBoxInactive: { 
    flex: 1, 
    padding: 10, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    backgroundColor: '#F8FAFC',
    alignItems: 'center'
  },
  bookFormatLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  bookFormatRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookFormatTextActive: { fontSize: 9, fontWeight: '900', color: '#6366F6' },
  bookFormatTextInactive: { fontSize: 9, fontWeight: '900', color: '#64748B' },
  bookOldPrice: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through' },
  bookNewPrice: { fontSize: 13, fontWeight: '800', color: '#1E293B' },

  bookActionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  bookBuyNowBtn: { flex: 1, backgroundColor: '#6366F1', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  bookBuyNowText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  bookAddCartBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#EEF2FF', 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    borderRadius: 12 
  },
  bookAddCartText: { color: '#6366F6', fontSize: 14, fontWeight: '800' },
  bookWishlistFloatBtn: {
    width: 32, 
    height: 32, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'absolute',
    top: 52,
    right: 12,
    zIndex: 5,
  },

  // ==========================================
  // EXAM CATEGORY CARD STYLES (Practice Tests)
  // ==========================================
  examCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    padding: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  examBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    alignItems: 'center',
  },
  examCodeBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  examCodeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  examYearBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  examYearText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  examName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 24,
    marginBottom: 8,
  },
  examDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
    flex: 1,
  },
  examDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  examStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8ECFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  examStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  examStatBorderX: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E0E5FF',
  },
  examStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  examStatLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  examCTABtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
  },
  examCTAText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});