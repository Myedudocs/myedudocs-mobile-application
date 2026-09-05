import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  TrendingUp,
  Search,
  X,
  Clock,
  ChevronRight,
  Sparkles,
  BarChart2,
  Award,
  BookOpen,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useExamResults, ExamAttempt } from '../../hooks/useExamResults';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { DashboardLoader } from '../../components/v2/DashboardLoader';
import { MetricsCard } from '../../components/v2/MetricsCard';

const { width } = Dimensions.get('window');

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const value =
    sanitized.length === 3
      ? sanitized.split('').map((c) => c + c).join('')
      : sanitized;
  const r = parseInt(value.substring(0, 2), 16) || 0;
  const g = parseInt(value.substring(2, 4), 16) || 0;
  const b = parseInt(value.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const GRADE_COLORS: Record<string, string> = {
  'A+': '#10B981',
  A: '#3B82F6',
  B: '#6366F1',
  C: '#F59E0B',
  D: '#F97316',
  F: '#EF4444',
};

export const ResultsListScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [testTypeFilter, setTestTypeFilter] = useState<'all' | 'live' | 'non-live'>('all');

  const { results, total, loading, refreshing, refresh } = useExamResults(page, 50);

  // Stats calculation
  const stats = useMemo(() => {
    const totalCount = results.length;
    if (totalCount === 0) {
      return { total: 0, passed: 0, failed: 0, passRate: 0, avgScore: 0 };
    }
    const passed = results.filter((r) => r.status === 'passed' || r.percentage >= 40).length;
    const failed = totalCount - passed;
    const passRate = Math.round((passed / totalCount) * 100);
    const totalScorePct = results.reduce((acc, r) => acc + (r.percentage || 0), 0);
    const avgScore = Math.round(totalScorePct / totalCount);
    return { total: totalCount, passed, failed, passRate, avgScore };
  }, [results]);

  // Grade distribution
  const gradeDist = useMemo(() => {
    const counts: Record<string, number> = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    results.forEach((r) => {
      const g = r.grade || 'B';
      if (g in counts) counts[g]++;
    });
    return counts;
  }, [results]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const title = (r.testSeriesName || r.testTitle || r.examName || '').toLowerCase();
      const matchesSearch = title.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filter === 'passed') return r.status === 'passed' || r.percentage >= 40;
      if (filter === 'failed') return r.status === 'failed' || r.percentage < 40;

      if (testTypeFilter === 'live' && !r.isLive) return false;
      if (testTypeFilter === 'non-live' && r.isLive) return false;

      return true;
    });
  }, [results, searchQuery, filter, testTypeFilter]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
        <GlobalSafeHeader
          title={t('results.title', { defaultValue: 'Results & Analytics' })}
          subtitle="Detailed test attempts & performance breakdown"
          showBack
          showMenu
        />
        <View style={styles.loaderWrap}>
          <DashboardLoader />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
      <GlobalSafeHeader
        title={t('results.title', { defaultValue: 'Results & Analytics' })}
        subtitle="Detailed test attempts & performance breakdown"
        showBack
        showMenu
        showSearch
        showThemeToggle
        showNotifications
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Top 4 Metrics Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsCol}>
            <MetricsCard
              title="TOTAL ATTEMPTS"
              value={stats.total}
              subtitle="All time tests"
              icon={<ClipboardCheck size={20} color="#6366F1" />}
              color="#6366F1"
            />
          </View>
          <View style={styles.statsCol}>
            <MetricsCard
              title="PASS RATE"
              value={`${stats.passRate}%`}
              subtitle={`${stats.passed} Passed`}
              icon={<CheckCircle size={20} color="#10B981" />}
              color="#10B981"
            />
          </View>
          <View style={styles.statsCol}>
            <MetricsCard
              title="AVG SCORE"
              value={`${stats.avgScore}%`}
              subtitle="Overall accuracy"
              icon={<TrendingUp size={20} color="#EC4899" />}
              color="#EC4899"
            />
          </View>
          <View style={styles.statsCol}>
            <MetricsCard
              title="TO IMPROVE"
              value={stats.failed}
              subtitle="Failed attempts"
              icon={<XCircle size={20} color="#EF4444" />}
              color="#EF4444"
            />
          </View>
        </View>

        {/* Grade Distribution Bar */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.gradeHeaderRow}>
            <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>
              Grade Distribution
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.textMuted }]}>
              Based on percentage scores
            </Text>
          </View>

          <View style={styles.distroRow}>
            {Object.entries(gradeDist).map(([g, c]) => {
              const max = Math.max(1, ...Object.values(gradeDist));
              const h = stats.total > 0 ? Math.max(8, (c / max) * 80) : 8;
              return (
                <View key={g} style={styles.distroCol}>
                  <View
                    style={[
                      styles.distroTrack,
                      { backgroundColor: hexToRgba(GRADE_COLORS[g], 0.12) },
                    ]}
                  >
                    <View
                      style={[
                        styles.distroBar,
                        {
                          backgroundColor: GRADE_COLORS[g],
                          height: h,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.distroGrade, { color: GRADE_COLORS[g] }]}>
                    {g}
                  </Text>
                  <Text style={[styles.distroCount, { color: theme.colors.textMuted }]}>
                    {c}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Search size={16} color={theme.colors.textMuted} />
            <TextInput
              placeholder="Search by test name or examination..."
              placeholderTextColor={theme.colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.colors.textMain }]}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipRow}>
            {[
              { key: 'all', label: `All (${results.length})` },
              { key: 'passed', label: `✓ Passed (${stats.passed})` },
              { key: 'failed', label: `⏳ Needs Review (${stats.failed})` },
            ].map((f) => {
              const isSelected = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFilter(f.key as any)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isDarkMode
                          ? '#CBD5E1'
                          : '#475569',
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Test Type Filter Chips (parity with web) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterChipRow, { marginTop: 6 }]}>
            {[
              { key: 'all', label: '📋 All Types' },
              { key: 'live', label: '🔴 Live Sessions' },
              { key: 'non-live', label: '📝 Regular Tests' },
            ].map((f) => {
              const isSelected = testTypeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setTestTypeFilter(f.key as any)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected
                        ? '#EC4899'
                        : theme.colors.surface,
                      borderColor: isSelected ? '#EC4899' : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isSelected ? '#FFFFFF' : isDarkMode ? '#CBD5E1' : '#475569',
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>


        {/* Attempts List */}
        {filteredResults.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(99, 102, 241, 0.15)'
                    : '#EEF2FF',
                },
              ]}
            >
              <BarChart2 size={36} color="#6366F1" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>
              {results.length === 0
                ? 'No Test Attempts Yet'
                : 'No matching results found'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              {results.length === 0
                ? 'Take your first full-length test series to generate detailed speed vs accuracy analytics, subject breakdowns, and AI recommendations.'
                : 'Try adjusting your search query or switching filters.'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs', { screen: 'TestSeriesTab' })}
              activeOpacity={0.85}
              style={[styles.emptyActionBtn, { backgroundColor: theme.colors.primary }]}
            >
              <BookOpen size={15} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Explore Test Series & Mock Tests</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredResults.map((r, idx) => {
            const grade = r.grade || 'B';
            const color = GRADE_COLORS[grade] || '#6366F1';
            const isPassed = r.status === 'passed' || r.percentage >= 40;

            return (
              <TouchableOpacity
                key={r._id || r.id || `att-${idx}`}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('TestResults', {
                    attemptId: r._id || r.id,
                    testId: r.testSeriesId,
                  })
                }
                style={[
                  styles.attemptCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {/* Header: Title + Grade Pill */}
                <View style={styles.attemptCardHeader}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text
                      style={[styles.attemptTitle, { color: theme.colors.textMain }]}
                      numberOfLines={2}
                    >
                      {r.testSeriesName || r.examName || 'Full-Length Mock Test'}
                    </Text>
                    <Text
                      style={[styles.attemptSub, { color: theme.colors.textMuted }]}
                    >
                      {r.examName || 'Mock Examination'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.gradeBadge,
                      { backgroundColor: hexToRgba(color, 0.15) },
                    ]}
                  >
                    <Text style={[styles.gradeBadgeText, { color }]}>{grade}</Text>
                  </View>
                </View>

                {/* Score & Accuracy Progress Bar */}
                <View style={styles.scoreProgressWrap}>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.scoreLabel, { color: theme.colors.textLight }]}>
                      Score: <Text style={{ color: theme.colors.textMain, fontWeight: '800' }}>{r.score}</Text> / {r.totalScore}
                    </Text>
                    <Text style={[styles.scorePercentage, { color }]}>
                      {r.percentage}% ({isPassed ? 'Passed' : 'Failed'})
                    </Text>
                  </View>
                  <View style={[styles.trackBg, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                    <View
                      style={[
                        styles.trackFill,
                        {
                          backgroundColor: color,
                          width: `${Math.min(100, Math.max(5, r.percentage))}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Meta row + CTA */}
                <View style={styles.attemptCardFooter}>
                  <View style={styles.dateMeta}>
                    <Clock size={11} color={theme.colors.textLight} />
                    <Text style={[styles.dateText, { color: theme.colors.textLight }]}>
                      {new Date(r.submittedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })} · {r.accuracy}% Accuracy
                    </Text>
                  </View>

                  <View style={styles.viewAnalysisBtn}>
                    <Text style={[styles.viewAnalysisText, { color: theme.colors.primary }]}>
                      View Full Analysis
                    </Text>
                    <ChevronRight size={13} color={theme.colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 24, paddingTop: 14 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Top 4 Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statsCol: {
    flexBasis: '48%',
    flexGrow: 1,
  },

  /* Grade Distribution Card */
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  gradeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 11,
  },
  distroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
  },
  distroCol: {
    flex: 1,
    alignItems: 'center',
  },
  distroTrack: {
    width: '55%',
    flex: 1,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  distroBar: {
    width: '100%',
    borderRadius: 6,
  },
  distroGrade: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 6,
  },
  distroCount: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },

  /* Search & Filter */
  searchWrap: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  filterChipRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 11.5,
  },

  /* Empty State */
  emptyCard: {
    alignItems: 'center',
    padding: 26,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* Attempt Card */
  attemptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  attemptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  attemptTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    lineHeight: 19,
  },
  attemptSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  gradeBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeText: {
    fontSize: 15,
    fontWeight: '900',
  },
  scoreProgressWrap: {
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 11.5,
  },
  scorePercentage: {
    fontSize: 12,
    fontWeight: '800',
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  attemptCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 10,
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
  },
  viewAnalysisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAnalysisText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
});

export default ResultsListScreen;