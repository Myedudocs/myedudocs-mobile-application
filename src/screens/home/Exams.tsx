import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, BookOpen, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BASE_URL, apiClient } from '../../service/api.service';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ScreenContainer } from '../../components/common/ScreenContainer';

interface Exam {
  _id: string;
  name: string;
  slug: string;
  categoryId: string | { _id: string; name: string };
  examImage?: string;
  status?: string;
  shortDescription?: string;
}

interface ExamCategory {
  _id: string;
  name: string;
  slug: string;
}

const getExamLogoUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL.replace('/api/v1', '')}${url}`; 
};

const ACCENT_COLORS = [
  '#6366F1', // Indigo
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
];

export const Exams = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [examsRes, catsRes] = await Promise.all([
          apiClient(`${BASE_URL}/exams/all?limit=150`),
          apiClient(`${BASE_URL}/exam-categories/all`)
        ]);
        
        setExams((examsRes?.exams || []) as Exam[]);
        setCategories((catsRes?.categories || []) as ExamCategory[]);
      } catch (err) {
        console.error('Failed to fetch exams/categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getFilteredExams = () => {
    let result = exams.filter(e => e.status !== 'INACTIVE');
    
    if (selectedCategory !== "All") {
      result = result.filter(exam => {
        const catObj = typeof exam.categoryId === 'object' ? exam.categoryId.name : categories.find(c => c._id === exam.categoryId)?.name;
        return catObj === selectedCategory;
      });
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(exam => exam.name.toLowerCase().includes(q) || (exam.shortDescription && exam.shortDescription.toLowerCase().includes(q)));
    }

    return result;
  };

  const filteredExams = getFilteredExams();

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={[styles.examRowCardSkeleton, { borderColor: theme.colors.border }]}>
          <SkeletonLoader width={48} height={48} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonLoader width="65%" height={16} />
            <SkeletonLoader width="35%" height={12} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScreenContainer
      header={{ title: 'Exams', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll
    >
      {/* Modern Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Search color={theme.colors.textMuted} size={18} />
          <TextInput
            placeholder="Search exams (e.g. UPSC, SSC, IBPS)..."
            placeholderTextColor={theme.colors.textLight}
            style={[styles.searchInput, { color: theme.colors.textMain }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <X color={theme.colors.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Horizontal Selector */}
      {!loading && (
        <View style={styles.categoryWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
            <TouchableOpacity 
              style={[
                styles.categoryPill, 
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                selectedCategory === "All" && [styles.categoryPillActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]
              ]}
              onPress={() => setSelectedCategory("All")}
            >
              <Text style={[
                styles.categoryPillText, 
                { color: theme.colors.textMuted },
                selectedCategory === "All" && styles.categoryPillTextActive
              ]}>
                All Exams ({exams.filter(e => e.status !== 'INACTIVE').length})
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const count = exams.filter(e => {
                const catObj = typeof e.categoryId === 'object' ? e.categoryId.name : categories.find(c => c._id === e.categoryId)?.name;
                return catObj === cat.name && e.status !== 'INACTIVE';
              }).length;

              if (count === 0) return null;

              return (
                <TouchableOpacity 
                  key={cat._id}
                  style={[
                    styles.categoryPill, 
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    selectedCategory === cat.name && [styles.categoryPillActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Text style={[
                    styles.categoryPillText, 
                    { color: theme.colors.textMuted },
                    selectedCategory === cat.name && styles.categoryPillTextActive
                  ]}>
                    {cat.name} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* List of Exams */}
      {loading ? (
        renderSkeleton()
      ) : filteredExams.length > 0 ? (
        <View style={styles.listContent}>
          {filteredExams.map((item, index) => {
            const logoUrl = getExamLogoUrl(item.examImage);
            const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
            return (
              <TouchableOpacity
                key={item._id}
                style={[styles.examCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => navigation.navigate('ExamDetails', { slug: item.slug })}
                activeOpacity={0.8}
              >
                <View style={[styles.cardLogoBg, { backgroundColor: theme.colors.background }]}>
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={styles.cardLogo} resizeMode="contain" />
                  ) : (
                    <BookOpen color={accentColor} size={22} />
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.examNameText, { color: theme.colors.textMain }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.examCatText, { color: accentColor }]}>
                    {typeof item.categoryId === 'object' ? item.categoryId.name : 'Competitive Exam'}
                  </Text>
                  <Text style={[styles.examDescText, { color: theme.colors.textMuted }]} numberOfLines={2}>
                    {item.shortDescription || `Master the ${item.name} exam with mock tests, previous year papers, and study books.`}
                  </Text>
                </View>
                <ChevronRight color={theme.colors.primary} size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <BookOpen color={theme.colors.textLight} size={48} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>No Exams Found</Text>
          <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>We couldn't find any exams matching your search criteria.</Text>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  clearBtn: {
    padding: 6,
  },
  categoryWrap: {
    marginBottom: 10,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillActive: {
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLogoBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardLogo: {
    width: '75%',
    height: '75%',
  },
  cardBody: {
    flex: 1,
    marginLeft: 14,
    marginRight: 6,
  },
  examNameText: {
    fontSize: 15,
    fontWeight: '800',
  },
  examCatText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  examDescText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  examRowCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
