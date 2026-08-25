import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Modal, 
  TextInput, 
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions,
  DeviceEventEmitter
} from 'react-native';
import { 
  ChevronRight,
  Sun,
  Moon,
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
  ShoppingCart
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import debounce from 'lodash/debounce';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../service/api.service';
import { getImageUrl } from '../../utils/image.utils';
import { NotFound } from '../../components/NotFound';

const { width } = Dimensions.get('window');

const STORAGE_KEY_RECENT = 'myedudocs_recent_searches';

// Category Configuration
const CAT_CONFIG: any = {
  course: { label: 'Courses', icon: GraduationCap, color: '#10B981', bg: '#ECFDF5' },
  book: { label: 'Books', icon: BookOpen, color: '#F59E0B', bg: '#FFFBEB' },
  'test-series': { label: 'Test Series', icon: FileText, color: '#EC4899', bg: '#FDF2F8' },
  job: { label: 'Jobs', icon: Briefcase, color: '#F59E0B', bg: '#FFFBEB' },
  pyq: { label: 'PYQs', icon: FileText, color: '#F59E0B', bg: '#FFFBEB' },
  syllabus: { label: 'Syllabus', icon: Layout, color: '#10B981', bg: '#ECFDF5' },
  blog: { label: 'Blogs', icon: Star, color: '#06B6D4', bg: '#ECFEFF' },
  teacher: { label: 'Teachers', icon: User, color: '#8B5CF6', bg: '#F5F3FF' },
  'current-affairs': { label: 'Current Affairs', icon: Star, color: '#3B82F6', bg: '#EFF6FF' },
};

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export const Header = React.memo(() => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  // --- SEARCH STATES ---
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({}); // Changed to object for safer property access
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // --- DYNAMIC AVATAR ---
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Student')}&background=6366F6&color=fff`;


  const profileImgUri = getImageUrl(user?.profile_image) || defaultAvatar;

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
    const subscription = DeviceEventEmitter.addListener("openGlobalSearch", () => {
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
    } catch (err) { console.error("Error loading recent searches:", err); }
  };

  const saveRecentSearch = async (val: string) => {
    if (!val || typeof val !== 'string' || !val.trim()) return;
    const updated = [val, ...recentSearches.filter(s => s !== val)].slice(0, 10);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
    } catch (err) { console.error("Error saving search:", err); }
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
      console.error("Trending fetch error:", err); 
      setTrendingSearches([]);
    } finally { 
      setTrendingLoading(false); 
    }
  };

  // --- SEARCH LOGIC ---
  const fetchResults = async (val: string) => {
    if (!val || !val.trim()) {
      setResults({});
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/search/global?q=${encodeURIComponent(val)}&limit=20`);
      const data = await res.json();
      if (data?.success && data?.data?.grouped) {
        setResults(data.data.grouped);
      } else {
        setResults({});
      }
    } catch (err) {
      console.error("Global search error:", err);
      setResults({});
    } finally {
      setLoading(false);
    }
  };

  // ROBUST DEBOUNCE: Use useRef to keep the debounced function stable & avoid stale closures
  const debouncedSearchRef = useRef<any>(null);

  useEffect(() => {
    debouncedSearchRef.current = debounce((text: string) => {
      fetchResults(text);
    }, 400);

    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, []); // Only create once

  const handleSearchChange = (text: string) => {
    setQuery(text);
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(text);
    }
  };

  const navigateToResult = (key: string, id: string, title: string) => {
    saveRecentSearch(title);
    setSearchVisible(false);
    setQuery("");
    setResults({});

    const routeMap: any = {
      course: 'CourseDetails',
      book: 'BookDetails',
      pyq: 'PreviousPapers',
      syllabus: 'Syllabus',
      'test-series': 'TestSeriesDetails',
      blog: 'BlogDetails',
      job: 'JobDetails',
      'current-affairs': 'CurrentAffairsDetails',
      teacher: 'Profile', // Fallback to Profile or a dedicated screen if available
      examination: 'AllTestSeries'
    };

    if (routeMap[key]) {
      navigation.navigate(routeMap[key], { id });
    }
  };

  const handleRecentClick = (text: string) => {
    setQuery(text);
    fetchResults(text);
  };

  // --- RENDER HELPERS ---
  const filteredKeys = useMemo(() => {
    if (!results || typeof results !== 'object') return [];
    const keys = Object.keys(results).filter(k => Array.isArray(results[k]) && results[k].length > 0);
    if (selectedType === 'all') return keys;
    return keys.filter(k => k === selectedType);
  }, [results, selectedType]);

  const activeTypes = useMemo(() => {
    if (!results || typeof results !== 'object') return [];
    return Object.keys(results).filter(k => Array.isArray(results[k]) && results[k].length > 0);
  }, [results]);

  const topPadding = insets.top + 4;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
          borderBottomColor: isDarkMode ? '#1E293B' : staticTheme.colors.border,
        },
      ]}
    >
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../../assets/images/EduDocsNewLogo.png')} 
          style={styles.headerLogo} 
          resizeMode="contain" 
        />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.searchBtn, { backgroundColor: isDarkMode ? theme.colors.surface : '#F5F5FF' }]} 
          activeOpacity={0.7}
          onPress={toggleTheme}
        >
          {isDarkMode ? (
            <Sun color={theme.colors.primary} size={20} strokeWidth={2.5} />
          ) : (
            <Moon color={theme.colors.primary} size={20} strokeWidth={2.5} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.searchBtn, { backgroundColor: isDarkMode ? theme.colors.surface : '#F5F5FF' }]} 
          activeOpacity={0.7}
          onPress={() => setSearchVisible(true)}
        >
          <Search color={theme.colors.primary} size={20} strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.searchBtn, { backgroundColor: isDarkMode ? theme.colors.surface : '#F5F5FF' }]} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Cart')}
        >
          <ShoppingCart color={theme.colors.primary} size={20} strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Profile')}
        >
          <Image 
            source={{ uri: profileImgUri }} 
            style={styles.avatar} 
          />
        </TouchableOpacity>
      </View>

      <Modal 
        visible={searchVisible} 
        animationType="slide" 
        transparent={false}
        onRequestClose={() => setSearchVisible(false)}
      >
        <SafeAreaView style={[styles.modalBg, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.searchHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? theme.colors.surface : '#F8FAFC' }]}>
              <Search color={theme.colors.textLight} size={18} />
              <TextInput
                style={[styles.textInput, { color: theme.colors.textMain }]}
                placeholder="Search courses, exams, books..."
                placeholderTextColor={theme.colors.textLight}
                autoFocus
                value={query}
                onChangeText={handleSearchChange}
                onSubmitEditing={() => saveRecentSearch(query)}
              />
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                query.length > 0 ? (
                  <TouchableOpacity onPress={() => {setQuery(""); setResults({});}}>
                    <X color={theme.colors.textLight} size={18} />
                  </TouchableOpacity>
                ) : null
              )}
            </View>
            <TouchableOpacity onPress={() => setSearchVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {(activeTypes.length > 0 || query.length > 0) && (
            <View style={styles.filterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                <TouchableOpacity 
                  onPress={() => setSelectedType('all')} 
                  style={[styles.filterPill, selectedType === 'all' && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, selectedType === 'all' && styles.filterPillTextActive]}>All Results</Text>
                </TouchableOpacity>
                {activeTypes.map(type => (
                  <TouchableOpacity 
                    key={type}
                    onPress={() => setSelectedType(type)} 
                  style={[styles.filterPill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, selectedType === type && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, { color: theme.colors.textMuted }, selectedType === type && styles.filterPillTextActive]}>
                      {CAT_CONFIG[type]?.label || type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.mainScroll}
            keyboardShouldPersistTaps="handled"
          >
            {query.length === 0 ? (
              <View>
                {Array.isArray(recentSearches) && recentSearches.length > 0 ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
                      <TouchableOpacity onPress={clearRecentSearches}>
                        <Text style={styles.clearText}>Clear all</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.recentGrid}>
                      {recentSearches.map((s, i) => (
                        <TouchableOpacity key={i} style={[styles.recentItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => handleRecentClick(s)}>
                          <History
                           color={theme.colors.textMuted} size={14} />
                          <Text style={[styles.recentText, { color: theme.colors.textMain }]}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={[styles.section, { marginTop: 10 }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>TRENDING NOW</Text>
                    {trendingLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
                  </View>
                  <View style={styles.trendingGrid}>
                    {Array.isArray(trendingSearches) && trendingSearches.map((t, i) => (
                      <TouchableOpacity key={i} style={styles.trendingCard} onPress={() => handleRecentClick(t.title)}>
                        <View style={styles.trendingIconBox}>
                           <TrendingUp color={theme.colors.primary} size={14} />
                        </View>
                        <Text style={styles.trendingText} numberOfLines={1}>{t.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>BROWSE CATEGORIES</Text>
                  <View style={styles.catGrid}>
                    {Object.entries(CAT_CONFIG).slice(0, 4).map(([key, cfg]: any) => (
                      <TouchableOpacity key={key} style={styles.catCard}>
                        <View style={[styles.catIconWrap, { backgroundColor: isDarkMode ? theme.colors.surface : cfg.bg }]}>
                          <cfg.icon color={cfg.color} size={20} />
                        </View>
                        <Text style={[styles.catLabel, { color: theme.colors.textMuted }]}>{cfg.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {query.length > 0 && (
              <View>
                {filteredKeys.length === 0 && !loading ? (
                   <NotFound 
                      fullScreen={false}
                      type="search"
                      title="No results found"
                      subtitle={`We couldn't find anything matching "${query}"`}
                      buttonText="Clear Search"
                      onButtonPress={() => { setQuery(""); setResults({}); }}
                   />
                ) : (
                  filteredKeys.map(key => (
                    <View key={key} style={styles.categoryBlock}>
                      <Text style={styles.categoryHeading}>{CAT_CONFIG[key]?.label || key.toUpperCase()}</Text>
                      {Array.isArray(results[key]) && results[key].map((item: any) => {
                        const thumb = getImageUrl(item.thumbnail);
                        return (
                          <TouchableOpacity 
                            key={item._id} 
                            style={styles.resCard}
                            onPress={() => navigateToResult(key, item._id, item.plainTitle || item.title)}
                          >
                            <View style={styles.resThumb}>
                               {thumb ? (
                                 <Image source={{ uri: thumb }} style={styles.resImg} />
                               ) : (
                                 <View style={[styles.resIconBox, { backgroundColor: CAT_CONFIG[key]?.bg || '#F1F5F9' }]}>
                                   {React.createElement(CAT_CONFIG[key]?.icon || Layers, { 
                                     color: CAT_CONFIG[key]?.color || '#64748B', 
                                     size: 20 
                                   })}
                                 </View>
                               )}
                            </View>
                            <View style={styles.resContent}>
                              <Text style={styles.resTitle} numberOfLines={2}>
                                {item.plainTitle || item.title}
                              </Text>
                              <View style={styles.resMeta}>
                                {item.price !== undefined && (
                                  <Text style={styles.resPrice}>
                                    {item.price === 0 ? 'FREE' : `₹${item.price}`}
                                  </Text>
                                )}
                                {item.rating ? (
                                  <View style={styles.ratingRow}>
                                    <Star color="#F59E0B" fill="#F59E0B" size={12} />
                                    <Text style={styles.ratingText}>{item.rating}</Text>
                                  </View>
                                ) : null}
                                {item.typeLabel ? <Text style={styles.resTag}>{item.typeLabel}</Text> : null}
                              </View>
                            </View>
                            <ChevronRight color="#CBD5E1" size={18} />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logoContainer: { flexDirection: 'column', justifyContent: 'center' },
  headerLogo: { width: 120, height: 32, borderRadius: 9 },
  
  actionsContainer: { flexDirection: 'row', alignItems: 'center' },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E2E8F0' },

  modalBg: { flex: 1 },
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
    backgroundColor: '#F8FAFC', 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    height: 46 
  },
  textInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0F172A', fontWeight: '500' },
  closeBtn: { marginLeft: 12 },
  closeBtnText: { color: staticTheme.colors.primary, fontWeight: '700', fontSize: 15 },
  
  filterBar: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  filterScroll: { paddingHorizontal: 16 },
  filterPill: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#F1F5F9', 
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  filterPillActive: { backgroundColor: staticTheme.colors.primary, borderColor: staticTheme.colors.primary },
  filterPillText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  filterPillTextActive: { color: '#FFFFFF' },

  mainScroll: { padding: 16 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  clearText: { fontSize: 12, fontWeight: '600', color: staticTheme.colors.primary },
  
  recentGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  recentItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    marginRight: 8, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  recentText: { marginLeft: 6, fontSize: 13, color: '#334155', fontWeight: '500' },
  
  trendingGrid: { flexDirection: 'column' },
  trendingCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F8FAFC' 
  },
  trendingIconBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFEFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  trendingText: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  
  catGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  catCard: { alignItems: 'center', width: (width - 64) / 4 },
  catIconWrap: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  catLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  categoryBlock: { marginBottom: 24 },
  categoryHeading: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  resCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resThumb: { marginRight: 12 },
  resImg: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#F8FAFC' },
  resIconBox: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  resContent: { flex: 1 },
  resTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  resMeta: { flexDirection: 'row', alignItems: 'center' },
  resPrice: { fontSize: 13, fontWeight: '800', color: staticTheme.colors.primary, marginRight: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#F59E0B', marginLeft: 3 },
  resTag: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  emptyResults: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});

