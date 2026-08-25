import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Share,
  Dimensions,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  BookOpen,
  ChevronRight,
  X,
  LayoutGrid,
  List,
  Filter,
  Calendar,
  Clock,
  Share2,
  Globe,
  Award,
  TrendingUp,
  ChevronDown,
  Check,
  ChevronLeft,
  GraduationCap
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BASE_URL, apiClient } from '../../service/api.service';
import { getImageUrl } from '../../utils/image.utils';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ScreenContainer } from '../../components/common/ScreenContainer';

const { width } = Dimensions.get('window');

interface Exam {
  _id: string;
  name: string;
  slug: string;
  categoryId: string | { _id: string; name: string };
  examImage?: string;
  status?: string;
  shortDescription?: string;
  examLevel?: string; // 'National', 'State', 'International'
  mode?: string; // 'Online', 'Offline', 'Hybrid'
  conductingBody?: string;
  importantDates?: {
    applicationStart?: string;
    applicationEnd?: string;
    admitCardDate?: string;
    examDate?: string;
    resultDate?: string;
  };
  isPopular?: boolean;
  views?: number;
  createdAt?: string;
  phases?: any[];
}

interface ExamCategory {
  _id: string;
  name: string;
  slug: string;
}

const getExamLogoUrl = (url?: string) => {
  if (!url) return '';
  return getImageUrl(url);
};

