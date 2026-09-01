import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  AppState,
  AppStateStatus,
  Dimensions,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  LayoutGrid,
  Flag,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Play,
  Clock,
  HelpCircle,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Globe,
  ShieldAlert,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../service/api.service';
import { getImageUrl } from '../../utils/image.utils';

import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// --------------------------------------------------------
// 1. TYPES & CONSTANTS
// --------------------------------------------------------
interface Option {
  _id?: string;
  text?: string;
  image?: string;
  latex?: string;
  isCorrect?: boolean;
}

interface Question {
  id: string;
  questionNumber: number;
  questionText?: string;
  questionImage?: string;
  questionLatex?: string;
  questionTextHindi?: string;
  questionImageHindi?: string;
  questionLatexHindi?: string;
  options: Option[];
  optionsHindi?: Option[];
  hindi?: {
    questionText?: string;
    questionImage?: string;
    questionLatex?: string;
    options?: Option[];
  };
  marks: number;
  negativeMarks: number;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  subject?: string;
  topic?: string;
}

interface TestSeries {
  id: string;
  title: string;
  duration: number;
  totalMarks: number;
  instructions: string[];
  availableLanguages?: string[];
  language?: string;
}

interface AttemptData {
  attemptId: string;
  testSeries: TestSeries;
  questions: Question[];
  startTime: string;
  timeRemaining: number;
  savedAnswers: Record<string, number>;
  selectedLanguage?: string;
}

const MAX_VIOLATIONS = 3;

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

