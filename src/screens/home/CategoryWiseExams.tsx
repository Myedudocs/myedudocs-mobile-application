import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { BookOpen, ChevronRight } from 'lucide-react-native';
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

const getExamLogoUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL.replace('/api/v1', '')}${url}`; 
};

export const CategoryWiseExams = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { categoryId, categoryName } = route.params || {};

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryExams = async () => {
      try {
        setLoading(true);
        // Fetch all exams
        const res = await apiClient(`${BASE_URL}/exams/all?limit=150`);
        const allExams = (res?.exams || []) as Exam[];
        
        // Filter by categoryId
        const filtered = allExams.filter(exam => {
          if (exam.status === 'INACTIVE') return false;
          
          const catIdVal = typeof exam.categoryId === 'object' ? exam.categoryId._id : exam.categoryId;
          const catNameVal = typeof exam.categoryId === 'object' ? exam.categoryId.name : '';
          
          return catIdVal === categoryId || catNameVal.toLowerCase() === (categoryName || '').toLowerCase();
        });
        
        setExams(filtered);
      } catch (err) {
        console.error('Failed to fetch category exams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryExams();
  }, [categoryId, categoryName]);

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.cardSkeleton, { borderColor: theme.colors.border }]}>
          <SkeletonLoader width={50} height={50} borderRadius={10} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonLoader width="60%" height={16} />
            <SkeletonLoader width="35%" height={12} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScreenContainer
      header={{ title: categoryName || 'Exams', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll
    >
      {/* List */}
      {loading ? (
        renderSkeleton()
      ) : exams.length > 0 ? (
        <View style={styles.listContent}>
          {exams.map((item) => {
            const logoUrl = getExamLogoUrl(item.examImage);
            return (
              <TouchableOpacity
                key={item._id}
                style={[styles.examCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => navigation.navigate('ExamDetails', { slug: item.slug })}
                activeOpacity={0.9}
              >
                <View style={[styles.logoBg, { backgroundColor: theme.colors.background }]}>
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
                  ) : (
                    <BookOpen color={theme.colors.primary} size={24} />
                  )}
                </View>
                <View style={styles.body}>
                  <Text style={[styles.nameText, { color: theme.colors.textMain }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.catText, { color: theme.colors.textMuted }]}>
                    {categoryName || 'Competitive Exam'}
                  </Text>
                  <Text style={[styles.descText, { color: theme.colors.textMuted }]} numberOfLines={2}>
                    {item.shortDescription || `Crack the ${item.name} exam with mock tests, interactive courses, and study materials.`}
                  </Text>
                </View>
                <ChevronRight color={theme.colors.primary} size={20} />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <BookOpen color={theme.colors.textMuted} size={48} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>No Exams Found</Text>
          <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
            There are currently no active exams listed under "{categoryName}".
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  logoBg: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logoImage: {
    width: '80%',
    height: '80%',
  },
  body: {
    flex: 1,
    marginLeft: 14,
    marginRight: 6,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '800',
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  descText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  cardSkeleton: {
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
