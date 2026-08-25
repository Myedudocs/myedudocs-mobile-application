import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  SafeAreaView,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DirectorySkeleton } from '../../components/skeletons/DirectorySkeleton';
import { TestSeriesSkeleton } from '../../components/skeletons/TestSeriesSkeleton';
import { useNavigation } from '@react-navigation/native';
import { 
  TrendingUp, 
  ChevronRight, 
  FileText, 
  BookOpen, 
  HelpCircle, 
  Calendar, 
  Clock,
  Search,
  X,
  Play,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Globe
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';
import { NotFound } from '../../components/NotFound';
import { Header } from '../home/Header'; 
import { useAuth } from '../../context/AuthContext';
import { apiClient, ENDPOINTS, BASE_URL } from '../../service/api.service';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// --------------------------------------------------------
// 1. TYPES & INTERFACES
// --------------------------------------------------------
interface PurchasedTopic {
  purchaseId: string; 
  type: 'category' | 'subject' | 'topic';
  topicId: string;
  topic: { name: string; code: string; description: string; subject: string; examination: string };
  purchaseDate: string; 
  amountPaid: number; 
  accessGranted: boolean; 
  validityUntil: string;
  totalTests: number; 
  testsAttempted: number; 
  testsCompleted: number; 
  totalTimeSpent: number;
}

interface TestSeries {
  _id: string; 
  title: string; 
  description?: string; 
  testType: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; 
  totalQuestions: number; 
  totalMarks: number; 
  maxAttempts: number;
  isPaid: boolean; 
  isActive: boolean; 
  status: string; 
  seriesNumber?: number;
}

// CUSTOM ALERT TYPES
type AlertType = 'success' | 'error' | 'warning' | 'info';
interface CustomAlertConfig {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

// Helper to format seconds into h/m
const formatTime = (s: number) => { 
  if (!s) return '0m';
  if (s < 60) return `${s}s`; 
  const m = Math.floor(s / 60); 
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; 
};

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const MyTestSeries: React.FC<{ hideHeader?: boolean; hideBottomNav?: boolean }> = ({
  hideHeader = false,
  hideBottomNav = false,
}) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth(); // Global Auth
  const { theme, isDarkMode } = useTheme();

  // --- CUSTOM ALERT STATE ---
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({
    visible: false, title: '', message: '', type: 'info',
  });

  const triggerAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void, onCancel?: () => void, confirmText = 'OK', cancelText?: string) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm, onCancel, confirmText, cancelText });
  };
  const hideAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));

  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<'My Test Series' | 'Explore Test Series'>('My Test Series');
  const [searchQuery, setSearchQuery] = useState('');

  // --- DATA STATES ---
  const [loading, setLoading] = useState(true);
  const [purchasedTopics, setPurchasedTopics] = useState<PurchasedTopic[]>([]);
  const [activeTopicsCount, setActiveTopicsCount] = useState(0);

  // --- MODAL STATES ---
  const [testsModalVisible, setTestsModalVisible] = useState(false);
  const [topicTests, setTopicTests] = useState<TestSeries[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedTestToStart, setSelectedTestToStart] = useState<TestSeries | null>(null);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<PurchasedTopic | null>(null);

  // --- 1. FETCH PURCHASED TOPICS ---
  useEffect(() => {
    const loadMyTopics = async () => {
      if (!user?.id || !user?.token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Corrected endpoint from backend
        const data = await apiClient(`${BASE_URL}/test-series-enrollment/purchase/my-purchases/${user.id}?limit=50`, {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` }
        });
        
        if (data.success && data.purchases) {
          // Map backend 'purchases' to our local 'PurchasedTopic' interface
          const mappedTopics: PurchasedTopic[] = data.purchases.map((p: any) => ({
            purchaseId: p.enrollmentId,
            type: p.type || 'subject',
            topicId: p.item?.id,
            topic: {
              name: p.item?.name || 'N/A',
              code: p.item?.code || 'N/A',
              description: p.item?.description || '',
              subject: p.item?.subject || 'N/A',
              examination: p.item?.examination || 'N/A'
            },
            purchaseDate: p.purchaseDate,
            amountPaid: p.pricing?.final_amount || 0,
            accessGranted: p.access?.granted || false,
            validityUntil: p.access?.expires_at,
            totalTests: p.totalTests || 0,
            testsAttempted: p.usage?.total_tests_attempted || 0,
            testsCompleted: p.usage?.total_tests_attempted || 0, // Fallback
            totalTimeSpent: p.usage?.total_time_spent || 0
          }));

          setPurchasedTopics(mappedTopics);
          setActiveTopicsCount(mappedTopics.filter((t: PurchasedTopic) => t.accessGranted).length);
        }
      } catch (e: any) {
        // console.log("Failed to load topics", e);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'My Test Series') {
      loadMyTopics();
    }
  }, [user, activeTab]);

  // --- 2. FILTER TOPICS LOCALLY ---
  const displayedTopics = useMemo(() => {
    if (!searchQuery) return purchasedTopics;
    const lowerQuery = searchQuery.toLowerCase();
    return purchasedTopics.filter(t => 
      t.topic.name.toLowerCase().includes(lowerQuery) || 
      t.topic.subject?.toLowerCase().includes(lowerQuery) ||
      t.topic.examination?.toLowerCase().includes(lowerQuery)
    );
  }, [purchasedTopics, searchQuery]);

  // --- 3. FETCH TESTS FOR A TOPIC ---
  const loadTopicTests = async (topic: PurchasedTopic) => {
    if (!user?.token) return;
    try {
      setLoadingTests(true);
      setSelectedTopic(topic);
      setTestsModalVisible(true);
      let endpoint = '';
      if (topic.type === 'category') {
        endpoint = `${BASE_URL}/test-series/hierarchy/exam/${topic.topicId}`;
      } else if (topic.type === 'subject') {
        endpoint = `${BASE_URL}/test-series/hierarchy/subject/${topic.topicId}`;
      } else {
        endpoint = `${BASE_URL}/test-series/navigation/topics/${topic.topicId}/test-series`;
      }

      const data = await apiClient(endpoint);
      
      if (data.success) {
        // Handle different data structures for hierarchical vs navigation endpoints
        const tests = data.data?.testSeries || data.testSeries || [];
        setTopicTests(tests);
      } else {
        setTopicTests([]);
      }
    } catch (e: any) {
      console.error(e);
      triggerAlert("Error", "Failed to load tests for this topic.", "error");
      setTopicTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

  // --- 4. START TEST HANDLERS ---
  const initiateTest = (test: TestSeries) => {
    if (!test.isActive) {
      triggerAlert("Unavailable", "This test is currently inactive.", "warning");
      return;
    }
    setSelectedTestToStart(test);
    setConfirmModalVisible(true);
  };

  const confirmStartTest = () => {
    if (!selectedTestToStart) return;
    setConfirmModalVisible(false);
    setTestsModalVisible(false);
    navigation.navigate('TestInterface', { testId: selectedTestToStart._id, topicId: selectedTopic?.topicId });
  };

  // --- RENDER TEST ITEM (MODAL) ---
  const renderTestItem = useCallback(({ item: test, index }: { item: TestSeries; index: number }) => (
    <View style={[styles.testModalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.testModalHeaderRow}>
        <View style={[styles.testModalNumBadge, { backgroundColor: isDarkMode ? theme.colors.border : '#EEF2FF' }]}>
          <Text style={[styles.testModalNumText, { color: theme.colors.primary }]}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.testModalTitle, { color: theme.colors.textMain }]}>{test.title}</Text>
          <Text style={[styles.testModalType, { color: theme.colors.textMuted }]}>{test.testType} • {test.difficulty.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={[styles.testModalStatsRow, { backgroundColor: theme.colors.background }]}>
        <View style={styles.testModalStatBox}>
          <Text style={[styles.testModalStatLabel, { color: theme.colors.textLight }]}>Duration</Text>
          <Text style={[styles.testModalStatVal, { color: theme.colors.textMain }]}>{test.duration}m</Text>
        </View>
        <View style={styles.testModalStatBox}>
          <Text style={[styles.testModalStatLabel, { color: theme.colors.textLight }]}>Questions</Text>
          <Text style={[styles.testModalStatVal, { color: theme.colors.textMain }]}>{test.totalQuestions}</Text>
        </View>
        <View style={styles.testModalStatBox}>
          <Text style={[styles.testModalStatLabel, { color: theme.colors.textLight }]}>Marks</Text>
          <Text style={[styles.testModalStatVal, { color: theme.colors.textMain }]}>{test.totalMarks}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.testModalStartBtn, !test.isActive && { backgroundColor: '#94A3B8' }]}
        activeOpacity={0.8}
        onPress={() => initiateTest(test)}
      >
        <Play color="#FFFFFF" size={14} style={{ marginRight: 6 }} />
        <Text style={styles.testModalStartText}>{test.isActive ? 'Start Test' : 'Inactive'}</Text>
      </TouchableOpacity>
    </View>
  ), [theme, isDarkMode]);

  // --- RENDER TOPIC ITEM ---
  const renderTopicItem = useCallback(({ item: topic, index }: { item: PurchasedTopic; index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()}
      style={[styles.card, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: theme.colors.border }]}
    >
      <View style={styles.topAccentBar} />
      <View style={styles.topRow}>
        <View style={styles.tagsContainer}>
          <Text style={styles.categoryTag}>{topic.topic.examination || 'EXAM'}</Text>
          <Text style={[styles.mutedTag, { color: theme.colors.textMuted }]}>{topic.topic.subject || 'SUBJECT'}</Text>
          <View style={styles.languageWrap}>
            <Globe color={theme.colors.textLight} size={12} strokeWidth={2} />
            <Text style={[styles.mutedTag, { color: theme.colors.textMuted }]}>English</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: topic.accessGranted ? (isDarkMode ? '#064E3B' : '#DCFCE7') : (isDarkMode ? '#7F1D1D' : '#FEE2E2') }]}>
          <Text style={[styles.statusText, { color: topic.accessGranted ? '#10B981' : '#EF4444' }]}>
            {topic.accessGranted ? 'ACTIVE' : 'EXPIRED'}
          </Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={[styles.titleText, { color: theme.colors.textMain }]} numberOfLines={2}>
          {topic.topic.name || 'Untitled Test Series'}
        </Text>
      </View>

      <Text style={[styles.descriptionText, { color: theme.colors.textMuted }]} numberOfLines={2}>
        {topic.topic.description || 'Updated questions based on latest exam pattern & negative marking.'}
      </Text>

      <View style={[styles.statsRow, { backgroundColor: isDarkMode ? '#0F172A' : '#F5F7FF', borderColor: theme.colors.border }]}>
        <View style={styles.statItem}>
          <FileText color="#6366F6" size={18} style={styles.statIcon} />
          <Text style={[styles.statText, { color: theme.colors.textMain }]}>{topic.totalTests} Tests</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.statItem}>
          <BookOpen color="#10B981" size={18} style={styles.statIcon} />
          <Text style={[styles.statText, { color: theme.colors.textMain }]}>{topic.testsCompleted} Completed</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.statItem}>
          <HelpCircle color="#F59E0B" size={18} style={styles.statIcon} />
          <Text style={[styles.statText, { color: theme.colors.textMain }]}>{topic.testsAttempted} Attempted</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Calendar color={theme.colors.textLight} size={14} />
          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Valid until: <Text style={[styles.infoValue, { color: theme.colors.textMain }]}>{new Date(topic.validityUntil).toLocaleDateString('en-IN')}</Text></Text>
        </View>
        <View style={styles.infoItem}>
          <Clock color={theme.colors.textLight} size={14} />
          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Time: <Text style={[styles.infoValue, { color: theme.colors.textMain }]}>{formatTime(topic.totalTimeSpent)}</Text></Text>
        </View>
      </View>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={[styles.detailsBtn, { borderColor: theme.colors.border, backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]} 
          activeOpacity={0.7}
          onPress={() => {
            setSelectedTopic(topic);
            setDetailsModalVisible(true);
          }} 
        >
          <Text style={[styles.detailsBtnText, { color: theme.colors.textMain }]}>Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.viewTestsBtn} 
          activeOpacity={0.8}
          onPress={() => loadTopicTests(topic)} 
        >
          <Text style={styles.viewTestsBtnText}>View Tests</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  ), [isDarkMode, theme]);

  return (
    <ScreenContainer
      header={
        hideHeader
          ? undefined
          : {
              title: 'My Tests',
              showBack: true,
              showThemeToggle: true,
              showCoins: false,
              showNotifications: false,
            }
      }
      noSafeArea={hideHeader}
      scroll={false}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: hideHeader ? 0 : staticTheme.spacing.sm }]}>

          {/* --- TOP TOGGLE TABS --- */}
          <View style={[styles.tabContainer, { backgroundColor: isDarkMode ? '#1E293B' : staticTheme.colors.border }]}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'My Test Series' && [styles.activeTab, { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' }]]}
              onPress={() => setActiveTab('My Test Series')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: theme.colors.textMuted }, activeTab === 'My Test Series' && [styles.activeTabText, { color: theme.colors.primary }]]}>
                My Test Series
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Explore Test Series' && [styles.activeTab, { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' }]]}
              onPress={() => {
                setActiveTab('Explore Test Series');
                navigation.navigate('TestSeriesBrowse'); // Navigate to explore page
                setTimeout(() => setActiveTab('My Test Series'), 500); // Reset tab
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: theme.colors.textMuted }, activeTab === 'Explore Test Series' && [styles.activeTabText, { color: theme.colors.primary }]]}>
                Explore Test Series
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- SEARCH BAR --- */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Search color={theme.colors.textLight} size={18} strokeWidth={2.5} style={styles.searchIcon} />
            <TextInput 
              style={[styles.searchInput, { color: theme.colors.textMain }]}
              placeholder="Search topics, subjects..."
              placeholderTextColor={theme.colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X color={theme.colors.textLight} size={16} />
              </TouchableOpacity>
            )}
          </View>

          {/* --- LISTING & SKELETONS --- */}
          {loading ? (
            <DirectorySkeleton type="test" count={4} />
          ) : (
            <FlatList
              data={displayedTopics}
              renderItem={renderTopicItem}
              keyExtractor={item => item.purchaseId || item.topicId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              ListHeaderComponent={
                <>
                  {/* --- BANNER 1: OVERALL GROWTH --- */}
                  {activeTab === 'My Test Series' && (
                    <TouchableOpacity 
                      style={[styles.growthCard, { backgroundColor: isDarkMode ? theme.colors.surface : '#FFFFFF', borderColor: theme.colors.border }]}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('OverallGrowth')}
                    >
                      <View style={styles.growthIconBox}>
                        <TrendingUp color="#6366F6" size={20} strokeWidth={2.5} />
                      </View>
                      <View style={styles.growthTextWrap}>
                        <Text style={[styles.growthTitle, { color: theme.colors.textMain }]}>View Overall Growth</Text>
                        <Text style={[styles.growthSub, { color: theme.colors.textMuted }]}>Track your preparation journey</Text>
                      </View>
                      <ChevronRight color={theme.colors.textLight} size={20} />
                    </TouchableOpacity>
                  )}

                  {/* --- SECTION HEADER --- */}
                  {activeTab === 'My Test Series' && (
                    <View style={styles.sectionHeaderRow}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>Enrolled Test Series</Text>
                      <View style={styles.activeBadgePill}>
                        <Text style={styles.activeBadgeText}>{activeTopicsCount} Active</Text>
                      </View>
                    </View>
                  )}
                </>
              }
              ListEmptyComponent={
                <View style={{ marginTop: 40, alignItems: 'center' }}>
                  <Target color="#CBD5E1" size={48} style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.textMain }}>No Topics Found</Text>
                  <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 6 }}>
                    {searchQuery ? "No topics match your search." : "You haven't purchased any test series yet."}
                  </Text>
                </View>
              }
            />
          )}
      </View>

      {/* ========================================================= */}
      {/* 1. TOPIC DETAILS MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={detailsModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.customAlertOverlay}>
          <View style={[styles.detailsModalBox, { backgroundColor: theme.colors.surface }]}>
            
            <View style={[styles.detailsModalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.detailsModalTitle, { color: theme.colors.textMain }]}>🎯 Topic Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeModalBtn}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
              <View style={[styles.confirmDetailsBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <View style={[styles.confirmRow, { borderBottomColor: theme.colors.border }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Topic Name</Text><Text style={[styles.confirmVal, { color: theme.colors.textMain }]}>{selectedTopic?.topic.name}</Text></View>
                <View style={[styles.confirmRow, { borderBottomColor: theme.colors.border }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Code</Text><Text style={[styles.confirmVal, { color: theme.colors.textMain }]}>{selectedTopic?.topic.code}</Text></View>
                <View style={[styles.confirmRow, { borderBottomColor: theme.colors.border }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Examination</Text><Text style={[styles.confirmVal, { color: theme.colors.textMain }]}>{selectedTopic?.topic.examination}</Text></View>
                <View style={[styles.confirmRow, { borderBottomColor: theme.colors.border }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Subject</Text><Text style={[styles.confirmVal, { color: theme.colors.textMain }]}>{selectedTopic?.topic.subject}</Text></View>
                {selectedTopic?.topic.description && (
                  <View style={[styles.confirmRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomColor: theme.colors.border }]}>
                    <Text style={[styles.confirmLabel, { color: theme.colors.textMuted, marginBottom: 6 }]}>Description</Text>
                    <Text style={[styles.confirmVal, { textAlign: 'left', paddingLeft: 0, fontWeight: '500', color: theme.colors.textMuted }]}>{selectedTopic.topic.description}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.detailsSectionTitle, { color: theme.colors.textMain }]}>Purchase & Access</Text>
              <View style={[styles.confirmDetailsBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <View style={[styles.confirmRow, { borderBottomColor: theme.colors.border }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Purchase Date</Text><Text style={[styles.confirmVal, { color: theme.colors.textMain }]}>{selectedTopic && new Date(selectedTopic.purchaseDate).toLocaleDateString("en-IN")}</Text></View>
                <View style={[styles.confirmRow, { borderBottomColor: theme.colors.border }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Amount Paid</Text><Text style={[styles.confirmVal, { color: '#F59E0B' }]}>₹{selectedTopic?.amountPaid}</Text></View>
                <View style={[styles.confirmRow, { borderBottomColor: theme.colors.border }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Valid Until</Text><Text style={[styles.confirmVal, { color: '#10B981' }]}>{selectedTopic && new Date(selectedTopic.validityUntil).toLocaleDateString("en-IN")}</Text></View>
                <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Access Status</Text><Text style={[styles.confirmVal, { color: '#10B981' }]}>ACTIVE</Text></View>
              </View>

              <Text style={[styles.detailsSectionTitle, { color: theme.colors.textMain }]}>Test Progress</Text>
              <View style={[styles.testModalStatsRow, { backgroundColor: theme.colors.background }]}>
                <View style={styles.testModalStatBox}>
                  <FileText color="#6366F6" size={16} style={{ marginBottom: 6 }} />
                  <Text style={[styles.testModalStatVal, { color: '#6366F6' }]}>{selectedTopic?.totalTests}</Text>
                  <Text style={[styles.testModalStatLabel, { color: theme.colors.textLight }]}>Total</Text>
                </View>
                <View style={styles.testModalStatBox}>
                  <Clock color="#F59E0B" size={16} style={{ marginBottom: 6 }} />
                  <Text style={[styles.testModalStatVal, { color: '#F59E0B' }]}>{selectedTopic?.testsAttempted}</Text>
                  <Text style={[styles.testModalStatLabel, { color: theme.colors.textLight }]}>Attempted</Text>
                </View>
                <View style={styles.testModalStatBox}>
                  <CheckCircle2 color="#10B981" size={16} style={{ marginBottom: 6 }} />
                  <Text style={[styles.testModalStatVal, { color: '#10B981' }]}>{selectedTopic?.testsCompleted}</Text>
                  <Text style={[styles.testModalStatLabel, { color: theme.colors.textLight }]}>Completed</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.customAlertConfirmBtn, { backgroundColor: theme.colors.primary }]} 
                onPress={() => {
                  setDetailsModalVisible(false);
                  if (selectedTopic) loadTopicTests(selectedTopic);
                }} 
                activeOpacity={0.8}
              >
                <Play color="#FFFFFF" size={14} style={{ marginRight: 6 }} />
                <Text style={styles.customAlertConfirmText}>View All Tests</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* 2. TESTS DRAWER (MODAL) */}
      {/* ========================================================= */}
      <Modal
        visible={testsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTestsModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalArea, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.modalHeaderTitle, { color: theme.colors.textMain }]} numberOfLines={2}>{selectedTopic?.topic.name}</Text>
              <Text style={[styles.modalSub, { color: theme.colors.textMuted }]}>{topicTests.length} Test Series Available</Text>
            </View>
            <TouchableOpacity onPress={() => setTestsModalVisible(false)} style={styles.closeModalBtn}>
              <X color={theme.colors.textMain} size={24} />
            </TouchableOpacity>
          </View>

          {/* Quick Info Banner */}
          <View style={[styles.modalBanner, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <Text style={[styles.modalBannerText, { color: theme.colors.textMain }]}>🎓 {selectedTopic?.topic.examination}</Text>
            <Text style={[styles.modalBannerText, { color: theme.colors.textMain }]}>📖 {selectedTopic?.topic.subject}</Text>
            <Text style={styles.modalBannerTextSuccess}>✓ Valid: {selectedTopic && new Date(selectedTopic.validityUntil).toLocaleDateString("en-IN")}</Text>
          </View>

          {loadingTests ? (
            <View style={{ padding: 20, gap: 16, alignItems: 'center' }}>
              <TestSeriesSkeleton />
              <TestSeriesSkeleton />
            </View>
          ) : (
            <FlatList
              data={topicTests}
              keyExtractor={(item) => item._id}
              renderItem={renderTestItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <FileText color={theme.colors.textLight} size={48} style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 16, color: theme.colors.textMuted }}>No tests available for this topic yet.</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* ========================================================= */}
      {/* 3. START TEST CONFIRMATION MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.customAlertOverlay}>
          <View style={[styles.customAlertBox, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.customAlertIconContainer, { backgroundColor: isDarkMode ? theme.colors.border : '#EEF2FF' }]}>
              <Target color={theme.colors.primary} size={32} />
            </View>

            <Text style={[styles.customAlertTitle, { color: theme.colors.textMain }]}>Ready to Start?</Text>

            <View style={[styles.confirmDetailsBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <View style={[styles.confirmRow, { borderBottomColor: theme.colors.border }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Test</Text><Text style={[styles.confirmVal, { color: theme.colors.textMain }]} numberOfLines={1}>{selectedTestToStart?.title}</Text></View>
              <View style={[styles.confirmRow, { borderBottomColor: theme.colors.border }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Duration</Text><Text style={[styles.confirmVal, { color: theme.colors.textMain }]}>{selectedTestToStart?.duration} minutes</Text></View>
              <View style={[styles.confirmRow, { borderBottomColor: theme.colors.border }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Questions</Text><Text style={[styles.confirmVal, { color: theme.colors.textMain }]}>{selectedTestToStart?.totalQuestions}</Text></View>
              <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}><Text style={[styles.confirmLabel, { color: theme.colors.textMuted }]}>Marks</Text><Text style={[styles.confirmVal, { color: theme.colors.textMain }]}>{selectedTestToStart?.totalMarks}</Text></View>
            </View>

            <View style={[styles.warningBox, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB', borderColor: isDarkMode ? 'rgba(245,158,11,0.3)' : '#FDE68A' }]}>
              <Text style={[styles.warningText, { color: isDarkMode ? '#FCD34D' : '#D97706' }]}>⚠️ Once you start, the timer begins immediately. Exiting will mark it as attempted.</Text>
            </View>

            <View style={styles.customAlertActionRow}>
              <TouchableOpacity style={[styles.customAlertCancelBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} onPress={() => setConfirmModalVisible(false)} activeOpacity={0.8}>
                <Text style={[styles.customAlertCancelText, { color: theme.colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.customAlertConfirmBtn, { backgroundColor: theme.colors.primary }]} onPress={confirmStartTest} activeOpacity={0.8}>
                <Play color="#FFFFFF" size={14} style={{ marginRight: 4 }} />
                <Text style={styles.customAlertConfirmText}>Start Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* 4. CUSTOM ALERT MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={customAlert.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.customAlertOverlay}>
          <View style={[styles.customAlertBox, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.customAlertIconContainer, 
              customAlert.type === 'success' && { backgroundColor: '#ECFDF5' },
              customAlert.type === 'error' && { backgroundColor: '#FEF2F2' },
              customAlert.type === 'warning' && { backgroundColor: '#FFFBEB' },
              customAlert.type === 'info' && { backgroundColor: isDarkMode ? theme.colors.border : '#EEF2FF' },
            ]}>
              {customAlert.type === 'success' && <CheckCircle2 color="#10B981" size={32} />}
              {customAlert.type === 'error' && <XCircle color="#EF4444" size={32} />}
              {customAlert.type === 'warning' && <AlertTriangle color="#F59E0B" size={32} />}
              {customAlert.type === 'info' && <Info color={theme.colors.primary} size={32} />}
            </View>
            <Text style={[styles.customAlertTitle, { color: theme.colors.textMain }]}>{customAlert.title}</Text>
            <Text style={[styles.customAlertMessage, { color: theme.colors.textMuted }]}>{customAlert.message}</Text>
            <View style={styles.customAlertActionRow}>
              {customAlert.onCancel && (
                <TouchableOpacity style={[styles.customAlertCancelBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} onPress={customAlert.onCancel} activeOpacity={0.8}>
                  <Text style={[styles.customAlertCancelText, { color: theme.colors.textMuted }]}>{customAlert.cancelText || 'Cancel'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.customAlertConfirmBtn, 
                  customAlert.type === 'error' && { backgroundColor: '#EF4444' },
                  customAlert.type === 'warning' && { backgroundColor: '#F59E0B' },
                  customAlert.type === 'success' && { backgroundColor: '#10B981' },
                  customAlert.type === 'info' && { backgroundColor: theme.colors.primary }
                ]} 
                onPress={customAlert.onConfirm || hideAlert} 
                activeOpacity={0.8}
              >
                <Text style={styles.customAlertConfirmText}>{customAlert.confirmText || 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// EXACT STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingTop: staticTheme.spacing.lg },

  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 4, marginHorizontal: 20, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#6366F6' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, height: 44, marginHorizontal: 20, marginBottom: 20, backgroundColor: '#FFFFFF' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', height: '100%' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  growthCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 24, ...staticTheme.shadows.elite },
  growthIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  growthTextWrap: { flex: 1 },
  growthTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  growthSub: { fontSize: 11, color: '#64748B' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  activeBadgePill: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#6366F6' },

  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    paddingTop: 24, 
    marginBottom: 16, 
    overflow: 'hidden',
    position: 'relative',
    ...staticTheme.shadows.elite 
  },
  topAccentBar: {
    height: 4,
    backgroundColor: '#6366F6',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryTag: { fontSize: 10, fontWeight: '800', color: '#6366F6', textTransform: 'uppercase' },
  mutedTag: { fontSize: 11, fontWeight: '500', color: '#64748B' },
  languageWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  titleText: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0F172A', lineHeight: 22, marginRight: 12 },
  descriptionText: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 20 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '800', color: '#16A34A', letterSpacing: 0.5 },
  
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#F5F7FF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8ECFF',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { marginBottom: 6 },
  statText: { fontSize: 10, fontWeight: '700', color: '#0F172A' },
  divider: { width: 1, height: 24, backgroundColor: '#E8ECFF' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 11, color: '#64748B' },
  infoValue: { fontWeight: '700', color: '#0F172A' },

  actionButtonsRow: { flexDirection: 'row', gap: 12 },
  detailsBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#6366F6', borderRadius: 8, paddingVertical: 12 },
  detailsBtnText: { fontSize: 13, fontWeight: '700', color: '#6366F6' },
  viewTestsBtn: { flex: 1.5, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366F6', borderRadius: 8, paddingVertical: 12 },
  viewTestsBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  modalArea: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF' },
  modalHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  modalSub: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  closeModalBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 },
  modalBanner: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: '#1E1B4B', padding: 16 },
  modalBannerText: { fontSize: 10, color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
  modalBannerTextSuccess: { fontSize: 10, color: '#10B981', backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden', fontWeight: '700' },
  modalScroll: { padding: 20 },
  
  testModalCard: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E8EDFF', 
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 16, 
    shadowColor: '#5B6CFF', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 12, 
    elevation: 3 
  },
  testModalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  testModalNumBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  testModalNumText: { fontSize: 13, fontWeight: '800', color: '#6366F6' },
  testModalTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  testModalType: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  
  testModalStatsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  testModalStatBox: { flex: 1, backgroundColor: '#F8FAFF', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E8EDFF' },
  testModalStatLabel: { fontSize: 10, color: '#94A3B8', marginBottom: 2 },
  testModalStatVal: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  
  testModalStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366F6', paddingVertical: 12, borderRadius: 10, shadowColor: '#6366F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  testModalStartText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  detailsModalBox: { backgroundColor: '#FFFFFF', width: '90%', maxWidth: 400, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, overflow: 'hidden', maxHeight: '80%' },
  detailsModalHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailsModalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  detailsSectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', alignSelf: 'flex-start', marginBottom: 12, marginTop: 4 },

  customAlertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  customAlertBox: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 380, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  customAlertIconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  customAlertTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 16 },
  customAlertMessage: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  customAlertActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  customAlertCancelBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customAlertCancelText: { color: '#475569', fontSize: 14, fontWeight: '700' },
  customAlertConfirmBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#6366F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customAlertConfirmText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  
  confirmDetailsBox: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  confirmLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  confirmVal: { fontSize: 13, color: '#0F172A', fontWeight: '700', flex: 1, textAlign: 'right', paddingLeft: 10 },
  
  warningBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 8, padding: 12, marginBottom: 24, width: '100%' },
  warningText: { color: '#B91C1C', fontSize: 11, fontWeight: '600', lineHeight: 16, textAlign: 'center' },
});