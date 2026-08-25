import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  DeviceEventEmitter,
  StatusBar,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  GraduationCap,
  BookOpen,
  Briefcase,
  FileText,
  Layout,
  User,
  Star,
  Search,
  X,
  TrendingUp,
  History,
  Layers,
  Sparkles,
  Flame,
  ArrowRight,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import debounce from 'lodash/debounce';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { BASE_URL } from '../../service/api.service';
import { getImageUrl } from '../../utils/image.utils';
import { NotFound } from '../NotFound';

const { width } = Dimensions.get('window');

const STORAGE_KEY_RECENT = 'myedudocs_recent_searches';

// Category Configuration with plural & singular fallbacks
const CAT_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; darkBg: string; tag: string; gradient: [string, string] }> = {
  course: { label: 'Courses', icon: GraduationCap, color: '#10B981', bg: '#ECFDF5', darkBg: 'rgba(16, 185, 129, 0.15)', tag: 'ONLINE COURSE', gradient: ['#10B981', '#059669'] },
  courses: { label: 'Courses', icon: GraduationCap, color: '#10B981', bg: '#ECFDF5', darkBg: 'rgba(16, 185, 129, 0.15)', tag: 'ONLINE COURSE', gradient: ['#10B981', '#059669'] },
  book: { label: 'Books', icon: BookOpen, color: '#F59E0B', bg: '#FFFBEB', darkBg: 'rgba(245, 158, 11, 0.15)', tag: 'E-BOOK / NOTES', gradient: ['#F59E0B', '#D97706'] },
  books: { label: 'Books', icon: BookOpen, color: '#F59E0B', bg: '#FFFBEB', darkBg: 'rgba(245, 158, 11, 0.15)', tag: 'E-BOOK / NOTES', gradient: ['#F59E0B', '#D97706'] },
  'test-series': { label: 'Test Series', icon: FileText, color: '#EC4899', bg: '#FDF2F8', darkBg: 'rgba(236, 72, 153, 0.15)', tag: 'MOCK TEST', gradient: ['#EC4899', '#DB2777'] },
  testseries: { label: 'Test Series', icon: FileText, color: '#EC4899', bg: '#FDF2F8', darkBg: 'rgba(236, 72, 153, 0.15)', tag: 'MOCK TEST', gradient: ['#EC4899', '#DB2777'] },
  examination: { label: 'Exams', icon: TrendingUp, color: '#6366F1', bg: '#EEF2FF', darkBg: 'rgba(99, 102, 241, 0.15)', tag: 'EXAMINATION', gradient: ['#6366F1', '#4F46E5'] },
  exams: { label: 'Exams', icon: TrendingUp, color: '#6366F1', bg: '#EEF2FF', darkBg: 'rgba(99, 102, 241, 0.15)', tag: 'EXAMINATION', gradient: ['#6366F1', '#4F46E5'] },
  job: { label: 'Jobs', icon: Briefcase, color: '#3B82F6', bg: '#EFF6FF', darkBg: 'rgba(59, 130, 246, 0.15)', tag: 'VACANCY', gradient: ['#3B82F6', '#2563EB'] },
  jobs: { label: 'Jobs', icon: Briefcase, color: '#3B82F6', bg: '#EFF6FF', darkBg: 'rgba(59, 130, 246, 0.15)', tag: 'VACANCY', gradient: ['#3B82F6', '#2563EB'] },
  pyq: { label: 'PYQs', icon: FileText, color: '#8B5CF6', bg: '#F5F3FF', darkBg: 'rgba(139, 92, 246, 0.15)', tag: 'PAST PAPERS', gradient: ['#8B5CF6', '#7C3AED'] },
  pyqs: { label: 'PYQs', icon: FileText, color: '#8B5CF6', bg: '#F5F3FF', darkBg: 'rgba(139, 92, 246, 0.15)', tag: 'PAST PAPERS', gradient: ['#8B5CF6', '#7C3AED'] },
  syllabus: { label: 'Syllabus', icon: Layout, color: '#06B6D4', bg: '#ECFEFF', darkBg: 'rgba(6, 182, 212, 0.15)', tag: 'EXAM SYLLABUS', gradient: ['#06B6D4', '#0891B2'] },
  blog: { label: 'Blogs', icon: Star, color: '#F43F5E', bg: '#FFF1F2', darkBg: 'rgba(244, 63, 94, 0.15)', tag: 'ARTICLE', gradient: ['#F43F5E', '#E11D48'] },
  blogs: { label: 'Blogs', icon: Star, color: '#F43F5E', bg: '#FFF1F2', darkBg: 'rgba(244, 63, 94, 0.15)', tag: 'ARTICLE', gradient: ['#F43F5E', '#E11D48'] },
  teacher: { label: 'Mentors', icon: User, color: '#6366F1', bg: '#EEF2FF', darkBg: 'rgba(99, 102, 241, 0.15)', tag: 'FACULTY', gradient: ['#6366F1', '#4F46E5'] },
  teachers: { label: 'Mentors', icon: User, color: '#6366F1', bg: '#EEF2FF', darkBg: 'rgba(99, 102, 241, 0.15)', tag: 'FACULTY', gradient: ['#6366F1', '#4F46E5'] },
  'current-affairs': { label: 'Current Affairs', icon: Sparkles, color: '#EAB308', bg: '#FEFCE8', darkBg: 'rgba(234, 179, 8, 0.15)', tag: 'DAILY NEWS', gradient: ['#EAB308', '#CA8A04'] },
};

