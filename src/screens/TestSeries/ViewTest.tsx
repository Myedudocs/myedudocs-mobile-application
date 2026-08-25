import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Calendar,
  ClipboardList,
  TrendingUp,
  Clock,
  FileText,
  Trophy
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// --------------------------------------------------------
// 1. TYPES & MOCK DATA
// --------------------------------------------------------
type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'HARD';

interface TestItem {
  id: string;
  num: string;
  numBg: 'blue' | 'gray';
  attemptsText: string;
  attemptsStatus: 'normal' | 'exhausted' | 'unlimited';
  difficulty: Difficulty;
  title: string;
  duration: string;
  questions: string;
  marks: string;
  hasStarted: boolean;
  canStart: boolean;
  exhaustedText?: string;
}

const TESTS_DATA: TestItem[] = [
  {
    id: 'test1',
    num: '01',
    numBg: 'blue',
    attemptsText: '0 / 4 ATTEMPTS',
    attemptsStatus: 'normal',
    difficulty: 'BEGINNER',
    title: 'Full Length Mock Test 1',
    duration: '180 mins',
    questions: '100 Qs',
    marks: '200 Marks',
    hasStarted: false,
    canStart: true,
  },
  {
    id: 'test2',
    num: '01',
    numBg: 'blue',
    attemptsText: '2 / 4 ATTEMPTS',
    attemptsStatus: 'normal',
    difficulty: 'BEGINNER',
    title: 'Full Length Mock Test 1',
    duration: '180 mins',
    questions: '100 Qs',
    marks: '200 Marks',
    hasStarted: true,
    canStart: true,
  },
  {
    id: 'test3',
    num: '02',
    numBg: 'gray',
    attemptsText: '1 / 1 ATTEMPTS',
    attemptsStatus: 'exhausted',
    difficulty: 'INTERMEDIATE',
    title: 'Full Length Mock Test 2',
    duration: '180 mins',
    questions: '100 Qs',
    marks: '200 Marks',
    hasStarted: true,
    canStart: false,
    exhaustedText: 'Maximum attempts reached for this mock test.',
  },
  {
    id: 'test4',
    num: '03',
    numBg: 'blue',
    attemptsText: 'UNLIMITED ATTEMPTS',
    attemptsStatus: 'unlimited',
    difficulty: 'HARD',
    title: 'Sectional: Indian Polity',
    duration: '60 mins',
    questions: '50 Qs',
    marks: '100 Marks',
    hasStarted: true, // Assuming true to show "View Result"
    canStart: true,
  },
];

// Helper for difficulty badge colors
const getDifficultyStyles = (diff: Difficulty) => {
  switch (diff) {
    case 'BEGINNER': return { bg: '#DCFCE7', text: '#16A34A' }; // Green
    case 'INTERMEDIATE': return { bg: '#FEF3C7', text: '#D97706' }; // Orange
    case 'HARD': return { bg: '#FEE2E2', text: '#DC2626' }; // Red
    default: return { bg: '#F1F5F9', text: '#64748B' };
  }
};

