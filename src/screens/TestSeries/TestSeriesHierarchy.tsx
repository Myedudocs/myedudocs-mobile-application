import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { apiClient, BASE_URL } from '../../service/api.service';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ScreenContainer } from '../../components/common/ScreenContainer';

interface Subject {
  _id: string;
  name: string;
  code?: string;
  description?: string;
}

interface Topic {
  _id: string;
  name: string;
  code?: string;
}

interface TestSeries {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  isPaid: boolean;
  price?: number;
  difficulty?: string;
  testType?: string;
  seriesNumber?: number;
}

type HierarchyLevel = 'exam' | 'subject' | 'topic' | 'tests';

interface NavigationState {
  level: HierarchyLevel;
  examId?: string;
  examName?: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
}

export const TestSeriesHierarchy = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [state, setState] = useState<NavigationState>({
    level: 'subject',
    examId: route.params?.examId,
    examName: route.params?.examName,
  });

  const [data, setData] = useState<Subject[] | Topic[] | TestSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [state.level, state.examId, state.subjectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      let response: any;

      switch (state.level) {
        case 'subject':
          if (state.examId) {
            endpoint = `${BASE_URL}/test-series/navigation/examinations/${state.examId}/subjects`;
            response = await apiClient(endpoint);
            setData(response?.data || []);
          }
          break;

        case 'topic':
          if (state.subjectId) {
            endpoint = `${BASE_URL}/test-series/navigation/subjects/${state.subjectId}/topics`;
            response = await apiClient(endpoint);
            setData(response?.data || []);
          }
          break;

        case 'tests':
          if (state.topicId) {
            endpoint = `${BASE_URL}/test-series/navigation/topics/${state.topicId}/test-series`;
            response = await apiClient(endpoint);
            setData(response?.data || []);
          }
          break;

        default:
          setData([]);
      }
    } catch (error) {
      console.error('Failed to load hierarchy data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    setState(prev => ({
      ...prev,
      level: 'topic',
      subjectId: subject._id,
      subjectName: subject.name,
    }));
  };

  const handleTopicSelect = (topic: Topic) => {
    setState(prev => ({
      ...prev,
      level: 'tests',
      topicId: topic._id,
      topicName: topic.name,
    }));
  };

  const handleTestSeriesSelect = (test: TestSeries) => {
    navigation.navigate('TestSeriesDetails', {
      testId: test._id,
      testTitle: test.title,
    });
  };

  const handleBackPress = () => {
    switch (state.level) {
      case 'subject':
        navigation.goBack();
        break;
      case 'topic':
        setState(prev => ({
          ...prev,
          level: 'subject',
          subjectId: undefined,
          subjectName: undefined,
        }));
        break;
      case 'tests':
        setState(prev => ({
          ...prev,
          level: 'topic',
          topicId: undefined,
          topicName: undefined,
        }));
        break;
      default:
        navigation.goBack();
    }
  };

  const getTitle = () => {
    switch (state.level) {
      case 'subject':
        return state.examName || 'Select Subject';
      case 'topic':
        return state.subjectName || 'Select Topic';
      case 'tests':
        return state.topicName || 'Test Series';
      default:
        return 'Test Series';
    }
  };

  const renderSubjectItem = (item: Subject) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: theme.colors.cardBg }]}
      onPress={() => handleSubjectSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        {item.code && (
          <Text style={[styles.itemCode, { color: theme.colors.textSecondary }]}>
            {item.code}
          </Text>
        )}
        {item.description && (
          <Text
            style={[styles.itemDesc, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        )}
      </View>
      <ChevronRight size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderTopicItem = (item: Topic) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: theme.colors.cardBg }]}
      onPress={() => handleTopicSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        {item.code && (
          <Text style={[styles.itemCode, { color: theme.colors.textSecondary }]}>
            {item.code}
          </Text>
        )}
      </View>
      <ChevronRight size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderTestSeriesItem = (item: TestSeries) => (
    <TouchableOpacity
      style={[styles.testCard, { backgroundColor: theme.colors.cardBg }]}
      onPress={() => handleTestSeriesSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.testContent}>
        <View style={styles.testHeader}>
          <Text
            style={[styles.testTitle, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.isPaid && (
            <View
              style={[
                styles.priceBadge,
                { backgroundColor: '#FEE2E2' },
              ]}
            >
              <Text style={[styles.priceBadgeText, { color: '#DC2626' }]}>
                ₹{item.price}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.testMetaContainer}>
          <View style={styles.testMeta}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
              Duration
            </Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]}>
              {item.duration} min
            </Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.testMeta}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
              Marks
            </Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]}>
              {item.totalMarks}
            </Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.testMeta}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
              {item.difficulty || 'N/A'}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text
            style={[styles.testDesc, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
      </View>
      <ChevronRight size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer
      header={{
        title: 'Categories',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
      }}
      scroll={false}
    >
      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentPadding}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonLoader height={100} borderRadius={16} />
            <SkeletonLoader height={100} borderRadius={16} style={{ marginTop: 12 }} />
            <SkeletonLoader height={100} borderRadius={16} style={{ marginTop: 12 }} />
          </View>
        ) : data.length > 0 ? (
          <View style={styles.listContainer}>
            {data.map((item: any, index) => {
              if (state.level === 'subject') {
                return (
                  <React.Fragment key={item._id}>
                    {renderSubjectItem(item)}
                  </React.Fragment>
                );
              } else if (state.level === 'topic') {
                return (
                  <React.Fragment key={item._id}>
                    {renderTopicItem(item)}
                  </React.Fragment>
                );
              } else {
                return (
                  <React.Fragment key={item._id}>
                    {renderTestSeriesItem(item)}
                  </React.Fragment>
                );
              }
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No items available
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
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listContainer: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 12,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testContent: {
    flex: 1,
    marginRight: 12,
    gap: 8,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  testTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  testMeta: {
    alignItems: 'center',
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  testDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  loadingContainer: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