export const GlobalSearchModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme, isDarkMode } = useTheme();

  // --- SEARCH STATES ---
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (searchVisible) {
      fetchTrending();
    }
  }, [searchVisible]);

  // --- GLOBAL SEARCH EVENT LISTENER ---
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('openGlobalSearch', () => {
      setSearchVisible(true);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_RECENT);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error('Error loading recent searches:', err);
    }
  };

  const saveRecentSearch = async (val: string) => {
    if (!val || typeof val !== 'string' || !val.trim()) return;
    const clean = val.trim();
    const updated = [clean, ...recentSearches.filter(s => s.toLowerCase() !== clean.toLowerCase())].slice(0, 10);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving search:', err);
    }
  };

  const removeSingleRecentSearch = async (val: string) => {
    const updated = recentSearches.filter(s => s !== val);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
    } catch (err) {
      console.error('Error removing recent search:', err);
    }
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(STORAGE_KEY_RECENT);
  };

  const fetchTrending = async () => {
    setTrendingLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/search/trending`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setTrendingSearches(data.data);
      } else {
        setTrendingSearches([]);
      }
    } catch (err) {
      console.error('Trending fetch error:', err);
      setTrendingSearches([]);
    } finally {
      setTrendingLoading(false);
    }
  };

  // --- SEARCH LOGIC ---
  const fetchResults = async (val: string) => {
    if (!val || !val.trim()) {
      setResults({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/search/global?q=${encodeURIComponent(val)}&limit=25`);
      const data = await res.json();
      if (data?.success && data?.data?.grouped) {
        setResults(data.data.grouped);
      } else {
        setResults({});
      }
    } catch (err) {
      console.error('Global search error:', err);
      setResults({});
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearchRef = useRef<any>(null);

  useEffect(() => {
    debouncedSearchRef.current = debounce((text: string) => {
      fetchResults(text);
    }, 350);

    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setQuery(text);
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(text);
    }
  };

  const navigateToResult = (key: string, id: string, title: string) => {
    saveRecentSearch(title);
    setSearchVisible(false);
    setQuery('');
    setResults({});

    const routeMap: any = {
      course: 'CoursesDetails',
      book: 'BookDetails',
      pyq: 'PreviousPapers',
      syllabus: 'Syllabus',
      'test-series': 'TestSeriesDetails',
      blog: 'BlogDetails',
      job: 'JobDetails',
      'current-affairs': 'CurrentAffairsDetails',
      teacher: 'Profile',
      examination: 'AllTestSeries',
    };

    if (routeMap[key]) {
      navigation.navigate(routeMap[key], { id, courseId: id, bookId: id });
    }
  };

  const handleSelectTag = (text: string, categoryKey?: string) => {
    setQuery(text);
    if (categoryKey) {
      setSelectedType(categoryKey);
    }
    fetchResults(text);
  };

  const totalResultsCount = useMemo(() => {
    if (!results || typeof results !== 'object') return 0;
    return Object.values(results).reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
  }, [results]);

  const filteredKeys = useMemo(() => {
    if (!results || typeof results !== 'object') return [];
    const keys = Object.keys(results).filter(
      k => Array.isArray(results[k]) && results[k].length > 0
    );
    if (selectedType === 'all') return keys;
    return keys.filter(k => k === selectedType);
  }, [results, selectedType]);

  const activeTypes = useMemo(() => {
    if (!results || typeof results !== 'object') return [];
    return Object.keys(results).filter(
      k => Array.isArray(results[k]) && results[k].length > 0
    );
  }, [results]);

  if (!searchVisible) return null;

  return (
    <Modal
      visible={searchVisible}
      animationType="fade"
      transparent={false}
      onRequestClose={() => setSearchVisible(false)}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F172A' : '#FFFFFF'}
      />
      <View style={[styles.modalRoot, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        
        {/* Top Floating App Search Bar */}
        <View
          style={[
            styles.searchHeader,
            {
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderBottomColor: isDarkMode ? '#1E293B' : theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                borderColor: isFocused ? theme.colors.primary : (isDarkMode ? '#334155' : '#E2E8F0'),
              },
            ]}
          >
            <Search color={isFocused ? theme.colors.primary : theme.colors.textMuted} size={19} strokeWidth={2.2} />
            <TextInput
              style={[styles.textInput, { color: theme.colors.textMain }]}
              placeholder="Search courses, test series, books..."
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
              value={query}
              onChangeText={handleSearchChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={() => {
                if (query.trim()) saveRecentSearch(query);
                Keyboard.dismiss();
              }}
              returnKeyType="search"
            />
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : query.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setResults({});
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.clearInputBtn}
              >
                <X color={theme.colors.textMuted} size={16} strokeWidth={2.5} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              setSearchVisible(false);
            }}
            style={styles.cancelBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, { color: theme.colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Category Filter Pills with Item Badges */}
        {(activeTypes.length > 0 || (query.length > 0 && totalResultsCount > 0)) && (
          <View
            style={[
              styles.filterBar,
              {
                backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                borderBottomColor: isDarkMode ? '#1E293B' : theme.colors.border,
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              <TouchableOpacity
                onPress={() => setSelectedType('all')}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: selectedType === 'all'
                      ? theme.colors.primary
                      : isDarkMode
                      ? '#1E293B'
                      : '#F1F5F9',
                    borderColor: selectedType === 'all' ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: selectedType === 'all' ? '#FFFFFF' : theme.colors.textMuted,
                      fontWeight: selectedType === 'all' ? '700' : '600',
                    },
                  ]}
                >
                  All ({totalResultsCount})
                </Text>
              </TouchableOpacity>

              {activeTypes.map(type => {
                const count = Array.isArray(results[type]) ? results[type].length : 0;
                const isSel = selectedType === type;
                const cfg = CAT_CONFIG[type];

                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedType(type)}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSel
                          ? theme.colors.primary
                          : isDarkMode
                          ? '#1E293B'
                          : '#F1F5F9',
                        borderColor: isSel ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: isSel ? '#FFFFFF' : theme.colors.textMuted,
                          fontWeight: isSel ? '700' : '600',
                        },
                      ]}
                    >
                      {cfg?.label || type} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Search Results / Discovery Feed */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.mainScroll, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {query.trim().length === 0 ? (
            <Animated.View entering={FadeIn.duration(300)}>
              
              {/* Recent Searches */}
              {Array.isArray(recentSearches) && recentSearches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <History color={theme.colors.textMuted} size={15} />
                      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
                        RECENT SEARCHES
                      </Text>
                    </View>
                    <TouchableOpacity onPress={clearRecentSearches} activeOpacity={0.7}>
                      <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear all</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.recentWrap}>
                    {recentSearches.map((s, i) => (
                      <View
                        key={i}
                        style={[
                          styles.recentChip,
                          {
                            backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                            borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.recentChipTextWrap}
                          onPress={() => handleSelectTag(s)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.recentText, { color: theme.colors.textMain }]} numberOfLines={1}>
                            {s}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeSingleRecentSearch(s)}
                          style={styles.recentChipRemove}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <X color={theme.colors.textMuted} size={13} strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Trending Now */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Flame color="#F59E0B" size={16} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
                      TRENDING TOPICS
                    </Text>
                  </View>
                  {trendingLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
                </View>

                <View style={styles.trendingGrid}>
                  {Array.isArray(trendingSearches) && trendingSearches.length > 0 ? (
                    trendingSearches.slice(0, 6).map((t, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.trendingCard,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        onPress={() => handleSelectTag(t.title)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.trendingRankBox}>
                          <Text style={[styles.trendingRankText, { color: theme.colors.primary }]}>
                            {i + 1}
                          </Text>
                        </View>
                        <Text
                          style={[styles.trendingText, { color: theme.colors.textMain }]}
                          numberOfLines={1}
                        >
                          {t.title}
                        </Text>
                        <TrendingUp color={theme.colors.textMuted} size={14} />
                      </TouchableOpacity>
                    ))
                  ) : (
                    // Default popular topics if API is empty
                    ['UPSC Civil Services', 'SSC CGL Tier 1', 'Banking & IBPS', 'State PSC', 'GATE Exam'].map((topic, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.trendingCard,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        onPress={() => handleSelectTag(topic)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.trendingRankBox}>
                          <Text style={[styles.trendingRankText, { color: theme.colors.primary }]}>
                            {i + 1}
                          </Text>
                        </View>
                        <Text
                          style={[styles.trendingText, { color: theme.colors.textMain }]}
                          numberOfLines={1}
                        >
                          {topic}
                        </Text>
                        <TrendingUp color={theme.colors.textMuted} size={14} />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>

              {/* Explore By Stream & Categories */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Layers color={theme.colors.primary} size={15} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
                      EXPLORE CHANNELS
                    </Text>
                  </View>
                </View>

                <View style={styles.catGrid}>
                  {Object.entries(CAT_CONFIG).slice(0, 8).map(([key, cfg]: any) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.catCard,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => handleSelectTag(cfg.label, key)}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.catIconWrap,
                          { backgroundColor: isDarkMode ? cfg.darkBg : cfg.bg },
                        ]}
                      >
                        <cfg.icon color={cfg.color} size={22} strokeWidth={2} />
                      </View>
                      <Text style={[styles.catLabel, { color: theme.colors.textMain }]}>
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </Animated.View>
          ) : (
            <View>
              {filteredKeys.length === 0 && !loading ? (
                <NotFound
                  fullScreen={false}
                  type="search"
                  title="No results found"
                  subtitle={`We couldn't find anything matching "${query}". Try searching another subject or exam.`}
                  buttonText="Clear Search"
                  onButtonPress={() => {
                    setQuery('');
                    setResults({});
                  }}
                />
              ) : (
                filteredKeys.map((key, sectionIdx) => {
                  const cfg = CAT_CONFIG[key] || {
                    label: key.toUpperCase(),
                    color: theme.colors.primary,
                    bg: '#EEF2FF',
                    darkBg: 'rgba(99,102,241,0.15)',
                    tag: 'ITEM',
                    icon: Layers,
                  };

                  return (
                    <Animated.View
                      key={key}
                      entering={FadeInDown.delay(sectionIdx * 50).duration(300)}
                      style={styles.categoryBlock}
                    >
                      <View style={styles.categoryHeaderRow}>
                        <View style={[styles.catDot, { backgroundColor: cfg.color }]} />
                        <Text style={[styles.categoryHeading, { color: theme.colors.textMain }]}>
                          {cfg.label}
                        </Text>
                        <Text style={[styles.catCountBadge, { color: theme.colors.textMuted }]}>
                          ({Array.isArray(results[key]) ? results[key].length : 0})
                        </Text>
                      </View>

                      {Array.isArray(results[key]) &&
                        results[key].map((item: any) => {
                          const rawImg = 
                            item.thumbnail || 
                            item.coverphoto || 
                            item.coverPhoto || 
                            item.coverImage || 
                            item.cover_image || 
                            item.bookImage || 
                            item.book_image || 
                            item.image || 
                            (Array.isArray(item.images) && item.images[0]) || 
                            item.banner || 
                            item.pdf_thumbnail || 
                            item.profile_image;

                          const thumb = rawImg ? getImageUrl(rawImg) : null;
                          const isBookOrDoc = ['book', 'books', 'syllabus', 'pyq', 'pyqs', 'course', 'courses'].includes(key);

                          return (
                            <TouchableOpacity
                              key={item._id}
                              style={[
                                styles.resCard,
                                {
                                  backgroundColor: theme.colors.surface,
                                  borderColor: theme.colors.border,
                                },
                              ]}
                              onPress={() =>
                                navigateToResult(key, item._id, item.plainTitle || item.title)
                              }
                              activeOpacity={0.75}
                            >
                              <View style={styles.resThumb}>
                                {thumb ? (
                                  <Image source={{ uri: thumb }} style={styles.resImg} resizeMode="cover" />
                                ) : isBookOrDoc ? (
                                  <View
                                    style={[
                                      styles.bookletCover,
                                      {
                                        backgroundColor: isDarkMode ? cfg.darkBg : cfg.bg,
                                        borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                      },
                                    ]}
                                  >
                                    <View style={[styles.bookletSpine, { backgroundColor: cfg.color }]} />
                                    <View style={styles.bookletInner}>
                                      <cfg.icon color={cfg.color} size={20} strokeWidth={2.2} />
                                      <Text
                                        style={[styles.bookletTitleSnippet, { color: theme.colors.textMuted }]}
                                        numberOfLines={1}
                                      >
                                        {(item.plainTitle || item.title || cfg.label).slice(0, 10)}
                                      </Text>
                                    </View>
                                  </View>
                                ) : (
                                  <View
                                    style={[
                                      styles.resIconBox,
                                      { backgroundColor: isDarkMode ? cfg.darkBg : cfg.bg },
                                    ]}
                                  >
                                    <cfg.icon color={cfg.color} size={22} />
                                  </View>
                                )}
                              </View>

                              <View style={styles.resContent}>
                                <View style={styles.tagHeaderRow}>
                                  <View
                                    style={[
                                      styles.tagPill,
                                      { backgroundColor: isDarkMode ? cfg.darkBg : cfg.bg },
                                    ]}
                                  >
                                    <Text style={[styles.tagPillText, { color: cfg.color }]}>
                                      {cfg.tag}
                                    </Text>
                                  </View>
                                  {item.rating ? (
                                    <View style={styles.ratingRow}>
                                      <Star color="#F59E0B" fill="#F59E0B" size={11} />
                                      <Text style={styles.ratingText}>{item.rating}</Text>
                                    </View>
                                  ) : null}
                                </View>

                                <Text
                                  style={[styles.resTitle, { color: theme.colors.textMain }]}
                                  numberOfLines={2}
                                >
                                  {item.plainTitle || item.title}
                                </Text>

                                <View style={styles.resBottomRow}>
                                  {item.price !== undefined ? (
                                    <Text style={[styles.resPrice, { color: theme.colors.primary }]}>
                                      {item.price === 0 ? 'FREE' : `₹${Number(item.price).toLocaleString('en-IN')}`}
                                    </Text>
                                  ) : (
                                    <Text style={[styles.resExploreText, { color: theme.colors.primary }]}>
                                      View Details
                                    </Text>
                                  )}

                                  <View style={styles.viewArrowWrap}>
                                    <ArrowRight color={theme.colors.textMuted} size={14} />
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                    </Animated.View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  clearInputBtn: {
    padding: 4,
    borderRadius: 10,
  },
  cancelBtn: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  cancelBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },

  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
  },

  mainScroll: {
    padding: 16,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
  },

  recentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: width * 0.75,
  },
  recentChipTextWrap: {
    marginRight: 4,
  },
  recentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentChipRemove: {
    padding: 4,
    borderRadius: 10,
  },

  trendingGrid: {
    gap: 8,
  },
  trendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  trendingRankBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  trendingRankText: {
    fontSize: 11,
    fontWeight: '800',
  },
  trendingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },

  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catCard: {
    width: (width - 42) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  catIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catLabel: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  categoryBlock: {
    marginBottom: 24,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  catCountBadge: {
    fontSize: 13,
    fontWeight: '600',
  },

  resCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  resThumb: {
    marginRight: 12,
  },
  resImg: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  bookletCover: {
    width: 68,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bookletSpine: {
    width: 6,
    height: '100%',
  },
  bookletInner: {
    flex: 1,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  bookletTitleSnippet: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  resIconBox: {
    width: 68,
    height: 68,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tagHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  resTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 6,
  },
  resBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  resExploreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  viewArrowWrap: {
    padding: 4,
  },
});

export default GlobalSearchModal;
