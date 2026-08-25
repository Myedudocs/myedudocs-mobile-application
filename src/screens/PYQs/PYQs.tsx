import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TextInput, ActivityIndicator,
  FlatList, View, Text, TouchableOpacity, ScrollView, StyleSheet, Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Search, Filter,
  Eye, Share2, FileText, Clock, Layout
} from 'lucide-react-native';

import { apiClient, ENDPOINTS } from '../../service/api.service';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';

interface PYQItem {
  _id: string;
  examName: string;
  title?: string;
  examCategory: string;
  year: number | string;
  examStage?: string;
  paper?: string;
  memoryBasedPaper?: boolean;
  questionPaperPDF: string;
  createdAt?: string;
}

interface GroupedPYQ {
  examName: string;
  examCategory: string;
  title: string;
  year: number | string;
  papersCount: number;
  memoryBasedPaper: boolean;
  createdAt: string;
}

export const PreviousPapers = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  const [pyqs, setPyqs] = useState<PYQItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Exams']);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState('All Exams');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStage, setSelectedStage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await apiClient(ENDPOINTS.GET_PYQS);

        if (data?.pyqs) {
          setPyqs(data.pyqs);
          const uniqueCats = ['All Exams', ...new Set(data.pyqs.map((item: any) => item.examCategory).filter(Boolean))];
          setCategories(uniqueCats as string[]);
        }
      } catch (err) {
        console.error("Error fetching PYQs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const yearOptions = useMemo(() => {
    return [...new Set(pyqs.map(p => p.year?.toString()).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  }, [pyqs]);

  // Group and filter
  const handleSectionShare = async () => {
    try {
      await Share.share({
        message: 'Master your exams with Previous Year Question Papers from MyEduDocs!\nhttps://myedudocs.in/pyqs',
      });
    } catch (error) {
      console.log('Error sharing PYQs section:', error);
    }
  };

  const handlePYQShare = async (item: GroupedPYQ) => {
    try {
      await Share.share({
        message: `Practice ${item.examName} Papers on MyEduDocs!\n${item.papersCount} papers available. Check them here: https://myedudocs.in/exam-topics/${item.examName}`,
      });
    } catch (error) {
      console.log('Error sharing PYQ:', error);
    }
  };

  const groupedData = useMemo(() => {
    const filtered = pyqs.filter(item => {
      const matchesCat = activeCategory === 'All Exams' || item.examCategory === activeCategory;
      const matchesSearch = item.examName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = !selectedYear || item.year?.toString() === selectedYear;
      const matchesStage = !selectedStage || (item.examStage || '').toLowerCase() === selectedStage.toLowerCase();
      return matchesCat && matchesSearch && matchesYear && matchesStage;
    });

    const map = new Map<string, GroupedPYQ>();
    filtered.forEach(item => {
      if (!map.has(item.examName)) {
        map.set(item.examName, {
          examName: item.examName,
          examCategory: item.examCategory || 'General',
          title: item.title || 'Official Paper Collection',
          year: item.year,
          papersCount: 1,
          memoryBasedPaper: item.memoryBasedPaper || false,
          createdAt: item.createdAt || new Date().toISOString()
        });
      } else {
        const existing = map.get(item.examName)!;
        existing.papersCount += 1;
        if (Number(item.year) > Number(existing.year)) {
          existing.year = item.year;
        }
      }
    });
    return Array.from(map.values());
  }, [pyqs, activeCategory, searchQuery, selectedYear, selectedStage]);

  const handleViewDetails = (examName: string) => {
    navigation.navigate('PYQDetails', { examName });
  };

  const renderGroupCard = useCallback(({ item }: { item: GroupedPYQ }) => {
    const dateObj = new Date(item.createdAt);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.cardTop}>
          <View style={[styles.badge, item.memoryBasedPaper ? styles.badgeMemory : styles.badgeOfficial]}>
            <Text style={[styles.badgeText, item.memoryBasedPaper ? styles.badgeTextMemory : styles.badgeTextOfficial]}>
              {item.memoryBasedPaper ? 'MEMORY BASED' : 'MYEDUDOCS'}
            </Text>
          </View>
          <Text style={[styles.yearText, { color: theme.colors.textMuted }]}>{item.year}</Text>
        </View>

        <View style={styles.cardHeader}>
          <Text style={[styles.examName, { color: theme.colors.textMain }]} numberOfLines={1}>
            {item.examName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
          </Text>
          <TouchableOpacity onPress={() => handlePYQShare(item)} style={styles.shareBtn}>
            <Share2 color={theme.colors.textLight} size={18} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.examTitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {item.title.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
        </Text>

        <View style={styles.pillsRow}>
          <View style={[styles.pill, styles.pillAccent]}>
            <FileText color="#6366F6" size={12} />
            <Text style={[styles.pillText, { color: '#6366F6' }]}>
              {item.papersCount} {item.papersCount === 1 ? 'Paper' : 'Papers'} Available
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: theme.colors.border }]}>
            <Layout color={theme.colors.textMuted} size={12} />
            <Text style={[styles.pillText, { color: theme.colors.textMuted }]}>{item.examCategory}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: theme.colors.border }]}>
            <Clock color={theme.colors.textMuted} size={12} />
            <Text style={[styles.pillText, { color: theme.colors.textMuted }]}>{dateStr !== 'Invalid Date' ? dateStr : 'Recently'}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.viewBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} onPress={() => handleViewDetails(item.examName)}>
          <Eye color={theme.colors.primary} size={16} style={{marginRight: 6}} />
          <Text style={[styles.viewBtnText, { color: theme.colors.primary }]}>View All Papers</Text>
        </TouchableOpacity>
      </View>
    );
  }, [theme]);

  const ListHeader = useMemo(() => (
    <View style={[styles.headerSection, { backgroundColor: theme.colors.surface }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
        {categories.map((cat, idx) => (
          <TouchableOpacity key={idx} style={[styles.catPill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }, activeCategory === cat && styles.catPillActive]} onPress={() => setActiveCategory(cat)}>
            <Text style={[styles.catText, { color: theme.colors.textMuted }, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.filtersRow}>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <Search color={theme.colors.textLight} size={18} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textMain }]}
            placeholder="Search exams..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {/* Simple visual filter button placeholder to match web layout visually */}
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <Filter color={theme.colors.textMuted} size={18} />
        </TouchableOpacity>
      </View>
    </View>
  ), [categories, activeCategory, searchQuery, theme]);

  return (
    <ScreenContainer
      header={{ title: 'Previous Papers', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
    >
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={groupedData}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.examName}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.scrollContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FileText color="#CBD5E1" size={60} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>No Papers Found</Text>
              <Text style={[styles.emptyDesc, { color: theme.colors.textMuted }]}>We couldn't find any question papers matching your criteria.</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },

  headerSection: { paddingBottom: 16 },
  catScroll: { paddingVertical: 15, gap: 10 },
  catPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catPillActive: { backgroundColor: '#6366F6', borderColor: '#6366F6' },
  catText: { fontSize: 13, fontWeight: '600' },
  catTextActive: { color: '#FFFFFF' },

  filtersRow: { flexDirection: 'row', gap: 10 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  card: { marginBottom: 16, borderRadius: 16, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeOfficial: { backgroundColor: '#EEF2FF' },
  badgeMemory: { backgroundColor: '#FFFBEB' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextOfficial: { color: '#6366F6' },
  badgeTextMemory: { color: '#D97706' },
  yearText: { fontSize: 14, fontWeight: '800' },

  examName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  examTitle: { fontSize: 14, marginBottom: 16 },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  pillAccent: { backgroundColor: '#EEF2FF' },
  pillText: { fontSize: 11, fontWeight: '600' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  shareBtn: { padding: 4 },

  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  viewBtnText: { fontSize: 14, fontWeight: '700' },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 50 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 20 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 }
});