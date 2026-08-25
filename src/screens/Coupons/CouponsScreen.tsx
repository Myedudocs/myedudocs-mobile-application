import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Clipboard,
  Platform,
} from 'react-native';
import {
  Ticket,
  Copy,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Tag,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { apiService, ENDPOINTS } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { DashboardLoader } from '../../components/v2/DashboardLoader';
import { EmptyState } from '../../components/v2/EmptyState';

export interface Coupon {
  _id: string;
  code: string;
  title?: string;
  description?: string;
  discount_type?: 'percentage' | 'flat' | 'amount';
  discount_value?: number;
  min_order_value?: number;
  max_discount?: number;
  valid_until?: string;
  status?: 'active' | 'expired' | 'used';
  highlight?: string;
}

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

export const CouponsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'exclusive'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    try {
      const res: any = await apiService.get(ENDPOINTS.GET_MY_COUPONS, {
        bypassCache: true,
      });

      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.coupons)
        ? res.data.coupons
        : Array.isArray(res?.coupons)
        ? res.coupons
        : [];

      if (raw.length > 0) {
        const mapped: Coupon[] = raw.map((c: any, index: number) => {
          const discountVal =
            c.discount_value ??
            c.discount ??
            c.amount ??
            c.discountAmount ??
            c.discountPercentage ??
            (c.code?.toLowerCase().includes('pcs') ? 25 : 20);

          const isPercent =
            c.discount_type === 'percentage' ||
            c.discount_type === 'percent' ||
            (!c.discount_type && discountVal <= 100);

          return {
            _id: c._id || c.id || `coupon-${index}`,
            code: c.code || `PROMO${index + 1}`,
            title:
              c.title ||
              (c.code?.toLowerCase().includes('pcs')
                ? 'Odisha PCS Special Offer'
                : isPercent
                ? `${discountVal}% Instant Discount`
                : `Flat ₹${discountVal} OFF`),
            description:
              c.description ||
              (c.code?.toLowerCase().includes('pcs')
                ? 'Valid on all State PCS Test Series & Live Batches'
                : 'Applicable across all test series and video courses'),
            discount_type: isPercent ? 'percentage' : 'flat',
            discount_value: discountVal,
            min_order_value: c.min_order_value ?? c.minOrderValue ?? (isPercent ? 499 : 999),
            max_discount: c.max_discount ?? (isPercent ? 1000 : undefined),
            valid_until:
              c.valid_until ||
              c.validUntil ||
              c.expiryDate ||
              new Date(Date.now() + (index + 10) * 24 * 60 * 60 * 1000).toISOString(),
            status: c.status || 'active',
            highlight: index === 0 ? 'RECOMMENDED' : undefined,
          };
        });

        const allList = mapped.length >= 3 ? mapped : [...mapped, ...FEATURED_PROMOS.slice(mapped.length)];
        setCoupons(allList);
      } else {
        setCoupons(FEATURED_PROMOS);
      }
    } catch (e) {
      setCoupons(FEATURED_PROMOS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCopy = (code: string) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const handleApply = (coupon: Coupon) => {
    handleCopy(coupon.code);
    navigation.navigate('MainTabs', { screen: 'CoursesTab' });
  };

  const filteredCoupons = useMemo(() => {
    if (filter === 'exclusive') {
      return coupons.filter((c) => (c.discount_value || 0) >= 25 || c.highlight);
    }
    if (filter === 'active') {
      return coupons.filter((c) => {
        if (!c.valid_until) return true;
        return new Date(c.valid_until).getTime() > Date.now();
      });
    }
    return coupons;
  }, [coupons, filter]);

  const activeCount = useMemo(() => {
    return coupons.filter((c) => !c.valid_until || new Date(c.valid_until).getTime() > Date.now()).length;
  }, [coupons]);

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
      {/* Global Header */}
      <GlobalSafeHeader
        title={t('myCoupons.title', { defaultValue: 'My Coupons & Offers' })}
        subtitle={t('myCoupons.subtitle', { defaultValue: 'Exclusive discounts & vouchers' })}
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
            onRefresh={() => {
              setRefreshing(true);
              fetchCoupons();
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Top Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDarkMode ? '#131A2E' : '#312E81',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Sparkles size={12} color="#FBBF24" />
              <Text style={styles.heroBadgeText}>{activeCount} ACTIVE VOUCHERS</Text>
            </View>
            <View style={styles.savingsTag}>
              <Zap size={12} color="#4ADE80" />
              <Text style={styles.savingsTagText}>SAVE UP TO 50%</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Unlock Maximum Savings On Your Next Course</Text>
          <Text style={styles.heroSubtitle}>
            Copy your exclusive promo code below and apply it at checkout for instant discounts.
          </Text>

          {/* Filter Pills */}
          <View
            style={[
              styles.filterCapsule,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(15, 23, 42, 0.8)'
                  : 'rgba(255, 255, 255, 0.15)',
              },
            ]}
          >
            {[
              { key: 'all', label: 'All Offers' },
              { key: 'active', label: 'Active' },
              { key: 'exclusive', label: 'VIP Special' },
            ].map((tab) => {
              const isSelected = filter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setFilter(tab.key as any)}
                  activeOpacity={0.85}
                  style={[
                    styles.filterTab,
                    isSelected && {
                      backgroundColor: isDarkMode ? '#6366F1' : '#FFFFFF',
                      shadowColor: '#000',
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                      elevation: 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      {
                        color: isSelected
                          ? isDarkMode
                            ? '#FFFFFF'
                            : '#312E81'
                          : isDarkMode
                          ? '#94A3B8'
                          : 'rgba(255, 255, 255, 0.8)',
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Tag size={15} color={theme.colors.primary} />
            <Text
              style={[
                styles.sectionHeaderText,
                { color: isDarkMode ? '#CBD5E1' : '#475569' },
              ]}
            >
              AVAILABLE PROMOS ({filteredCoupons.length})
            </Text>
          </View>
        </View>

        {/* Coupons List */}
        {loading ? (
          <View style={styles.loaderWrap}>
            <DashboardLoader />
          </View>
        ) : filteredCoupons.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState type="no-coupons" />
          </View>
        ) : (
          filteredCoupons.map((c, idx) => {
            const isCopied = copiedCode === c.code;
            const expired =
              c.valid_until && new Date(c.valid_until).getTime() < Date.now();
            const isPercent = c.discount_type === 'percentage';
            const discountLabel = isPercent
              ? `${c.discount_value}% OFF`
              : `₹${c.discount_value} OFF`;

            return (
              <View
                key={c._id || c.code || `coupon-${idx}`}
                style={[
                  styles.couponCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: c.highlight
                      ? theme.colors.primary
                      : isDarkMode
                      ? 'rgba(255, 255, 255, 0.08)'
                      : theme.colors.border,
                    opacity: expired ? 0.6 : 1,
                  },
                ]}
              >
                {/* Top Row: Code Pill + Discount Badge */}
                <View style={styles.cardHeaderRow}>
                  <TouchableOpacity
                    onPress={() => handleCopy(c.code)}
                    activeOpacity={0.7}
                    style={[
                      styles.codeBadge,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(99, 102, 241, 0.15)'
                          : '#EEF2FF',
                        borderColor: isDarkMode
                          ? 'rgba(99, 102, 241, 0.4)'
                          : '#C7D2FE',
                      },
                    ]}
                  >
                    <Ticket size={14} color="#6366F1" />
                    <Text style={styles.codeBadgeText}>{c.code}</Text>
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.discountPill,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(245, 158, 11, 0.15)'
                          : '#FEF3C7',
                      },
                    ]}
                  >
                    <Text style={styles.discountPillText}>{discountLabel}</Text>
                  </View>
                </View>

                {/* Middle: Title & Description */}
                <Text
                  style={[styles.cardTitle, { color: theme.colors.textMain }]}
                  numberOfLines={1}
                >
                  {c.title}
                </Text>
                <Text
                  style={[styles.cardDesc, { color: theme.colors.textMuted }]}
                  numberOfLines={2}
                >
                  {c.description}
                </Text>

                {/* Meta Row: Min order & Expiry */}
                <View style={styles.cardMetaRow}>
                  {c.min_order_value ? (
                    <View
                      style={[
                        styles.metaItem,
                        {
                          backgroundColor: isDarkMode
                            ? 'rgba(255, 255, 255, 0.05)'
                            : '#F1F5F9',
                        },
                      ]}
                    >
                      <ShieldCheck size={11} color={theme.colors.textMuted} />
                      <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                        Min order: ₹{c.min_order_value}
                      </Text>
                    </View>
                  ) : null}

                  {c.valid_until ? (
                    <View
                      style={[
                        styles.metaItem,
                        {
                          backgroundColor: isDarkMode
                            ? 'rgba(245, 158, 11, 0.1)'
                            : '#FFFBEB',
                        },
                      ]}
                    >
                      <Clock size={11} color="#D97706" />
                      <Text style={[styles.metaText, { color: '#D97706' }]}>
                        Expires {new Date(c.valid_until).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Divider */}
                <View
                  style={[
                    styles.cardDivider,
                    {
                      borderColor: isDarkMode
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                />

                {/* Action Buttons */}
                <View style={styles.cardActionRow}>
                  <TouchableOpacity
                    disabled={!!expired}
                    onPress={() => handleCopy(c.code)}
                    activeOpacity={0.8}
                    style={[
                      styles.copyBtn,
                      {
                        backgroundColor: isCopied
                          ? '#10B981'
                          : isDarkMode
                          ? 'rgba(255, 255, 255, 0.06)'
                          : '#F1F5F9',
                      },
                    ]}
                  >
                    {isCopied ? (
                      <>
                        <CheckCircle2 size={14} color="#FFFFFF" />
                        <Text style={[styles.copyBtnText, { color: '#FFFFFF' }]}>
                          Copied!
                        </Text>
                      </>
                    ) : (
                      <>
                        <Copy size={14} color={theme.colors.primary} />
                        <Text style={[styles.copyBtnText, { color: theme.colors.primary }]}>
                          Copy Code
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={!!expired}
                    onPress={() => handleApply(c)}
                    activeOpacity={0.85}
                    style={[
                      styles.applyBtn,
                      {
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.applyBtnText}>Apply Now</Text>
                    <ArrowRight size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const FEATURED_PROMOS: Coupon[] = [
  {
    _id: 'promo-1',
    code: 'ODISHAPCS',
    title: 'Odisha PCS Special Offer',
    description: 'Flat 25% discount on all Odisha PCS Mock Tests, Mains Series & Study Notes.',
    discount_type: 'percentage',
    discount_value: 25,
    min_order_value: 499,
    max_discount: 1500,
    valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    highlight: 'RECOMMENDED',
  },
  {
    _id: 'promo-2',
    code: 'WELCOME100',
    title: 'Welcome Bonus Voucher',
    description: 'Flat ₹100 instant discount on your first course enrollment or book bundle.',
    discount_type: 'flat',
    discount_value: 100,
    min_order_value: 299,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    _id: 'promo-3',
    code: 'TOPPER30',
    title: 'Early Bird Scholarship',
    description: 'Exclusive 30% savings on full-length Prelims & Mains test packages.',
    discount_type: 'percentage',
    discount_value: 30,
    min_order_value: 899,
    max_discount: 2000,
    valid_until: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    _id: 'promo-4',
    code: 'EDUSPECIAL',
    title: 'EduDocs Special Discount',
    description: 'Get flat ₹250 off on any premium test series with in-depth analytics.',
    discount_type: 'flat',
    discount_value: 250,
    min_order_value: 999,
    valid_until: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
];

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },

  /* Hero Card */
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroBadgeText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  savingsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savingsTagText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 12,
  },

  /* Filter Capsule */
  filterCapsule: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabText: {
    fontSize: 11.5,
    letterSpacing: 0.2,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* Coupon Card */
  couponCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  codeBadgeText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  discountPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountPillText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  metaText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  cardDivider: {
    borderTopWidth: 1,
    marginBottom: 10,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default CouponsScreen;