const EXAM_COLORS = [
  '#6366F1', // Indigo
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export const ExamsPage = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  // Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [sortBy, setSortBy] = useState("latest"); // 'latest' | 'views' | 'name'
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [page, setPage] = useState(1);
  const limit = 10; // Rich mobile cards per page

  // Modals / Dropdowns State
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Category FlatList Ref for scrolling
  const categoryListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [examsRes, catsRes] = await Promise.all([
          apiClient(`${BASE_URL}/exams/all?limit=200`),
          apiClient(`${BASE_URL}/exam-categories/all`)
        ]);

        const allExams = ((examsRes?.exams || []) as Exam[]).filter(e => e.status !== 'INACTIVE');
        setExams(allExams);
        setCategories((catsRes?.categories || []) as ExamCategory[]);
      } catch (err) {
        console.error('Failed to fetch exams/categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter & Sort Logic
  const getFilteredExams = () => {
    let result = [...exams];

    // Search Query
    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      result = result.filter(
        exam => 
          exam.name.toLowerCase().includes(q) || 
          (exam.shortDescription && exam.shortDescription.toLowerCase().includes(q)) ||
          (exam.conductingBody && exam.conductingBody.toLowerCase().includes(q))
      );
    }

    // Category Filter
    if (selectedCategory) {
      result = result.filter(exam => {
        const catId = typeof exam.categoryId === 'object' ? exam.categoryId._id : exam.categoryId;
        return catId === selectedCategory;
      });
    }

    // Exam Level Filter
    if (selectedLevel) {
      result = result.filter(exam => exam.examLevel === selectedLevel);
    }

    // Mode Filter
    if (selectedMode) {
      result = result.filter(exam => exam.mode === selectedMode);
    }

    // Sorting
    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortBy === "views") {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  };

  const filteredExams = getFilteredExams();

  // Paginated Exams
  const paginatedExams = filteredExams.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredExams.length / limit);

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedLevel("");
    setSelectedMode("");
    setSortBy("latest");
    setPage(1);
  };

  const hasActiveFilters = search || selectedCategory || selectedLevel || selectedMode;

  const handleShare = async (exam: Exam) => {
    try {
      const shareMessage = `Check out details for the ${exam.name} Exam! Conducted by ${exam.conductingBody || 'official body'}. Learn about important dates, syllabus, pattern and expert-curated materials.\n\nRead more details here: https://myedudocs.com/exams/${exam.slug}`;
      await Share.share({
        title: exam.name,
        message: shareMessage,
      });
    } catch (error) {
      console.log('Error sharing exam:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  // Rendering shimmering loader
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.skeletonCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.skeletonTop}>
            <SkeletonLoader width={40} height={40} borderRadius={10} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonLoader width="60%" height={16} />
              <SkeletonLoader width="40%" height={12} style={{ marginTop: 6 }} />
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <SkeletonLoader width="90%" height={12} />
            <SkeletonLoader width="75%" height={12} style={{ marginTop: 6 }} />
          </View>
          <View style={styles.skeletonDivider} />
          <View style={styles.skeletonFooter}>
            <SkeletonLoader width="40%" height={28} borderRadius={14} />
            <SkeletonLoader width="15%" height={28} borderRadius={14} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <>
    <ScreenContainer
      header={{ title: 'Exams', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll
      contentStyle={styles.scrollContent}
    >
        {/* ── Visual Brand Hero Banner ── */}
        <View style={[styles.heroCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <View style={styles.eyebrowContainer}>
                <Award color="#FFFFFF" size={12} />
                <Text style={styles.heroEyebrow}>INDIA'S PREMIER EXAM HUB</Text>
              </View>
              <Text style={styles.heroTitle}>Discover Your Next{'\n'}Career Move</Text>
              <Text style={styles.heroSubtitle}>
                Explore {exams.length}+ government & competitive exams. Expert mock tests, previous papers, and prep materials.
              </Text>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.heroStats}>
            <View style={styles.statBox}>
              <Text style={styles.statCount}>{exams.length || '100+'}</Text>
              <Text style={styles.statLabel}>Active Exams</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statBox}>
              <Text style={styles.statCount}>{categories.length || '15+'}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statBox}>
              <Text style={styles.statCount}>50K+</Text>
              <Text style={styles.statLabel}>Aspirants</Text>
            </View>
          </View>
        </View>

        {/* ── Search Bar Section ── */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Search color={theme.colors.textMuted} size={18} />
            <TextInput
              placeholder="Search (e.g. UPSC, SSC, IBPS, Bank)..."
              placeholderTextColor={theme.colors.textLight}
              style={[styles.searchInput, { color: theme.colors.textMain }]}
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                setPage(1);
              }}
            />
            {search.trim().length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
                <X color={theme.colors.textMuted} size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Category Chip Slider ── */}
        {!loading && categories.length > 0 && (
          <View style={styles.categoryWrap}>
            <FlatList
              ref={categoryListRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ _id: "", name: "All Exams" }, ...categories]}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.categoriesContent}
              renderItem={({ item }) => {
                const count = item._id === "" 
                  ? exams.length 
                  : exams.filter(e => {
                      const catId = typeof e.categoryId === 'object' ? e.categoryId._id : e.categoryId;
                      return catId === item._id;
                    }).length;

                if (count === 0) return null;
                const isActive = selectedCategory === item._id;

                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryPill,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                      isActive && [styles.categoryPillActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]
                    ]}
                    onPress={() => {
                      setSelectedCategory(item._id);
                      setPage(1);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: theme.colors.textMuted },
                        isActive && styles.categoryPillTextActive
                      ]}
                    >
                      {item.name} <Text style={[styles.pillCount, isActive && { color: 'rgba(255,255,255,0.8)' }]}>({count})</Text>
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* ── Filters Toolbar ── */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Text style={[styles.resultCount, { color: theme.colors.textMuted }]}>
              Found <Text style={{ color: theme.colors.textMain, fontWeight: '800' }}>{filteredExams.length}</Text> exams
            </Text>
          </View>
          <View style={styles.toolbarRight}>
            {/* Filter Toggle Button */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => setShowFilterModal(true)}
            >
              <Filter color={theme.colors.textMain} size={15} />
              <Text style={[styles.actionButtonText, { color: theme.colors.textMain }]}>
                {selectedLevel || selectedMode ? 'Filters (•)' : 'Filters'}
              </Text>
            </TouchableOpacity>

            {/* Sort Toggle Button */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => setShowSortModal(true)}
            >
              <TrendingUp color={theme.colors.textMain} size={15} />
              <Text style={[styles.actionButtonText, { color: theme.colors.textMain }]}>
                {sortBy === 'latest' ? 'Latest' : sortBy === 'views' ? 'Popular' : 'A-Z'}
              </Text>
            </TouchableOpacity>

            {/* Layout Toggle */}
            <View style={[styles.layoutToggle, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity 
                style={[styles.layoutButton, viewMode === 'grid' && [styles.layoutButtonActive, { backgroundColor: theme.colors.primaryLight }]]}
                onPress={() => setViewMode('grid')}
              >
                <LayoutGrid color={viewMode === 'grid' ? theme.colors.primary : theme.colors.textMuted} size={15} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.layoutButton, viewMode === 'list' && [styles.layoutButtonActive, { backgroundColor: theme.colors.primaryLight }]]}
                onPress={() => setViewMode('list')}
              >
                <List color={viewMode === 'list' ? theme.colors.primary : theme.colors.textMuted} size={15} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Active Filter Badges ── */}
        {hasActiveFilters && (
          <View style={styles.activeFilterChips}>
            {search && (
              <View style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.filterChipText, { color: theme.colors.textMain }]}>Search: "{search}"</Text>
                <TouchableOpacity onPress={() => setSearch("")}>
                  <X color={theme.colors.textMuted} size={12} style={styles.chipCloseIcon} />
                </TouchableOpacity>
              </View>
            )}
            {selectedCategory && (
              <View style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.filterChipText, { color: theme.colors.textMain }]}>
                  Category: {categories.find(c => c._id === selectedCategory)?.name || 'Filtered'}
                </Text>
                <TouchableOpacity onPress={() => setSelectedCategory("")}>
                  <X color={theme.colors.textMuted} size={12} style={styles.chipCloseIcon} />
                </TouchableOpacity>
              </View>
            )}
            {selectedLevel && (
              <View style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.filterChipText, { color: theme.colors.textMain }]}>Level: {selectedLevel}</Text>
                <TouchableOpacity onPress={() => setSelectedLevel("")}>
                  <X color={theme.colors.textMuted} size={12} style={styles.chipCloseIcon} />
                </TouchableOpacity>
              </View>
            )}
            {selectedMode && (
              <View style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.filterChipText, { color: theme.colors.textMain }]}>Mode: {selectedMode}</Text>
                <TouchableOpacity onPress={() => setSelectedMode("")}>
                  <X color={theme.colors.textMuted} size={12} style={styles.chipCloseIcon} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={clearFilters}>
              <Text style={[styles.resetAllText, { color: theme.colors.primary }]}>Reset All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Main Content Grid/List ── */}
        {loading ? (
          renderSkeleton()
        ) : paginatedExams.length > 0 ? (
          viewMode === 'grid' ? (
            <View style={styles.gridContainer}>
              {paginatedExams.map((exam, i) => {
                const logoUrl = getExamLogoUrl(exam.examImage);
                const accentColor = EXAM_COLORS[i % EXAM_COLORS.length];
                const dates = exam.importantDates || {};

                return (
                  <TouchableOpacity
                    key={exam._id}
                    style={[styles.gridCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => navigation.navigate('ExamDetails', { slug: exam.slug })}
                    activeOpacity={0.9}
                  >
                    {/* Top Accent Strip */}
                    <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />

                    {/* Logo & Level Badges */}
                    <View style={styles.gridCardHeader}>
                      <View style={[styles.logoWrap, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}35` }]}>
                        {logoUrl ? (
                          <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
                        ) : (
                          <GraduationCap color={accentColor} size={20} strokeWidth={2} />
                        )}
                      </View>

                      <View style={styles.badgesWrap}>
                        {exam.examLevel && (
                          <View style={[styles.tagBadge, { backgroundColor: theme.colors.background }]}>
                            <Text style={[styles.tagBadgeText, { color: theme.colors.textMuted }]}>{exam.examLevel}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Info */}
                    <View style={styles.gridCardBody}>
                      <Text style={[styles.examTitleText, { color: theme.colors.textMain }]} numberOfLines={1}>
                        {exam.name}
                      </Text>
                      <Text style={[styles.conductingText, { color: accentColor }]}>
                        {exam.conductingBody || 'Competitive Board'}
                      </Text>
                      <Text style={[styles.examDescText, { color: theme.colors.textMuted }]} numberOfLines={2}>
                        {exam.shortDescription || `Master the ${exam.name} examination with top quality mocks.`}
                      </Text>

                      {/* Dates */}
                      {(dates.applicationStart || dates.applicationEnd) && (
                        <View style={[styles.metaRow, { borderTopColor: theme.colors.border }]}>
                          <Calendar color={theme.colors.textLight} size={12} />
                          <Text style={[styles.metaText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                            Apply: {formatDate(dates.applicationStart) || 'TBA'} - {formatDate(dates.applicationEnd) || 'TBA'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Footer Actions */}
                    <View style={[styles.gridCardFooter, { borderTopColor: theme.colors.border }]}>
                      <TouchableOpacity 
                        style={[styles.btnExplore, { backgroundColor: theme.colors.primary }]}
                        onPress={() => navigation.navigate('ExamDetails', { slug: exam.slug })}
                      >
                        <Text style={styles.btnExploreText}>Details</Text>
                        <ChevronRight color="#FFFFFF" size={14} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.btnShare, { borderColor: theme.colors.border }]}
                        onPress={() => handleShare(exam)}
                      >
                        <Share2 color={theme.colors.textMuted} size={14} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {paginatedExams.map((exam, i) => {
                const logoUrl = getExamLogoUrl(exam.examImage);
                const accentColor = EXAM_COLORS[i % EXAM_COLORS.length];
                const dates = exam.importantDates || {};

                return (
                  <TouchableOpacity
                    key={exam._id}
                    style={[styles.listCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => navigation.navigate('ExamDetails', { slug: exam.slug })}
                    activeOpacity={0.9}
                  >
                    {/* Left Accent Bar */}
                    <View style={[styles.listCardLeftAccent, { backgroundColor: accentColor }]} />

                    <View style={styles.listCardBody}>
                      <View style={styles.listCardHeader}>
                        <View style={[styles.listLogoWrap, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}35` }]}>
                          {logoUrl ? (
                            <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
                          ) : (
                            <GraduationCap color={accentColor} size={22} strokeWidth={2} />
                          )}
                        </View>
                        <View style={styles.listCardTitleWrap}>
                          <Text style={[styles.listExamTitleText, { color: theme.colors.textMain }]} numberOfLines={1}>
                            {exam.name}
                          </Text>
                          <Text style={[styles.listConductingText, { color: accentColor }]}>
                            {exam.conductingBody || 'Competitive Board'}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.listExamDescText, { color: theme.colors.textMuted }]} numberOfLines={2}>
                        {exam.shortDescription || `Preparation courses, live classes and best practice test series to clear ${exam.name}.`}
                      </Text>

                      {/* Info & Tags Row */}
                      <View style={styles.listMetaRow}>
                        {exam.examLevel && (
                          <View style={[styles.tagBadge, { backgroundColor: theme.colors.background }]}>
                            <Globe color={theme.colors.textMuted} size={10} style={{ marginRight: 4 }} />
                            <Text style={[styles.tagBadgeText, { color: theme.colors.textMuted }]}>{exam.examLevel}</Text>
                          </View>
                        )}
                        {exam.mode && (
                          <View style={[styles.tagBadge, { backgroundColor: theme.colors.background }]}>
                            <Award color={theme.colors.textMuted} size={10} style={{ marginRight: 4 }} />
                            <Text style={[styles.tagBadgeText, { color: theme.colors.textMuted }]}>{exam.mode}</Text>
                          </View>
                        )}
                        {(dates.applicationStart || dates.applicationEnd) && (
                          <View style={[styles.tagBadge, { backgroundColor: theme.colors.background }]}>
                            <Clock color={theme.colors.textMuted} size={10} style={{ marginRight: 4 }} />
                            <Text style={[styles.tagBadgeText, { color: theme.colors.textMuted }]}>
                              End: {formatDate(dates.applicationEnd) || 'TBA'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Footer */}
                      <View style={[styles.listCardFooter, { borderTopColor: theme.colors.border }]}>
                        <View style={{ flex: 1 }} />
                        <View style={styles.listActions}>
                          <TouchableOpacity 
                            style={[styles.btnShare, { borderColor: theme.colors.border, marginRight: 8 }]}
                            onPress={() => handleShare(exam)}
                          >
                            <Share2 color={theme.colors.textMuted} size={14} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.listBtnExplore, { backgroundColor: theme.colors.primary }]}
                            onPress={() => navigation.navigate('ExamDetails', { slug: exam.slug })}
                          >
                            <Text style={styles.listBtnExploreText}>Explore Preparation</Text>
                            <ChevronRight color="#FFFFFF" size={14} strokeWidth={2.5} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        ) : (
          <View style={styles.emptyWrap}>
            <BookOpen color={theme.colors.textLight} size={48} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>No Exams Found</Text>
            <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
              We couldn't find any exams matching your selected filters. Try resetting them.
            </Text>
            <TouchableOpacity 
              style={[styles.btnResetEmpty, { backgroundColor: theme.colors.primary }]}
              onPress={clearFilters}
            >
              <Text style={styles.btnResetEmptyText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Pagination controls ── */}
        {!loading && totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity 
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
              disabled={page === 1}
              onPress={() => setPage(p => p - 1)}
            >
              <ChevronLeft color={page === 1 ? theme.colors.textLight : theme.colors.textMain} size={18} />
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = page === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.pageNumberBtn,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                      isCurrent && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    ]}
                    onPress={() => setPage(p)}
                  >
                    <Text style={[styles.pageNumberText, { color: theme.colors.textMuted }, isCurrent && { color: '#FFFFFF', fontWeight: '800' }]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
              disabled={page === totalPages}
              onPress={() => setPage(p => p + 1)}
            >
              <ChevronRight color={page === totalPages ? theme.colors.textLight : theme.colors.textMain} size={18} />
            </TouchableOpacity>
          </View>
        )}
    </ScreenContainer>

      {/* ── Sort Options Modal ── */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textMain }]}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X color={theme.colors.textMain} size={20} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'Latest First', value: 'latest' },
              { label: 'Most Popular', value: 'views' },
              { label: 'A to Z', value: 'name' }
            ].map((option) => {
              const isSelected = sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalOption, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    setSortBy(option.value);
                    setPage(1);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: theme.colors.textMain }, isSelected && { color: theme.colors.primary, fontWeight: '800' }]}>
                    {option.label}
                  </Text>
                  {isSelected && <Check color={theme.colors.primary} size={18} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Filters Options Modal ── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textMain }]}>Filter Exams</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X color={theme.colors.textMain} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.filterModalBody}>
              {/* Level Filter */}
              <Text style={[styles.filterGroupTitle, { color: theme.colors.textMain }]}>Exam Level</Text>
              <View style={styles.filterChipRow}>
                {['', 'National', 'State', 'International'].map((lvl) => {
                  const isSelected = selectedLevel === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.filterModalChip,
                        { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                        isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                      ]}
                      onPress={() => setSelectedLevel(lvl)}
                    >
                      <Text style={[styles.filterModalChipText, { color: theme.colors.textMuted }, isSelected && { color: '#FFFFFF', fontWeight: '800' }]}>
                        {lvl === '' ? 'All Levels' : lvl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Mode Filter */}
              <Text style={[styles.filterGroupTitle, { color: theme.colors.textMain, marginTop: 20 }]}>Exam Mode</Text>
              <View style={styles.filterChipRow}>
                {['', 'Online', 'Offline', 'Hybrid'].map((md) => {
                  const isSelected = selectedMode === md;
                  return (
                    <TouchableOpacity
                      key={md}
                      style={[
                        styles.filterModalChip,
                        { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                        isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                      ]}
                      onPress={() => setSelectedMode(md)}
                    >
                      <Text style={[styles.filterModalChipText, { color: theme.colors.textMuted }, isSelected && { color: '#FFFFFF', fontWeight: '800' }]}>
                        {md === '' ? 'All Modes' : md}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={[styles.filterModalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.btnModalClear, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setSelectedLevel("");
                  setSelectedMode("");
                }}
              >
                <Text style={[styles.btnModalClearText, { color: theme.colors.textMuted }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnModalApply, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setPage(1);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.btnModalApplyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },
  heroCard: {
    marginHorizontal: 0,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#5B64E8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  eyebrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
    lineHeight: 16,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    marginTop: 2,
  },
  statSep: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchSection: {
    paddingHorizontal: 0,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 4,
  },
  categoryWrap: {
    paddingBottom: 14,
  },
  categoriesContent: {
    paddingHorizontal: 0,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillActive: {
    shadowColor: '#5B64E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pillCount: {
    fontSize: 10,
    fontWeight: '700',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingBottom: 14,
  },
  toolbarLeft: {
    flex: 1,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  layoutToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    padding: 2,
  },
  layoutButton: {
    width: 28,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layoutButtonActive: {},
  activeFilterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 0,
    paddingBottom: 12,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipCloseIcon: {
    marginLeft: 6,
  },
  resetAllText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  gridCard: {
    width: (width - 32 - 12) / 2, // 2 equal columns within ScreenContainer
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardAccent: {
    height: 4,
    width: '100%',
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  logoWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoImage: {
    width: '75%',
    height: '75%',
  },
  badgesWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  gridCardBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flex: 1,
  },
  examTitleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  conductingText: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  examDescText: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
    gap: 6,
  },
  metaText: {
    fontSize: 9,
    fontWeight: '600',
    flex: 1,
  },
  gridCardFooter: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  btnExplore: {
    flex: 1,
    flexDirection: 'row',
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  btnExploreText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  btnShare: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 0,
    gap: 14,
  },
  listCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  listCardLeftAccent: {
    width: 6,
  },
  listCardBody: {
    flex: 1,
    padding: 14,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listCardTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  listExamTitleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  listConductingText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  listExamDescText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8,
  },
  listMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  listCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listBtnExplore: {
    flexDirection: 'row',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  listBtnExploreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  btnResetEmpty: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnResetEmptyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    paddingHorizontal: 16,
    gap: 10,
  },
  pageButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageNumbers: {
    alignItems: 'center',
    gap: 6,
  },
  pageNumberBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  skeletonCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  skeletonTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 12,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterModalBody: {
    padding: 20,
  },
  filterGroupTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterModalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterModalChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  btnModalClear: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnModalClearText: {
    fontSize: 13,
    fontWeight: '800',
  },
  btnModalApply: {
    flex: 2,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnModalApplyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
