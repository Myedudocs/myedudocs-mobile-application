import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Dimensions, TextInput, RefreshControl, Platform, Image, StatusBar
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ChevronLeft, CheckCircle2, XCircle, MinusCircle, 
  LayoutGrid, Lightbulb, X, AlertCircle, Info, Target,
  Search, FileText, BarChart2, Trophy, Calendar, Clock, Eye, Filter,
  ChevronRight
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DirectorySkeleton } from '../../components/skeletons/DirectorySkeleton';
import { theme as staticTheme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { getImageUrl } from '../../utils/image.utils';

// --- IMPORT GLOBAL AUTH & API ---
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../service/api.service';
import { NotFound } from '../../components/NotFound';
import { ScreenContainer } from '../../components/common/ScreenContainer';

const { width } = Dimensions.get('window');

// --------------------------------------------------------
// 1. TYPES & INTERFACES
// --------------------------------------------------------

interface TestAttempt {
  id: string; 
  testTitle: string;
  testId: string;
  status: 'completed' | 'ongoing' | 'submitted';
  startTime: string;
  endTime: string;
  score: number;
  percentage: number;
  rank: number;
}

interface ResultsStats {
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalTimeSpent: number;
  passedTests: number;
  failedTests: number;
}

interface QuestionAnalysis {
  questionNumber: number;
  questionText?: string;
  questionImage?: string;
  questionLatex?: string;
  options: Array<{ text?: string; image?: string; isCorrect: boolean; selected: boolean }>;
  userAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  marks: number;
  marksObtained: number;
  explanation?: string;
  explanationImage?: string;
  explanationLatex?: string;
  difficulty?: string;
  subject?: string;
  topic?: string;
}

interface TestResultsData {
  attemptId: string;
  testSeries: { id: string; title: string; duration: number; totalMarks: number };
  performance: {
    totalScore: number; maxScore: number; percentage: number;
    correctAnswers: number; incorrectAnswers: number; unanswered: number;
    totalQuestions: number; timeTaken: number; rank: number; totalAttempts: number;
  };
  questionAnalysis: QuestionAnalysis[];
}

type AlertType = 'success' | 'error' | 'warning' | 'info';
interface CustomAlertConfig {
  visible: boolean; title: string; message: string; type: AlertType;
  onConfirm?: () => void; onCancel?: () => void; confirmText?: string; cancelText?: string;
}

// --------------------------------------------------------
// 2. HELPER FUNCTIONS
// --------------------------------------------------------
const calculateTimeTaken = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.max(0, Math.floor((end - start) / 1000));
};

