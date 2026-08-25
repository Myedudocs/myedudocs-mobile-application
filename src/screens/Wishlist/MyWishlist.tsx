import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { DirectorySkeleton } from '../../components/skeletons/DirectorySkeleton';
import { useAlert } from '../../context/AlertContext';
import {
  Heart,
  Search,
  Trash2,
  X,
  BookOpen,
  Video,
  FileQuestion,
  Zap,
  ArrowRight,
  FileText,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL, apiClient } from '../../service/api.service';
import { getImageUrl } from '../../utils/image.utils';
import { Header } from '../home/Header';
import { useTheme } from '../../context/ThemeContext';
import RatingBadge from '../../components/RatingBadge';
import { NotFound } from '../../components/NotFound';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// ─── Types ────────────────────────────────────────────────────────────────────

type WishlistType = 'book' | 'test_series' | 'course';
type FilterKey = 'all' | 'course' | 'book' | 'test_series';

interface WishlistItem {
  _id: string;
  item_type: WishlistType;
  item_id: string;
  snapshot: any;
  createdAt: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const TYPE_CONFIG: Record<WishlistType, { label: string; color: string; bg: string; darkBg: string; Icon: any }> = {
  course:      { label: 'COURSE',      color: '#6366F6', bg: '#EEF2FF', darkBg: 'rgba(99,102,241,0.15)', Icon: Video },
  book:        { label: 'BOOK',        color: '#10B981', bg: '#ECFDF5', darkBg: 'rgba(16,185,129,0.15)', Icon: BookOpen },
  test_series: { label: 'TEST SERIES', color: '#F59E0B', bg: '#FFFBEB', darkBg: 'rgba(245,158,11,0.15)', Icon: FileQuestion },
};

const FILTER_CONFIG = [
  { key: 'all' as FilterKey,         label: 'All Items', activeColor: '#6366F6', icon: Layers },
  { key: 'course' as FilterKey,      label: 'Courses',   activeColor: '#6366F6', icon: Video },
  { key: 'book' as FilterKey,        label: 'Books',     activeColor: '#10B981', icon: BookOpen },
  { key: 'test_series' as FilterKey, label: 'Tests',     activeColor: '#F59E0B', icon: FileQuestion },
];

// ─── 1. Test Series Wishlist Card ─────────────────────────────────────────────

const TestSeriesCard = ({
  item,
  removing,
  onRemove,
  onView,
  themeColors,
  isDark,
}: {
  item: WishlistItem;
  removing: string | null;
  onRemove: (item: WishlistItem) => void;
  onView: (item: WishlistItem) => void;
  themeColors: any;
  isDark: boolean;
}) => {
  const snap = item.snapshot || {};
  const title = snap.title || snap.name || 'Untitled Test Series';
  const exam = snap.code || snap.category || 'EXAM';
  const year = snap.year ? `${snap.year}/${snap.year + 1}` : '2024-25';

  return (
    <View style={[
      cardStyles.cardContainer,
      { 
        backgroundColor: themeColors.surface, 
        borderColor: themeColors.border,
      }
    ]}>
      {/* Top Header Row */}
      <View style={cardStyles.cardHeaderRow}>
        <View style={cardStyles.tagsGroup}>
          <View style={[cardStyles.examTagWrap, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
            <Text style={cardStyles.examTagText}>{exam}</Text>
          </View>
          <Text style={[cardStyles.yearTagText, { color: themeColors.textMuted }]}>{year}</Text>
        </View>

        <TouchableOpacity
          style={[cardStyles.removeIconBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2' }]}
          onPress={() => onRemove(item)}
          disabled={removing === item._id}
          activeOpacity={0.7}
        >
          {removing === item._id
            ? <ActivityIndicator size="small" color="#EF4444" />
            : <Trash2 color="#EF4444" size={15} strokeWidth={2.2} />}
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={[cardStyles.cardTitle, { color: themeColors.textMain }]} numberOfLines={2}>{title}</Text>
      
      {/* Rating */}
      <View style={{ marginBottom: 10 }}>
         <RatingBadge
            itemId={item.item_id}
            itemType="test_series"
            preloadedRating={Number(snap.rating || 0)}
            preloadedCount={Number(snap.ratingCount || 0)}
            size="sm"
         />
      </View>

      {/* Description */}
      <Text style={[cardStyles.cardDesc, { color: themeColors.textMuted }]} numberOfLines={2}>
        {snap.description || 'Comprehensive test series based on latest exam pattern & syllabus.'}
      </Text>

      {/* Action CTA */}
      <TouchableOpacity 
        style={[cardStyles.primaryCtaBtn, { backgroundColor: themeColors.primary }]} 
        onPress={() => onView(item)} 
        activeOpacity={0.85}
      >
        <Text style={cardStyles.primaryCtaText}>Explore Test Series</Text>
        <ArrowRight color="#FFFFFF" size={15} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

// ─── 2. Course / Book Wishlist Card ───────────────────────────────────────────

const CourseBookCard = ({
  item,
  removing,
  onRemove,
  onView,
  themeColors,
  isDark,
}: {
  item: WishlistItem;
  removing: string | null;
  onRemove: (item: WishlistItem) => void;
  onView: (item: WishlistItem) => void;
  themeColors: any;
  isDark: boolean;
}) => {
  const snap = item.snapshot || {};
  const cfg  = TYPE_CONFIG[item.item_type] || TYPE_CONFIG.course;

  const rawImg = 
    snap.coverImage || 
    snap.coverphoto || 
    snap.image || 
    snap.cover || 
    snap.thumbnail || 
    snap.imageUrl || 
    snap.book?.coverImage || 
    snap.book?.image || 
    snap.course?.coverphoto || 
    snap.course?.image || 
    '';
  const imgUri = getImageUrl(rawImg);
  const title     = snap.title || snap.name || snap.book?.title || 'Untitled';
  const rating    = Number(snap.rating || 0);
  const ratingCount = snap.ratingCount || snap.students || 0;
  const category  = snap.category || snap.language || cfg.label;
  const price     = snap.price || snap.digitalFinalPrice || snap.book?.price || 0;
  const origPrice = snap.originalPrice || snap.actual_price || snap.book?.originalPrice || 0;
  const discount  = snap.discount || snap.digitalDiscountPercentage || 0;

  const ImageEl = cfg.Icon;

  return (
    <View style={[cardStyles.cardContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={cardStyles.horizontalCardWrap}>
        {/* Cover / Thumbnail */}
        <View style={[cardStyles.thumbContainer, { backgroundColor: isDark ? cfg.darkBg : cfg.bg }]}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={cardStyles.thumbImage} resizeMode="cover" />
          ) : (
            <View style={cardStyles.thumbFallback}>
              <ImageEl color={cfg.color} size={28} strokeWidth={1.8} />
            </View>
          )}
          <View style={[cardStyles.thumbBadge, { backgroundColor: cfg.color }]}>
            <Text style={cardStyles.thumbBadgeText}>{cfg.label}</Text>
          </View>
        </View>

        {/* Content Details */}
        <View style={cardStyles.infoContainer}>
          <View style={cardStyles.infoTopRow}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={[cardStyles.categoryText, { color: cfg.color }]} numberOfLines={1}>
                {category.toUpperCase()}
              </Text>
              <Text style={[cardStyles.cardTitle, { color: themeColors.textMain, fontSize: 15, marginBottom: 4 }]} numberOfLines={2}>
                {title}
              </Text>
            </View>

            <TouchableOpacity
              style={[cardStyles.removeIconBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2' }]}
              onPress={() => onRemove(item)}
              disabled={removing === item._id}
              activeOpacity={0.7}
            >
              {removing === item._id
                ? <ActivityIndicator size="small" color="#EF4444" />
                : <Trash2 color="#EF4444" size={14} strokeWidth={2.2} />}
            </TouchableOpacity>
          </View>

          {/* Rating */}
          <View style={{ marginBottom: 8 }}>
            <RatingBadge
              itemId={item.item_id}
              itemType={item.item_type}
              preloadedRating={rating}
              preloadedCount={ratingCount}
              size="sm"
            />
          </View>

          {/* Price & CTA Row */}
          <View style={cardStyles.priceActionRow}>
            <View>
              {discount > 0 && (
                <View style={[cardStyles.discountPill, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2' }]}>
                  <Text style={cardStyles.discountPillText}>{Math.round(discount)}% OFF</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={[cardStyles.priceText, { color: themeColors.textMain }]}>
                  {price > 0 ? formatPrice(price) : 'FREE'}
                </Text>
                {origPrice > price && price > 0 && (
                  <Text style={[cardStyles.origPriceText, { color: themeColors.textLight }]}>{formatPrice(origPrice)}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[cardStyles.compactCtaBtn, { backgroundColor: cfg.color }]}
              onPress={() => onView(item)}
              activeOpacity={0.85}
            >
              <Text style={cardStyles.compactCtaText}>View</Text>
              <ArrowRight color="#FFFFFF" size={13} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const MyWishlist = () => {
  const navigation = useNavigation<any>();
  const { user }   = useAuth();
  const { showAlert } = useAlert();
  const { theme, isDarkMode } = useTheme();

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [wishlist,     setWishlist]     = useState<WishlistItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [removing,     setRemoving]     = useState<string | null>(null);

  // ── Fetch Wishlist ──
  useEffect(() => {
    const fetchMyWishlist = async () => {
      if (!user?.token) { setLoading(false); return; }
      try {
        setLoading(true);
        const json = await apiClient(`${BASE_URL}/wishlist/my`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        });
        if (json?.data?.items) setWishlist(json.data.items);
      } catch (err) {
        console.error('Failed to fetch wishlist:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyWishlist();
  }, [user]);

  // ── Remove Item ──
  const handleRemove = async (item: WishlistItem) => {
    if (!user?.token) return;
    try {
      setRemoving(item._id);
      const res = await fetch(`${BASE_URL}/wishlist/remove`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body:    JSON.stringify({ item_type: item.item_type, item_id: item.item_id }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setWishlist(prev => prev.filter(w => w._id !== item._id));
      } else {
        showAlert('Error', 'Could not remove item. Please try again.', [], 'error');
      }
    } catch {
      showAlert('Error', 'Network error. Could not remove item.', [], 'error');
    } finally {
      setRemoving(null);
    }
  };

  // ── View Details ──
  const handleView = (item: WishlistItem) => {
    if (item.item_type === 'course')      navigation.navigate('CourseDetails',     { id: item.item_id });
    else if (item.item_type === 'book')   navigation.navigate('BookDetails',       { id: item.item_id });
    else                                  navigation.navigate('TestSeriesDetails', { id: item.item_id });
  };

  // ── Filter & Search Logic ──
  const filteredItems = useMemo(() => {
    let result = wishlist;
    if (activeFilter !== 'all') result = result.filter(w => w.item_type === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const s = item.snapshot || {};
        return (
          (s.title   || '').toLowerCase().includes(q) ||
          (s.name    || '').toLowerCase().includes(q) ||
          (s.author  || '').toLowerCase().includes(q) ||
          (s.category|| '').toLowerCase().includes(q) ||
          (s.code    || '').toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [wishlist, activeFilter, searchQuery]);

  const counts = {
    all:         wishlist.length,
    course:      wishlist.filter(w => w.item_type === 'course').length,
    book:        wishlist.filter(w => w.item_type === 'book').length,
    test_series: wishlist.filter(w => w.item_type === 'test_series').length,
  };

  // ── Render Item Callback ──
  const renderWishlistItem = useCallback(({ item, index }: { item: WishlistItem; index: number }) => {
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 60).springify()}
        style={styles.cardWrapper}
      >
        {item.item_type === 'test_series' ? (
          <TestSeriesCard 
            item={item} 
            removing={removing} 
            onRemove={handleRemove} 
            onView={handleView} 
            themeColors={theme.colors}
            isDark={isDarkMode}
          />
        ) : (
          <CourseBookCard 
            item={item} 
            removing={removing} 
            onRemove={handleRemove} 
            onView={handleView} 
            themeColors={theme.colors}
            isDark={isDarkMode}
          />
        )}
      </Animated.View>
    );
  }, [removing, handleRemove, handleView, theme, isDarkMode]);

  return (
    <ScreenContainer
      header={{ title: 'My Wishlist', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
    >
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        renderItem={renderWishlistItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* ── 1. Hero Summary Card ── */}
            <View style={[styles.heroCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.heroTopRow}>
                <View style={[styles.heroIconBadge, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEF2F2' }]}>
                  <Heart color="#EF4444" fill="#EF4444" size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroTitle, { color: theme.colors.textMain }]}>Saved Collections</Text>
                  <Text style={[styles.heroSubtitle, { color: theme.colors.textMuted }]}>
                    {wishlist.length > 0
                      ? `${wishlist.length} item${wishlist.length > 1 ? 's' : ''} saved in your library`
                      : 'Keep track of items you want to learn'}
                  </Text>
                </View>
                {wishlist.length > 0 && (
                  <View style={[styles.totalCountBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.totalCountBadgeText}>{wishlist.length}</Text>
                  </View>
                )}
              </View>

              {/* Summary Stats Row */}
              {wishlist.length > 0 && (
                <View style={[styles.summaryPillsRow, { borderTopColor: theme.colors.border }]}>
                  <TouchableOpacity 
                    style={[styles.summaryPill, activeFilter === 'course' && { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}
                    onPress={() => setActiveFilter(activeFilter === 'course' ? 'all' : 'course')}
                    activeOpacity={0.7}
                  >
                    <Video color="#6366F6" size={14} strokeWidth={2.5} />
                    <Text style={[styles.summaryPillCount, { color: '#6366F6' }]}>{counts.course}</Text>
                    <Text style={[styles.summaryPillLabel, { color: theme.colors.textMuted }]}>Courses</Text>
                  </TouchableOpacity>

                  <View style={[styles.summaryPillDivider, { backgroundColor: theme.colors.border }]} />

                  <TouchableOpacity 
                    style={[styles.summaryPill, activeFilter === 'book' && { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.2)' : '#ECFDF5' }]}
                    onPress={() => setActiveFilter(activeFilter === 'book' ? 'all' : 'book')}
                    activeOpacity={0.7}
                  >
                    <BookOpen color="#10B981" size={14} strokeWidth={2.5} />
                    <Text style={[styles.summaryPillCount, { color: '#10B981' }]}>{counts.book}</Text>
                    <Text style={[styles.summaryPillLabel, { color: theme.colors.textMuted }]}>Books</Text>
                  </TouchableOpacity>

                  <View style={[styles.summaryPillDivider, { backgroundColor: theme.colors.border }]} />

                  <TouchableOpacity 
                    style={[styles.summaryPill, activeFilter === 'test_series' && { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.2)' : '#FFFBEB' }]}
                    onPress={() => setActiveFilter(activeFilter === 'test_series' ? 'all' : 'test_series')}
                    activeOpacity={0.7}
                  >
                    <FileQuestion color="#F59E0B" size={14} strokeWidth={2.5} />
                    <Text style={[styles.summaryPillCount, { color: '#F59E0B' }]}>{counts.test_series}</Text>
                    <Text style={[styles.summaryPillLabel, { color: theme.colors.textMuted }]}>Tests</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* ── 2. Search Bar ── */}
            {wishlist.length > 0 && (
              <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Search color={theme.colors.textLight} size={18} strokeWidth={2} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.textMain }]}
                  placeholder="Search saved courses, books, tests..."
                  placeholderTextColor={theme.colors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                    <X color={theme.colors.textMuted} size={15} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── 3. Filter Category Pills ── */}
            {wishlist.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {FILTER_CONFIG.map(f => {
                  const isActive = activeFilter === f.key;
                  const Icon = f.icon;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[
                        styles.filterChip,
                        { 
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border 
                        },
                        isActive && { 
                          backgroundColor: f.activeColor, 
                          borderColor: f.activeColor,
                          ...theme.shadows.light
                        },
                      ]}
                      onPress={() => setActiveFilter(f.key)}
                      activeOpacity={0.8}
                    >
                      <Icon color={isActive ? '#FFFFFF' : theme.colors.textMuted} size={14} strokeWidth={isActive ? 2.5 : 2} />
                      <Text style={[
                        styles.filterChipText, 
                        { color: theme.colors.textMuted },
                        isActive && { color: '#FFFFFF', fontWeight: '800' }
                      ]}>
                        {f.label} ({counts[f.key]})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {loading && (
              <View style={{ paddingTop: 16 }}>
                <DirectorySkeleton type="list" count={4} />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            wishlist.length === 0 ? (
              <NotFound 
                fullScreen={false}
                title="Your Wishlist is Empty"
                subtitle="Save tests, books, and courses you're interested in to easily access them later."
                icon={Heart}
                buttonText="Explore All Courses"
                onButtonPress={() => navigation.navigate('Courses')}
              />
            ) : (
              <View style={styles.emptySearchResult}>
                <Sparkles color={theme.colors.textLight} size={42} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptySearchTitle, { color: theme.colors.textMain }]}>No Items Match Your Search</Text>
                <Text style={[styles.emptySearchSub, { color: theme.colors.textMuted }]}>Try adjusting your search query or switching filters.</Text>
                <TouchableOpacity
                  style={[styles.clearFilterBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => { setSearchQuery(''); setActiveFilter('all'); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.clearFilterBtnText}>Reset Filters</Text>
                </TouchableOpacity>
              </View>
            )
          ) : null
        }
      />
    </ScreenContainer>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 110,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  // Hero Card
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  totalCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
  },
  summaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 10,
  },
  summaryPillCount: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryPillLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryPillDivider: {
    width: 1,
    height: 16,
  },

  // Search Box
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    fontWeight: '500',
  },
  clearSearchBtn: {
    padding: 4,
  },

  // Filters
  filterScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty State Search
  emptySearchResult: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 20,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySearchSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  clearFilterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

// Card Styles
const cardStyles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  // Test Series Card
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  examTagWrap: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  examTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F6',
    textTransform: 'uppercase',
  },
  yearTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  removeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Course / Book Horizontal Layout
  horizontalCardWrap: {
    flexDirection: 'row',
    gap: 14,
  },
  thumbContainer: {
    width: 86,
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  thumbBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  infoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  discountPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  discountPillText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
  },
  origPriceText: {
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  compactCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  compactCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});