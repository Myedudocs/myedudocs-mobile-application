import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Wallet, Sparkles, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiService, ENDPOINTS } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { DashboardLoader } from '../../components/v2/DashboardLoader';
import { EmptyState } from '../../components/v2/EmptyState';

interface WalletData {
  balance: number;
  sourceBreakdown?: {
    fromTests?: number;
    fromPurchases?: number;
    fromDaily?: number;
    fromReferrals?: number;
  };
  transactions?: Array<{
    _id: string;
    type: 'credit' | 'debit';
    amount: number;
    source: string;
    description?: string;
    createdAt: string;
  }>;
}

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

export const WalletScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res: any = await apiService.get(ENDPOINTS.GET_WALLET_SUMMARY);
      if (res?.success) setData(res.data);
      // fallback to user.coins
      if (!res?.data && user?.coins != null) {
        setData({ balance: user.coins, transactions: [] });
      }
    } catch (e) {
      if (user?.coins != null) setData({ balance: user.coins, transactions: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
        <GlobalSafeHeader title={t('myCoupons.wallet', { defaultValue: 'Wallet' })} showBack showMenu />
        <View style={styles.loaderWrap}>
          <DashboardLoader />
        </View>
      </View>
    );
  }

  const balance = data?.balance ?? user?.coins ?? 0;
  const breakdown = data?.sourceBreakdown || {};
  const totalEarned = Object.values(breakdown).reduce<number>((s, v) => s + (v || 0), 0);
  const transactions = data?.transactions || [];

  const sources: Array<{ label: string; value: number; color: string }> = [
    { label: t('rewards.fromTests', { defaultValue: 'From tests' }), value: breakdown.fromTests || 0, color: '#6366f1' },
    { label: t('rewards.fromDaily', { defaultValue: 'Daily check-in' }), value: breakdown.fromDaily || 0, color: '#f59e0b' },
    { label: t('rewards.fromPurchases', { defaultValue: 'Purchases' }), value: breakdown.fromPurchases || 0, color: '#10b981' },
    { label: t('rewards.fromReferrals', { defaultValue: 'Referrals' }), value: breakdown.fromReferrals || 0, color: '#ec4899' },
  ];

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
      <GlobalSafeHeader title={t('myCoupons.wallet', { defaultValue: 'Wallet' })} showBack showMenu />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetch(true)}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Balance card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.balanceTopRow}>
            <View style={styles.walletIconWrap}>
              <Wallet size={20} color="#FFF" />
            </View>
            <Text style={styles.balanceLabel}>
              {t('myCoupons.totalBalance', { defaultValue: 'Total Balance' })}
            </Text>
          </View>
          <View style={styles.balanceAmountRow}>
            <Sparkles size={22} color="#FBBF24" />
            <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
            <Text style={styles.balanceCurrency}>coins</Text>
          </View>
          <View style={styles.balanceBottomRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>
                {t('myCoupons.totalEarned', { defaultValue: 'Total earned' })}
              </Text>
              <Text style={styles.miniStatValue}>{totalEarned.toLocaleString()}</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>
                {t('myCoupons.transactions', { defaultValue: 'Transactions' })}
              </Text>
              <Text style={styles.miniStatValue}>{transactions.length}</Text>
            </View>
          </View>
        </View>

        {/* Sources */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>
          {t('myCoupons.coinSources', { defaultValue: 'Coin Sources' })}
        </Text>
        <View style={styles.sourcesGrid}>
          {sources.map((s) => (
            <View
              key={s.label}
              style={[
                styles.sourceCard,
                {
                  backgroundColor: hexToRgba(s.color, 0.1),
                  borderColor: hexToRgba(s.color, 0.2),
                },
              ]}
            >
              <TrendingUp size={16} color={s.color} />
              <Text style={[styles.sourceValue, { color: s.color }]}>
                {s.value.toLocaleString()}
              </Text>
              <Text style={[styles.sourceLabel, { color: theme.colors.textMuted }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Transactions */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>
          {t('myCoupons.recentTransactions', { defaultValue: 'Recent Transactions' })}
        </Text>
        {transactions.length === 0 ? (
          <EmptyState type="no-transactions" />
        ) : (
          <View
            style={[
              styles.listCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {transactions.slice(0, 30).map((tx, i) => (
              <View
                key={tx._id}
                style={[
                  styles.txRow,
                  i < transactions.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.txIcon,
                    {
                      backgroundColor: hexToRgba(
                        tx.type === 'credit' ? '#10b981' : '#ef4444',
                        0.12
                      ),
                    },
                  ]}
                >
                  {tx.type === 'credit' ? (
                    <ArrowDownRight size={14} color="#10b981" />
                  ) : (
                    <ArrowUpRight size={14} color="#ef4444" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txTitle, { color: theme.colors.textMain }]}>
                    {tx.source || tx.description}
                  </Text>
                  <Text style={[styles.txDate, { color: theme.colors.textMuted }]}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    {
                      color: tx.type === 'credit' ? '#10b981' : '#ef4444',
                    },
                  ]}
                >
                  {tx.type === 'credit' ? '+' : '-'}
                  {Math.abs(tx.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 24 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  balanceCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  balanceTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  walletIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
  balanceAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: '900', lineHeight: 40 },
  balanceCurrency: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 14 },
  balanceBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
  },
  miniStat: { flex: 1 },
  miniStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' },
  miniStatValue: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 2 },
  miniStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 10 },

  sectionTitle: { fontSize: 15, fontWeight: '800', marginVertical: 12 },
  sourcesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sourceCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  sourceValue: { fontSize: 18, fontWeight: '900', marginTop: 6 },
  sourceLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },

  listCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: { fontSize: 13, fontWeight: '700' },
  txDate: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '900' },
});

export default WalletScreen;