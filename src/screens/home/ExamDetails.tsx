import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Linking,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Share2,
  Calendar,
  BookOpen,
  Clock,
  Award,
  FileText,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  PlayCircle,
  Star,
  HelpCircle,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Video,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BASE_URL, apiClient } from '../../service/api.service';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ScreenContainer } from '../../components/common/ScreenContainer';

interface ExamDetailsData {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  categoryId: string | { _id: string; name: string };
  importantDates?: {
    applicationStart?: string;
    applicationEnd?: string;
    examDate?: string;
    admitCardDate?: string;
    resultDate?: string;
  };
  eligibilityCriteria?: {
    ageLimit?: string;
    educationQualification?: string;
    nationality?: string;
  };
  examPattern?: string;
  phases?: Array<{
    name: string;
    subjects: Array<{ name: string; marks: number; duration: string }>;
  }>;
  vacancies?: Array<{
    postName: string;
    total: number;
  }>;
  salary?: {
    payScale?: string;
    inHandSalary?: string;
    jobProfile?: string;
  };
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  testSeries?: string[];
  courses?: string[];
  books?: string[];
  courseContents?: string[];
}

const { width } = Dimensions.get('window');

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'TBA';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

const getResourceImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL.replace('/api/v1', '')}${url}`;
};

export const ExamDetails = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { slug } = route.params || {};

  const [exam, setExam] = useState<ExamDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pattern' | 'dates' | 'eligibility' | 'material' | 'faqs'>('overview');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Marketplace Grid Filters
  const [marketFilter, setMarketFilter] = useState<'all' | 'courses' | 'tests' | 'books'>('all');

  // Linked Resources state
  const [linkedCourses, setLinkedCourses] = useState<any[]>([]);
  const [linkedBooks, setLinkedBooks] = useState<any[]>([]);
  const [linkedTestCats, setLinkedTestCats] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await apiClient(`${BASE_URL}/exams/slug/${slug}`);
        const data = res?.data as ExamDetailsData;
        
        if (data) {
          setExam(data);

          // Fetch all linked resources parallelly
          const promises: Promise<any>[] = [];

          if (data.courses && data.courses.length > 0) {
            promises.push(
              apiClient(`${BASE_URL}/course/admin/courses/?limit=100`)
                .then(r => {
                  const all = r?.data?.courses || [];
                  return all.filter((c: any) => data.courses?.includes(c._id));
                })
                .catch(() => [])
            );
          } else {
            promises.push(Promise.resolve([]));
          }

          if (data.books && data.books.length > 0) {
            promises.push(
              apiClient(`${BASE_URL}/books/approved?limit=100`)
                .then(r => {
                  const all = r?.books || [];
                  return all.filter((b: any) => data.books?.includes(b._id));
                })
                .catch(() => [])
            );
          } else {
            promises.push(Promise.resolve([]));
          }

          if (data.testSeries && data.testSeries.length > 0) {
            promises.push(
              apiClient(`${BASE_URL}/test-series/navigation/examinations?limit=100`)
                .then(r => {
                  const all = r?.data?.examinationCategories || [];
                  return all.filter((c: any) => data.testSeries?.includes(c._id));
                })
                .catch(() => [])
            );
          } else {
            promises.push(Promise.resolve([]));
          }

          const [courses, books, tests] = await Promise.all(promises);
          setLinkedCourses(courses);
          setLinkedBooks(books);
          setLinkedTestCats(tests);
        }
      } catch (err) {
        console.error('Failed to fetch exam details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchDetails();
    }
  }, [slug]);

  const handleShare = async () => {
    if (!exam) return;
    try {
      await Share.share({
        message: `Prepare for ${exam.name} on MyEdudocs!\nJoin live classes, mock tests & grab study books: https://myedudocs.com/exams/${slug}`,
      });
    } catch (e) {
      console.log('Error sharing:', e);
    }
  };

  if (loading) {
    return (
      <ScreenContainer header={{ showBack: true }} scroll bgVariant="screen">
        <View style={styles.loadingHeader}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <SkeletonLoader width={150} height={20} style={{ marginLeft: 20 }} />
        </View>
        <View style={{ padding: 20 }}>
          <SkeletonLoader width="90%" height={32} />
          <SkeletonLoader width="60%" height={16} style={{ marginTop: 12 }} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <SkeletonLoader width={100} height={40} borderRadius={10} />
            <SkeletonLoader width={100} height={40} borderRadius={10} />
            <SkeletonLoader width={100} height={40} borderRadius={10} />
          </View>
          <SkeletonLoader width="100%" height={200} borderRadius={20} style={{ marginTop: 24 }} />
        </View>
      </ScreenContainer>
    );
  }

  if (!exam) {
    return (
      <ScreenContainer header={{ showBack: true }} scroll={false} bgVariant="screen">
        <View style={[styles.errorScreen, { backgroundColor: theme.colors.background }]}>
          <ShieldAlert color="#EF4444" size={54} />
          <Text style={[styles.errorText, { color: theme.colors.textMain }]}>Exam Not Found</Text>
          <TouchableOpacity style={[styles.errorBtn, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={{ color: '#FFF', fontWeight: '800' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Loaded & Formatted items
  const displayCourses = linkedCourses;
  const displayTests = linkedTestCats;
  const displayBooks = linkedBooks;

  return (
    <ScreenContainer
      header={{ title: 'Exam Details', showBack: true, showThemeToggle: true }}
      scroll
      contentStyle={styles.scrollArea}
    >
      {/* Content starts here */}
        
        {/* ── High-Fidelity Accent Header with Circular Streak Metric ── */}
        <View style={[styles.heroCard, { backgroundColor: theme.colors.primary, overflow: 'hidden' }]}>
          {/* Decorative background visual layers for depth */}
          <View style={styles.heroGlowCircle1} />
          <View style={styles.heroGlowCircle2} />

          <View style={[styles.heroLayoutRow, { zIndex: 1 }]}>
            <View style={styles.heroTextContent}>
              <View style={styles.eyebrowContainer}>
                <Sparkles color="#FFFFFF" size={11} />
                <Text style={styles.heroEyebrow}>PRODUCTION-LEVEL RESOURCE HUB</Text>
              </View>
              <Text style={styles.heroTitle}>{exam.name}</Text>
              <Text style={styles.heroDesc} numberOfLines={3}>
                {exam.shortDescription || `Crack the competitive ${exam.name} exam under top guidance. Access structured live batches, recommended guidebooks, and mock tests.`}
              </Text>
            </View>

            {/* Preparation Goal Score Dial Graphic */}
            <View style={styles.dialMetricWrap}>
              <View style={styles.dialCircle}>
                <Text style={styles.dialPercentage}>85%</Text>
                <Text style={styles.dialSub}>Goal Score</Text>
              </View>
              <View style={styles.dialStatusPill}>
                <Check size={9} color="#10B981" strokeWidth={3} />
                <Text style={styles.dialStatusText}>Streak Active</Text>
              </View>
            </View>
          </View>

          {/* Detailed Statistics Row */}
          <View style={styles.statsBar}>
            <View style={styles.statCell}>
              <Text style={styles.statVal}>{exam.phases?.length || '2+'}</Text>
              <Text style={styles.statLabel}>Exam Stages</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statVal}>
                {exam.vacancies?.[0]?.total ? `${exam.vacancies[0].total.toLocaleString()}` : '1,500+'}
              </Text>
              <Text style={styles.statLabel}>Vacancies</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statVal}>National</Text>
              <Text style={styles.statLabel}>Exam Level</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statVal}>Online</Text>
              <Text style={styles.statLabel}>Exam Mode</Text>
            </View>
          </View>
        </View>

        {/* ── Interactive sliding Navigation Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'material', label: 'Study Material' },
            { id: 'pattern', label: 'Exam Pattern' },
            { id: 'dates', label: 'Important Dates' },
            { id: 'eligibility', label: 'Eligibility' },
            { id: 'faqs', label: 'FAQs' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabBtn,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  isActive && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryLight }
                ]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Text style={[
                  styles.tabLabel, 
                  { color: theme.colors.textMuted }, 
                  isActive && { color: theme.colors.primary, fontWeight: '800' }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Tab Content Container ── */}
        <View style={styles.contentWrap}>
          
          {/* TAB 1: OVERVIEW & ANALYTICS CHECKLIST */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              {/* Preparation Checklist Graphics Dashboard */}
              <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginBottom: 16 }]}>
                <View style={styles.cardTitleRow}>
                  <TrendingUp color={theme.colors.primary} size={20} />
                  <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Preparation Checklist Dashboard</Text>
                </View>
                
                <View style={styles.checklistGrid}>
                  <View style={[styles.checkItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <View style={[styles.checkIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      <BookOpenCheck color="#10B981" size={20} />
                    </View>
                    <View style={styles.checkDetails}>
                      <Text style={[styles.checkTitle, { color: theme.colors.textMain }]}>Official Syllabus Check</Text>
                      <Text style={[styles.checkSub, { color: theme.colors.textMuted }]}>Updated according to 2026 notification guidelines</Text>
                    </View>
                  </View>

                  <View style={[styles.checkItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <View style={[styles.checkIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                      <FileSpreadsheet color="#F59E0B" size={20} />
                    </View>
                    <View style={styles.checkDetails}>
                      <Text style={[styles.checkTitle, { color: theme.colors.textMain }]}>Previous Year Solved Papers</Text>
                      <Text style={[styles.checkSub, { color: theme.colors.textMuted }]}>All papers from 2012-2025 unlocked & available</Text>
                    </View>
                  </View>

                  <View style={[styles.checkItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <View style={[styles.checkIconWrap, { backgroundColor: 'rgba(91, 100, 232, 0.1)' }]}>
                      <Video color="#5B64E8" size={20} />
                    </View>
                    <View style={styles.checkDetails}>
                      <Text style={[styles.checkTitle, { color: theme.colors.textMain }]}>Target Live Lectures</Text>
                      <Text style={[styles.checkSub, { color: theme.colors.textMuted }]}>Interactive coaching classes in Marketplace tab</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Introduction Card */}
              <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.cardTitleRow}>
                  <BookOpen color={theme.colors.primary} size={20} />
                  <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>About the Exam</Text>
                </View>
                <Text style={[styles.infoCardText, { color: theme.colors.textMuted }]}>
                  {exam.shortDescription || `The ${exam.name} examination is highly competitive. Adequate preparation using our expert study material guarantees maximum retention and success. Join today to get complete access to mock papers, interactive notes, and recommended books.`}
                </Text>
              </View>

              {/* Salary Structure */}
              {exam.salary && (
                <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginTop: 16 }]}>
                  <View style={styles.cardTitleRow}>
                    <Award color={theme.colors.primary} size={20} />
                    <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Salary & Job Profile</Text>
                  </View>
                  <View style={styles.salaryWrap}>
                    {exam.salary.payScale && (
                      <View style={[styles.salaryRow, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.salaryKey, { color: theme.colors.textMuted }]}>Pay Scale</Text>
                        <Text style={[styles.salaryVal, { color: theme.colors.textMain }]}>{exam.salary.payScale}</Text>
                      </View>
                    )}
                    {exam.salary.inHandSalary && (
                      <View style={[styles.salaryRow, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.salaryKey, { color: theme.colors.textMuted }]}>In-Hand Salary</Text>
                        <Text style={[styles.salaryVal, { color: theme.colors.primary, fontWeight: '800' }]}>{exam.salary.inHandSalary}</Text>
                      </View>
                    )}
                    {exam.salary.jobProfile && (
                      <View style={[styles.salaryRowCol, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.salaryKey, { color: theme.colors.textMuted, marginBottom: 4 }]}>Job Profile Description</Text>
                        <Text style={[styles.salaryValText, { color: theme.colors.textMain }]}>{exam.salary.jobProfile}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Vacancy Structure */}
              {exam.vacancies && exam.vacancies.length > 0 && (
                <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginTop: 16 }]}>
                  <View style={styles.cardTitleRow}>
                    <TrendingUp color={theme.colors.primary} size={20} />
                    <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Vacancy Distribution</Text>
                  </View>
                  <View style={styles.vacancyTable}>
                    {exam.vacancies.map((vac, i) => (
                      <View key={i} style={[styles.vacancyRow, { borderBottomColor: theme.colors.border }]}>
                        <View style={styles.vacancyBullet} />
                        <Text style={[styles.vacancyPostText, { color: theme.colors.textMain }]}>{vac.postName}</Text>
                        <View style={[styles.vacancyBadge, { backgroundColor: theme.colors.primaryLight }]}>
                          <Text style={[styles.vacancyBadgeText, { color: theme.colors.primary }]}>{vac.total.toLocaleString()} Vacancies</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
            {/* TAB 2: EXAMS MARKETPLACE GRID */}
          {activeTab === 'material' && (
            <View style={styles.tabContent}>
              {/* Marketplace Category Selector */}
              <View style={styles.marketFilterRow}>
                {[
                  { id: 'all', label: 'All Resources' },
                  { id: 'courses', label: 'Online Courses' },
                  { id: 'tests', label: 'Mock Tests' },
                  { id: 'books', label: 'Prep Books' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.marketFilterPill,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                      marketFilter === item.id && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }
                    ]}
                    onPress={() => setMarketFilter(item.id as any)}
                  >
                    <Text style={[
                      styles.marketFilterText,
                      { color: theme.colors.textMuted },
                      marketFilter === item.id && { color: theme.colors.primary, fontWeight: '800' }
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Check if empty */}
              {((marketFilter === 'all' && displayCourses.length === 0 && displayTests.length === 0 && displayBooks.length === 0) ||
                (marketFilter === 'courses' && displayCourses.length === 0) ||
                (marketFilter === 'tests' && displayTests.length === 0) ||
                (marketFilter === 'books' && displayBooks.length === 0)) ? (
                <View style={[styles.noMaterialWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingVertical: 40 }]}>
                  <Text style={[styles.noMaterialText, { color: theme.colors.textMain }]}>Currently, no study material.</Text>
                </View>
              ) : (
                <View style={styles.marketplaceGrid}>
                  
                  {/* 1. COURSES IN THE GRID */}
                  {(marketFilter === 'all' || marketFilter === 'courses') && displayCourses.map((c, i) => {
                    const courseImg = getResourceImageUrl(c.courseImage);
                    const isBestseller = c.isBestseller || i === 0;

                    return (
                      <TouchableOpacity
                        key={c._id}
                        style={[styles.marketGridCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => navigation.navigate('CourseDetails', { id: c._id })}
                        activeOpacity={0.9}
                      >
                        {/* Course Cover Cover photo */}
                        <View style={styles.gridCardCoverWrap}>
                          <Image 
                            source={{ uri: getResourceImageUrl(c.coverphoto) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300' }} 
                            style={styles.gridCardCoverImg}
                            resizeMode="cover"
                          />
                          <View style={[styles.marketOverlayBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.overlayBadgeText}>Video Classes</Text>
                          </View>
                          {isBestseller && (
                            <View style={styles.bestsellerBadge}>
                              <Text style={styles.bestsellerBadgeText}>★ BESTSELLER</Text>
                            </View>
                          )}
                        </View>

                        {/* Course Content */}
                        <View style={styles.gridCardBody}>
                          <View>
                            <Text style={[styles.gridCardTitle, { color: theme.colors.textMain }]} numberOfLines={2}>
                              {c.title}
                            </Text>
                            {(c.teacher?.name || c.teacher_id?.tname) && (
                              <Text style={[styles.gridCardSub, { color: theme.colors.textMuted }]} numberOfLines={1}>
                                By {c.teacher?.name || c.teacher_id?.tname}
                              </Text>
                            )}
                          </View>

                          {/* Rating block */}
                          <View style={styles.gridCardRatingRow}>
                            <View style={styles.starRatingWrap}>
                              <Star color="#F59E0B" fill="#F59E0B" size={11} />
                              <Text style={styles.ratingNumber}> {c.rating || '4.5'}</Text>
                            </View>
                            <Text style={[styles.ratingCountText, { color: theme.colors.textLight }]}>
                              ({(c.ratingCount || c.reviewsCount || 0).toLocaleString()})
                            </Text>
                          </View>

                          {/* Course stats */}
                          <View style={styles.gridStatsRow}>
                            {c.video_count !== undefined && (
                              <View style={styles.gridStatMini}>
                                <Video color={theme.colors.textMuted} size={11} />
                                <Text style={[styles.gridStatMiniText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                                  {c.video_count} Lectures
                                </Text>
                              </View>
                            )}
                            {c.pdf_count !== undefined && (
                              <View style={styles.gridStatMini}>
                                <FileText color={theme.colors.textMuted} size={11} />
                                <Text style={[styles.gridStatMiniText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                                  {c.pdf_count} Study PDFs
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Divider */}
                          <View style={[styles.gridCardDivider, { backgroundColor: theme.colors.border }]} />

                          {/* Pricing and Action */}
                          <View style={styles.gridCardFooter}>
                            <View style={styles.gridPriceWrap}>
                              <Text style={[styles.gridDiscPrice, { color: theme.colors.primary }]}>
                                ₹{Number(c.discounted_price || c.price || 0).toLocaleString('en-IN')}
                              </Text>
                              {(c.actual_price || c.discount_percentage) && (
                                <View style={styles.gridOriginalPriceRow}>
                                  {c.actual_price && (
                                    <Text style={[styles.gridOrigPrice, { color: theme.colors.textLight }]}>
                                      ₹{Number(c.actual_price).toLocaleString('en-IN')}
                                    </Text>
                                  )}
                                  {c.discount_percentage && (
                                    <Text style={[styles.gridPercentOff, { color: theme.colors.success }]}>
                                      {c.discount_percentage}% Off
                                    </Text>
                                  )}
                                </View>
                              )}
                            </View>
                            <TouchableOpacity 
                              style={[styles.gridBuyBtn, { backgroundColor: theme.colors.primary }]}
                              onPress={() => navigation.navigate('CourseDetails', { id: c._id })}
                            >
                              <Text style={styles.gridBuyBtnText}>Enroll</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* 2. TEST SERIES IN THE GRID */}
                  {(marketFilter === 'all' || marketFilter === 'tests') && displayTests.map((t, i) => {
                    const isBestseller = t.isBestseller || i === 0;

                    return (
                      <TouchableOpacity
                        key={t._id}
                        style={[styles.marketGridCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => navigation.navigate('TestSeriesDetails', { id: t._id })}
                        activeOpacity={0.9}
                      >
                        {/* Test Series Cover Placeholder */}
                        <View style={[styles.gridCardCoverWrap, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                          <Award color={theme.colors.primary} size={48} />
                          <View style={[styles.marketOverlayBadge, { backgroundColor: '#10B981' }]}>
                            <Text style={styles.overlayBadgeText}>Mock Tests</Text>
                          </View>
                          {isBestseller && (
                            <View style={styles.bestsellerBadge}>
                              <Text style={styles.bestsellerBadgeText}>★ BESTSELLER</Text>
                            </View>
                          )}
                          {t.free_tests !== undefined && (
                            <View style={styles.freeTestsPill}>
                              <Text style={styles.freeTestsPillText}>{t.free_tests} Free Tests</Text>
                            </View>
                          )}
                        </View>

                        {/* Content */}
                        <View style={styles.gridCardBody}>
                          <View>
                            <Text style={[styles.gridCardTitle, { color: theme.colors.textMain }]} numberOfLines={2}>
                              {t.name}
                            </Text>
                            <Text style={[styles.gridCardSub, { color: theme.colors.textMuted }]} numberOfLines={1}>
                              Curated by MyEdudocs Faculty
                            </Text>
                          </View>

                          {/* Rating block */}
                          <View style={styles.gridCardRatingRow}>
                            <View style={styles.starRatingWrap}>
                              <Star color="#F59E0B" fill="#F59E0B" size={11} />
                              <Text style={styles.ratingNumber}> {t.rating || '4.8'}</Text>
                            </View>
                            <Text style={[styles.ratingCountText, { color: theme.colors.textLight }]}>
                              ({(t.ratingCount || t.reviewsCount || 0).toLocaleString()})
                            </Text>
                          </View>

                          {/* Test stats */}
                          <View style={styles.gridStatsRow}>
                            {t.total_tests !== undefined && (
                              <View style={styles.gridStatMini}>
                                <FileSpreadsheet color={theme.colors.textMuted} size={11} />
                                <Text style={[styles.gridStatMiniText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                                  {t.total_tests} Full Mocks
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Divider */}
                          <View style={[styles.gridCardDivider, { backgroundColor: theme.colors.border }]} />

                          {/* Pricing and Action */}
                          <View style={styles.gridCardFooter}>
                            <View style={styles.gridPriceWrap}>
                              <Text style={[styles.gridDiscPrice, { color: theme.colors.primary }]}>
                                ₹{Number(t.discounted_price || t.price || 0).toLocaleString('en-IN')}
                              </Text>
                              {(t.actual_price || t.discount_percentage) && (
                                <View style={styles.gridOriginalPriceRow}>
                                  {t.actual_price && (
                                    <Text style={[styles.gridOrigPrice, { color: theme.colors.textLight }]}>
                                      ₹{Number(t.actual_price).toLocaleString('en-IN')}
                                    </Text>
                                  )}
                                  {t.discount_percentage && (
                                    <Text style={[styles.gridPercentOff, { color: theme.colors.success }]}>
                                      {t.discount_percentage}% Off
                                    </Text>
                                  )}
                                </View>
                              )}
                            </View>
                            <TouchableOpacity 
                              style={[styles.gridBuyBtn, { backgroundColor: theme.colors.primary }]}
                              onPress={() => navigation.navigate('TestSeriesDetails', { id: t._id })}
                            >
                              <Text style={styles.gridBuyBtnText}>Unlock</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* 3. BOOKS IN THE GRID */}
                  {(marketFilter === 'all' || marketFilter === 'books') && displayBooks.map((b, i) => {
                    const bookImg = getResourceImageUrl(b.coverImage);
                    const isBestseller = b.isBestseller || i === 0;

                    return (
                      <TouchableOpacity
                        key={b._id}
                        style={[styles.marketGridCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => navigation.navigate('BookDetails', { id: b._id })}
                        activeOpacity={0.9}
                      >
                        {/* Book Cover wrap */}
                        <View style={[styles.gridCardCoverWrap, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 8 }]}>
                          <Image 
                            source={{ uri: bookImg || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300' }} 
                            style={styles.gridCardBookImg}
                            resizeMode="contain"
                          />
                          <View style={[styles.marketOverlayBadge, { backgroundColor: '#3B82F6' }]}>
                            <Text style={styles.overlayBadgeText}>Prep Books</Text>
                          </View>
                          {isBestseller && (
                            <View style={styles.bestsellerBadge}>
                              <Text style={styles.bestsellerBadgeText}>★ BESTSELLER</Text>
                            </View>
                          )}
                        </View>

                        {/* Content */}
                        <View style={styles.gridCardBody}>
                          <View>
                            <Text style={[styles.gridCardTitle, { color: theme.colors.textMain }]} numberOfLines={2}>
                              {b.title}
                            </Text>
                            {b.author && (
                              <Text style={[styles.gridCardSub, { color: theme.colors.textMuted }]} numberOfLines={1}>
                                By {b.author}
                              </Text>
                            )}
                          </View>

                          {/* Rating block */}
                          <View style={styles.gridCardRatingRow}>
                            <View style={styles.starRatingWrap}>
                              <Star color="#F59E0B" fill="#F59E0B" size={11} />
                              <Text style={styles.ratingNumber}> {b.rating || '4.5'}</Text>
                            </View>
                            <Text style={[styles.ratingCountText, { color: theme.colors.textLight }]}>
                              ({(b.ratingCount || b.reviewsCount || 0).toLocaleString()})
                            </Text>
                          </View>

                          {/* Book tag */}
                          <View style={styles.gridStatsRow}>
                            <View style={styles.gridStatMini}>
                              <BookOpen color={theme.colors.textMuted} size={11} />
                              <Text style={[styles.gridStatMiniText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                                Syllabus Oriented
                              </Text>
                            </View>
                          </View>

                          {/* Divider */}
                          <View style={[styles.gridCardDivider, { backgroundColor: theme.colors.border }]} />

                          {/* Pricing and Action */}
                          <View style={styles.gridCardFooter}>
                            <View style={styles.gridPriceWrap}>
                              <Text style={[styles.gridDiscPrice, { color: theme.colors.primary }]}>
                                ₹{Number(b.discounted_price || b.price || 0).toLocaleString('en-IN')}
                              </Text>
                              {(b.actual_price || b.discount_percentage) && (
                                <View style={styles.gridOriginalPriceRow}>
                                  {b.actual_price && (
                                    <Text style={[styles.gridOrigPrice, { color: theme.colors.textLight }]}>
                                      ₹{Number(b.actual_price).toLocaleString('en-IN')}
                                    </Text>
                                  )}
                                  {b.discount_percentage && (
                                    <Text style={[styles.gridPercentOff, { color: theme.colors.success }]}>
                                      {b.discount_percentage}% Off
                                    </Text>
                                  )}
                                </View>
                              )}
                            </View>
                            <TouchableOpacity 
                              style={[styles.gridBuyBtn, { backgroundColor: theme.colors.primary }]}
                              onPress={() => navigation.navigate('BookDetails', { id: b._id })}
                            >
                              <Text style={styles.gridBuyBtnText}>Buy</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                </View>
              )}
            </View>
          )}

          {/* TAB 3: EXAM PATTERN */}
          {activeTab === 'pattern' && (
            <View style={styles.tabContent}>
              {exam.phases && exam.phases.length > 0 ? (
                exam.phases.map((phase, phaseIdx) => (
                  <View key={phaseIdx} style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginBottom: 16 }]}>
                    <View style={styles.cardTitleRow}>
                      <Award color={theme.colors.primary} size={20} />
                      <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>{phase.name}</Text>
                    </View>
                    
                    <View style={[styles.tableContainer, { borderColor: theme.colors.border }]}>
                      <View style={[styles.tableHeader, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.thText, { flex: 2, color: theme.colors.textMain }]}>Subject</Text>
                        <Text style={[styles.thText, { flex: 1, textAlign: 'center', color: theme.colors.textMain }]}>Marks</Text>
                        <Text style={[styles.thText, { flex: 1.2, textAlign: 'right', color: theme.colors.textMain }]}>Duration</Text>
                      </View>
                      {phase.subjects.map((sub, i) => (
                        <View key={i} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                          <Text style={[styles.tdText, { flex: 2, color: theme.colors.textMain }]} numberOfLines={2}>
                            {sub.name}
                          </Text>
                          <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={[styles.tdTextMarks, { color: theme.colors.primary }]}>
                              {sub.marks}
                            </Text>
                          </View>
                          <Text style={[styles.tdTextDuration, { flex: 1.2, textAlign: 'right', color: theme.colors.textMuted }]}>
                            {sub.duration}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.cardTitleRow}>
                    <Award color={theme.colors.primary} size={20} />
                    <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Pattern details</Text>
                  </View>
                  <Text style={[styles.infoCardText, { color: theme.colors.textMuted }]}>
                    {exam.examPattern || 'Standard competitive examination pattern applies. Exact paper stages, duration, and subject syllabus are detailed inside our courses. Explore study materials tab to view details.'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 4: IMPORTANT DATES TIMELINE */}
          {activeTab === 'dates' && (
            <View style={styles.tabContent}>
              <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.cardTitleRow}>
                  <Calendar color={theme.colors.primary} size={20} />
                  <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Important Dates & Timeline</Text>
                </View>

                {exam.importantDates ? (
                  <View style={styles.premiumTimeline}>
                    {/* Timeline Node 1: Registration Start */}
                    <View style={styles.timelineCard}>
                      <View style={[styles.timelineLeftAccent, { backgroundColor: theme.colors.primary }]} />
                      <View style={styles.timelineCardContent}>
                        <View style={styles.timelineCardHeader}>
                          <Text style={[styles.timelineNodeTitle, { color: theme.colors.textMain }]}>Registration Start</Text>
                          <View style={[styles.timelineBadge, { backgroundColor: theme.colors.primaryLight }]}>
                            <Text style={[styles.timelineBadgeText, { color: theme.colors.primary }]}>Active</Text>
                          </View>
                        </View>
                        <Text style={[styles.timelineNodeDate, { color: theme.colors.textMuted }]}>
                          {formatDate(exam.importantDates.applicationStart)}
                        </Text>
                      </View>
                    </View>

                    {/* Timeline Node 2: Registration End */}
                    <View style={styles.timelineCard}>
                      <View style={[styles.timelineLeftAccent, { backgroundColor: '#EF4444' }]} />
                      <View style={styles.timelineCardContent}>
                        <View style={styles.timelineCardHeader}>
                          <Text style={[styles.timelineNodeTitle, { color: theme.colors.textMain }]}>Registration End</Text>
                          <View style={[styles.timelineBadge, { backgroundColor: '#FEE2E2' }]}>
                            <Text style={[styles.timelineBadgeText, { color: '#EF4444' }]}>Deadline</Text>
                          </View>
                        </View>
                        <Text style={[styles.timelineNodeDate, { color: theme.colors.textMuted }]}>
                          {formatDate(exam.importantDates.applicationEnd)}
                        </Text>
                      </View>
                    </View>

                    {/* Timeline Node 3: Admit Card Release */}
                    <View style={styles.timelineCard}>
                      <View style={[styles.timelineLeftAccent, { backgroundColor: '#F59E0B' }]} />
                      <View style={styles.timelineCardContent}>
                        <View style={styles.timelineCardHeader}>
                          <Text style={[styles.timelineNodeTitle, { color: theme.colors.textMain }]}>Admit Card Release</Text>
                          <View style={[styles.timelineBadge, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={[styles.timelineBadgeText, { color: '#F59E0B' }]}>Upcoming</Text>
                          </View>
                        </View>
                        <Text style={[styles.timelineNodeDate, { color: theme.colors.textMuted }]}>
                          {formatDate(exam.importantDates.admitCardDate)}
                        </Text>
                      </View>
                    </View>

                    {/* Timeline Node 4: Written Exam */}
                    <View style={styles.timelineCard}>
                      <View style={[styles.timelineLeftAccent, { backgroundColor: '#10B981' }]} />
                      <View style={styles.timelineCardContent}>
                        <View style={styles.timelineCardHeader}>
                          <Text style={[styles.timelineNodeTitle, { color: theme.colors.textMain }]}>Written Exam Date</Text>
                          <View style={[styles.timelineBadge, { backgroundColor: '#D1FAE5' }]}>
                            <Text style={[styles.timelineBadgeText, { color: '#10B981' }]}>Final</Text>
                          </View>
                        </View>
                        <Text style={[styles.timelineNodeDate, { color: theme.colors.textMuted }]}>
                          {formatDate(exam.importantDates.examDate)}
                        </Text>
                      </View>
                    </View>

                    {/* Timeline Node 5: Result Declaration */}
                    <View style={styles.timelineCard}>
                      <View style={[styles.timelineLeftAccent, { backgroundColor: '#3B82F6' }]} />
                      <View style={styles.timelineCardContent}>
                        <View style={styles.timelineCardHeader}>
                          <Text style={[styles.timelineNodeTitle, { color: theme.colors.textMain }]}>Results Declaration</Text>
                          <View style={[styles.timelineBadge, { backgroundColor: '#DBEAFE' }]}>
                            <Text style={[styles.timelineBadgeText, { color: '#3B82F6' }]}>TBA</Text>
                          </View>
                        </View>
                        <Text style={[styles.timelineNodeDate, { color: theme.colors.textMuted }]}>
                          {formatDate(exam.importantDates.resultDate)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.infoCardText, { color: theme.colors.textMuted }]}>
                    No official dates have been declared yet. Check back here periodically for instant schedule updates.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* TAB 5: ELIGIBILITY CRITERIA */}
          {activeTab === 'eligibility' && (
            <View style={styles.tabContent}>
              <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.cardTitleRow}>
                  <CheckCircle color={theme.colors.primary} size={20} />
                  <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Eligibility Guidelines</Text>
                </View>

                {exam.eligibilityCriteria ? (
                  <View style={{ gap: 16 }}>
                    {exam.eligibilityCriteria.ageLimit && (
                      <View style={[styles.eligibilityBlock, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.eligibilityBlockTitle, { color: theme.colors.textMain }]}>Age Limit</Text>
                        <Text style={[styles.infoCardText, { color: theme.colors.textMuted, marginTop: 4 }]}>
                          {exam.eligibilityCriteria.ageLimit}
                        </Text>
                      </View>
                    )}

                    {exam.eligibilityCriteria.educationQualification && (
                      <View style={[styles.eligibilityBlock, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.eligibilityBlockTitle, { color: theme.colors.textMain }]}>Educational Qualifications</Text>
                        <Text style={[styles.infoCardText, { color: theme.colors.textMuted, marginTop: 4 }]}>
                          {exam.eligibilityCriteria.educationQualification}
                        </Text>
                      </View>
                    )}

                    {exam.eligibilityCriteria.nationality && (
                      <View style={[styles.eligibilityBlock, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.eligibilityBlockTitle, { color: theme.colors.textMain }]}>Nationality / Citizenship</Text>
                        <Text style={[styles.infoCardText, { color: theme.colors.textMuted, marginTop: 4 }]}>
                          {exam.eligibilityCriteria.nationality}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.infoCardText, { color: theme.colors.textMuted }]}>
                    Eligibility criteria details will be populated shortly. Usually requires graduation and age limit between 21-32 years.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* TAB 6: FAQS ACCORDION */}
          {activeTab === 'faqs' && (
            <View style={styles.tabContent}>
              <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.cardTitleRow}>
                  <HelpCircle color={theme.colors.primary} size={20} />
                  <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Frequently Asked Questions</Text>
                </View>

                {exam.faqs && exam.faqs.length > 0 ? (
                  <View style={styles.faqList}>
                    {exam.faqs.map((faq, i) => {
                      const isOpen = openFaqIndex === i;
                      return (
                        <View key={i} style={[styles.faqAccordion, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                          <TouchableOpacity 
                            style={styles.faqHeader}
                            onPress={() => setOpenFaqIndex(isOpen ? null : i)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.faqQuestion, { color: theme.colors.textMain }]}>{faq.question}</Text>
                            <View style={[styles.faqArrowCircle, { backgroundColor: isOpen ? theme.colors.primary : 'rgba(0,0,0,0.04)' }]}>
                              <ChevronDown 
                                color={isOpen ? '#FFFFFF' : theme.colors.textMuted} 
                                size={14} 
                                style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} 
                              />
                            </View>
                          </TouchableOpacity>
                          {isOpen && (
                            <View style={[styles.faqBody, { borderTopColor: theme.colors.border }]}>
                              <Text style={[styles.faqAnswer, { color: theme.colors.textMuted }]}>{faq.answer}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={[styles.infoCardText, { color: theme.colors.textMuted }]}>
                    No FAQ lists registered for this exam yet. Check back later for complete updates.
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  errorScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 20,
  },
  errorBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scrollArea: {
    paddingBottom: 40,
  },
  heroCard: {
    margin: 16,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 6,
    position: 'relative',
  },
  heroLayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTextContent: {
    flex: 1.8,
    marginRight: 10,
  },
  eyebrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroEyebrow: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  heroDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  dialMetricWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderTopColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  dialPercentage: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  dialSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 7,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dialStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
    gap: 3,
  },
  dialStatusText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 20,
    paddingVertical: 14,
    marginTop: 24,
    zIndex: 1,
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabBar: {
    paddingHorizontal: 16,
    marginVertical: 16,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  contentWrap: {
    paddingHorizontal: 16,
  },
  tabContent: {},
  infoCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  infoCardText: {
    fontSize: 13,
    lineHeight: 19,
  },
  checklistGrid: {
    gap: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  checkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkDetails: {
    flex: 1,
    marginLeft: 12,
  },
  checkTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  checkSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  salaryWrap: {
    gap: 10,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  salaryRowCol: {
    padding: 14,
    borderRadius: 14,
  },
  salaryKey: {
    fontSize: 12,
    fontWeight: '700',
  },
  salaryVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  salaryValText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
  },
  vacancyBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5B64E8',
    marginRight: 10,
  },
  vacancyTable: {
    gap: 8,
  },
  vacancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  vacancyPostText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  vacancyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vacancyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
  },
  thText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  tdText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  tdTextMarks: {
    fontSize: 13,
    fontWeight: '800',
  },
  tdTextDuration: {
    fontSize: 12,
    fontWeight: '600',
  },
  premiumTimeline: {
    gap: 12,
  },
  timelineCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  timelineLeftAccent: {
    width: 6,
  },
  timelineCardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineNodeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  timelineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timelineBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  timelineNodeDate: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  eligibilityBlock: {
    padding: 14,
    borderRadius: 16,
  },
  eligibilityBlockTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  marketFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  marketFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  marketFilterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  marketplaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  marketGridCard: {
    width: (width - 44) / 2, // 2 columns dynamically calculated
    height: 325, // Fixed uniform height to prevent layout breakages
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  gridCardCoverWrap: {
    width: '100%',
    height: 115,
    position: 'relative',
  },
  gridCardCoverImg: {
    width: '100%',
    height: '100%',
  },
  gridCardBookImg: {
    width: '75%',
    height: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  marketOverlayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overlayBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  bestsellerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  bestsellerBadgeText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
  },
  freeTestsPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeTestsPillText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  gridCardBody: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  gridCardSub: {
    fontSize: 10,
    marginTop: 2,
  },
  gridCardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  starRatingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingNumber: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#D97706',
  },
  ratingCountText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  gridStatsRow: {
    marginTop: 4,
    gap: 2,
  },
  gridStatMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridStatMiniText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  gridCardDivider: {
    height: 1,
    marginVertical: 6,
  },
  gridCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  gridPriceWrap: {
    flexDirection: 'column',
  },
  gridDiscPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  gridOriginalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  gridOrigPrice: {
    fontSize: 9,
    textDecorationLine: 'line-through',
  },
  gridPercentOff: {
    fontSize: 9,
    fontWeight: '800',
  },
  gridBuyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridBuyBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  noMaterialWrap: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderStyle: 'dashed',
    marginTop: 8,
    justifyContent: 'center',
  },
  noMaterialText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  noMaterialSubText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  faqList: {
    gap: 10,
  },
  faqAccordion: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  faqArrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqBody: {
    borderTopWidth: 1,
    padding: 16,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18.5,
  },
  heroGlowCircle1: {
    position: 'absolute',
    top: -45,
    right: -45,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  heroGlowCircle2: {
    position: 'absolute',
    bottom: -35,
    left: -25,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
});