const formatTime = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${secs}s`;
};

const getGradeColor = (percentage?: number) => {
  const p = percentage || 0;
  if (p >= 90) return '#722ED1'; 
  if (p >= 80) return '#10B981'; 
  if (p >= 70) return '#3B82F6'; 
  if (p >= 60) return '#F59E0B'; 
  if (p >= 50) return '#F97316'; 
  return '#EF4444'; 
};

const getGradeText = (percentage?: number) => {
  const p = percentage || 0;
  if (p >= 90) return 'A+';
  if (p >= 80) return 'A';
  if (p >= 70) return 'B+';
  if (p >= 60) return 'B';
  if (p >= 50) return 'C';
  return 'D';
};

// --------------------------------------------------------
// 3. MAIN COMPONENT (MASIVE MERGED FILE)
// --------------------------------------------------------
export const TestResults = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Safe extraction of route params
  const initialAttemptId = route?.params?.attemptId || null;
  const initialResults = route?.params?.results || null;
  
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();

  // --- CORE VIEW STATE ---
  const [viewMode, setViewMode] = useState<'LIST' | 'ANALYSIS' | 'REVIEW'>(initialAttemptId ? 'ANALYSIS' : 'LIST');

  // --- CUSTOM ALERT ---
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({ visible: false, title: '', message: '', type: 'info' });
  const triggerAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void, confirmText = 'OK') => {
    setCustomAlert({ visible: true, title, message, type, onConfirm, confirmText });
  };
  const hideAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));

  // ==========================================
  // STATE A: LIST VIEW (StudentExamResults)
  // ==========================================
  const [listLoading, setListLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [listStats, setListStats] = useState<ResultsStats>({
    totalAttempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0,
    totalTimeSpent: 0, passedTests: 0, failedTests: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'completed'>('all');

  const loadAllResults = async (isRefresh = false) => {
    if (!user?.id || !user?.token) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setListLoading(true);
      setListError(null);

      const response = await fetch(
        `${BASE_URL}/student/test-series/attempt/user/${user.id}/attempts?limit=50&page=1`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` } }
      );
      const data = await response.json();

      if (data.success) {
        const loadedAttempts = data.attempts || [];
        setAttempts(loadedAttempts);
        
        if (loadedAttempts.length === 0) {
          setListStats({ totalAttempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0, totalTimeSpent: 0, passedTests: 0, failedTests: 0 });
        } else {
          const scores = loadedAttempts.map((a: any) => a.percentage || 0);
          const passed = loadedAttempts.filter((a: any) => (a.percentage || 0) >= 40).length;
          setListStats({
            totalAttempts: loadedAttempts.length,
            averageScore: scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length,
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores),
            totalTimeSpent: 0, passedTests: passed, failedTests: loadedAttempts.length - passed
          });
        }
      } else {
        throw new Error(data.message || 'Failed to load results');
      }
    } catch (err: any) {
      setListError(err.message);
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'LIST') loadAllResults();
  }, [user, viewMode]);

  const displayedAttempts = useMemo(() => {
    let filtered = attempts;
    if (searchQuery) filtered = filtered.filter(a => a.testTitle?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter !== 'all') {
      if (statusFilter === 'passed') filtered = filtered.filter(a => (a.percentage || 0) >= 40);
      else if (statusFilter === 'failed') filtered = filtered.filter(a => (a.percentage || 0) < 40);
      else if (statusFilter === 'completed') filtered = filtered.filter(a => a.status === 'completed');
    }
    return filtered;
  }, [attempts, searchQuery, statusFilter]);

  // ==========================================
  // STATE B: ANALYSIS & REVIEW VIEW
  // ==========================================
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(initialAttemptId || null);
  const [singleLoading, setSingleLoading] = useState(!initialResults && !!initialAttemptId);
  const [singleResult, setSingleResult] = useState<TestResultsData | null>(initialResults || null);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [paletteVisible, setPaletteVisible] = useState(false);

  const fetchSingleResult = async (idToFetch: string) => {
    if (!user?.token) return;
    try {
      setSingleLoading(true);
      const res = await fetch(`${BASE_URL}/student/test-series/attempt/${idToFetch}/results`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      
      if (data.success && data.results) {
        setSingleResult(data.results);
      } else {
        const msg = data.message || "Failed to load detailed analysis";
        if (msg.toLowerCase().includes('not yet completed')) {
          triggerAlert(
            "Test In Progress",
            "This test attempt is currently ongoing or awaiting submission. Complete your exam to unlock in-depth score analysis and performance metrics.",
            "info",
            () => setViewMode('LIST'),
            "Back to Results"
          );
        } else {
          throw new Error(msg);
        }
      }
    } catch (err: any) {
      if (!err.message?.toLowerCase().includes('not yet completed')) {
        triggerAlert("Notice", err.message || "Could not load results.", "info", () => setViewMode('LIST'));
      }
    } finally {
      setSingleLoading(false);
    }
  };

  useEffect(() => {
    if (initialAttemptId && !initialResults) {
      fetchSingleResult(initialAttemptId);
    }
  }, [initialAttemptId]);

  const handleViewDetails = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setViewMode('ANALYSIS');
    fetchSingleResult(attemptId);
  };

  const handleBackNavigation = () => {
    if (viewMode === 'REVIEW') {
      setViewMode('ANALYSIS');
    } else if (viewMode === 'ANALYSIS') {
      if (initialAttemptId) navigation.goBack(); 
      else setViewMode('LIST'); 
    } else {
      navigation.goBack();
    }
  };

  // Safe Calculations
  const percentile = useMemo(() => {
    if (!singleResult?.performance) return 0;
    const { rank, totalAttempts } = singleResult.performance;
    if (!totalAttempts || totalAttempts <= 1) return 100;
    return Math.max(0, ((totalAttempts - rank) / totalAttempts) * 100);
  }, [singleResult]);

  const topPercent = useMemo(() => {
    return Math.max(1, Math.ceil(100 - percentile));
  }, [percentile]);

  const sectionalAnalysis = useMemo(() => {
    if (!singleResult?.questionAnalysis || !Array.isArray(singleResult.questionAnalysis)) return [];
    const s: Record<string, { correct: number; total: number }> = {};
    singleResult.questionAnalysis.forEach(q => {
      const sub = q.subject || 'General';
      if (!s[sub]) s[sub] = { correct: 0, total: 0 };
      s[sub].total += 1;
      if (q.isCorrect) s[sub].correct += 1;
    });
    return Object.entries(s).map(([name, data]) => ({ name, accuracy: Math.round((data.correct / data.total) * 100) }));
  }, [singleResult]);


  // ======================================================================
  // RENDER: LIST VIEW
  // ======================================================================
  if (viewMode === 'LIST') {
    if (listLoading && !refreshing) {
      return (
        <ScreenContainer
          header={{
            title: 'Test Results',
            showBack: true,
            showThemeToggle: true,
            showCoins: false,
            showNotifications: false,
          }}
          scroll={false}
        >
          <DirectorySkeleton type="test" count={4} />
        </ScreenContainer>
      );
    }

    if (listError) {
      return (
        <ScreenContainer
          header={{
            title: 'Test Results',
            showBack: true,
            showThemeToggle: true,
            showCoins: false,
            showNotifications: false,
          }}
          scroll={false}
        >
          <View style={[styles.safeArea, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
            <XCircle color="#EF4444" size={48} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.textMain, marginBottom: 8 }}>Unable to Load Results</Text>
            <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginBottom: 24 }}>{listError}</Text>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={() => loadAllResults()}>
              <Text style={styles.primaryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </ScreenContainer>
      );
    }

    return (
      <ScreenContainer
        header={{
          title: 'Test Results',
          showBack: true,
          showThemeToggle: true,
          showCoins: false,
          showNotifications: false,
        }}
        scroll={true}
      >

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.listScrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAllResults(true)} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
        >
          <View style={styles.listStatsGrid}>
            <View style={[styles.listStatCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: isDarkMode ? 1 : 0 }]}>
              <View style={[styles.listStatIconBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]}><FileText color={theme.colors.primary} size={20} /></View>
              <Text style={[styles.listStatVal, { color: theme.colors.textMain }]}>{listStats.totalAttempts}</Text>
              <Text style={[styles.listStatLabel, { color: theme.colors.textMuted }]}>Total Attempts</Text>
            </View>
            <View style={[styles.listStatCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: isDarkMode ? 1 : 0 }]}>
              <View style={[styles.listStatIconBox, { backgroundColor: isDarkMode ? '#2E1065' : '#F5F3FF' }]}><BarChart2 color="#8B5CF6" size={20} /></View>
              <Text style={[styles.listStatVal, { color: '#8B5CF6' }]}>{listStats.averageScore.toFixed(1)}%</Text>
              <Text style={[styles.listStatLabel, { color: theme.colors.textMuted }]}>Avg Score</Text>
            </View>
            <View style={[styles.listStatCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: isDarkMode ? 1 : 0 }]}>
              <View style={[styles.listStatIconBox, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5' }]}><CheckCircle2 color="#10B981" size={20} /></View>
              <Text style={[styles.listStatVal, { color: '#10B981' }]}>{listStats.passedTests}</Text>
              <Text style={[styles.listStatLabel, { color: theme.colors.textMuted }]}>Passed</Text>
            </View>
            <View style={[styles.listStatCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: isDarkMode ? 1 : 0 }]}>
              <View style={[styles.listStatIconBox, { backgroundColor: isDarkMode ? '#451A03' : '#FFFBEB' }]}><Trophy color="#F59E0B" size={20} /></View>
              <Text style={[styles.listStatVal, { color: '#F59E0B' }]}>{listStats.highestScore.toFixed(1)}%</Text>
              <Text style={[styles.listStatLabel, { color: theme.colors.textMuted }]}>High Score</Text>
            </View>
          </View>
  
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Search color={theme.colors.textMuted} size={18} style={styles.searchIcon} />
            <TextInput 
              style={[styles.searchInput, { color: theme.colors.textMain }]} 
              placeholder="Search by test name..." 
              placeholderTextColor={theme.colors.textMuted} 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}><X color={theme.colors.textMuted} size={16} /></TouchableOpacity>
            )}
          </View>
  
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {['all', 'passed', 'failed', 'completed'].map((f) => (
              <TouchableOpacity 
                key={f} 
                style={[
                  styles.filterPill, 
                  { backgroundColor: isDarkMode ? theme.colors.surface : '#FFFFFF', borderColor: theme.colors.border },
                  statusFilter === f && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]} 
                onPress={() => setStatusFilter(f as any)}
              >
                <Text style={[styles.filterPillText, { color: theme.colors.textMuted }, statusFilter === f && { color: '#FFFFFF' }]}>
                  {f === 'all' ? 'All Results' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
  
          <View style={styles.listHeaderRow}>
            <Text style={[styles.listTitle, { color: theme.colors.textMain }]}>Test Attempts</Text>
            <Text style={[styles.listCount, { color: theme.colors.textMuted }]}>{displayedAttempts.length} Found</Text>
          </View>
  
          {displayedAttempts.length === 0 ? (
            <NotFound
              fullScreen={false}
              title="No Results Found"
              subtitle={attempts.length === 0 ? 'Start taking tests to see your results here.' : 'Try adjusting your search or filters.'}
              icon={Target}
              buttonText={attempts.length === 0 ? "Browse Tests" : undefined}
              onButtonPress={attempts.length === 0 ? () => navigation.navigate('MyTestSeries') : undefined}
            />
          ) : (
            displayedAttempts.map((attempt, index) => {
              const gradeColor = getGradeColor(attempt.percentage || 0);
              const isPassed = (attempt.percentage || 0) >= 40;
              const timeTaken = calculateTimeTaken(attempt.startTime, attempt.endTime);
  
              return (
                <Animated.View 
                  key={attempt.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                  style={[
                    styles.resultCard, 
                    { 
                      backgroundColor: theme.colors.surface, 
                      borderColor: theme.colors.border,
                      borderLeftColor: isPassed ? '#10B981' : '#EF4444', 
                      borderLeftWidth: 4 
                    }
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={[styles.testTitle, { color: theme.colors.textMain }]} numberOfLines={2}>{attempt.testTitle || 'Test Series'}</Text>
                      <View style={styles.dateRow}>
                        <Calendar color={theme.colors.textMuted} size={12} style={{ marginRight: 4 }} />
                        <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                          {new Date(attempt.startTime).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(attempt.startTime).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.scoreBox}>
                      <Text style={[styles.scorePercent, { color: gradeColor }]}>{(attempt.percentage || 0).toFixed(1)}%</Text>
                      <Text style={[styles.scoreGrade, { color: theme.colors.textMuted }]}>Grade {getGradeText(attempt.percentage || 0)}</Text>
                    </View>
                  </View>
  
                  <View style={[styles.cardMiddleRow, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
                    <View style={styles.miniStatBox}>
                      <Trophy color="#3B82F6" size={14} style={{ marginBottom: 4 }} />
                      <Text style={[styles.miniStatVal, { color: theme.colors.textMain }]}>{attempt.rank || '-'}</Text>
                      <Text style={[styles.miniStatLabel, { color: theme.colors.textMuted }]}>Rank</Text>
                    </View>
                    <View style={[styles.miniStatDivider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.miniStatBox}>
                      <CheckCircle2 color="#10B981" size={14} style={{ marginBottom: 4 }} />
                      <Text style={[styles.miniStatVal, { color: '#10B981' }]}>{isPassed ? 'PASSED' : 'FAILED'}</Text>
                      <Text style={[styles.miniStatLabel, { color: theme.colors.textMuted }]}>Status</Text>
                    </View>
                    <View style={[styles.miniStatDivider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.miniStatBox}>
                      <Clock color="#8B5CF6" size={14} style={{ marginBottom: 4 }} />
                      <Text style={[styles.miniStatVal, { color: theme.colors.textMain }]}>{formatTime(timeTaken)}</Text>
                      <Text style={[styles.miniStatLabel, { color: theme.colors.textMuted }]}>Time</Text>
                    </View>
                  </View>
  
                  <TouchableOpacity 
                    style={[styles.viewDetailsBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]} 
                    activeOpacity={0.8} 
                    onPress={() => handleViewDetails(attempt.id)}
                  >
                    <Eye color={theme.colors.primary} size={16} style={{ marginRight: 6 }} />
                    <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>View Full Analysis</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ======================================================================
  // RENDER: LOADING SINGLE ANALYSIS
  // ======================================================================
  if (singleLoading) {
    return (
      <ScreenContainer
        header={{
          title: 'Test Results',
          showBack: true,
          showThemeToggle: true,
          showCoins: false,
          showNotifications: false,
        }}
        scroll={false}
      >
        <DirectorySkeleton type="card" count={2} />
      </ScreenContainer>
    );
  }

  if (!singleResult || !singleResult.performance) {
    return (
      <ScreenContainer
        header={{
          title: 'Test Results',
          showBack: true,
          showThemeToggle: true,
          showCoins: false,
          showNotifications: false,
        }}
        scroll={false}
      >
        <View style={{ flex: 1, paddingTop: 60 }}>
          <NotFound
            title="Analysis Unavailable"
            subtitle="We couldn't generate a detailed performance analysis for this attempt. Data might be missing or incomplete."
          />
          <View style={{ paddingHorizontal: 20, marginTop: 40, alignItems: 'center' }}>
            <TouchableOpacity
              style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}
              onPress={() => setViewMode('LIST')}
            >
              <ChevronLeft color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Back to Results List</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Render the Custom Alert just in case it was triggered */}
        <Modal visible={customAlert.visible} transparent animationType="fade">
          <View style={styles.customAlertOverlay}>
            <View style={[styles.customAlertBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
              <Text style={[styles.customAlertTitle, { color: theme.colors.textMain }]}>{customAlert.title}</Text>
              <Text style={[styles.customAlertMessage, { color: theme.colors.textSecondary }]}>{customAlert.message}</Text>
              <TouchableOpacity style={[styles.customAlertConfirmBtn, { backgroundColor: theme.colors.primary }]} onPress={customAlert.onConfirm || (() => setCustomAlert({ ...customAlert, visible: false }))}>
                <Text style={styles.customAlertConfirmText}>{customAlert.confirmText || 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScreenContainer>
    );
  }

  // ======================================================================
  // STATE C: RESULT ANALYSIS (Figma Matched)
  // ======================================================================
  if (viewMode === 'ANALYSIS') {
    const timeTakenSec = singleResult.performance.timeTaken || 0;

    return (
      <ScreenContainer
        header={{
          title: 'Test Results',
          showBack: true,
          showThemeToggle: true,
          showCoins: false,
          showNotifications: false,
        }}
        scroll={true}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.analysisScrollContent}>
          {/* Hero Score Card */}
          <View style={[styles.scoreCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.trophyIconPill, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}>
              <Trophy color={theme.colors.primary} size={22} />
            </View>

            <Text style={[styles.finalScoreLabel, { color: theme.colors.primary }]}>OVERALL PERFORMANCE</Text>
            
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: theme.colors.textMain }]}>
                {typeof singleResult.performance.totalScore === 'number'
                  ? Number(singleResult.performance.totalScore.toFixed(2)).toString()
                  : (singleResult.performance.totalScore || 0)}
              </Text>
              <Text style={[styles.scoreTotal, { color: theme.colors.textMuted }]}> / {singleResult.performance.maxScore || 0}</Text>
            </View>

            {timeTakenSec > 0 && (
              <View style={[styles.timeTakenBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                <Clock color={theme.colors.textMuted} size={13} />
                <Text style={[styles.timeTakenText, { color: theme.colors.textMuted }]}>
                  Time Spent: {formatTime(timeTakenSec)}
                </Text>
              </View>
            )}

            <View style={[styles.rankRow, { borderTopColor: theme.colors.border }]}>
              <View style={styles.rankCol}>
                <Text style={[styles.rankVal, { color: theme.colors.primary }]}>{percentile.toFixed(1)}%</Text>
                <Text style={[styles.rankLabel, { color: theme.colors.textMuted }]}>PERCENTILE</Text>
              </View>
              <View style={[styles.rankDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.rankCol}>
                <Text style={[styles.rankVal, { color: theme.colors.textMain }]}>Top {topPercent}%</Text>
                <Text style={[styles.rankLabel, { color: theme.colors.textMuted }]}>ESTIMATED RANK</Text>
              </View>
            </View>
          </View>

          {/* Breakdown Stat Cards */}
          <View style={styles.analysisStatsGrid}>
            <View style={[styles.analysisStatBox, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5', borderColor: isDarkMode ? '#059669' : '#A7F3D0' }]}>
              <CheckCircle2 color="#10B981" size={22} style={{ marginBottom: 6 }} />
              <Text style={[styles.analysisStatBoxNum, { color: '#10B981' }]}>{singleResult.performance.correctAnswers || 0}</Text>
              <Text style={[styles.analysisStatBoxLabel, { color: '#10B981' }]}>CORRECT</Text>
            </View>
            <View style={[styles.analysisStatBox, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2', borderColor: isDarkMode ? '#DC2626' : '#FECACA' }]}>
              <XCircle color="#EF4444" size={22} style={{ marginBottom: 6 }} />
              <Text style={[styles.analysisStatBoxNum, { color: '#EF4444' }]}>{singleResult.performance.incorrectAnswers || 0}</Text>
              <Text style={[styles.analysisStatBoxLabel, { color: '#EF4444' }]}>INCORRECT</Text>
            </View>
            <View style={[styles.analysisStatBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.colors.border }]}>
              <MinusCircle color={isDarkMode ? '#94A3B8' : '#64748B'} size={22} style={{ marginBottom: 6 }} />
              <Text style={[styles.analysisStatBoxNum, { color: theme.colors.textMain }]}>{singleResult.performance.unanswered || 0}</Text>
              <Text style={[styles.analysisStatBoxLabel, { color: theme.colors.textMuted }]}>SKIPPED</Text>
            </View>
          </View>

          {/* Sectional Performance */}
          <View style={[styles.sectionalContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.secHeaderRow}>
              <Text style={[styles.secTitle, { color: theme.colors.textMain }]}>Sectional Analysis</Text>
              <View style={[styles.accuracyBadge, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}>
                <Text style={[styles.accuracyText, { color: theme.colors.primary }]}>Accuracy Rate</Text>
              </View>
            </View>

            {sectionalAnalysis.length === 0 ? (
              <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginVertical: 16, fontSize: 13 }}>No sectional data available.</Text>
            ) : (
              sectionalAnalysis.map((sec, idx) => {
                const barColor = sec.accuracy >= 65 ? '#10B981' : sec.accuracy >= 35 ? '#F59E0B' : '#EF4444';
                return (
                  <View key={idx} style={styles.secRow}>
                    <View style={styles.secLabelRow}>
                      <Text style={[styles.secSubject, { color: theme.colors.textMain }]}>{sec.name}</Text>
                      <Text style={[styles.secPercent, { color: barColor }]}>{sec.accuracy}%</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                      <View style={[styles.progressBarFill, { width: `${Math.max(3, sec.accuracy)}%`, backgroundColor: barColor }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footerFixed, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.btnSolid, { backgroundColor: theme.colors.primary }]}
            onPress={() => setViewMode('REVIEW')}
            activeOpacity={0.85}
          >
            <LayoutGrid color="#FFFFFF" size={16} style={{ marginRight: 8 }} />
            <Text style={styles.btnSolidText}>View Solutions & Explanations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnOutline, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: theme.colors.border }]}
            onPress={handleBackNavigation}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnOutlineText, { color: theme.colors.textMain }]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // ======================================================================
  // STATE D: EXAM REVIEW (Right Figma Screen)
  // ======================================================================
  // Bulletproof safety check for missing array
  if (!singleResult.questionAnalysis || singleResult.questionAnalysis.length === 0) {
    return (
      <ScreenContainer
        header={{
          title: 'Test Results',
          showBack: true,
          showThemeToggle: true,
          showCoins: false,
          showNotifications: false,
        }}
        scroll={false}
      >
        <View style={[styles.safeArea, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <AlertCircle color="#EF4444" size={48} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.textMain, marginBottom: 8 }}>No Review Data</Text>
          <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginBottom: 24 }}>The detailed question analysis is not available for this test.</Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={handleBackNavigation}>
            <Text style={styles.primaryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Bulletproof question object extraction
  const safeIndex = Math.min(currentQIndex, singleResult.questionAnalysis.length - 1);
  const q = singleResult.questionAnalysis[safeIndex] || {};
  
  // Status Helpers
  const isSkipped = q.userAnswer === null || q.userAnswer === undefined;
  const isWrong = !q.isCorrect && !isSkipped;
  const isRight = !!q.isCorrect;

  return (
    <ScreenContainer
      header={{
        title: 'Test Results',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
      }}
      scroll={false}
    >
      {/* Top Question Nav */}
      <View style={[styles.reviewQNav, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.qIndexText, { color: theme.colors.textMain }]}>
          Question {safeIndex + 1} <Text style={{ color: theme.colors.textMuted }}>/ {singleResult.questionAnalysis.length}</Text>
        </Text>
        <TouchableOpacity style={[styles.gridBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]} onPress={() => setPaletteVisible(true)}>
          <LayoutGrid color={theme.colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 120 }}>
        
        {/* Tags */}
        <View style={styles.tagsRow}>
          {isRight && (
            <View style={[styles.tagPill, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', borderColor: isDarkMode ? '#059669' : '#A7F3D0' }]}>
              <CheckCircle2 color="#10B981" size={12} style={{marginRight:4}}/>
              <Text style={[styles.tagText, {color: '#10B981'}]}>Correct</Text>
            </View>
          )}
          {isWrong && (
            <View style={[styles.tagPill, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDarkMode ? '#DC2626' : '#FECACA' }]}>
              <XCircle color="#EF4444" size={12} style={{marginRight:4}}/>
              <Text style={[styles.tagText, {color: '#EF4444'}]}>Incorrect</Text>
            </View>
          )}
          {isSkipped && (
            <View style={[styles.tagPill, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: theme.colors.border }]}>
              <MinusCircle color={isDarkMode ? '#94A3B8' : '#64748B'} size={12} style={{marginRight:4}}/>
              <Text style={[styles.tagText, {color: isDarkMode ? '#94A3B8' : '#64748B'}]}>Skipped</Text>
            </View>
          )}
          
          <View style={[styles.tagPill, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF', borderColor: isDarkMode ? '#3730A3' : '#C7D2FE' }]}>
            <Text style={[styles.tagText, {color: isDarkMode ? '#818CF8' : '#6366F6'}]}>{q.subject || 'General'} • {q.difficulty || 'Medium'}</Text>
          </View>
        </View>

        {/* Question Image */}
        {q.questionImage ? (
          <View style={[styles.qImageContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.colors.border }]}>
            <Image
              source={{ uri: getImageUrl(q.questionImage) || '' }}
              style={styles.qImage}
              resizeMode="contain"
            />
          </View>
        ) : null}

        {/* Question Text */}
        {q.questionText ? (
          <Text style={[styles.qText, { color: theme.colors.textMain }]}>{q.questionText}</Text>
        ) : null}

        {/* Options */}
        <View style={styles.optionsContainer}>
          {(q.options || []).map((opt, idx) => {
            const isUserSelection = q.userAnswer === idx;
            const isCorrectOption = q.correctAnswer === idx;

            // Determine styling
            let boxBg = theme.colors.surface;
            let boxBorder = theme.colors.border;
            let letterBg = isDarkMode ? '#334155' : '#F1F5F9';
            let letterCol = theme.colors.textSecondary;

            if (isCorrectOption) {
              boxBg = isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4';
              boxBorder = '#10B981';
              letterBg = isDarkMode ? '#064E3B' : '#ECFDF5';
              letterCol = '#10B981';
            } else if (isUserSelection && !isCorrectOption) {
              boxBg = isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2';
              boxBorder = '#EF4444';
              letterBg = isDarkMode ? '#7F1D1D' : '#FEF2F2';
              letterCol = '#EF4444';
            }

            return (
              <View 
                key={idx} 
                style={[
                  styles.optionBox, 
                  { 
                    backgroundColor: boxBg, 
                    borderColor: boxBorder 
                  }
                ]}
              >
                
                {isCorrectOption && (
                  <View style={styles.floatingLabelCorrect}><Text style={styles.floatingLabelText}>CORRECT</Text></View>
                )}
                {isUserSelection && !isCorrectOption && (
                  <View style={styles.floatingLabelWrong}><Text style={styles.floatingLabelText}>YOUR ANSWER</Text></View>
                )}

                <View style={styles.optInner}>
                  <View style={[styles.optLetterBox, { backgroundColor: letterBg }]}>
                    <Text style={[styles.optLetter, { color: letterCol }]}>{String.fromCharCode(65 + idx)}</Text>
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    {opt.image ? (
                      <View style={[styles.optImageWrapper, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
                        <Image
                          source={{ uri: getImageUrl(opt.image) || '' }}
                          style={styles.optImage}
                          resizeMode="contain"
                        />
                      </View>
                    ) : null}
                    {opt.text && opt.text !== '[image]' ? (
                      <Text style={[styles.optText, { color: theme.colors.textMain }]}>{opt.text}</Text>
                    ) : null}
                  </View>
                  
                  {isCorrectOption && <CheckCircle2 color="#10B981" size={20} />}
                  {isUserSelection && !isCorrectOption && <XCircle color="#EF4444" size={20} />}
                </View>
              </View>
            );
          })}
        </View>

        {/* Explanation Box */}
        {(q.explanation || q.explanationImage) && (
          <View style={[styles.explanationBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF', borderColor: isDarkMode ? '#334155' : '#C7D2FE', borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Lightbulb color={theme.colors.primary} size={20} style={{ marginRight: 8 }} />
              <Text style={[styles.expTitle, { color: theme.colors.primary }]}>Step-by-step Explanation</Text>
            </View>
            {q.explanationImage ? (
              <View style={[styles.qImageContainer, { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', borderColor: theme.colors.border }]}>
                <Image
                  source={{ uri: getImageUrl(q.explanationImage) || '' }}
                  style={styles.qImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}
            {q.explanation ? (
              <Text style={[styles.expText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>{q.explanation}</Text>
            ) : null}
          </View>
        )}

      </ScrollView>

      {/* QUESTION NAV BOTTOM BAR */}
      <View style={[styles.reviewBottomNav, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}>
        <TouchableOpacity 
          style={[styles.navBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }, currentQIndex === 0 && { opacity: 0.4 }]} 
          disabled={currentQIndex === 0}
          onPress={() => setCurrentQIndex(prev => prev - 1)}
        >
          <ChevronLeft color={theme.colors.textMain} size={20} />
          <Text style={[styles.navBtnText, { color: theme.colors.textMain }]}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }, currentQIndex === singleResult.questionAnalysis.length - 1 && { opacity: 0.4 }]}
          disabled={currentQIndex === singleResult.questionAnalysis.length - 1}
          onPress={() => setCurrentQIndex(prev => prev + 1)}
        >
          <Text style={[styles.navBtnText, { color: theme.colors.textMain }]}>Next</Text>
          <ChevronRight color={theme.colors.textMain} size={20} />
        </TouchableOpacity>
      </View>

      {/* ========================================================= */}
      {/* QUESTION PALETTE MODAL */}
      {/* ========================================================= */}
      <Modal visible={paletteVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPaletteVisible(false)}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.paletteHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <View style={[styles.dragHandle, { backgroundColor: theme.colors.border }]} />
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 12}}>
              <Text style={[styles.paletteTitle, { color: theme.colors.textMain }]}>Question Palette</Text>
              <TouchableOpacity onPress={() => setPaletteVisible(false)} style={[styles.iconBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
                <X color={theme.colors.textMain} size={24} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 20}}>
            <View style={styles.legendGrid}>
              <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#10B981'}]}/><Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Correct</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#EF4444'}]}/><Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Incorrect</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: isDarkMode ? '#334155' : '#E2E8F0'}]}/><Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Skipped</Text></View>
            </View>

            <View style={styles.qGrid}>
              {(singleResult.questionAnalysis || []).map((qa, i) => {
                const isSkip = qa.userAnswer === null || qa.userAnswer === undefined;
                const isRt = !!qa.isCorrect;
                const bg = isSkip ? (isDarkMode ? '#334155' : '#E2E8F0') : isRt ? '#10B981' : '#EF4444';
                const col = isSkip ? (isDarkMode ? '#94A3B8' : '#64748B') : '#FFF';
                
                return (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.qGridItem, { backgroundColor: bg }, currentQIndex === i && { borderWidth: 2, borderColor: theme.colors.primary }]}
                    onPress={() => { setCurrentQIndex(i); setPaletteVisible(false); }}
                  >
                    <Text style={[styles.qGridText, {color: col}]}>{i + 1}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* CUSTOM ALERT MODAL (Shared) */}
      <Modal visible={customAlert.visible} transparent animationType="fade">
        <View style={styles.customAlertOverlay}>
          <View style={[styles.customAlertBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
            <Text style={[styles.customAlertTitle, { color: theme.colors.textMain }]}>{customAlert.title}</Text>
            <Text style={[styles.customAlertMessage, { color: theme.colors.textSecondary }]}>{customAlert.message}</Text>
            <TouchableOpacity style={[styles.customAlertConfirmBtn, { backgroundColor: theme.colors.primary }]} onPress={customAlert.onConfirm || (() => setCustomAlert(prev => ({...prev, visible: false})))}>
              <Text style={styles.customAlertConfirmText}>{customAlert.confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
};

// --------------------------------------------------------
// STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 28) : 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerIcon: { padding: 4 },
  headerTitleMain: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  
  // --- LIST SCREEN STYLES ---
  listScrollContent: { padding: 20, paddingBottom: 60 },
  listStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  listStatCard: { width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, ...staticTheme.shadows.elite },
  listStatIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  listStatVal: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  listStatLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 16 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 10 },
  filterPillActive: { backgroundColor: '#6366F6', borderColor: '#6366F6' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterPillTextActive: { color: '#FFFFFF' },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  listTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  listCount: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  testTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', lineHeight: 22, marginBottom: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  scoreBox: { alignItems: 'flex-end' },
  scorePercent: { fontSize: 22, fontWeight: '800' },
  scoreGrade: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  cardMiddleRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 16, justifyContent: 'space-between' },
  miniStatBox: { flex: 1, alignItems: 'center' },
  miniStatVal: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  miniStatLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  miniStatDivider: { width: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF', paddingVertical: 12, borderRadius: 10 },
  viewDetailsText: { fontSize: 14, fontWeight: '700', color: '#6366F6' },
  primaryBtn: { backgroundColor: '#6366F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // --- ANALYSIS SCREEN STYLES ---
  analysisScrollContent: { padding: 20, paddingBottom: 130 },
  scoreCard: { alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 20 },
  trophyIconPill: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  finalScoreLabel: { fontSize: 11, fontWeight: '800', color: '#6366F6', letterSpacing: 1, marginBottom: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  scoreValue: { fontSize: 52, fontWeight: '900', color: '#0F172A', lineHeight: 60 },
  scoreTotal: { fontSize: 18, fontWeight: '700', color: '#94A3B8' },
  timeTakenBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 16 },
  timeTakenText: { fontSize: 11.5, fontWeight: '700' },
  rankRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  rankCol: { flex: 1, alignItems: 'center' },
  rankDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
  rankVal: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  rankLabel: { fontSize: 9.5, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8 },
  analysisStatsGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  analysisStatBox: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
  analysisStatBoxNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  analysisStatBoxLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  sectionalContainer: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 },
  secHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  secTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  accuracyBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  accuracyText: { fontSize: 11, fontWeight: '700', color: '#6366F6' },
  secRow: { marginBottom: 16 },
  secLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  secSubject: { fontSize: 13, fontWeight: '600', color: '#475569' },
  secPercent: { fontSize: 13, fontWeight: '800' },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  footerFixed: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFFFFF', padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 30 },
  btnSolid: { flexDirection: 'row', backgroundColor: '#6366F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  btnSolidText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnOutline: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  btnOutlineText: { color: '#64748B', fontSize: 15, fontWeight: '700' },

  // --- REVIEW SCREEN STYLES ---
  reviewQNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 16, marginTop: 8, marginBottom: 8, borderRadius: 14, borderWidth: 1 },
  qIndexText: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  gridBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tagPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '700' },
  qText: { fontSize: 15.5, fontWeight: '600', color: '#1E293B', lineHeight: 24, marginBottom: 20 },
  optionsContainer: { gap: 14, marginBottom: 24 },
  optionBox: { position: 'relative', borderRadius: 14, borderWidth: 2, paddingTop: 16, paddingBottom: 16, paddingHorizontal: 14, marginTop: 8, overflow: 'visible' },
  optInner: { flexDirection: 'row', alignItems: 'center' },
  optBoxNeutral: { borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  optBoxCorrect: { borderColor: '#10B981', backgroundColor: '#FFFFFF' },
  optBoxWrong: { borderColor: '#EF4444', backgroundColor: '#FFFFFF' },
  optLetterBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optLetterBgNeutral: { backgroundColor: '#F1F5F9' },
  optLetterBgCorrect: { backgroundColor: '#ECFDF5' },
  optLetterBgWrong: { backgroundColor: '#FEF2F2' },
  optLetterColNeutral: { color: '#64748B' },
  optLetterColCorrect: { color: '#10B981' },
  optLetterColWrong: { color: '#EF4444' },
  optLetter: { fontSize: 14, fontWeight: '700' },
  optText: { flex: 1, fontSize: 14.5, color: '#334155', fontWeight: '500', lineHeight: 21, marginRight: 6 },
  floatingLabelCorrect: { position: 'absolute', top: -11, right: 14, backgroundColor: '#10B981', paddingHorizontal: 9, paddingVertical: 2.5, borderRadius: 5, zIndex: 10, elevation: 3 },
  floatingLabelWrong: { position: 'absolute', top: -11, right: 14, backgroundColor: '#EF4444', paddingHorizontal: 9, paddingVertical: 2.5, borderRadius: 5, zIndex: 10, elevation: 3 },
  floatingLabelText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  explanationBox: { backgroundColor: '#EEF2FF', borderRadius: 16, padding: 18, marginBottom: 20 },
  expTitle: { fontSize: 14, fontWeight: '700', color: '#6366F6' },
  expText: { fontSize: 14, color: '#475569', lineHeight: 24 },
  reviewBottomNav: { flexDirection: 'row', position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#F8FAFC' },
  navBtnText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  // --- PALETTE MODAL ---
  paletteHeader: { alignItems: 'center', padding: 20, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dragHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2 },
  paletteTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  qGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  qGridItem: { width: (width - 40 - 50) / 6, aspectRatio: 1, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  qGridText: { fontSize: 14, fontWeight: '700' },

  // --- IMAGE STYLES ---
  qImageContainer: { width: '100%', maxHeight: 280, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 16, padding: 8, backgroundColor: '#F8FAFC' },
  qImage: { width: '100%', height: 220 },
  optImageWrapper: { width: '100%', maxHeight: 180, borderRadius: 8, overflow: 'hidden', marginVertical: 6 },
  optImage: { width: '100%', height: 140 },

  // --- CUSTOM ALERT MODAL ---
  customAlertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center' },
  customAlertBox: { backgroundColor: '#FFFFFF', width: '85%', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  customAlertTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 12 },
  customAlertMessage: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  customAlertConfirmBtn: { width: '100%', backgroundColor: '#6366F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  customAlertConfirmText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});