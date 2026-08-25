import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DirectorySkeleton } from '../../components/skeletons/DirectorySkeleton';
import {
  Coins,
  PlusCircle,
  ShoppingBag
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// --- IMPORT GLOBAL AUTH & API ---
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../service/api.service';

// --------------------------------------------------------
// 1. TYPES & HELPERS
// --------------------------------------------------------
const ACTIVITY_TABS = ['All', 'Earned', 'Spent'];

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  source: string;
  description: string;
  createdAt: string;
}

// Helper to format source strings into nice labels (e.g., "blog_reward" -> "Blog Reward")
const formatSourceLabel = (src: string) => {
  if (src === 'all') return 'All Activities';
  const map: Record<string, string> = {
    blog_reward: 'Blog Reward',
    exam_reward: 'Exam Reward',
    bonus: 'Bonus',
    referral: 'Referral',
  };
  return map[src?.toLowerCase()] || src?.replace(/_/g, ' ') || 'Reward';
};

// Helper to format date nicely
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const CoinHistory = () => {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();

  // --- STATES ---
  const [wallet, setWallet] = useState<{ balance: number; transactions: Transaction[] }>({
    balance: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('All');

  // --- FETCH WALLET DATA ---
  const fetchWallet = useCallback(async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${BASE_URL}/student/wallet`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWallet({
          balance: data.wallet.balance || 0,
          transactions: data.wallet.transactions || [],
        });
      }
    } catch (error) {
      console.error("Failed to load wallet", error);
    }
  }, [user]);

  // Initial Load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchWallet();
      setLoading(false);
    };
    load();
  }, [fetchWallet]);

  // Pull to Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallet();
    setRefreshing(false);
  };

  // --- DERIVED DATA ---
  const txns = wallet.transactions;
  const uniqueCategories = ['all', ...Array.from(new Set(txns.map(t => t.source)))];

  const filteredActivities = txns.filter(item => {
    const matchCategory = activeCategory === 'all' || item.source === activeCategory;
    let matchTab = true;
    if (activeTab === 'Earned') matchTab = item.amount > 0;
    if (activeTab === 'Spent') matchTab = item.amount < 0;
    return matchCategory && matchTab;
  }).reverse();

  const colors = theme.colors;

  return (
    <ScreenContainer
      header={{
        title: 'Coin History',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
      }}
    >
      {/* --- HORIZONTAL CATEGORY FILTERS --- */}
      <View style={[styles.categoriesWrapper, { backgroundColor: colors.surface }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          {uniqueCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill, 
                { 
                  borderColor: colors.border, 
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' 
                },
                activeCategory === cat && styles.categoryPillActive
              ]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.categoryText, 
                { color: colors.textSecondary },
                activeCategory === cat && styles.categoryTextActive, 
                { textTransform: 'capitalize' }
              ]}>
                {formatSourceLabel(cat)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <DirectorySkeleton type="list" count={5} />
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F6']} />
          }
        >
          
          {/* --- BALANCE CARD --- */}
          <View style={styles.balanceCard}>
            <Coins color="rgba(255,255,255,0.1)" size={120} style={styles.watermarkIcon} />
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <View style={styles.balanceAmountRow}>
              <Coins color="#F59E0B" size={28} strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.balanceAmountText}>{wallet.balance.toLocaleString()}</Text>
            </View>
          </View>

          {/* --- ACTIVITY SEGMENTED TABS --- */}
          <View style={[styles.tabsContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
            {ACTIVITY_TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabButton, 
                    isActive && [
                      styles.tabButtonActive, 
                      { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' }
                    ]
                  ]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.tabButtonText, 
                    { color: colors.textSecondary },
                    isActive && { color: colors.textMain }
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* --- ACTIVITY LIST --- */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>RECENT ACTIVITY</Text>
          
          {filteredActivities.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 30 }}>
              <Coins color={colors.border} size={48} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textMain }}>No transactions found</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>Earn coins by writing blogs or taking exams!</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {filteredActivities.map((activity, index) => {
                const isEarned = activity.amount > 0;
                const displayAmount = Math.abs(activity.amount);
                
                return (
                  <Animated.View 
                    key={activity._id}
                    entering={FadeInDown.delay(index * 60).springify()}
                    style={[styles.activityRow, { borderBottomColor: colors.border, borderBottomWidth: index < filteredActivities.length - 1 ? 1 : 0, paddingBottom: 16 }]}
                  >
                    
                    {/* Icon Column */}
                    <View style={[
                      styles.iconWrap, 
                      isEarned 
                        ? { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5', borderColor: isDarkMode ? 'rgba(16,185,129,0.3)' : '#D1FAE5' }
                        : { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEF2F2', borderColor: isDarkMode ? 'rgba(239,68,68,0.3)' : '#FEE2E2' },
                      { borderWidth: 1 }
                    ]}>
                      {isEarned ? (
                        <PlusCircle color="#10B981" size={20} strokeWidth={2} />
                      ) : (
                        <ShoppingBag color="#EF4444" size={18} strokeWidth={2} />
                      )}
                    </View>

                    {/* Details Column */}
                    <View style={styles.activityContent}>
                      <View style={styles.activityTopRow}>
                        <Text style={[styles.amountText, isEarned ? styles.amountEarned : styles.amountSpent]}>
                          {isEarned ? '+' : '-'}{displayAmount} Coins
                        </Text>
                        <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatDate(activity.createdAt)}</Text>
                      </View>
                      <Text style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {activity.description || formatSourceLabel(activity.source)}
                      </Text>
                    </View>
                    
                  </Animated.View>
                );
              })}
            </View>
          )}

        </ScrollView>
      )}
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 3. STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerIcon: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },

  // Horizontal Categories
  categoriesWrapper: {
    marginBottom: 0,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  categoriesScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillActive: {
    backgroundColor: '#6366F6',
    borderColor: '#6366F6',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: '#6366F6',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#6366F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  watermarkIcon: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    transform: [{ rotate: '-15deg' }],
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmountText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  // Segmented Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Section Title
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },

  // Activity List
  activityList: {
    gap: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  amountEarned: {
    color: '#10B981',
  },
  amountSpent: {
    color: '#EF4444',
  },
  dateText: {
    fontSize: 10,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 18,
  },
});