const formatTime = (seconds: number) => {
  if (seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Watermark Component (Anti-Screenshot)
const WatermarkOverlay = ({ email }: { email?: string }) => (
  <View style={styles.watermarkContainer} pointerEvents="none">
    {Array.from({ length: 12 }).map((_, i) => (
      <Text key={i} style={styles.watermarkText}>
        {email || 'STUDENT'} • MYEDUDOCS • PROTECTED
      </Text>
    ))}
  </View>
);

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const TestInterface = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { testId, id } = route.params || {};
  const effectiveTestId = testId || id;
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();

  // --- CUSTOM ALERT STATE ---
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const triggerAlert = (
    title: string,
    message: string,
    type: AlertType = 'info',
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText = 'OK',
    cancelText?: string
  ) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm, onCancel, confirmText, cancelText });
  };
  const hideAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));

  // --- TEST STATES ---
  const [testState, setTestState] = useState<'LOADING' | 'INSTRUCTIONS' | 'ACTIVE' | 'SUBMITTED' | 'ERROR'>('LOADING');
  const [agreed, setAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi'>('english');

  // --- DATA STATES ---
  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [activeSubject, setActiveSubject] = useState<string>('All');
  const [allSubjects, setAllSubjects] = useState<string[]>(['All']);

  // --- TIMER & SECURITY STATES ---
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [violations, setViolations] = useState(0);

  // --- UI STATES ---
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [violationModalVisible, setViolationModalVisible] = useState(false);
  const [violationReason, setViolationReason] = useState('App switched to background');
  const [saving, setSaving] = useState(false);

  const saveTimeoutRef = useRef<any>(null);
  const submittedRef = useRef(false);

  // --- 1. START TEST (FETCH DATA) ---
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const initTest = async () => {
      let token = user?.token;
      let studentId = user?.id || (user as any)?._id;

      if (!token || !studentId) {
        try {
          const stored = await AsyncStorage.getItem('edudocs');
          if (stored) {
            const parsed = JSON.parse(stored);
            token = token || parsed?.token;
            studentId = studentId || parsed?.id || parsed?._id;
          }
        } catch (e) {}
      }

      if (!effectiveTestId) {
        setErrorMsg('Test identification parameter is missing.');
        setTestState('ERROR');
        return;
      }

      try {
        setTestState('LOADING');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${BASE_URL}/student/test-series/attempt/${effectiveTestId}/start`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ studentId }),
        });
        const data = await response.json();

        if (!data.success) {
          if (data.requiresPurchase) {
            triggerAlert(
              'Purchase Required',
              data.message || 'This test series requires an active subscription or purchase.',
              'warning',
              () => {
                navigation.replace('TestSeriesDetails', { id: effectiveTestId });
              },
              () => navigation.goBack(),
              'View Package',
              'Cancel'
            );
            return;
          }
          throw new Error(data.message || 'Failed to start test');
        }

        // If ongoing attempt expired or completed
        if (data.timeExpired || data.attempt?.status === 'completed') {
          navigation.replace('TestResults', {
            attemptId: data.attempt?.attemptId || data.attempt?._id,
          });
          return;
        }

        let rawQuestions = data.attempt?.questions || [];
        if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
          rawQuestions = [
            {
              id: 'mock_q1',
              questionNumber: 1,
              questionText: "Which of the following options correctly describes the story of the Indian play 'Mudrarakshasa'?",
              options: [
                { text: 'The conflict between demons and gods', isCorrect: false },
                { text: 'The love story of a demon and a princess', isCorrect: false },
                { text: 'The story of a young Aryan man and a court dancer', isCorrect: false },
                { text: 'The political machinations of Chanakya against the Nanda dynasty', isCorrect: true },
              ],
              marks: 2,
              negativeMarks: 0.66,
              difficulty: 'medium',
              subject: 'General Studies',
              topic: 'Ancient History',
            },
          ];
        }

        const normalizedQuestions: Question[] = rawQuestions.map((q: any, i: number) => ({
          ...q,
          id: (q.id || q._id || `q_${i + 1}`).toString(),
          questionNumber: q.questionNumber || i + 1,
          questionText: q.questionText || `Question ${i + 1}`,
          options: (q.options && q.options.length > 0) ? q.options : [
            { text: 'Option A' },
            { text: 'Option B' },
            { text: 'Option C' },
            { text: 'Option D' },
          ],
        }));

        const validAttempt: AttemptData = {
          attemptId: data.attempt?.attemptId || data.attempt?._id || `att_${Date.now()}`,
          testSeries: data.attempt?.testSeries || {
            id: effectiveTestId,
            title: 'Mock Test Series',
            duration: 60,
            totalMarks: normalizedQuestions.length * 2,
            instructions: [],
          },
          questions: normalizedQuestions,
          startTime: data.attempt?.startTime || new Date().toISOString(),
          timeRemaining: data.attempt?.timeRemaining || (data.attempt?.testSeries?.duration || 60) * 60,
          savedAnswers: data.attempt?.savedAnswers || {},
          selectedLanguage: data.attempt?.selectedLanguage,
        };

        setAttemptData(validAttempt);
        setAnswers(validAttempt.savedAnswers);
        setTimeRemaining(validAttempt.timeRemaining);
        setTotalSeconds((validAttempt.testSeries?.duration || 60) * 60);

        if (validAttempt.selectedLanguage) {
          setSelectedLanguage(validAttempt.selectedLanguage as 'english' | 'hindi');
        }

        const subs = Array.from(new Set(normalizedQuestions.map((q: Question) => q.subject || 'General')));
        setAllSubjects(subs.length > 0 ? (subs as string[]) : ['General']);
        setActiveSubject((subs[0] as string) || 'General');
        setVisited(new Set([normalizedQuestions[0].id]));

        if (Object.keys(validAttempt.savedAnswers).length > 0) {
          setTestState('ACTIVE');
        } else {
          setTestState('INSTRUCTIONS');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load test');
        setTestState('ERROR');
      }
    };

    initTest();
  }, [effectiveTestId, user, retryCount]);

  // --- 2. SECURITY: APP STATE TRACKING ---
  useEffect(() => {
    if (testState !== 'ACTIVE') return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setViolations(prev => {
          const newCount = prev + 1;
          setViolationReason(
            nextAppState === 'background' ? 'App switched to background or multitasking' : 'Screen inactive or locked'
          );
          setViolationModalVisible(true);

          if (newCount >= MAX_VIOLATIONS) {
            setTimeout(() => {
              handleFinalSubmit();
            }, 1500);
          }
          return newCount;
        });
      }
    });
    return () => subscription.remove();
  }, [testState]);

  // --- 3. TIMER LOGIC ---
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (testState === 'ACTIVE' && timeRemaining > 0) {
      timer = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
    } else if (timeRemaining === 0 && testState === 'ACTIVE') {
      triggerAlert('Time Up!', 'Your test is being submitted automatically.', 'info', handleFinalSubmit, undefined, 'OK');
    }
    return () => clearInterval(timer);
  }, [testState, timeRemaining]);

  // --- 4. QUESTION HANDLERS ---
  const handleAnswer = (optionIndex: number) => {
    if (!attemptData) return;
    const currentQId = attemptData.questions[currentQIndex].id;

    setAnswers(prev => ({ ...prev, [currentQId]: optionIndex }));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await fetch(`${BASE_URL}/student/test-series/attempt/${attemptData.attemptId}/answer`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
          body: JSON.stringify({ questionId: currentQId, selectedOption: optionIndex, timeSpent: 0 }),
        });
      } catch (err) {
        console.error('Failed to save answer', err);
      } finally {
        setSaving(false);
      }
    }, 700);
  };

  const handleClear = () => {
    if (!attemptData) return;
    const currentQId = attemptData.questions[currentQIndex].id;
    const newAnswers = { ...answers };
    delete newAnswers[currentQId];
    setAnswers(newAnswers);
  };

  const handleMark = () => {
    if (!attemptData) return;
    const currentQId = attemptData.questions[currentQIndex].id;
    setMarked(prev => {
      const next = new Set(prev);
      if (next.has(currentQId)) next.delete(currentQId);
      else next.add(currentQId);
      return next;
    });
  };

  const navigateQuestion = (index: number) => {
    if (!attemptData) return;
    if (index >= 0 && index < attemptData.questions.length) {
      setCurrentQIndex(index);
      setVisited(prev => new Set(prev).add(attemptData.questions[index].id));
      setActiveSubject(attemptData.questions[index].subject || 'General');
    }
  };

  const handleSaveAndNext = () => navigateQuestion(currentQIndex + 1);
  const handlePrev = () => navigateQuestion(currentQIndex - 1);

  // --- 5. SUBMIT TEST ---
  const handleFinalSubmit = async () => {
    if (!attemptData || submittedRef.current) return;
    try {
      submittedRef.current = true;
      setSubmitModalVisible(false);
      setPaletteVisible(false);
      setTestState('LOADING');

      const timeTaken = Math.floor((Date.now() - new Date(attemptData.startTime).getTime()) / 1000);

      const response = await fetch(`${BASE_URL}/student/test-series/attempt/${attemptData.attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ timeTaken, studentId: user?.id || (user as any)?._id }),
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.message || 'Failed to submit test');

      setTestState('SUBMITTED');

      navigation.replace('TestResults', {
        attemptId: attemptData.attemptId,
        results: data.results,
      });
    } catch (err: any) {
      setTestState('ACTIVE');
      submittedRef.current = false;
      triggerAlert('Submit Failed', err.message || 'Could not submit test', 'error');
    }
  };

  const answeredCount = Object.keys(answers).length;
  const safeQIndex = Math.min(Math.max(0, currentQIndex), Math.max(0, (attemptData?.questions?.length || 1) - 1));
  const currentQ = attemptData?.questions?.[safeQIndex] || attemptData?.questions?.[0];

  // ======================================================================
  // RENDER: LOADING OR ERROR
  // ======================================================================
  if (testState === 'LOADING') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.textMuted, fontWeight: '700', fontSize: 14 }}>
          Preparing your secure test environment...
        </Text>
      </View>
    );
  }

  if (testState === 'ERROR') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: isDarkMode ? '#7F1D1D30' : '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <AlertCircle color="#EF4444" size={40} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.textMain, marginBottom: 8, textAlign: 'center' }}>
          Unable to Start Test
        </Text>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20, fontSize: 13 }}>
          {errorMsg}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, width: '100%', maxWidth: 320, marginTop: 4 }}>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderWidth: 1, borderColor: theme.colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.primaryBtnText, { color: theme.colors.textMain }]}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1, backgroundColor: theme.colors.primary }]}
            onPress={() => setRetryCount(prev => prev + 1)}
          >
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ======================================================================
  // RENDER: INSTRUCTIONS SCREEN
  // ======================================================================
  if (testState === 'INSTRUCTIONS' && attemptData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        
        {/* Single Sleek Header */}
        <View style={[styles.instHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color={theme.colors.textMain} size={22} />
          </TouchableOpacity>
          <View style={{ flex: 1, paddingLeft: 8 }}>
            <Text style={[styles.instHeaderTitle, { color: theme.colors.textMain }]} numberOfLines={1}>
              {attemptData.testSeries.title}
            </Text>
            <Text style={[styles.instHeaderSub, { color: theme.colors.primary }]}>TEST INSTRUCTIONS</Text>
          </View>
          {/* Language Toggle in Instructions Header */}
          <TouchableOpacity
            style={[
              styles.headerPillBtn,
              {
                backgroundColor: selectedLanguage === 'hindi' ? '#FEF3C7' : isDarkMode ? '#1E293B' : '#EEF2FF',
                borderColor: selectedLanguage === 'hindi' ? '#F59E0B' : theme.colors.border,
              },
            ]}
            onPress={() => setSelectedLanguage(prev => (prev === 'english' ? 'hindi' : 'english'))}
            activeOpacity={0.8}
          >
            <Globe color={selectedLanguage === 'hindi' ? '#D97706' : theme.colors.primary} size={13} />
            <Text style={[styles.headerPillText, { color: selectedLanguage === 'hindi' ? '#D97706' : theme.colors.primary }]}>
              {selectedLanguage === 'english' ? 'EN' : 'HI'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.instScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.instStatsGrid}>
            <View style={[styles.instStatCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[styles.instIconBadge, { backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF' }]}>
                <HelpCircle color={theme.colors.primary} size={20} />
              </View>
              <Text style={[styles.instStatLabel, { color: theme.colors.textMuted }]}>Questions</Text>
              <Text style={[styles.instStatValue, { color: theme.colors.textMain }]}>{attemptData.questions.length}</Text>
            </View>

            <View style={[styles.instStatCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[styles.instIconBadge, { backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF' }]}>
                <Clock color={theme.colors.primary} size={20} />
              </View>
              <Text style={[styles.instStatLabel, { color: theme.colors.textMuted }]}>Duration</Text>
              <Text style={[styles.instStatValue, { color: theme.colors.textMain }]}>{attemptData.testSeries.duration} Mins</Text>
            </View>
          </View>

          <Text style={[styles.sectionHeading, { color: theme.colors.textMuted }]}>MARKING SCHEME</Text>
          <View style={[styles.cardBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.markingRow, { borderBottomColor: theme.colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CheckCircle2 color="#10B981" size={16} style={{ marginRight: 8 }} />
                <Text style={[styles.markingText, { color: theme.colors.textMain }]}>Correct Answer</Text>
              </View>
              <Text style={[styles.markingScore, { color: '#10B981' }]}>+ Marks Assigned</Text>
            </View>
            <View style={styles.markingRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <XCircle color="#EF4444" size={16} style={{ marginRight: 8 }} />
                <Text style={[styles.markingText, { color: theme.colors.textMain }]}>Wrong Answer</Text>
              </View>
              <Text style={[styles.markingScore, { color: '#EF4444' }]}>Negative Penalty</Text>
            </View>
          </View>

          <Text style={[styles.sectionHeading, { color: theme.colors.textMuted }]}>RULES & ENVIRONMENT</Text>
          <View style={[styles.cardBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, gap: 12 }]}>
            {[
              'Questions can be reviewed and changed anytime before the final submission.',
              'Switching apps or locking your screen triggers a security violation warning.',
              'The test will automatically submit when the countdown timer reaches zero.',
            ].map((inst, i) => (
              <View key={i} style={styles.ruleItem}>
                <View style={[styles.ruleBullet, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.ruleBulletText}>{i + 1}</Text>
                </View>
                <Text style={[styles.ruleText, { color: theme.colors.textMuted }]}>{inst}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.agreeCheckboxRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
            <View
              style={[
                styles.checkboxBox,
                { borderColor: agreed ? theme.colors.primary : theme.colors.border },
                agreed && { backgroundColor: theme.colors.primary },
              ]}
            >
              {agreed && <CheckCircle2 color="#FFFFFF" size={13} />}
            </View>
            <Text style={[styles.agreeCheckboxText, { color: theme.colors.textMain }]}>
              I have read and understood all test instructions and guidelines.
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Start Button */}
        <View style={[styles.bottomBarFixed, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.startBtnLarge, { backgroundColor: theme.colors.primary }, !agreed && { opacity: 0.45 }]}
            disabled={!agreed}
            onPress={() => setTestState('ACTIVE')}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnLargeText}>Begin Examination</Text>
            <Play color="#FFFFFF" size={16} fill="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Custom Alert Modal */}
        <Modal visible={customAlert.visible} transparent animationType="fade" onRequestClose={hideAlert}>
          <View style={styles.customAlertOverlay}>
            <View style={[styles.submitDialogCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <AlertCircle color={customAlert.type === 'error' ? '#EF4444' : customAlert.type === 'warning' ? '#F59E0B' : theme.colors.primary} size={36} />
              <Text style={[styles.submitDialogTitle, { color: theme.colors.textMain }]}>{customAlert.title}</Text>
              <Text style={[styles.submitDialogSub, { color: theme.colors.textMuted }]}>{customAlert.message}</Text>
              <View style={styles.submitDialogBtns}>
                {customAlert.onCancel && (
                  <TouchableOpacity style={[styles.dialogCancelBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} onPress={customAlert.onCancel}>
                    <Text style={[styles.dialogCancelBtnText, { color: theme.colors.textMain }]}>{customAlert.cancelText || 'Cancel'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.dialogConfirmBtn, { backgroundColor: theme.colors.primary }]} onPress={customAlert.onConfirm || hideAlert}>
                  <Text style={styles.dialogConfirmBtnText}>{customAlert.confirmText || 'OK'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ======================================================================
  // RENDER: ACTIVE TEST SCREEN
  // ======================================================================
  if (testState === 'ACTIVE' && attemptData && currentQ) {
    const isHindi = selectedLanguage === 'hindi';
    const hindiText = currentQ.questionTextHindi || currentQ.hindi?.questionText;
    const hindiImage = currentQ.questionImageHindi || currentQ.hindi?.questionImage;
    const hindiLatex = currentQ.questionLatexHindi || currentQ.hindi?.questionLatex;
    const hindiOptions = (currentQ.optionsHindi && currentQ.optionsHindi.length > 0)
      ? currentQ.optionsHindi
      : (currentQ.hindi?.options && currentQ.hindi?.options.length > 0 ? currentQ.hindi.options : null);

    const hasHindiForThisQ = !!(hindiText || hindiImage || hindiLatex || (hindiOptions && hindiOptions.length > 0));
    const hasAnyHindiInTest = attemptData.testSeries.language === 'both' ||
      (attemptData.testSeries.availableLanguages && attemptData.testSeries.availableLanguages.length > 1) ||
      attemptData.questions.some(q => q.questionTextHindi || q.hindi?.questionText || (q.optionsHindi && q.optionsHindi.length > 0) || (q.hindi?.options && q.hindi?.options.length > 0));

    const currentQText = (isHindi && hindiText) ? hindiText : (currentQ.questionText || '');
    const currentQImage = (isHindi && hindiImage) ? hindiImage : currentQ.questionImage;
    const currentOptionsList = (isHindi && hindiOptions) ? hindiOptions : currentQ.options;

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <WatermarkOverlay email={user?.email} />

        {/* --- SINGLE MASTER TEST HEADER --- */}
        <View style={[styles.activeHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          {/* Left: Timer */}
          <View style={styles.timerBlock}>
            <Text style={[styles.timerSubText, { color: theme.colors.textLight }]}>TIME LEFT</Text>
            <View style={styles.timerValueRow}>
              <Clock color={timeRemaining < 300 ? '#EF4444' : theme.colors.primary} size={16} />
              <Text style={[styles.timerDigitText, { color: timeRemaining < 300 ? '#EF4444' : theme.colors.primary }]}>
                {formatTime(timeRemaining)}
              </Text>
            </View>
          </View>

          {/* Right: Violation + Language + Palette + Submit */}
          <View style={styles.headerControlsRight}>
            {violations > 0 && (
              <View style={styles.violationTag}>
                <ShieldAlert color="#EF4444" size={12} />
                <Text style={styles.violationTagText}>{violations}/{MAX_VIOLATIONS}</Text>
              </View>
            )}

            {/* Language Switcher */}
            <TouchableOpacity
              style={[styles.headerPillBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF', borderColor: theme.colors.border }]}
              onPress={() => setSelectedLanguage(prev => (prev === 'english' ? 'hindi' : 'english'))}
              activeOpacity={0.8}
            >
              <Globe color={theme.colors.primary} size={13} />
              <Text style={[styles.headerPillText, { color: theme.colors.primary }]}>
                {selectedLanguage === 'english' ? 'EN' : 'HI'}
              </Text>
            </TouchableOpacity>

            {/* Question Palette Icon */}
            <TouchableOpacity
              style={[styles.headerSquareBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: theme.colors.border }]}
              onPress={() => setPaletteVisible(true)}
              activeOpacity={0.7}
            >
              <LayoutGrid color={theme.colors.textMain} size={18} />
            </TouchableOpacity>

            {/* Submit Icon Button */}
            <TouchableOpacity
              style={[styles.headerSubmitBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
              onPress={() => setSubmitModalVisible(true)}
              activeOpacity={0.7}
            >
              <CheckCircle color="#EF4444" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SUBJECT PILLS TABS --- */}
        <View style={[styles.subjectTabsBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectTabsScroll}>
            {allSubjects.map(sub => {
              const isSubActive = activeSubject === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[
                    styles.subjectTabPill,
                    {
                      backgroundColor: isSubActive ? theme.colors.primary : isDarkMode ? '#1E293B' : '#F1F5F9',
                      borderColor: isSubActive ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    const firstIdx = attemptData.questions.findIndex(q => (q.subject || 'General') === sub);
                    if (firstIdx !== -1) navigateQuestion(firstIdx);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subjectTabPillText, { color: isSubActive ? '#FFFFFF' : theme.colors.textMuted }]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* --- MAIN QUESTION SCROLL --- */}
        <ScrollView contentContainerStyle={styles.activeScrollArea} showsVerticalScrollIndicator={false}>
          {/* Progress Header */}
          <View style={styles.qTopProgress}>
            <View>
              <Text style={[styles.qCounterTitle, { color: theme.colors.textMain }]}>
                Question {currentQIndex + 1}{' '}
                <Text style={{ color: theme.colors.textLight, fontSize: 13, fontWeight: '500' }}>
                  / {attemptData.questions.length}
                </Text>
              </Text>
              <Text style={[styles.qAttemptedSub, { color: theme.colors.primary }]}>
                {answeredCount} of {attemptData.questions.length} ATTEMPTED
              </Text>
            </View>

            <View style={[styles.progressBarTrack, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${Math.max(4, (answeredCount / attemptData.questions.length) * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Badges Row */}
          <View style={styles.badgeChipsRow}>
            <View style={[styles.badgePill, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: theme.colors.border }]}>
              <Text style={[styles.badgePillText, { color: theme.colors.textMuted }]}>
                {(currentQ.topic || currentQ.subject || 'GENERAL').toUpperCase()}
              </Text>
            </View>

            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor:
                    currentQ.difficulty === 'easy'
                      ? 'rgba(16,185,129,0.1)'
                      : currentQ.difficulty === 'hard'
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(245,158,11,0.1)',
                  borderColor:
                    currentQ.difficulty === 'easy'
                      ? '#10B981'
                      : currentQ.difficulty === 'hard'
                      ? '#EF4444'
                      : '#F59E0B',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgePillText,
                  {
                    color:
                      currentQ.difficulty === 'easy'
                        ? '#10B981'
                        : currentQ.difficulty === 'hard'
                        ? '#EF4444'
                        : '#F59E0B',
                    fontWeight: '800',
                  },
                ]}
              >
                {(currentQ.difficulty || 'MEDIUM').toUpperCase()}
              </Text>
            </View>

            <View style={[styles.badgePill, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: theme.colors.border }]}>
              <Text style={[styles.badgePillText, { color: theme.colors.textMuted }]}>
                +{currentQ.marks || 2} / -{currentQ.negativeMarks || 0.66}
              </Text>
            </View>

            {/* Direct In-Question Language Switcher Pill (Always Visible) */}
            <TouchableOpacity
              style={[
                styles.badgePill,
                {
                  backgroundColor: isHindi ? '#FEF3C7' : '#EEF2FF',
                  borderColor: isHindi ? '#F59E0B' : theme.colors.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                },
              ]}
              onPress={() => setSelectedLanguage(prev => (prev === 'english' ? 'hindi' : 'english'))}
              activeOpacity={0.7}
            >
              <Globe size={11} color={isHindi ? '#D97706' : theme.colors.primary} />
              <Text
                style={[
                  styles.badgePillText,
                  {
                    color: isHindi ? '#D97706' : theme.colors.primary,
                    fontWeight: '800',
                    marginLeft: 4,
                  },
                ]}
              >
                {isHindi ? '🇮🇳 हिन्दी' : '🇬🇧 EN'}
              </Text>
            </TouchableOpacity>

            {isHindi && !hasHindiForThisQ && (
              <View style={[styles.badgePill, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                <Text style={[styles.badgePillText, { color: '#DC2626', fontSize: 10 }]}>
                  (English shown)
                </Text>
              </View>
            )}

            {marked.has(currentQ.id) && (
              <View style={[styles.badgePill, { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: '#8B5CF6' }]}>
                <Flag size={11} color="#8B5CF6" fill="#8B5CF6" />
                <Text style={[styles.badgePillText, { color: '#8B5CF6', fontWeight: '800', marginLeft: 3 }]}>Review</Text>
              </View>
            )}
          </View>

          {/* Question Image (if any) */}
          {currentQImage ? (
            <View style={[styles.qImageBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: theme.colors.border }]}>
              <Image source={{ uri: getImageUrl(currentQImage) || '' }} style={styles.qImage} resizeMode="contain" />
            </View>
          ) : null}

          {/* Question Text */}
          {currentQText ? (
            <Text style={[styles.questionTextBody, { color: theme.colors.textMain }]}>
              {currentQIndex + 1}. {currentQText}
            </Text>
          ) : null}

          {/* Option Choices */}
          <View style={styles.optionsList}>
            {currentOptionsList.map((opt, optIndex) => {
              const isSelected = answers[currentQ.id] === optIndex;
              const optionLetter = String.fromCharCode(65 + optIndex);

              return (
                <TouchableOpacity
                  key={opt._id || optIndex}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? isDarkMode
                          ? 'rgba(99,102,241,0.2)'
                          : '#EEF2FF'
                        : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleAnswer(optIndex)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.optionLetterCircle,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : isDarkMode ? '#1E293B' : '#F1F5F9',
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.optionLetterText, { color: isSelected ? '#FFFFFF' : theme.colors.textMuted }]}>
                      {optionLetter}
                    </Text>
                  </View>

                  <Text style={[styles.optionContentText, { color: isSelected ? theme.colors.textMain : theme.colors.textMuted }]}>
                    {opt.text || `Option ${optionLetter}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* --- STICKY FOOTER CONTROLS --- */}
        <View
          style={[
            styles.bottomStickyBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: Math.max(12, insets.bottom),
            },
          ]}
        >
          {/* Top row: Mark Review & Clear */}
          <View style={styles.footerActionRowTop}>
            <TouchableOpacity
              style={[
                styles.actionBtnSmall,
                {
                  backgroundColor: marked.has(currentQ.id)
                    ? isDarkMode
                      ? '#312E81'
                      : '#EEF2FF'
                    : isDarkMode
                    ? '#1E293B'
                    : '#FFFFFF',
                  borderColor: marked.has(currentQ.id) ? '#6366F1' : theme.colors.border,
                },
              ]}
              onPress={handleMark}
              activeOpacity={0.8}
            >
              <Flag size={14} color={marked.has(currentQ.id) ? '#6366F1' : theme.colors.textMuted} />
              <Text style={[styles.actionBtnSmallText, { color: marked.has(currentQ.id) ? '#6366F1' : theme.colors.textMuted }]}>
                {marked.has(currentQ.id) ? 'Unmark Review' : 'Mark Review'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtnSmall,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderColor: theme.colors.border,
                  opacity: answers[currentQ.id] === undefined ? 0.5 : 1,
                },
              ]}
              onPress={handleClear}
              disabled={answers[currentQ.id] === undefined}
              activeOpacity={0.8}
            >
              <RotateCcw size={13} color={theme.colors.textMuted} />
              <Text style={[styles.actionBtnSmallText, { color: theme.colors.textMuted }]}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom row: Previous & Save and Next */}
          <View style={styles.footerActionRowBottom}>
            <TouchableOpacity
              style={[
                styles.prevBtn,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderColor: theme.colors.border,
                  opacity: currentQIndex === 0 ? 0.4 : 1,
                },
              ]}
              onPress={handlePrev}
              disabled={currentQIndex === 0}
              activeOpacity={0.8}
            >
              <ChevronLeft size={16} color={theme.colors.textMain} />
              <Text style={[styles.prevBtnText, { color: theme.colors.textMain }]}>Prev</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveNextBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleSaveAndNext}
              disabled={currentQIndex === attemptData.questions.length - 1}
              activeOpacity={0.85}
            >
              <Text style={styles.saveNextBtnText}>Save & Next</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- QUESTION PALETTE MODAL --- */}
        <Modal visible={paletteVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPaletteVisible(false)}>
          <View style={[styles.modalPaletteContainer, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
            <View style={[styles.modalPaletteHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalPaletteTitle, { color: theme.colors.textMain }]}>Question Palette</Text>
              <TouchableOpacity onPress={() => setPaletteVisible(false)} style={styles.modalCloseIconBtn}>
                <X color={theme.colors.textMain} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalPaletteBody}>
              {/* Status Legend */}
              <View style={styles.legendGrid}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textMuted }]}>Attempted ({answeredCount})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textMuted }]}>Marked ({marked.size})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textMuted }]}>Unattempted ({attemptData.questions.length - answeredCount})</Text>
                </View>
              </View>

              {/* Grid of question buttons */}
              <View style={styles.paletteButtonsGrid}>
                {attemptData.questions.map((q, idx) => {
                  const isAns = answers[q.id] !== undefined;
                  const isMrk = marked.has(q.id);
                  const isCur = currentQIndex === idx;

                  let btnBg = isDarkMode ? '#1E293B' : '#F1F5F9';
                  let textColor = theme.colors.textMuted;

                  if (isAns) {
                    btnBg = '#10B981';
                    textColor = '#FFFFFF';
                  } else if (isMrk) {
                    btnBg = '#8B5CF6';
                    textColor = '#FFFFFF';
                  }

                  return (
                    <TouchableOpacity
                      key={q.id || idx}
                      style={[
                        styles.paletteQBtn,
                        {
                          backgroundColor: btnBg,
                          borderColor: isCur ? '#3B82F6' : 'transparent',
                          borderWidth: isCur ? 2.5 : 0,
                        },
                      ]}
                      onPress={() => {
                        navigateQuestion(idx);
                        setPaletteVisible(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.paletteQBtnText, { color: textColor }]}>{idx + 1}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* --- SUBMIT CONFIRMATION MODAL --- */}
        <Modal visible={submitModalVisible} transparent animationType="fade" onRequestClose={() => setSubmitModalVisible(false)}>
          <View style={styles.customAlertOverlay}>
            <View style={[styles.submitDialogCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <CheckCircle2 color={theme.colors.primary} size={42} />
              <Text style={[styles.submitDialogTitle, { color: theme.colors.textMain }]}>Submit Test?</Text>
              <Text style={[styles.submitDialogSub, { color: theme.colors.textMuted }]}>
                You have answered {answeredCount} of {attemptData.questions.length} questions. Are you sure you want to submit your final attempt?
              </Text>

              <View style={styles.submitDialogBtns}>
                <TouchableOpacity
                  style={[styles.dialogCancelBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
                  onPress={() => setSubmitModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dialogCancelBtnText, { color: theme.colors.textMain }]}>Resume Test</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dialogConfirmBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={handleFinalSubmit}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dialogConfirmBtnText}>Submit Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

// --------------------------------------------------------
// STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    overflow: 'hidden',
    justifyContent: 'space-around',
    alignItems: 'center',
    opacity: 0.02,
  },
  watermarkText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    transform: [{ rotate: '-30deg' }],
    marginVertical: 35,
  },

  // Instructions Screen
  instHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  instHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  instHeaderSub: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  instScrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 14,
  },
  instStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  instStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  instIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  instStatLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  instStatValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  cardBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  markingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  markingText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  markingScore: {
    fontSize: 12,
    fontWeight: '800',
  },
  ruleItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  ruleBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  ruleBulletText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  agreeCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeCheckboxText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  bottomBarFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  startBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startBtnLargeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Active Test Master Header
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  timerBlock: {},
  timerSubText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  timerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerDigitText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  violationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  violationTagText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  headerPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  headerSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerSubmitBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Subjects Tab Bar
  subjectTabsBar: {
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  subjectTabsScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  subjectTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  subjectTabPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Active Question Scroll Body
  activeScrollArea: {
    padding: 16,
    paddingBottom: 190,
    gap: 12,
  },
  qTopProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  qCounterTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  qAttemptedSub: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  progressBarTrack: {
    width: 90,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  qImageBox: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 6,
  },
  qImage: {
    width: '100%',
    height: '100%',
  },
  questionTextBody: {
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 23,
    marginVertical: 4,
  },
  optionsList: {
    gap: 10,
    marginTop: 6,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  optionLetterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionLetterText: {
    fontSize: 12,
    fontWeight: '800',
  },
  optionContentText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 19,
  },

  // Bottom Sticky Controls
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  footerActionRowTop: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnSmallText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerActionRowBottom: {
    flexDirection: 'row',
    gap: 10,
  },
  prevBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveNextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveNextBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // Palette Modal Styles
  modalPaletteContainer: {
    flex: 1,
  },
  modalPaletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalPaletteTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalCloseIconBtn: {
    padding: 6,
  },
  modalPaletteBody: {
    padding: 16,
  },
  legendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paletteButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paletteQBtn: {
    width: (width - 32 - 40) / 5,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteQBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Custom Alert / Dialog
  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  submitDialogCard: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  submitDialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  submitDialogSub: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  submitDialogBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    width: '100%',
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  dialogCancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  dialogConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  dialogConfirmBtnText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});

export default TestInterface;