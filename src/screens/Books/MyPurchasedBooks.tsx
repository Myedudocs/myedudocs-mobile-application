import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  Book as BookIcon,
  CheckCircle2,
  FileText,
  Truck,
  Layers,
  X,
  BookOpen,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Star,
  Download,
  AlertTriangle,
  Heart,
  Package,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BookSkeleton } from '../../components/skeletons/BookSkeleton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { getImageUrl } from '../../utils/image.utils';
import { OrderTrackerModal } from './OrderTrackerModal';

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

export interface PurchasedBook {
  purchaseId: string;
  bookId: string;
  book: {
    title: string;
    category: string;
    coverImage: string;
    author: string;
    pages: number;
    pdfFile: string;
    rating: number;
    reviews: number;
  };
  purchaseType: 'book' | 'ebook';
  deliveryStatus?: string;
  deliveryDetails?: {
    status?: string;
    courier?: string;
    tracking_id?: string;
    packed_at?: string;
    shipped_at?: string;
    delivered_at?: string;
    address?: any;
  };
  readingProgress: number;
  purchaseDate?: string;
}

export interface BookStats {
  totalBooks: number;
  ebooks: number;
  physicalBooks: number;
  favoriteBooks?: number;
  totalSpent?: number;
}

export const MyPurchasedBooks: React.FC<{ hideHeader?: boolean; hideBottomNav?: boolean }> = ({
  hideHeader = false,
  hideBottomNav = false,
}) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();

  const [books, setBooks] = useState<PurchasedBook[]>([]);
  const [stats, setStats] = useState<BookStats>({
    totalBooks: 0,
    ebooks: 0,
    physicalBooks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'ebook' | 'book'>('all');

  // Modals
  const [trackerFor, setTrackerFor] = useState<PurchasedBook | null>(null);
  const [selectedBook, setSelectedBook] = useState<PurchasedBook | null>(null);
  const [readingModalVisible, setReadingModalVisible] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (!user?.id && !user?._id) return;
    const uid = user.id || user._id;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams({ limit: '50' });
      if (selectedFormat !== 'all') params.append('format', selectedFormat);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(
        `${BASE_URL}/student/books/purchase/my-books/${uid}?${params}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setBooks(data.books || []);
        setStats(data.stats || {
          totalBooks: data.books?.length || 0,
          ebooks: (data.books || []).filter((b: any) => b.purchaseType === 'ebook').length,
          physicalBooks: (data.books || []).filter((b: any) => b.purchaseType === 'book').length,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, searchQuery, selectedFormat]);

  // Physical orders for live quick tracking
  const physicalOrders = useMemo(() => {
    return books.filter((b) => b.purchaseType === 'book');
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (selectedFormat !== 'all' && b.purchaseType !== selectedFormat) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const title = (b.book?.title || '').toLowerCase();
        const author = (b.book?.author || '').toLowerCase();
        return title.includes(q) || author.includes(q);
      }
      return true;
    });
  }, [books, selectedFormat, searchQuery]);

  const handleBookClick = (b: PurchasedBook) => {
    if (b.purchaseType === 'ebook') {
      setSelectedBook(b);
      setReadingModalVisible(true);
    } else {
      setTrackerFor(b);
    }
  };

  const getStatusInfo = (status?: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s.includes('deliver')) return { label: 'DELIVERED', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
    if (s.includes('out')) return { label: 'OUT FOR DELIVERY', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    if (s.includes('ship') || s.includes('transit')) return { label: 'SHIPPED', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
    if (s.includes('pack')) return { label: 'PACKED', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)' };
    return { label: 'CONFIRMED', color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)' };
  };

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
      {!hideHeader && (
        <GlobalSafeHeader
          title="My Library"
          subtitle="Your purchased eBooks & hardcopy deliveries"
          showBack
          showMenu
          showSearch
          showThemeToggle
          showNotifications
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Top 3 Interactive Metrics */}
        <View style={styles.metricsRow}>
          {[
            {
              id: 'all',
              label: 'Total Books',
              count: stats.totalBooks,
              icon: Layers,
              color: '#6366F1',
              active: selectedFormat === 'all',
            },
            {
              id: 'ebook',
              label: 'Digital eBooks',
              count: stats.ebooks,
              icon: FileText,
              color: '#10B981',
              active: selectedFormat === 'ebook',
            },
            {
              id: 'book',
              label: 'Physical Orders',
              count: stats.physicalBooks,
              icon: Truck,
              color: '#F59E0B',
              active: selectedFormat === 'book',
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.85}
                onPress={() => setSelectedFormat(m.id as any)}
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: m.active
                      ? isDarkMode
                        ? '#1E293B'
                        : '#FFFFFF'
                      : theme.colors.surface,
                    borderColor: m.active ? m.color : theme.colors.border,
                    borderWidth: m.active ? 1.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: hexToRgba(m.color, 0.12) },
                  ]}
                >
                  <Icon size={18} color={m.color} />
                </View>
                <Text style={[styles.metricCount, { color: theme.colors.textMain }]}>
                  {m.count}
                </Text>
                <Text
                  style={[
                    styles.metricLabel,
                    { color: m.active ? m.color : theme.colors.textMuted },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* --- PHYSICAL ORDERS QUICK TRACKING SECTION (Matching Web v2) --- */}
        {physicalOrders.length > 0 && selectedFormat !== 'ebook' && (
          <View
            style={[
              styles.trackingHubCard,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : '#E0E7FF',
              },
            ]}
          >
            <View style={styles.trackingHubHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Truck size={17} color="#6366F1" />
                  <Text style={[styles.trackingHubTitle, { color: theme.colors.textMain }]}>
                    Track Physical Orders ({physicalOrders.length})
                  </Text>
                </View>
                <Text style={[styles.trackingHubSub, { color: theme.colors.textMuted }]}>
                  Live courier dispatch & parcel timeline
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setTrackerFor(physicalOrders[0])}
                activeOpacity={0.8}
                style={[styles.trackLatestBtn, { borderColor: theme.colors.primary }]}
              >
                <Text style={[styles.trackLatestText, { color: theme.colors.primary }]}>
                  Latest Order
                </Text>
              </TouchableOpacity>
            </View>

            {/* List of physical orders for tracking */}
            {physicalOrders.map((order) => {
              const statusInfo = getStatusInfo(order.deliveryDetails?.status || order.deliveryStatus);
              const courier = order.deliveryDetails?.courier || 'Express Shipment';
              const awb = order.deliveryDetails?.tracking_id || `OD-${(order.purchaseId || '12345678').slice(-8).toUpperCase()}`;

              return (
                <View
                  key={order.purchaseId}
                  style={[
                    styles.shipmentRowCard,
                    {
                      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: getImageUrl(order.book?.coverImage) }}
                    style={styles.shipmentCover}
                  />

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[styles.shipmentTitle, { color: theme.colors.textMain }]}
                      numberOfLines={1}
                    >
                      {order.book?.title}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <View style={[styles.statusPill, { backgroundColor: statusInfo.bg }]}>
                        <Text style={[styles.statusPillText, { color: statusInfo.color }]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[styles.courierText, { color: theme.colors.textLight }]}
                      numberOfLines={1}
                    >
                      {courier} · AWB: {awb}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setTrackerFor(order)}
                    activeOpacity={0.85}
                    style={styles.trackActionBtn}
                  >
                    <Text style={styles.trackActionBtnText}>Track</Text>
                    <ChevronRight size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Search & Format Filter Chips */}
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
              placeholder="Search by book title or author..."
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

          {/* Segmented Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {[
              { id: 'all', label: `All Books (${books.length})` },
              { id: 'ebook', label: `📖 Digital eBooks (${stats.ebooks})` },
              { id: 'book', label: `📦 Physical Copies (${stats.physicalBooks})` },
            ].map((f) => {
              const isSelected = selectedFormat === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setSelectedFormat(f.id as any)}
                  style={[
                    styles.formatChip,
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
                      styles.formatChipText,
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
        </View>

        {/* --- BOOKS LIST --- */}
        {loading ? (
          <View style={styles.booksGrid}>
            <BookSkeleton />
            <BookSkeleton />
          </View>
        ) : filteredBooks.length === 0 ? (
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
                { backgroundColor: hexToRgba(theme.colors.primary, 0.12) },
              ]}
            >
              <BookIcon size={36} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>
              {books.length === 0
                ? 'Your library is empty'
                : 'No matching books found'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              {books.length === 0
                ? 'Explore our comprehensive collection of UPSC, BPSC & Civil Services study materials.'
                : 'Try adjusting your search query or filter.'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs', { screen: 'BooksTab' })}
              activeOpacity={0.85}
              style={[styles.emptyBtn, { backgroundColor: theme.colors.primary }]}
            >
              <BookOpen size={15} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Explore Books Store</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.booksGrid}>
            {filteredBooks.map((item, index) => {
              const isEbook = item.purchaseType === 'ebook';
              const statusInfo = getStatusInfo(item.deliveryDetails?.status || item.deliveryStatus);

              return (
                <Animated.View
                  key={item.purchaseId}
                  entering={FadeInDown.delay(index * 60).springify()}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleBookClick(item)}
                    style={[
                      styles.bookCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    {/* Cover Thumbnail */}
                    <Image
                      source={{ uri: getImageUrl(item.book?.coverImage) }}
                      style={styles.bookCover}
                    />

                    {/* Book Info */}
                    <View style={styles.bookDetails}>
                      <View>
                        <View style={styles.cardHeaderRow}>
                          <View
                            style={[
                              styles.formatBadge,
                              {
                                backgroundColor: isEbook
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : 'rgba(99, 102, 241, 0.12)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.formatBadgeText,
                                { color: isEbook ? '#10B981' : '#6366F1' },
                              ]}
                            >
                              {isEbook ? '📖 EBOOK' : '📦 HARDCOPY'}
                            </Text>
                          </View>

                          {item.readingProgress === 100 && (
                            <View style={styles.completedPill}>
                              <CheckCircle2 size={12} color="#10B981" />
                              <Text style={styles.completedText}>Completed</Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={[styles.bookTitle, { color: theme.colors.textMain }]}
                          numberOfLines={2}
                        >
                          {item.book?.title}
                        </Text>
                        <Text
                          style={[styles.bookAuthor, { color: theme.colors.textMuted }]}
                          numberOfLines={1}
                        >
                          By {item.book?.author || 'MyEduDocs Editorial Team'}
                        </Text>
                      </View>

                      {/* Footer: Action button or progress */}
                      <View style={{ marginTop: 10 }}>
                        {isEbook ? (
                          <View>
                            <View style={styles.progressRow}>
                              <Text style={[styles.progressLabel, { color: theme.colors.textLight }]}>
                                Reading Progress
                              </Text>
                              <Text style={[styles.progressPct, { color: theme.colors.primary }]}>
                                {item.readingProgress || 0}%
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.progressBarTrack,
                                { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' },
                              ]}
                            >
                              <View
                                style={[
                                  styles.progressBarFill,
                                  {
                                    backgroundColor: theme.colors.primary,
                                    width: `${Math.max(4, item.readingProgress || 0)}%`,
                                  },
                                ]}
                              />
                            </View>

                            <TouchableOpacity
                              onPress={() => handleBookClick(item)}
                              activeOpacity={0.85}
                              style={[styles.readBtn, { backgroundColor: theme.colors.primary }]}
                            >
                              <BookOpen size={14} color="#FFFFFF" />
                              <Text style={styles.readBtnText}>Read Online</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View>
                            <View style={styles.deliveryStatusRow}>
                              <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                              <Text style={[styles.deliveryStatusText, { color: statusInfo.color }]}>
                                {statusInfo.label}
                              </Text>
                            </View>

                            <TouchableOpacity
                              onPress={() => setTrackerFor(item)}
                              activeOpacity={0.85}
                              style={[
                                styles.trackDeliveryBtn,
                                {
                                  backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF',
                                  borderColor: hexToRgba('#6366F1', 0.25),
                                },
                              ]}
                            >
                              <Truck size={14} color="#6366F1" />
                              <Text style={styles.trackDeliveryBtnText}>Track Shipment</Text>
                              <ChevronRight size={13} color="#6366F1" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* --- DELIVERY TRACKER MODAL --- */}
      <OrderTrackerModal
        visible={!!trackerFor}
        onClose={() => setTrackerFor(null)}
        order={trackerFor}
      />

      {/* --- READING MODAL --- */}
      <Modal visible={readingModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={[styles.dragIndicator, { backgroundColor: theme.colors.border }]} />
            <TouchableOpacity onPress={() => setReadingModalVisible(false)} style={styles.modalCloseBtn}>
              <X color={theme.colors.textMain} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalImageWrapper}>
              <Image source={{ uri: getImageUrl(selectedBook?.book?.coverImage) }} style={styles.modalCover} />
            </View>

            <Text style={[styles.modalTitle, { color: theme.colors.textMain }]}>{selectedBook?.book?.title}</Text>
            <Text style={[styles.modalAuthor, { color: theme.colors.textMuted }]}>Written by {selectedBook?.book?.author}</Text>

            <View style={[styles.modalStatsRow, { backgroundColor: theme.colors.background }]}>
              <View style={styles.mStat}>
                <Text style={[styles.mStatVal, { color: theme.colors.textMain }]}>{selectedBook?.book?.pages || 0}</Text>
                <Text style={[styles.mStatLab, { color: theme.colors.textLight }]}>Pages</Text>
              </View>
              <View style={[styles.mStatDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.mStat}>
                <Text style={[styles.mStatVal, { color: theme.colors.textMain }]}>{selectedBook?.readingProgress || 0}%</Text>
                <Text style={[styles.mStatLab, { color: theme.colors.textLight }]}>Read</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.fullReadBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                setReadingModalVisible(false);
                navigation.navigate('PdfViewer', {
                  url: `${BASE_URL.replace('/api/v1', '')}${selectedBook?.book?.pdfFile}`,
                  title: selectedBook?.book?.title,
                });
              }}
            >
              <BookOpen color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.fullReadBtnText}>Open Secure Reader</Text>
            </TouchableOpacity>

            <View style={[styles.drmProtectionBox, { backgroundColor: theme.colors.background }]}>
              <ShieldCheck color="#10B981" size={18} />
              <Text style={[styles.drmBoxText, { color: theme.colors.textMuted }]}>
                Protected by MyEduDocs Secure Digital Rights Management (DRM).
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  scrollBody: { padding: 16, paddingBottom: 32 },

  /* Top 3 Interactive Metrics */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricCount: {
    fontSize: 16,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },

  /* Physical Orders Quick Tracking Banner */
  trackingHubCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  trackingHubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingHubTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  trackingHubSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  trackLatestBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  trackLatestText: {
    fontSize: 11,
    fontWeight: '800',
  },

  shipmentRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
  },
  shipmentCover: {
    width: 38,
    height: 52,
    borderRadius: 6,
  },
  shipmentTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  courierText: {
    fontSize: 11,
    marginTop: 2,
  },
  trackActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  trackActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  /* Search & Format Filter */
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
  chipRow: {
    flexDirection: 'row',
  },
  formatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  formatChipText: {
    fontSize: 11.5,
  },

  /* Books Grid */
  booksGrid: {
    gap: 12,
  },
  bookCard: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bookCover: {
    width: 80,
    height: 112,
    borderRadius: 10,
  },
  bookDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  formatBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  formatBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  completedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 11.5,
    marginTop: 2,
  },

  /* eBook Progress & Actions */
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10.5,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
  },
  readBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  /* Physical Delivery */
  deliveryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deliveryStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  trackDeliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  trackDeliveryBtnText: {
    color: '#6366F1',
    fontSize: 11.5,
    fontWeight: '800',
  },

  /* Empty State */
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
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
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* Modal */
  modalRoot: { flex: 1, paddingTop: 12 },
  modalHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  dragIndicator: { width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  modalCloseBtn: { position: 'absolute', right: 16, top: 8 },
  modalContent: { padding: 20, alignItems: 'center' },
  modalImageWrapper: {
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    marginBottom: 16,
  },
  modalCover: { width: 130, height: 185, borderRadius: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  modalAuthor: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  modalStatsRow: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  mStat: { alignItems: 'center' },
  mStatVal: { fontSize: 16, fontWeight: '800' },
  mStatLab: { fontSize: 11, marginTop: 2 },
  mStatDivider: { width: 1, height: '80%' },
  fullReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    width: '100%',
    marginBottom: 14,
  },
  fullReadBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  drmProtectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    width: '100%',
  },
  drmBoxText: { flex: 1, fontSize: 11, lineHeight: 15 },
});

export default MyPurchasedBooks;