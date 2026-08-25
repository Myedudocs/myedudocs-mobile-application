import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  ChevronRight,
  Clock,
  Award,
  BookOpen,
  TrendingUp,
  X,
  Layers,
  FileText,
  Play,
  CheckCircle,
  Sparkles,
  Lock,
  Globe,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient, BASE_URL } from '../../service/api.service';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ScreenContainer } from '../../components/common/ScreenContainer';

const { width } = Dimensions.get('window');

export interface PurchasedTopic {
  purchaseId: string;
  type: 'category' | 'subject';
  topicId: string;
  topic: {
    name: string;
    code?: string;
    description?: string;
    subject?: string;
    examination?: string;
  };
  purchaseDate: string;
  amountPaid: number;
  accessGranted: boolean;
  validityUntil?: string;
  totalTests: number;
  testsAttempted: number;
  testsCompleted: number;
}

export interface TestSeriesItem {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  totalQuestions?: number;
  isPaid: boolean;
  price?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | string;
  testType?: string;
  language?: string;
  availableLanguages?: string[];
  seriesNumber?: number;
  examination?: string;
  subject?: string;
}

export const AllTestSeries = () => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<'my_series' | 'all' | 'free'>('my_series');
  const [purchasedTopics, setPurchasedTopics] = useState<PurchasedTopic[]>([]);
  const [allTests, setAllTests] = useState<TestSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');

  // Topic Drilldown Modal State
  const [selectedTopic, setSelectedTopic] = useState<PurchasedTopic | null>(null);
  const [topicTests, setTopicTests] = useState<TestSeriesItem[]>([]);
  const [loadingTopicTests, setLoadingTopicTests] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // 1. Fetch Enrolled / Purchased Test Series from Web v2 API
  const fetchPurchases = async () => {
    const studentId = user?.id || (user as any)?._id;
    if (!studentId || !user?.token) {
      setPurchasedTopics([]);
      return;
    }

    try {
      const endpoint = `${BASE_URL}/test-series-enrollment/purchase/my-purchases/${studentId}?limit=50`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.purchases)) {
        const mapped: PurchasedTopic[] = data.purchases.map((p: any) => ({
          purchaseId: p.enrollmentId,
          type: p.type,
          topicId: p.item.id,
          topic: {
            name: p.item.name,
            code: p.item.code,
            description: p.item.description,
            subject: p.item.subject || 'All Subjects',
            examination: p.item.examination || 'General',
          },
          purchaseDate: p.purchaseDate,
          amountPaid: p.pricing?.final_amount || 0,
          accessGranted: p.access?.granted ?? true,
          validityUntil: p.access?.expires_at,
          totalTests: p.totalTests || 0,
          testsAttempted: p.usage?.total_tests_attempted || 0,
          testsCompleted: 0,
        }));
        setPurchasedTopics(mapped);
      }
    } catch (err) {
      console.warn('Failed to load purchased test series:', err);
    }
  };

  // 2. Fetch All Active Test Series
  const fetchAllTests = async () => {
    try {
      const response = await apiClient(`${BASE_URL}/test-series/active/all`);
      if (response?.success && response.data) {
        const series = Array.isArray(response.data)
          ? response.data
          : response.data.testSeries || [];
        setAllTests(series);
      }
    } catch (err) {
      console.warn('Failed to load all tests:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchPurchases(), fetchAllTests()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // 3. Load tests for a specific purchased topic series
  const handleOpenTopic = async (topic: PurchasedTopic) => {
    setSelectedTopic(topic);
    setLoadingTopicTests(true);
    setModalVisible(true);

    try {
      let endpoint = '';
      if (topic.type === 'subject') {
        endpoint = `${BASE_URL}/test-series/navigation/subjects/${topic.topicId}/topics`;
      } else if (topic.type === 'category') {
        endpoint = `${BASE_URL}/test-series/navigation/examinations/${topic.topicId}/subjects`;
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        const data = await res.json();
        let loaded: TestSeriesItem[] = [];

        if (topic.type === 'category') {
          const subjects = data.data?.subjects || [];
          for (const sub of subjects) {
            const tRes = await fetch(`${BASE_URL}/test-series/navigation/subjects/${sub._id}/topics`);
            const tData = await tRes.json();
            if (tData.success) {
              const topicsList = tData.data?.topicCategories || [];
              for (const t of topicsList) {
                const testRes = await fetch(
                  `${BASE_URL}/test-series/navigation/topics/${t._id}/test-series`
                );
                const testData = await testRes.json();
                if (testData.success) {
                  loaded.push(...(testData.data?.testSeries || []));
                }
              }
            }
          }
        } else if (topic.type === 'subject') {
          const topicsList = data.data?.topicCategories || [];
          for (const t of topicsList) {
            const testRes = await fetch(
              `${BASE_URL}/test-series/navigation/topics/${t._id}/test-series`
            );
            const testData = await testRes.json();
            if (testData.success) {
              loaded.push(...(testData.data?.testSeries || []));
            }
          }
        }

        setTopicTests(loaded.length > 0 ? loaded : allTests.slice(0, 6));
      } else {
        setTopicTests(allTests.slice(0, 6));
      }
    } catch (e) {
      setTopicTests(allTests.slice(0, 6));
    } finally {
      setLoadingTopicTests(false);
    }
  };

  // Exam list for filtering
  const examsList = useMemo(() => {
    const set = new Set<string>();
    purchasedTopics.forEach(t => {
      if (t.topic.examination && t.topic.examination !== 'N/A') set.add(t.topic.examination);
    });
    allTests.forEach(t => {
      if (t.examination && t.examination !== 'N/A') set.add(t.examination);
    });
    return ['all', ...Array.from(set)];
  }, [purchasedTopics, allTests]);

  // Filtered Purchased Series
  const filteredPurchased = useMemo(() => {
    let result = [...purchasedTopics];
    if (selectedExam !== 'all') {
      result = result.filter(t => t.topic.examination === selectedExam);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.topic.name.toLowerCase().includes(q) ||
          t.topic.subject?.toLowerCase().includes(q) ||
          t.topic.examination?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [purchasedTopics, selectedExam, searchQuery]);

  // Filtered All / Free Tests
  const filteredAllTests = useMemo(() => {
    let result = [...allTests];
    if (activeTab === 'free') {
      result = result.filter(t => !t.isPaid);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.examination?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allTests, activeTab, searchQuery]);

  const handleStartTest = (test: TestSeriesItem, isEnrolled: boolean = false) => {
    setModalVisible(false);
    const testId = test._id || (test as any).id;
    if (isEnrolled || !test.isPaid || activeTab === 'my_series') {
      navigation.navigate('TestInterface', { testId, id: testId });
    } else {
      navigation.navigate('TestSeriesDetails', { id: testId, testId });
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
      case 'beginner':
        return '#10B981';
      case 'medium':
      case 'intermediate':
        return '#F59E0B';
      case 'hard':
      case 'advanced':
        return '#EF4444';
      default:
        return '#6366F1';
    }
  };

  return (
    <ScreenContainer
      header={{
        showLogo: true,
        showBack: false,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: true,
      }}
      scroll={false}
    >
      {/* Top Search & Filter Bar */}
      <View style={[styles.headerFilterArea, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDarkMode ? '#1E293B' : theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Search size={18} color={theme.colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textMain }]}
            placeholder="Search mock tests & topics..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Switcher (My Series / All Tests / Free Practice) */}
        <View style={styles.segmentRow}>
          {[
            { key: 'my_series', label: `My Series (${purchasedTopics.length})` },
            { key: 'all', label: 'All Mocks' },
            { key: 'free', label: '🎁 Free Tests' },
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={[
                  styles.segmentBtn,
                  {
                    backgroundColor: isActive ? theme.colors.primary : isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    { color: isActive ? '#FFFFFF' : theme.colors.textMuted },
                    isActive && styles.segmentBtnTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Exam Filter Chips (If activeTab === 'my_series' and exams exist) */}
        {examsList.length > 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.examChipsRow}
          >
            {examsList.map(exam => {
              const isSelected = selectedExam === exam;
              return (
                <TouchableOpacity
                  key={exam}
                  onPress={() => setSelectedExam(exam)}
                  style={[
                    styles.examChip,
                    {
                      backgroundColor: isSelected
                        ? isDarkMode
                          ? 'rgba(99,102,241,0.25)'
                          : '#EEF2FF'
                        : isDarkMode
                        ? '#1E293B'
                        : '#F1F5F9',
                      borderColor: isSelected ? theme.colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.examChipText,
                      { color: isSelected ? theme.colors.primary : theme.colors.textMuted },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {exam === 'all' ? 'All Examinations' : exam}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Main List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading ? (
          <View style={{ gap: 14 }}>
            <SkeletonLoader height={140} borderRadius={16} />
            <SkeletonLoader height={140} borderRadius={16} />
            <SkeletonLoader height={140} borderRadius={16} />
          </View>
        ) : activeTab === 'my_series' ? (
          /* TAB 1: MY ENROLLED TEST SERIES (Web v2 Architecture) */
          filteredPurchased.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Layers size={44} color={theme.colors.textLight} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>
                No Enrolled Test Series
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                You haven't enrolled in any test packs yet. Explore available mock series to begin practicing.
              </Text>
              <TouchableOpacity
                style={[styles.exploreBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={styles.exploreBtnText}>Explore Test Series</Text>
                <ChevronRight size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            filteredPurchased.map(topic => (
              <View
                key={topic.purchaseId}
                style={[
                  styles.topicCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {/* Accent Top Bar */}
                <View style={styles.cardAccentBar} />

                <View style={styles.topicCardBody}>
                  <View style={styles.topicCardTopRow}>
                    <View style={styles.examTag}>
                      <Text style={styles.examTagText}>
                        {topic.topic.examination || 'General Exam'}
                      </Text>
                    </View>
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>ENROLLED</Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.topicTitle, { color: theme.colors.textMain }]}
                    numberOfLines={2}
                  >
                    {topic.topic.name}
                  </Text>

                  <View style={styles.topicSubjectRow}>
                    <Award size={14} color={theme.colors.textLight} />
                    <Text style={[styles.topicSubjectText, { color: theme.colors.textMuted }]}>
                      Subject: {topic.topic.subject}
                    </Text>
                  </View>

                  {/* Practice Action Button */}
                  <TouchableOpacity
                    style={styles.practiceBtn}
                    onPress={() => handleOpenTopic(topic)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.practiceBtnText}>PRACTICE TESTS</Text>
                    <ChevronRight size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          /* TAB 2 & 3: ALL / FREE MOCK TESTS */
          filteredAllTests.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <FileText size={44} color={theme.colors.textLight} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>
                No Tests Found
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                No test series matching your query. Try clearing the search filter.
              </Text>
            </View>
          ) : (
            filteredAllTests.map(test => {
              const diffColor = getDifficultyColor(test.difficulty);
              const isHindi = test.language === 'hindi';
              const isBilingual =
                test.language === 'both' || (test.availableLanguages && test.availableLanguages.length > 1);

              return (
                <TouchableOpacity
                  key={test._id}
                  style={[
                    styles.testCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => handleStartTest(test)}
                  activeOpacity={0.85}
                >
                  <View style={styles.testHeaderRow}>
                    <View
                      style={[
                        styles.diffPill,
                        {
                          backgroundColor: `${diffColor}18`,
                          borderColor: `${diffColor}40`,
                        },
                      ]}
                    >
                      <View style={[styles.diffDot, { backgroundColor: diffColor }]} />
                      <Text style={[styles.diffText, { color: diffColor }]}>
                        {test.difficulty ? test.difficulty.toUpperCase() : 'MIXED'}
                      </Text>
                    </View>

                    {test.isPaid ? (
                      <View style={styles.paidPill}>
                        <Lock size={10} color="#7C3AED" />
                        <Text style={styles.paidPillText}>PRO</Text>
                      </View>
                    ) : (
                      <View style={styles.freePill}>
                        <Text style={styles.freePillText}>FREE</Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[styles.testTitle, { color: theme.colors.textMain }]}
                    numberOfLines={2}
                  >
                    {test.title}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={13} color={theme.colors.textLight} />
                      <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                        {test.duration || 60} mins
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Award size={13} color={theme.colors.textLight} />
                      <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                        {test.totalMarks || 100} marks
                      </Text>
                    </View>

                    {isBilingual && (
                      <View style={styles.bilingualTag}>
                        <Globe size={11} color="#6366F1" />
                        <Text style={styles.bilingualText}>Bilingual</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.testFooterRow}>
                    <Text style={[styles.startTestText, { color: theme.colors.primary }]}>
                      {test.isPaid ? 'Unlock Series' : 'Start Test'}
                    </Text>
                    <ChevronRight size={16} color={theme.colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })
          )
        )}
      </ScrollView>

      {/* TOPIC TESTS DRILLDOWN MODAL (Web v2 Feature) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text
                  style={[styles.modalTitle, { color: theme.colors.textMain }]}
                  numberOfLines={1}
                >
                  {selectedTopic?.topic.name}
                </Text>
                <Text style={[styles.modalSub, { color: theme.colors.textMuted }]}>
                  {selectedTopic?.topic.examination} • Select a test to begin
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={theme.colors.textMain} />
              </TouchableOpacity>
            </View>

            {/* Modal Test List */}
            <ScrollView
              contentContainerStyle={styles.modalScrollList}
              showsVerticalScrollIndicator={false}
            >
              {loadingTopicTests ? (
                <View style={styles.modalLoaderContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.modalLoaderText, { color: theme.colors.textMuted }]}>
                    Loading series mock tests...
                  </Text>
                </View>
              ) : topicTests.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <FileText size={36} color={theme.colors.textLight} />
                  <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>
                    No Tests in Series
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                    Tests are being prepared for this series.
                  </Text>
                </View>
              ) : (
                topicTests.map((t, idx) => (
                  <TouchableOpacity
                    key={t._id || idx}
                    style={[
                      styles.modalTestCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => handleStartTest(t, true)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.modalTestLeft}>
                      <View style={styles.modalTestNum}>
                        <Text style={styles.modalTestNumText}>#{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.modalTestTitle, { color: theme.colors.textMain }]}
                          numberOfLines={2}
                        >
                          {t.title}
                        </Text>
                        <View style={styles.modalTestMeta}>
                          <Text style={[styles.modalTestMetaText, { color: theme.colors.textLight }]}>
                            {t.duration || 60} mins • {t.totalMarks || 100} marks
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalStartBtn}>
                      <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.modalStartBtnText}>Start</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerFilterArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    fontWeight: '800',
  },
  examChipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  examChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  examChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 95,
    gap: 12,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  topicCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccentBar: {
    height: 3.5,
    backgroundColor: '#6366F1',
  },
  topicCardBody: {
    padding: 16,
  },
  topicCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  examTag: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  examTagText: {
    color: '#6366F1',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  activeTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 8,
  },
  topicSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  topicSubjectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  practiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  practiceBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  testCard: {
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  testHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  diffDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '800',
  },
  paidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(124,58,237,0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  paidPillText: {
    color: '#7C3AED',
    fontSize: 9.5,
    fontWeight: '900',
  },
  freePill: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  freePillText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
  },
  testTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  bilingualTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bilingualText: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '700',
  },
  testFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  startTestText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
  },
  modalScrollList: {
    padding: 16,
    gap: 10,
  },
  modalLoaderContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  modalLoaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  modalTestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalTestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  modalTestNum: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTestNumText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '800',
  },
  modalTestTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalTestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTestMetaText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  modalStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  modalStartBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
});

export default AllTestSeries;
