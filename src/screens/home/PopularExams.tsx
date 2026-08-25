import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  InteractionManager
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BookOpen, Star, ChevronRight, Award } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BASE_URL, apiClient } from '../../service/api.service';
import SkeletonLoader from '../../components/SkeletonLoader';

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

// Curated harmonious colors for exam card badges & borders
const CARD_ACCENTS = [
  '#6366F1', // Indigo
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export const PopularExams = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
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

    const task = InteractionManager.runAfterInteractions(() => {
      fetchData();
    });
    return () => task.cancel();
  }, []);

  const getFilteredExams = () => {
    const activeExams = exams.filter(e => e.status !== 'INACTIVE');
    if (selectedCategory === "All") {
      return activeExams.slice(0, 10); // Show top 10 on home screen
    }
    return activeExams.filter(exam => {
       const catObj = typeof exam.categoryId === 'object' ? exam.categoryId.name : categories.find(c => c._id === exam.categoryId)?.name;
       return catObj === selectedCategory;
    });
  };

  const filteredExams = getFilteredExams();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.headerContainer}>
          <SkeletonLoader width={180} height={20} />
          <SkeletonLoader width={100} height={35} borderRadius={12} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
          {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} width={90} height={36} borderRadius={20} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.skeletonCard, { borderColor: theme.colors.border }]}>
              <View style={styles.cardHeader}>
                <SkeletonLoader width={48} height={48} borderRadius={12} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <SkeletonLoader width="80%" height={16} />
                  <SkeletonLoader width="50%" height={12} style={{ marginTop: 8 }} />
                </View>
              </View>
              <SkeletonLoader width="100%" height={14} style={{ marginTop: 12 }} />
              <SkeletonLoader width="85%" height={14} style={{ marginTop: 6 }} />
              <SkeletonLoader width="100%" height={32} borderRadius={10} style={{ marginTop: 16 }} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Premium Header */}
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <View style={styles.eyebrowRow}>
            <Award color={theme.colors.primary} size={14} />
            <Text style={[styles.eyebrowText, { color: theme.colors.primary }]}>Top Competitive Exams</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>Choose Your Exam</Text>
        </View>
        <TouchableOpacity 
          style={[styles.browseBtn, { backgroundColor: theme.colors.primaryLight }]}
          onPress={() => navigation.navigate('ExamsPage')}
          activeOpacity={0.8}
        >
          <Text style={[styles.browseBtnText, { color: theme.colors.primary }]}>View All</Text>
          <ChevronRight color={theme.colors.primary} size={14} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Slider */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
        <TouchableOpacity 
          style={[
            styles.pill, 
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            selectedCategory === "All" && [styles.pillActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]
          ]}
          onPress={() => setSelectedCategory("All")}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.pillText, 
            { color: theme.colors.textMuted },
            selectedCategory === "All" && styles.pillTextActive
          ]}>
            All ({exams.filter(e => e.status !== 'INACTIVE').length})
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
                styles.pill, 
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                selectedCategory === cat.name && [styles.pillActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]
              ]}
              onPress={() => setSelectedCategory(cat.name)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.pillText, 
                { color: theme.colors.textMuted },
                selectedCategory === cat.name && styles.pillTextActive
              ]}>
                {cat.name} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Horizontal Cards List */}
      {filteredExams.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {filteredExams.map((exam, index) => {
            const logoUrl = getExamLogoUrl(exam.examImage);
            const accentColor = CARD_ACCENTS[index % CARD_ACCENTS.length];
            return (
              <TouchableOpacity 
                key={exam._id} 
                style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => navigation.navigate('ExamDetails', { slug: exam.slug })}
                activeOpacity={0.9}
              >
                {/* Visual Accent bar at the top */}
                <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />

                <View style={styles.cardHeader}>
                  <View style={[styles.logoContainer, { backgroundColor: theme.colors.background }]}>
                    {logoUrl ? (
                      <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
                    ) : (
                      <BookOpen color={accentColor} size={26} />
                    )}
                  </View>
                  <View style={styles.nameContainer}>
                    <Text style={[styles.examName, { color: theme.colors.textMain }]} numberOfLines={2}>
                      {exam.name}
                    </Text>
                    <Text style={[styles.categoryLabel, { color: theme.colors.textMuted }]}>
                      {typeof exam.categoryId === 'object' ? exam.categoryId.name : 'Competitive Exam'}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.cardDesc, { color: theme.colors.textMuted }]} numberOfLines={2}>
                  {exam.shortDescription || `Master the ${exam.name} exam with mock tests, interactive classes, and study books.`}
                </Text>

                <View style={[styles.actionContainer, { borderTopColor: theme.colors.border }]}>
                  <Text style={[styles.actionText, { color: accentColor }]}>Explore Preparation</Text>
                  <ChevronRight color={accentColor} size={15} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <BookOpen color={theme.colors.textLight} size={40} />
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No exams found in this category.</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingVertical: 14,
  },
  loadingContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  browseBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pillsContainer: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillActive: {
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 10,
  },
  card: {
    width: 270,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingTop: 22, // Space for visual accent bar
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoImage: {
    width: '75%',
    height: '75%',
  },
  nameContainer: {
    flex: 1,
  },
  examName: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  skeletonCard: {
    width: 260,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
});
