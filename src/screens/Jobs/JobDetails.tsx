import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Calendar,
  CreditCard,
  Users,
  Link as LinkIcon,
  Clock,
  Download,
  Share2,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { apiClient, ENDPOINTS } from '../../service/api.service';
import { NotFound } from '../../components/NotFound';
import { useAuth } from '../../context/AuthContext';
import DetailsSkeleton from '../../components/skeletons/DetailsSkeleton';
import { DownloadPopupModal } from '../../components/DownloadPopupModal';
import { ScreenContainer } from '../../components/common/ScreenContainer';

const { width } = Dimensions.get('window');

export const JobDetails = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const { id } = route.params;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadData, setDownloadData] = useState({ url: '', title: '' });

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await apiClient(ENDPOINTS.GET_JOB_DETAILS(id));
        setJob(response?.data?.job || null);
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [id]);

  const openDownloadPopup = (url: string, title: string) => {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `https://api.myedudocs.in/${url.replace(/\\/g, '/')}`;
    setDownloadData({ url: fullUrl, title });
    setDownloadModalVisible(true);
  };

  const handleShare = async () => {
    try {
      const { Share } = await import('react-native');
      await Share.share({
        message: `New Job Notification: ${job.organization_name} - ${job.title}\nCheck out the full details here: https://myedudocs.in/job-details/${id}`,
      });
    } catch (error) {
      console.log('Error sharing job:', error);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <ScreenContainer
        header={{ title: 'Job Details', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
        scroll={false}
      >
        <DetailsSkeleton />
      </ScreenContainer>
    );
  }

  if (!job) {
    return (
      <ScreenContainer
        header={{ title: 'Job Details', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
        scroll={false}
      >
        <NotFound
          title="Job Not Found"
          subtitle="This job notification may have expired or been removed from the portal."
          buttonText="Browse Other Jobs"
          onButtonPress={() => navigation.goBack()}
          fullScreen={true}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      header={{ title: 'Job Details', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={true}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* --- TOP INFO CARD --- */}
        <View style={[styles.mainCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.orgBadge, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
            <Text style={styles.orgText}>{job.organization_name}</Text>
          </View>
          <Text style={[styles.jobTitle, { color: theme.colors.textMain }]}>{job.title}</Text>

          <View style={styles.quickMeta}>
            <View style={styles.metaItem}>
              <Clock color={theme.colors.textSecondary} size={14} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>Posted: {formatDate(job.posted_on)}</Text>
            </View>
            {job.advertisement_number && (
              <View style={styles.metaItem}>
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>Advt No: {job.advertisement_number}</Text>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <Text style={[styles.sectionHeading, { color: theme.colors.textMain }]}>Short Information</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {job.job_description || `Official recruitment notification for ${job.title} at ${job.organization_name}. Check below for eligibility, dates, and application process.`}
          </Text>
        </View>

        {/* --- IMPORTANT DATES --- */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <Calendar color="#6366F6" size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>Important Dates</Text>
          </View>

          <View style={styles.grid}>
            <DateItem label="Application Begin" value={formatDate(job.start_date)} />
            <DateItem label="Last Date to Apply" value={formatDate(job.last_date || job.deadline)} isHighLight />
            <DateItem label="Fee Last Date" value={formatDate(job.fee_last_date)} />
            <DateItem label="Exam Date" value={formatDate(job.exam_date)} />
            <DateItem label="Admit Card" value={formatDate(job.admit_card_release)} />
            <DateItem label="Result Date" value={formatDate(job.result_date)} />
          </View>
        </View>

        {/* --- APPLICATION FEES --- */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <CreditCard color="#10B981" size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>Application Fees</Text>
          </View>

          <View style={styles.feeList}>
            <FeeItem label="General / UR / OBC" value={job.application_fee_general || job.application_fee_obc} isDark={isDarkMode} themeColors={theme.colors} />
            <FeeItem label="EWS" value={job.application_fee_ews} isDark={isDarkMode} themeColors={theme.colors} />
            <FeeItem label="SC / ST" value={job.application_fee_sc || job.application_fee_st} isDark={isDarkMode} themeColors={theme.colors} />
            <FeeItem label="PH / PWD" value={job.application_fee_pwd} isDark={isDarkMode} themeColors={theme.colors} />
            <FeeItem label="Female (All Cat.)" value={job.application_fee_female} isDark={isDarkMode} themeColors={theme.colors} />
          </View>
          <Text style={[styles.feeNote, { color: theme.colors.textMuted }]}>* Pay exam fee through Online mode (UPI, Debit/Credit Card, Net Banking).</Text>
        </View>

        {/* --- VACANCY & ELIGIBILITY --- */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <Users color="#F59E0B" size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>Vacancy & Eligibility</Text>
          </View>

          <View style={styles.vacancyRow}>
            <View style={styles.vacancyBox}>
              <Text style={styles.vacancyCount}>{job.total_vacancies || 'N/A'}</Text>
              <Text style={[styles.vacancyLabel, { color: theme.colors.textSecondary }]}>Total Posts</Text>
            </View>
            <View style={[styles.vacancyBox, { borderLeftWidth: 1, borderLeftColor: theme.colors.border }]}>
              <Text style={styles.vacancyCount}>
                {job.age_limit_min ? `${job.age_limit_min}-${job.age_limit_max}` : 'N/A'}
              </Text>
              <Text style={[styles.vacancyLabel, { color: theme.colors.textSecondary }]}>Age Limit (Yrs)</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <Text style={[styles.subHeading, { color: theme.colors.textMain }]}>Eligibility Criteria</Text>
          {job.qualifications_required && job.qualifications_required.length > 0 ? (
            job.qualifications_required.map((item: string, index: number) => (
              <View key={index} style={styles.bulletItem}>
                <View style={[styles.bullet, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.bulletText, { color: theme.colors.textSecondary }]}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>Eligibility details not specified in short notice.</Text>
          )}
        </View>

        {/* --- IMPORTANT LINKS --- */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <LinkIcon color="#6366F6" size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>Important Links</Text>
          </View>

          <View style={styles.linksContainer}>
            <LinkBtn
              label="Official Notification"
              icon={<Download size={18} color="#6366F6" />}
              onPress={() => openDownloadPopup(job.job_pdf_url, "Official Notification")}
              isDark={isDarkMode}
              themeColors={theme.colors}
            />
            <LinkBtn
              label="Download Syllabus"
              icon={<Download size={18} color="#6366F6" />}
              onPress={() => openDownloadPopup(job.syllabus_url, "Exam Syllabus")}
              isDark={isDarkMode}
              themeColors={theme.colors}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* --- DOWNLOAD POPUP MODAL --- */}
      <DownloadPopupModal
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        targetUrl={downloadData.url}
        resourceTitle={downloadData.title}
        resourceType="Job Document"
      />
    </ScreenContainer>
  );
};

const DateItem = ({ label, value, isHighLight, themeColors }: any) => (
  <View style={styles.dateItem}>
    <Text style={[styles.dateLabel, { color: themeColors?.textLight || '#94A3B8' }]}>{label}</Text>
    <Text style={[styles.dateValue, { color: themeColors?.textMain || '#0F172A' }, isHighLight && styles.highLight]}>{value}</Text>
  </View>
);

const FeeItem = ({ label, value, isDark, themeColors }: any) => (
  <View style={styles.feeItem}>
    <Text style={[styles.feeLabel, { color: themeColors?.textSecondary || '#475569' }]}>{label}</Text>
    <Text style={[styles.feeValue, { color: themeColors?.textMain || '#0F172A' }]}>{value ? `₹${value}/-` : 'Exempted'}</Text>
  </View>
);

const LinkBtn = ({ label, icon, onPress, isDark, themeColors }: any) => (
  <TouchableOpacity
    style={[styles.linkBtn, { backgroundColor: isDark ? '#1E293B' : (themeColors?.background || '#F8FAFC'), borderColor: themeColors?.border || '#F1F5F9' }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.linkLeft}>
      {icon}
      <Text style={[styles.linkLabel, { color: themeColors?.textMain || '#1E293B' }]}>{label}</Text>
    </View>
    <ChevronLeft size={18} color={themeColors?.textMuted || '#94A3B8'} style={{ transform: [{ rotate: '180deg' }] }} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scrollContent: { paddingBottom: 40 },

  mainCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  orgBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  orgText: { color: '#6366F6', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  jobTitle: { fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 12 },
  quickMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '500' },

  divider: { height: 1, marginVertical: 16 },
  sectionHeading: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 22 },

  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateItem: { width: '50%', marginBottom: 16, paddingRight: 8 },
  dateLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  dateValue: { fontSize: 13, fontWeight: '700' },
  highLight: { color: '#EF4444' },

  feeList: { gap: 12 },
  feeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: 13, fontWeight: '500' },
  feeValue: { fontSize: 13, fontWeight: '700' },
  feeNote: { fontSize: 11, marginTop: 12, fontStyle: 'italic' },

  vacancyRow: { flexDirection: 'row', paddingVertical: 8 },
  vacancyBox: { flex: 1, alignItems: 'center' },
  vacancyCount: { fontSize: 18, fontWeight: '800', color: '#6366F6' },
  vacancyLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  subHeading: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 20 },
  emptyText: { fontSize: 13, fontStyle: 'italic' },

  linksContainer: { gap: 12 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkLabel: { fontSize: 14, fontWeight: '600' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeIcon: {
    padding: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalSubtitleWeb: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  leadForm: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  inputWrap: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  secureText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: '#6366F6',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});