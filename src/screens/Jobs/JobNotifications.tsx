import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Share,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  MapPin,
  Users,
  GraduationCap,
  Share2,
  Heart,
  ArrowRight,
} from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { NotFound } from '../../components/NotFound';
import { apiClient, ENDPOINTS } from '../../service/api.service';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// --------------------------------------------------------
// 1. TYPES
// --------------------------------------------------------
const FILTERS = ['All Exams', 'NEET', 'JEE', 'SSC', 'Banking', 'UPSC'];

type Sector = 'PRIVATE' | 'GOVT';

interface JobData {
  id: string;
  sector: Sector;
  postedTime: string;
  closingBadge?: string;
  title: string;
  location: string;
  vacancies: string;
  qualification: string;
}

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const JobNotifications = () => {
  const navigation = useNavigation<any>();
  const { theme, isDarkMode } = useTheme();
  const [activeFilter, setActiveFilter] = useState('All Exams');
  const [searchQuery, setSearchQuery] = useState('');

  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await apiClient(ENDPOINTS.GET_JOB_NOTIFICATIONS);
        if (response.success && response.jobs) {
          const mappedJobs: JobData[] = response.jobs.map((j: any) => ({
            id: j._id,
            sector: j.job_type?.toUpperCase() === 'GOVERNMENT' ? 'GOVT' : 'PRIVATE',
            postedTime: j.posted_on ? `Posted ${new Date(j.posted_on).toLocaleDateString()}` : 'Recently Posted',
            title: j.title,
            location: j.location,
            vacancies: j.total_vacancies ? `${j.total_vacancies} Vacancies` : 'Multiple Vacancies',
            qualification: Array.isArray(j.qualifications_required) ? j.qualifications_required.join(', ') : j.qualifications_required || 'Not Specified',
            closingBadge: j.deadline ? `CLOSING ${new Date(j.deadline).toLocaleDateString()}` : undefined
          }));
          setJobs(mappedJobs);
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSectionShare = async () => {
    try {
      await Share.share({
        message: 'Stay updated with the latest Job Notifications on MyEduDocs!\nhttps://myedudocs.in/jobs',
      });
    } catch (error) {
      console.log('Error sharing jobs section:', error);
    }
  };

  const handleJobShare = async (job: JobData) => {
    try {
      await Share.share({
        message: `Job Opening: ${job.title}\nLocation: ${job.location}\nCheck details here: https://myedudocs.in/job-details/${job.id}`,
      });
    } catch (error) {
      console.log('Error sharing job:', error);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [jobs, searchQuery]);

  const renderJobItem = useCallback(({ item, index }: { item: JobData; index: number }) => (
    <Animated.View
      entering={index < 10 ? FadeInDown.delay(index * 50).springify() : undefined}
    >
      <View style={[
        styles.card,
        { backgroundColor: theme.colors.surface, shadowColor: isDarkMode ? '#000' : '#64748B' }
      ]}>
        {/* Optional Closing Badge (Absolute top right) */}
        {!!item.closingBadge && (
          <View style={styles.closingBadge}>
            <Text style={styles.closingBadgeText}>{item.closingBadge}</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={[
            styles.sectorTag,
            item.sector === 'GOVT'
              ? { backgroundColor: isDarkMode ? 'rgba(22,163,74,0.18)' : '#DCFCE7' }
              : { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }
          ]}>
            <Text style={[
              styles.sectorTagText,
              item.sector === 'GOVT' ? styles.sectorTextGovt : styles.sectorTextPrivate
            ]}>
              {item.sector}
            </Text>
          </View>
          <Text style={[styles.postedTimeText, { color: theme.colors.textMuted }]}>{item.postedTime}</Text>
        </View>

        <Text style={[styles.jobTitle, { color: theme.colors.textMain }]}>{item.title}</Text>

        <View style={styles.metaGrid}>
          <View style={styles.metaItemHalf}>
            <MapPin color={theme.colors.textSecondary} size={14} style={styles.metaIcon} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{item.location}</Text>
          </View>
          <View style={styles.metaItemHalf}>
            <Users color={theme.colors.textSecondary} size={14} style={styles.metaIcon} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{item.vacancies}</Text>
          </View>
          <View style={styles.metaItemFull}>
            <GraduationCap color={theme.colors.textSecondary} size={14} style={styles.metaIcon} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{item.qualification}</Text>
          </View>
        </View>

        <View style={[styles.actionRow, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={styles.viewDetailsBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('JobDetails', { id: item.id })}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <ArrowRight color="#6366F6" size={14} strokeWidth={2.5} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <View style={styles.actionIcons}>
            <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => handleJobShare(item)}>
              <Share2 color={theme.colors.textMuted} size={20} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
              <Heart color={theme.colors.textMuted} size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  ), [theme, isDarkMode]);

  const ListHeader = useMemo(() => (
    <View>
      {/* --- HORIZONTAL TABS --- */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.tabPill,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                activeFilter === filter && styles.tabPillActive
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeFilter === filter && styles.tabTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* --- SEARCH BAR --- */}
      <View style={[
        styles.searchContainer,
        {
          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
          borderColor: theme.colors.border
        }
      ]}>
        <Search color={theme.colors.textMuted} size={18} strokeWidth={2.5} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.textMain }]}
          placeholder="Search by job category, dept"
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  ), [activeFilter, searchQuery, theme, isDarkMode]);

  return (
    <ScreenContainer
      header={{ title: 'Job Notifications', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
    >
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <NotFound
              type="search"
              title="No jobs found"
              subtitle={`We couldn't find any job matching "${searchQuery}"`}
              buttonText="Clear Filters"
              onButtonPress={() => {
                setActiveFilter('All Exams');
                setSearchQuery('');
              }}
              fullScreen={false}
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 3. STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Horizontal Tabs
  tabsWrapper: {
    marginBottom: 16,
  },
  tabsScrollContent: {
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabPillActive: {
    backgroundColor: '#6366F6',
    borderColor: '#6366F6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 20,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    height: '100%',
  },

  // Job Cards
  card: {
    position: 'relative',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },

  // Closing Badge (Red flag on top right)
  closingBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 8,
    zIndex: 10,
  },
  closingBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectorTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  sectorTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectorTextPrivate: {
    color: '#6366F6',
  },
  sectorTextGovt: {
    color: '#16A34A',
  },
  postedTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },

  jobTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 16,
    paddingRight: 10,
  },

  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItemHalf: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  metaItemFull: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  metaIcon: {
    marginRight: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F6',
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconBtn: {
    padding: 2,
  },
});