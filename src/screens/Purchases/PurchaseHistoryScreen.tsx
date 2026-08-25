import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Receipt,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Video,
  ShoppingBag,
  FileText,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { usePurchaseHistory, PurchaseRecord } from '../../hooks/usePurchaseHistory';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { DashboardLoader } from '../../components/v2/DashboardLoader';
import { EmptyState } from '../../components/v2/EmptyState';
import { InvoiceV2Modal } from '../../components/v2/InvoiceV2Modal';

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

const TYPE_META: Record<
  string,
  { icon: React.ComponentType<any>; color: string; label: string }
> = {
  course: { icon: GraduationCap, color: '#6366f1', label: 'Course' },
  book: { icon: BookOpen, color: '#ec4899', label: 'Book' },
  test_series: { icon: ClipboardList, color: '#10b981', label: 'Test Series' },
  exam: { icon: FileText, color: '#f59e0b', label: 'Exam' },
  live_session: { icon: Video, color: '#ef4444', label: 'Live Session' },
};

const FILTERS = ['all', 'course', 'book', 'test_series', 'exam'] as const;

export const PurchaseHistoryScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');
  const [invoiceFor, setInvoiceFor] = useState<PurchaseRecord | null>(null);

  const { purchases, total, loading, refreshing, error, refresh } =
    usePurchaseHistory(1);

  const filtered = (purchases || []).filter(
    (p) => filter === 'all' || p.purchase_type === filter
  );

  const totalSpent = (purchases || []).reduce(
    (sum, p) => sum + (p.pricing?.final_amount || 0),
    0
  );

  if (loading) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
        <GlobalSafeHeader title={t('purchases.title', { defaultValue: 'Purchase History' })} showBack showMenu />
        <View style={styles.loaderWrap}>
          <DashboardLoader />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
      <GlobalSafeHeader
        title={t('purchases.title', { defaultValue: 'Purchase History' })}
        showBack
        showMenu
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.summaryIconWrap}>
            <Receipt size={20} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>
              {t('purchases.totalSpent', { defaultValue: 'Total Spent' })}
            </Text>
            <Text style={styles.summaryValue}>₹{totalSpent.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryCount}>{total}</Text>
            <Text style={styles.summaryCountLabel}>
              {t('purchases.orders', { defaultValue: 'orders' })}
            </Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    filter === f
                      ? theme.colors.primary
                      : isDarkMode
                      ? '#1E293B'
                      : '#F1F5F9',
                  borderColor:
                    filter === f ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: filter === f ? '#FFF' : theme.colors.textMain,
                  },
                ]}
              >
                {t(`purchases.filter.${f}`, { defaultValue: f })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState type="no-purchases" />
        ) : (
          filtered.map((p) => {
            const meta = TYPE_META[p.purchase_type] || TYPE_META.course;
            const Icon = meta.icon;
            return (
              <TouchableOpacity
                key={p._id}
                onPress={() => setInvoiceFor(p)}
                activeOpacity={0.85}
                style={[
                  styles.row,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: hexToRgba(meta.color, 0.12) },
                  ]}
                >
                  <Icon size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.rowTitle, { color: theme.colors.textMain }]}
                    numberOfLines={2}
                  >
                    {p.item_details?.name || t('purchases.item', { defaultValue: 'Item' })}
                  </Text>
                  <View style={styles.rowMetaRow}>
                    <View
                      style={[
                        styles.rowTypePill,
                        { backgroundColor: hexToRgba(meta.color, 0.12) },
                      ]}
                    >
                      <Text style={[styles.rowTypeText, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>
                    <Text style={[styles.rowDate, { color: theme.colors.textMuted }]}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowAmount, { color: theme.colors.textMain }]}>
                    ₹{(p.pricing?.final_amount || 0).toLocaleString()}
                  </Text>
                  <Text style={[styles.rowInvoiceLink, { color: meta.color }]}>
                    {t('purchases.viewInvoice', { defaultValue: 'Invoice' })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <InvoiceV2Modal
        visible={!!invoiceFor}
        onClose={() => setInvoiceFor(null)}
        purchase={invoiceFor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 24 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  summaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },
  summaryValue: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 2 },
  summaryRight: { alignItems: 'flex-end' },
  summaryCount: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  summaryCountLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' },

  filtersRow: { gap: 8, paddingBottom: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 13, fontWeight: '700' },
  rowMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rowTypePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rowTypeText: { fontSize: 10, fontWeight: '800' },
  rowDate: { fontSize: 11, fontWeight: '600' },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 14, fontWeight: '900' },
  rowInvoiceLink: { fontSize: 11, fontWeight: '800', marginTop: 2 },
});

export default PurchaseHistoryScreen;