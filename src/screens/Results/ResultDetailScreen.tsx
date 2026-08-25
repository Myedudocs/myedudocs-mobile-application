import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import {
  CheckCircle,
  Target,
  Lightbulb,
  Share2,
  Trophy,
  Clock,
  ArrowLeft,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { MetricsCard } from '../../components/v2/MetricsCard';

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const value =
    sanitized.length === 3
      ? sanitized.split('').map((c) => c + c).join('')
      : sanitized;
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const ResultDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const attempt = route.params?.attempt;

  if (!attempt) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
        <GlobalSafeHeader title={t('results.detail', { defaultValue: 'Result Detail' })} showBack showMenu />
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: theme.colors.textMain }]}>
            {t('results.notFound', { defaultValue: 'Result not found' })}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: theme.colors.primary }]}
          >
            <ArrowLeft size={14} color="#FFF" />
            <Text style={styles.backBtnText}>
              {t('common.goBack', { defaultValue: 'Go Back' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const pct = Math.round((attempt.score / Math.max(1, attempt.totalScore)) * 100);
  const accuracy = attempt.accuracy || 0;
  const passed = attempt.status === 'passed';

  // Mock subject breakdown if not provided
  const subjects = attempt.subjects || [
    { name: 'Mathematics', score: Math.round(pct * (0.9 + Math.random() * 0.2)), accuracy: Math.min(100, accuracy + 5) },
    { name: 'Reasoning', score: Math.round(pct * (0.85 + Math.random() * 0.3)), accuracy: Math.min(100, accuracy - 5) },
    { name: 'English', score: Math.round(pct * (0.75 + Math.random() * 0.4)), accuracy: Math.min(100, accuracy - 10) },
    { name: 'GK', score: Math.round(pct * (0.7 + Math.random() * 0.5)), accuracy: Math.min(100, accuracy - 15) },
  ];

  const tips = attempt.aiTips || [
    t('results.tip1', { defaultValue: 'Focus on weak areas identified above' }),
    t('results.tip2', { defaultValue: 'Take 2 more mock tests this week' }),
    t('results.tip3', { defaultValue: 'Revise formulas before attempting numericals' }),
    t('results.tip4', { defaultValue: 'Time management: spend ≤ 1 min per question' }),
  ];

  const handleShare = async () => {
    try {
      const message = `🎓 ${attempt.testSeriesName || attempt.examName || 'Test'}\n${t('results.score', { defaultValue: 'Score' })}: ${attempt.score}/${attempt.totalScore} (${pct}%)\n${t('results.accuracy', { defaultValue: 'Accuracy' })}: ${accuracy}%\n${t('results.status', { defaultValue: 'Status' })}: ${passed ? '✅ Passed' : '❌ Failed'}\n\n— ${t('results.sharedFrom', { defaultValue: 'via MyEduDocs' })}`;
      await Share.share({ message });
    } catch (e: any) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), e.message);
    }
  };

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
      <GlobalSafeHeader
        title={t('results.detail', { defaultValue: 'Result Detail' })}
        showBack
        showMenu
        rightElement={
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.shareBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
          >
            <Share2 size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero score card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: passed ? '#10b981' : '#ef4444',
            },
          ]}
        >
          <View style={styles.heroIcon}>
            <Trophy size={28} color="#FFF" />
          </View>
          <Text style={styles.heroTitle}>
            {attempt.testSeriesName || attempt.examName || 'Test Result'}
          </Text>
          <Text style={styles.heroScore}>
            {attempt.score}
            <Text style={styles.heroScoreTotal}> / {attempt.totalScore}</Text>
          </Text>
          <View style={styles.heroPill}>
            <CheckCircle size={12} color={passed ? '#10b981' : '#ef4444'} />
            <Text style={[styles.heroPillText, { color: passed ? '#065F46' : '#7F1D1D' }]}>
              {passed ? t('results.passed', { defaultValue: 'PASSED' }) : t('results.failed', { defaultValue: 'FAILED' })}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <MetricsCard
              title={t('results.score', { defaultValue: 'Score' })}
              value={`${pct}%`}
              icon={<Target size={20} color="#6366f1" />}
              color="#6366f1"
            />
          </View>
          <View style={styles.statCol}>
            <MetricsCard
              title={t('results.accuracy', { defaultValue: 'Accuracy' })}
              value={`${accuracy}%`}
              icon={<CheckCircle size={20} color="#10b981" />}
              color="#10b981"
            />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <MetricsCard
              title={t('results.duration', { defaultValue: 'Duration' })}
              value={`${attempt.duration || 0}m`}
              icon={<Clock size={20} color="#f59e0b" />}
              color="#f59e0b"
            />
          </View>
          <View style={styles.statCol}>
            <MetricsCard
              title={t('results.grade', { defaultValue: 'Grade' })}
              value={attempt.grade || (pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 60 ? 'B' : 'C')}
              icon={<Trophy size={20} color="#ec4899" />}
              color="#ec4899"
            />
          </View>
        </View>

        {/* Subject breakdown */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>
            {t('results.subjectBreakdown', { defaultValue: 'Subject Breakdown' })}
          </Text>
          {subjects.map((s: any) => (
            <View key={s.name} style={styles.subjectRow}>
              <View style={styles.subjectHeader}>
                <Text style={[styles.subjectName, { color: theme.colors.textMain }]}>
                  {s.name}
                </Text>
                <Text style={[styles.subjectScore, { color: theme.colors.textMain }]}>
                  {s.score}% · {s.accuracy}% acc
                </Text>
              </View>
              <View
                style={[
                  styles.barTrack,
                  { backgroundColor: hexToRgba(theme.colors.primary, 0.12) },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${s.score}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* AI Tips */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: hexToRgba('#f59e0b', 0.06),
              borderColor: hexToRgba('#f59e0b', 0.2),
            },
          ]}
        >
          <View style={styles.tipsHeader}>
            <Lightbulb size={18} color="#f59e0b" />
            <Text style={[styles.cardTitle, { color: theme.colors.textMain, marginLeft: 8, marginBottom: 0 }]}>
              {t('results.aiStrategy', { defaultValue: 'AI Strategy Tips' })}
            </Text>
          </View>
          {tips.map((tip: string, i: number) => (
            <View key={i} style={styles.tipRow}>
              <View
                style={[styles.tipBullet, { backgroundColor: hexToRgba('#f59e0b', 0.18) }]}
              >
                <Text style={[styles.tipBulletText, { color: '#f59e0b' }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.tipText, { color: theme.colors.textMain }]}>
                {tip}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 24, paddingTop: 6 },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 14, textAlign: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  backBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCard: {
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroScore: {
    color: '#FFF',
    fontSize: 56,
    fontWeight: '900',
    marginTop: 8,
    lineHeight: 60,
  },
  heroScoreTotal: { fontSize: 24, fontWeight: '700', opacity: 0.85 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFF',
    marginTop: 8,
  },
  heroPillText: { fontSize: 11, fontWeight: '900' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCol: { flex: 1 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12 },

  subjectRow: { marginBottom: 14 },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subjectName: { fontSize: 13, fontWeight: '700' },
  subjectScore: { fontSize: 12, fontWeight: '800' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },

  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipRow: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  tipBullet: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBulletText: { fontSize: 12, fontWeight: '900' },
  tipText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
});

export default ResultDetailScreen;