// --------------------------------------------------------
// 2. COMPONENT
// --------------------------------------------------------
export const ViewTest = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  return (
    <ScreenContainer
      header={{
        title: 'View Test',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
      }}
      scroll={true}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* --- OVERVIEW CARD --- */}
        <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Top Enrolled Row */}
          <View style={styles.enrolledRow}>
            <View style={[styles.enrolledBadge, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
              <Text style={styles.enrolledBadgeText}>ENROLLED</Text>
            </View>
            <View style={styles.dateWrap}>
              <Calendar color={theme.colors.textSecondary} size={14} />
              <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>Valid till 31 Oct 2024</Text>
            </View>
          </View>

          <View style={[styles.overviewDivider, { backgroundColor: theme.colors.border }]} />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {/* Total Tests */}
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <ClipboardList color="#6366F6" size={16} strokeWidth={2.5} />
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>TOTAL TESTS</Text>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.textMain }]}>128</Text>
              <Text style={styles.statSubtextGreen}>+12 this week</Text>
            </View>

            {/* Vertical Divider */}
            <View style={[styles.statVerticalDivider, { backgroundColor: theme.colors.border }]} />

            {/* Avg Accuracy */}
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <TrendingUp color="#6366F6" size={16} strokeWidth={2.5} />
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>AVG ACCURACY</Text>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.textMain }]}>76<Text style={styles.statPercent}>%</Text></Text>
              <Text style={styles.statSubtextBlue}>Top 5% of users</Text>
            </View>
          </View>
        </View>

        {/* --- TEST CARDS LIST --- */}
        <View style={styles.testsContainer}>
          {TESTS_DATA.map((test) => {
            const diffStyle = getDifficultyStyles(test.difficulty);
            
            return (
              <View key={test.id} style={[styles.testCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                
                {/* Header Row: Num, Attempts, Difficulty */}
                <View style={styles.testHeader}>
                  <View style={styles.testHeaderLeft}>
                    <View style={[
                      styles.numCircle, 
                      { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF' },
                      test.numBg === 'gray' && { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }
                    ]}>
                      <Text style={[styles.numText, test.numBg === 'gray' && styles.numTextGray]}>{test.num}</Text>
                    </View>
                    <Text style={[
                      styles.attemptsText, 
                      { color: theme.colors.textSecondary },
                      test.attemptsStatus === 'exhausted' && styles.attemptsTextRed
                    ]}>
                      {test.attemptsText}
                    </Text>
                  </View>
                  <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
                    <Text style={[styles.diffBadgeText, { color: diffStyle.text }]}>{test.difficulty}</Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={[styles.testTitle, { color: theme.colors.textMain }]}>{test.title}</Text>

                {/* Meta Info Row */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Clock color={theme.colors.textMuted} size={14} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{test.duration}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <FileText color={theme.colors.textMuted} size={14} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{test.questions}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Trophy color={theme.colors.textMuted} size={14} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{test.marks}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                  {test.canStart ? (
                    <TouchableOpacity style={styles.btnSolid} activeOpacity={0.8}>
                      <Text style={styles.btnSolidText}>Start Test</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.btnDisabled, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                      <Text style={styles.btnDisabledText}>Attempts Exhausted</Text>
                    </View>
                  )}

                  {test.hasStarted && (
                    <TouchableOpacity style={[styles.btnOutline, { backgroundColor: 'transparent' }]} activeOpacity={0.7}>
                      <Text style={styles.btnOutlineText}>View Result</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {test.exhaustedText && (
                  <Text style={[styles.exhaustedHelperText, { color: theme.colors.textSecondary }]}>{test.exhaustedText}</Text>
                )}

              </View>
            );
          })}
        </View>

      </ScrollView>
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 3. EXACT STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagUPSC: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagUPSCText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  tagActive: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagActiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // --- OVERVIEW CARD ---
  overviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  enrolledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  enrolledBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  enrolledBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F6',
    letterSpacing: 0.5,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  overviewDivider: {
    height: 1,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
  },
  statVerticalDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 16,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statPercent: {
    fontSize: 16,
  },
  statSubtextGreen: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981', // Green
  },
  statSubtextBlue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366F6', // Blue
  },

  // --- TEST CARDS ---
  testsContainer: {
    gap: 16,
  },
  testCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  numCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numCircleGray: {},
  numText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6366F6',
  },
  numTextGray: {
    color: '#64748B',
  },
  attemptsText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  attemptsTextRed: {
    color: '#EF4444',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  diffBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  testTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Actions
  actionsContainer: {
    gap: 10,
  },
  btnSolid: {
    backgroundColor: '#6366F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSolidText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#6366F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    color: '#6366F6',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabledText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  exhaustedHelperText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 12,
  },
});