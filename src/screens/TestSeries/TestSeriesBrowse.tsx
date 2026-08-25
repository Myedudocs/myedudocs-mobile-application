import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Search,
  BookOpen,
  ChevronRight,
  ClipboardList,
  ClipboardCheck,
  HelpCircle,
  ArrowRight,
  Target,
  Heart
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient, BASE_URL } from '../../service/api.service';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Header } from '../home/Header';
import { ScreenContainer } from '../../components/common/ScreenContainer';

const { width } = Dimensions.get('window');

interface ExaminationCategory {
  _id: string;
  name: string;
  code: string;
  year?: number;
  description?: string;
  statistics?: {
    totalSubjects: number;
    totalTestSeries: number;
  };
}

export const TestSeriesBrowse = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.token) {
      fetchWishlist();
    } else {
      setWishlistedIds(new Set());
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user?.token) return;
    try {
      const wishlistRes = await fetch(`${BASE_URL}/wishlist/my`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const wishlistData = await wishlistRes.json();
      if (wishlistData?.data?.items) {
        const ids = new Set<string>(
          wishlistData.data.items
            .filter((i: any) => i.item_type === 'test_series')
            .map((i: any) => i.item_id)
        );
        setWishlistedIds(ids);
      }
    } catch (err) {
      console.error('Failed to load wishlist', err);
    }
  };

  const toggleWishlist = async (exam: ExaminationCategory) => {
    if (!user?.token) {
      Alert.alert("Login Required", "Please login to save this test series to your wishlist ❤️", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("Login") }
      ]);
      return;
    }
    if (wishlistLoadingId) return;

    const isSaved = wishlistedIds.has(exam._id);
    setWishlistLoadingId(exam._id);

    try {
      const res = await fetch(`${BASE_URL}/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          item_type: 'test_series',
          item_id: exam._id,
          snapshot: { title: exam.name, code: exam.code, year: exam.year }
        })
      });
      
      if (res.ok) {
        setWishlistedIds(prev => {
          const n = new Set(prev);
          isSaved ? n.delete(exam._id) : n.add(exam._id);
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

  const [examinations, setExaminations] = useState<ExaminationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Exams');

  useEffect(() => {
    fetchExaminations();
  }, []);

  const fetchExaminations = async () => {
    try {
      setLoading(true);
      const response = await apiClient(
        `${BASE_URL}/test-series/navigation/examinations`
      );
      
      let list = [];
      if (response?.success && response.data) {
        if (Array.isArray(response.data)) {
          list = response.data;
        } else if (Array.isArray(response.data.examinationCategories)) {
          list = response.data.examinationCategories;
        } else if (response.data.data && Array.isArray(response.data.data.examinationCategories)) {
          list = response.data.data.examinationCategories;
        }
      }
      setExaminations(list);
    } catch (error) {
      console.error('Failed to fetch examinations:', error);
      setExaminations([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic filter tabs
  const dynamicFilterList = useMemo(() => {
    if (!Array.isArray(examinations) || examinations.length === 0) return ['All Exams'];
    const codes = examinations
      .map(exam => exam?.code)
      .filter((value, index, self) => value && self.indexOf(value) === index);
    return ['All Exams', ...codes];
  }, [examinations]);

  // Combined filtering: Category + Search query
  const filteredExaminations = useMemo(() => {
    let filtered = (Array.isArray(examinations) ? examinations : []).filter(Boolean);

    if (selectedCategory !== 'All Exams') {
      filtered = filtered.filter(exam => exam && exam.code === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        exam =>
          exam &&
          (exam.name?.toLowerCase().includes(query) ||
            (exam.code && exam.code.toLowerCase().includes(query)) ||
            (exam.description && exam.description.toLowerCase().includes(query)))
      );
    }

    return filtered;
  }, [examinations, selectedCategory, searchQuery]);

  const handleExamSelect = (exam: ExaminationCategory) => {
    navigation.navigate('TestSeriesDetails', {
      id: exam._id,
    });
  };

  const ExamCard = ({ exam }: { exam: ExaminationCategory }) => {
    const totalMocks = exam.statistics?.totalTestSeries || 0;
    const totalSubjects = exam.statistics?.totalSubjects || 0;
    const totalQuestions = (exam as any).examPattern?.totalQuestions || (totalMocks * 100) || "200+";

    return (
      <View style={[styles.card, { backgroundColor: isDarkMode ? theme.colors.cardBg : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
        <View style={styles.topAccentBar} />
        <View style={styles.cardHeader}>
          <View style={styles.badgeGroup}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{exam.code}</Text>
            </View>
            <View style={styles.yearBadge}>
              <Text style={styles.yearBadgeText}>
                {exam.year ? `${exam.year}/${exam.year + 1}` : '2026/2027'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.iconBtn} 
            onPress={() => toggleWishlist(exam)} 
            disabled={wishlistLoadingId === exam._id}
          >
            {wishlistLoadingId === exam._id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Heart 
                color={wishlistedIds.has(exam._id) ? "#EF4444" : "#94A3B8"} 
                fill={wishlistedIds.has(exam._id) ? "#EF4444" : "transparent"} 
                size={18} 
                strokeWidth={2.5} 
              />
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.examName, { color: theme.colors.text }]} numberOfLines={2}>
          {exam.name}
        </Text>
        <Text style={[styles.examDesc, { color: theme.colors.textSecondary }]} numberOfLines={3}>
          {exam.description || 'Updated questions based on latest exam pattern & negative marking.'}
        </Text>

        <View style={styles.divider} />

        {/* Stats Grid */}
        <View style={[styles.statsGrid, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFF', borderColor: isDarkMode ? '#334155' : '#E8EDFF' }]}>
          <View style={styles.statBox}>
            <ClipboardCheck color="#6366F1" size={20} style={styles.statIcon} />
            <View style={styles.statLabels}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{totalMocks}</Text>
              <Text style={styles.statLabel}>MOCKS</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <BookOpen color="#10B981" size={20} style={styles.statIcon} />
            <View style={styles.statLabels}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{totalSubjects}</Text>
              <Text style={styles.statLabel}>SUBJECTS</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <HelpCircle color="#F59E0B" size={20} style={styles.statIcon} />
            <View style={styles.statLabels}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{totalQuestions}</Text>
              <Text style={styles.statLabel}>QUES</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.exploreCta}
          onPress={() => handleExamSelect(exam)}
          activeOpacity={0.8}
        >
          <Text style={styles.exploreCtaText}>Explore Test Series</Text>
          <ArrowRight color="#FFFFFF" size={16} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenContainer
      header={{
        title: 'Browse Tests',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
      }}
      scroll={false}
    >
      {/* Category Slider & Search */}
      <View style={[styles.searchFilterContainer, { backgroundColor: theme.colors.background }]}>
        
        {/* Horizontal Category Slider */}
        <View style={styles.sliderWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sliderContent}
          >
            {dynamicFilterList.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.catChip,
                  { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' },
                  selectedCategory === tab && [styles.catChipActive, { backgroundColor: '#6366F1', borderColor: '#6366F1' }]
                ]}
                onPress={() => setSelectedCategory(tab)}
                activeOpacity={0.8}
              >
                <ClipboardList color={selectedCategory === tab ? '#FFFFFF' : '#64748B'} size={14} style={styles.catChipIcon} />
                <Text style={[
                  styles.catChipText,
                  selectedCategory === tab && styles.catChipTextActive
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Refined Search Box */}
        <View style={[styles.searchBox, { backgroundColor: isDarkMode ? theme.colors.cardBg : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
          <Search size={18} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search test series..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentPadding}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonLoader height={200} borderRadius={16} />
            <SkeletonLoader height={200} borderRadius={16} style={{ marginTop: 12 }} />
          </View>
        ) : filteredExaminations.length > 0 ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Competitive Exams Test Series
              </Text>
              <Text style={styles.sectionSubtitle}>
                Showing {filteredExaminations.length} packages
              </Text>
            </View>
            
            {filteredExaminations.map((exam, index) => (
              <ExamCard key={exam._id} exam={exam} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Target color="#CBD5E1" size={48} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Test Series Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              {searchQuery.trim()
                ? "Try a different search term or category"
                : "No test series packages available at the moment."}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  searchFilterContainer: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  sliderWrapper: {
    height: 40,
    marginBottom: 4,
  },
  sliderContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    shadowColor: '#5B6CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  catChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  catChipIcon: {
    marginRight: 6,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    height: 46,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#5B6CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 24,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#5B6CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  topAccentBar: {
    height: 4,
    backgroundColor: '#6366F1',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#6366F1',
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  yearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  yearBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  examName: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    marginBottom: 6,
  },
  examDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EDFF',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 6,
  },
  statLabels: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6366F6',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8EDFF',
  },
  exploreCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 46,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  exploreCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  iconBtn: {
    padding: 4,
  },
  loadingContainer: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: 30,
    lineHeight: 18,
  },
});
