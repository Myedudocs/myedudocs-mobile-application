import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Sparkles,
  Gift,
  Copy,
  Tag,
  Clock,
  Award,
  Ticket,
  GraduationCap,
  Star,
  FileEdit,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CouponItem {
  id: string;
  code: string;
  discount: string;
  description: string;
  expiry: string;
  minAmount?: number;
}

export const RewardsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();

  const [coins, setCoins] = useState(user?.coins || 350);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real coupons assigned to the student
  const fetchCoupons = async () => {
    if (!user?.token) {
      setLoadingCoupons(false);
      return;
    }

    try {
      setLoadingCoupons(true);
      const res = await fetch(`${BASE_URL}/coupons/my-coupons`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json();

      if (json?.success && Array.isArray(json?.data)) {
        const formatted: CouponItem[] = json.data.map((c: any) => {
          const discountStr =
            c.discountType === 'percentage'
              ? `${c.discountValue}% OFF`
              : `₹${c.discountValue} OFF`;

          const expiryStr = c.expiryDate
            ? `Valid till ${new Date(c.expiryDate).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}`
            : 'No Expiry';

          return {
            id: c.assignmentId || c._id || Math.random().toString(),
            code: c.code,
            discount: discountStr,
            description: c.description || `Special discount voucher on MyEduDocs`,
            expiry: expiryStr,
          };
        });

        setCoupons(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch user coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    if (user?.coins !== undefined) {
      setCoins(user.coins);
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCoupons();
    setRefreshing(false);
  };

  const handleCopyCoupon = (code: string) => {
    setCopiedCode(code);
    Alert.alert('Coupon Copied!', `Code "${code}" copied. Apply at checkout for instant discount.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Safe Global Header */}
      <GlobalSafeHeader
        title="Rewards & EduCoins"
        showBack={navigation.canGoBack()}
        showThemeToggle={true}
        showNotifications={true}
        rightElement={
          <TouchableOpacity
            onPress={() => navigation.navigate('CoinHistory')}
            style={[
              styles.historyBtn,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF',
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Text style={[styles.historyBtnText, { color: theme.colors.primary }]}>History</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Wallet Balance Hero Card */}
        <View
          style={[
            styles.walletCard,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#4338CA',
            },
          ]}
        >
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.walletLabel}>TOTAL EDUCOIN BALANCE</Text>
              <View style={styles.coinsRow}>
                <Sparkles size={28} color="#F59E0B" />
                <Text style={styles.coinsText}>{coins}</Text>
                <Text style={styles.coinsUnit}>Coins</Text>
              </View>
            </View>

            <View style={styles.coinWorthPill}>
              <Text style={styles.coinWorthText}>≈ ₹{(coins / 10).toFixed(0)} Value</Text>
            </View>
          </View>

          <Text style={styles.walletSub}>
            Use your EduCoins during checkout for instant discounts on Test Series and eBooks.
          </Text>
        </View>

        {/* Ways to Earn Coins */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textMain, marginBottom: 14 }]}
          >
            How to Earn More Coins
          </Text>

          <View style={styles.earnRow}>
            <View style={[styles.earnIconWrap, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}>
              <Award size={20} color="#6366F1" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={[styles.earnTitle, { color: theme.colors.textMain }]}>
                Top 10% Score in Test Series
              </Text>
              <Text style={[styles.earnSub, { color: theme.colors.textMuted }]}>
                Earn up to 50 coins per high-scoring mock test
              </Text>
            </View>
            <Text style={styles.earnValue}>+50 Coins</Text>
          </View>

          <View style={styles.earnRow}>
            <View style={[styles.earnIconWrap, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.2)' : '#ECFDF5' }]}>
              <GraduationCap size={20} color="#10B981" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={[styles.earnTitle, { color: theme.colors.textMain }]}>
                Complete Course Modules
              </Text>
              <Text style={[styles.earnSub, { color: theme.colors.textMuted }]}>
                Finish certified video lessons & test chapters
              </Text>
            </View>
            <Text style={styles.earnValue}>+100 Coins</Text>
          </View>

          <View style={styles.earnRow}>
            <View style={[styles.earnIconWrap, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.2)' : '#FFFBEB' }]}>
              <Star size={20} color="#F59E0B" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={[styles.earnTitle, { color: theme.colors.textMain }]}>
                Submit Verified Reviews
              </Text>
              <Text style={[styles.earnSub, { color: theme.colors.textMuted }]}>
                Share feedback on books & exam preparation tests
              </Text>
            </View>
            <Text style={styles.earnValue}>+25 Coins</Text>
          </View>

          <View style={styles.earnRow}>
            <View style={[styles.earnIconWrap, { backgroundColor: isDarkMode ? 'rgba(236,72,153,0.2)' : '#FDF2F8' }]}>
              <FileEdit size={20} color="#EC4899" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={[styles.earnTitle, { color: theme.colors.textMain }]}>
                Publish Approved Blogs
              </Text>
              <Text style={[styles.earnSub, { color: theme.colors.textMuted }]}>
                Author educational articles and study tips
              </Text>
            </View>
            <Text style={styles.earnValue}>+150 Coins</Text>
          </View>
        </View>

        {/* Real Live Coupons */}
        <View style={styles.couponsHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>
            Available Discount Coupons
          </Text>
        </View>

        {loadingCoupons ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loaderText, { color: theme.colors.textMuted }]}>
              Loading available coupons...
            </Text>
          </View>
        ) : coupons.length === 0 ? (
          <View
            style={[
              styles.emptyCouponCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ticket size={40} color={theme.colors.textMuted} />
            <Text style={[styles.emptyCouponTitle, { color: theme.colors.textMain }]}>
              No Coupons Available
            </Text>
            <Text style={[styles.emptyCouponSub, { color: theme.colors.textMuted }]}>
              Any special vouchers or discount coupons assigned to your account will appear here.
            </Text>
          </View>
        ) : (
          coupons.map(c => (
            <View
              key={c.id}
              style={[
                styles.couponCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.couponLeft}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{c.discount}</Text>
                </View>
                <Text style={[styles.couponTitle, { color: theme.colors.textMain }]}>
                  {c.description}
                </Text>
                <View style={styles.couponMetaRow}>
                  <Clock size={12} color={theme.colors.textLight} />
                  <Text style={[styles.couponExpiry, { color: theme.colors.textLight }]}>
                    {c.expiry}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.copyBtn,
                  {
                    backgroundColor: isDarkMode ? '#0F172A' : '#EEF2FF',
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleCopyCoupon(c.code)}
                activeOpacity={0.8}
              >
                <Copy size={14} color={theme.colors.primary} />
                <Text style={[styles.copyBtnText, { color: theme.colors.primary }]}>
                  {c.code}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 16,
  },
  historyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  walletCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  walletLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinsText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  coinsUnit: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  coinWorthPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coinWorthText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  walletSub: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    gap: 12,
  },
  earnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  earnSub: {
    fontSize: 11,
  },
  earnValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  couponsHeaderRow: {
    marginTop: 4,
    marginBottom: -4,
  },
  loaderContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCouponCard: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyCouponTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyCouponSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  couponLeft: {
    flex: 1,
    marginRight: 12,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  discountBadgeText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '800',
  },
  couponTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  couponMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  couponExpiry: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default RewardsScreen;
