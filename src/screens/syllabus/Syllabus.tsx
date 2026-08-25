import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Share
} from 'react-native';
import {
  Search,
  Calendar,
  Layers,
  ChevronDown,
  Download,
  Eye,
  BookOpen,
  GraduationCap,
  Clock,
  Share2
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ENDPOINTS, apiClient } from '../../service/api.service';
import { DownloadPopupModal } from '../../components/DownloadPopupModal';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// --------------------------------------------------------
// 1. MOCK DATA & TYPES (For Fallbacks)
// --------------------------------------------------------
interface SyllabusItem {
  _id: string;
  examCategory: string;
  examName: string;
  title?: string;
  isFeatured?: boolean;
  subjects?: string[];
  examPattern?: {
    examMode?: string;
    numberOfQuestions?: number;
    duration?: number;
  };
  syllabusPDF: string;
}

const FALLBACK_SYLLABUS: SyllabusItem[] = [
  {
    _id: 's1',
    examCategory: 'UPSC',
    examName: 'UPSC CSE 2025',
    title: 'Comprehensive Syllabus Guide',
    isFeatured: true,
    subjects: ['History', 'Geography', 'Polity'],
    examPattern: { examMode: 'OFFLINE', numberOfQuestions: 100, duration: 120 },
    syllabusPDF: ''
  },
  {
    _id: 's2',
    examCategory: 'SSC',
    examName: 'SSC CGL Tier 1',
    title: 'Latest Syllabus & Pattern',
    isFeatured: false,
    subjects: ['Quant', 'English', 'Reasoning', 'GA'],
    examPattern: { examMode: 'CBT', numberOfQuestions: 100, duration: 60 },
    syllabusPDF: ''
  }
];

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const Syllabus = () => {
  const { theme, isDarkMode } = useTheme();
  const [activeFilter, setActiveFilter] = useState('All Exams');
  const [searchQuery, setSearchQuery] = useState('');

  const [syllabuses, setSyllabuses] = useState<SyllabusItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Download Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SyllabusItem | null>(null);

  const openDownloadModal = (item: SyllabusItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // Fetch Syllabus
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient(ENDPOINTS.GET_SYLLABUS);

        if (response?.syllabuses && response.syllabuses.length > 0) {
          setSyllabuses(response.syllabuses);
        } else {
          setSyllabuses(FALLBACK_SYLLABUS);
        }
      } catch (err) {
        console.error("Error fetching Syllabus", err);
        setSyllabuses(FALLBACK_SYLLABUS);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- DYNAMIC FILTERS ---
  const dynamicFilters = useMemo(() => {
    if (!syllabuses || syllabuses.length === 0) return ['All Exams'];
    const cats = syllabuses
      .map(item => item.examCategory)
      .filter((value, index, self) => value && self.indexOf(value) === index);
    return ['All Exams', ...cats];
  }, [syllabuses]);

  // --- FILTERING LOGIC ---
  const displayedSyllabus = useMemo(() => {
    return syllabuses.filter(item => {
      const matchesCat = activeFilter === 'All Exams' || item.examCategory === activeFilter;
      const matchesSearch = item.examName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [syllabuses, activeFilter, searchQuery]);

  // --- OPEN PDF ---
  const handleOpenPDF = (pdfPath: string) => {
    if (!pdfPath) return;
    const fullUrl = pdfPath.startsWith('http') ? pdfPath : `https://api.myedudocs.in/${pdfPath.replace(/\\/g, '/')}`;
    Linking.openURL(fullUrl).catch(err => console.error("Couldn't load page", err));
  };

  // --- SHARE SYLLABUS ---
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out the complete Exam Syllabus for various exams here:\nhttps://myedudocs.in/syllabus`,
      });
    } catch (error) {
      console.log('Error sharing syllabus:', error);
    }
  };

  const handleSyllabusShare = async (item: SyllabusItem) => {
    try {
      await Share.share({
        message: `Check out the ${item.examName} Syllabus on MyEduDocs!\nDetailed guide: https://myedudocs.in/syllabus`,
      });
    } catch (error) {
      console.log('Error sharing syllabus item:', error);
    }
  };

  return (
    <ScreenContainer
      header={{ title: 'Syllabus', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={true}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* --- HORIZONTAL TABS --- */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
          {dynamicFilters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.tabPill,
                  { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' },
                  activeFilter === filter && styles.tabPillActive
                ]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, { color: theme.colors.textSecondary }, activeFilter === filter && styles.tabTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* --- SEARCH BAR --- */}
        <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.colors.border }]}>
          <Search color={theme.colors.textMuted} size={18} strokeWidth={2.5} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textMain }]}
            placeholder="Search by exam name or subject..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* --- DROPDOWN FILTERS ROW --- */}
        <View style={styles.dropdownRow}>
          <TouchableOpacity style={[styles.dropdownBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} activeOpacity={0.7}>
            <View style={styles.dropdownLeft}>
              <Calendar color={theme.colors.textSecondary} size={16} style={{ marginRight: 8 }} />
              <Text style={[styles.dropdownText, { color: theme.colors.textMain }]}>Year</Text>
            </View>
            <ChevronDown color={theme.colors.textSecondary} size={16} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.dropdownBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} activeOpacity={0.7}>
            <View style={styles.dropdownLeft}>
              <Layers color={theme.colors.textSecondary} size={16} style={{ marginRight: 8 }} />
              <Text style={[styles.dropdownText, { color: theme.colors.textMain }]}>Exam Stage</Text>
            </View>
            <ChevronDown color={theme.colors.textSecondary} size={16} />
          </TouchableOpacity>
        </View>

        {/* --- SYLLABUS LIST --- */}
        {loading ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6366F6" />
          </View>
        ) : displayedSyllabus.length === 0 ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ color: '#64748B' }}>No syllabus found.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {displayedSyllabus.map((item) => {

              const examMode = item.examPattern?.examMode ? item.examPattern.examMode.toUpperCase() : 'LATEST SYLLABUS';

              return (
                <View key={item._id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>

                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.badge, { backgroundColor: isDarkMode ? 'rgba(22,163,74,0.15)' : '#DCFCE7' }]}>
                      <Text style={styles.badgeText}>{examMode}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity onPress={() => handleSyllabusShare(item)} activeOpacity={0.7}>
                        <Share2 color={theme.colors.textMuted} size={16} />
                      </TouchableOpacity>
                      {item.isFeatured && (
                        <Text style={styles.featuredText}>FEATURED</Text>
                      )}
                    </View>
                  </View>

                  {/* Titles */}
                  <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>{item.examName}</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>{item.title || 'Comprehensive Syllabus Guide'}</Text>

                  {/* Tags Row */}
                  <View style={styles.tagsRow}>
                    <View style={[styles.tagWrap, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.colors.border }]}>
                      <BookOpen color={theme.colors.textSecondary} size={12} style={{ marginRight: 4 }} />
                      <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>{item.subjects?.length || 0} Subjects</Text>
                    </View>
                    <View style={[styles.tagWrap, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.colors.border }]}>
                      <GraduationCap color={theme.colors.textSecondary} size={12} style={{ marginRight: 4 }} />
                      <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>{item.examPattern?.numberOfQuestions || 0} Qs</Text>
                    </View>
                    <View style={[styles.tagWrap, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.colors.border }]}>
                      <Clock color={theme.colors.textSecondary} size={12} style={{ marginRight: 4 }} />
                      <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>{item.examPattern?.duration || 0} Mins</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenPDF(item.syllabusPDF)}
                    >
                      <Eye color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
                      <Text style={styles.viewBtnText}>View Syllabus</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.downloadBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      activeOpacity={0.7}
                      onPress={() => openDownloadModal(item)}
                    >
                      <Download color={theme.colors.textSecondary} size={20} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>

                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {selectedItem && (
        <DownloadPopupModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          targetUrl={selectedItem.syllabusPDF.startsWith('http') ? selectedItem.syllabusPDF : `https://api.myedudocs.in/${selectedItem.syllabusPDF.replace(/\\/g, '/')}`}
          resourceTitle={selectedItem.examName}
          resourceType="syllabus"
        />
      )}
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 3. EXACT STYLES (Kept identical to PreviousPapers)
// --------------------------------------------------------
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },

  // Horizontal Tabs
  tabsWrapper: {
    marginBottom: 16,
  },
  tabsScrollContent: {
    paddingHorizontal: 0,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabPillActive: {
    backgroundColor: '#6366F6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    height: '100%',
  },

  // Dropdowns
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // List Container
  listContainer: {
    gap: 16,
  },

  // Cards
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B', // Amber for featured
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Buttons Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#6366F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  downloadBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});