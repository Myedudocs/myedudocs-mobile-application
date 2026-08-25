import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { DetailsSkeleton } from '../../components/skeletons/DetailsSkeleton';
import {
  Check,
  PlayCircle,
  Copy,
  Download,
  HelpCircle
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { generateAndOpenInvoice } from '../../utils/invoiceGenerator';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// --------------------------------------------------------
// 1. MOCK DATA
// --------------------------------------------------------
const PAYMENT_INFO = {
  statusLabel: 'PAYMENT SUCCESSFUL',
  amount: '₹4,999',
  date: 'Oct 24, 2023 • 10:45 AM',
  itemTitle: 'UPSC CSE 2024: Complete Foundation Batch',
  itemPlatform: 'ExamHub Platform',
  details: [
    { label: 'Order ID', value: 'ORD-99283475', copyable: true },
    { label: 'Transaction ID', value: 'TXN-882736451', copyable: true },
    { label: 'Payment Method', value: 'UPI (Google Pay)', copyable: false },
    { label: 'UPI Ref No.', value: '329847562019', copyable: false },
    { label: 'Billing Name', value: 'Alex Johnson', copyable: false },
    { label: 'Status', value: 'Completed', isStatus: true },
  ],
  breakdown: {
    subtotal: '₹6,999',
    discount: '-₹2,500',
    tax: '₹500',
    total: '₹4,999',
  }
};

// --------------------------------------------------------
// 2. HELPER COMPONENTS
// --------------------------------------------------------
const DetailRow = ({ item, themeColors }: { item: any; themeColors: any }) => (
  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
    <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>{item.label}</Text>
    <View style={styles.detailValueContainer}>
      {item.isStatus && <View style={styles.statusDot} />}
      <Text style={[styles.detailValue, { color: themeColors.textMain }, item.isStatus && styles.detailValueSuccess]}>
        {item.value}
      </Text>
      {item.copyable && (
        <TouchableOpacity style={styles.copyBtn} activeOpacity={0.7}>
          <Copy color={themeColors.primary} size={14} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// --------------------------------------------------------
// 3. MAIN COMPONENT
// --------------------------------------------------------
export const PaymentDetails = () => {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <ScreenContainer
        header={{ title: 'Payment Details', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
        scroll={false}
      >
        <DetailsSkeleton />
      </ScreenContainer>
    );
  }

  const colors = theme.colors;

  return (
    <ScreenContainer
      header={{ title: 'Payment Details', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={true}
    >
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.headerIcon} />
          <Text style={[styles.headerTitle, { color: colors.textMain }]}>Payment Details</Text>
          <View style={styles.headerIcon} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* --- SUCCESS STATUS SECTION --- */}
          <View style={styles.statusSection}>
            <View style={styles.successIconCircle}>
              <Check color="#FFFFFF" size={24} strokeWidth={3} />
            </View>
            <Text style={styles.statusLabel}>{PAYMENT_INFO.statusLabel}</Text>
            <Text style={[styles.amountText, { color: colors.textMain }]}>{PAYMENT_INFO.amount}</Text>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{PAYMENT_INFO.date}</Text>
          </View>

          {/* --- ITEM CARD --- */}
          <View style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.itemIconWrap}>
              <PlayCircle color={colors.primary} size={20} strokeWidth={2} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: colors.textMain }]}>{PAYMENT_INFO.itemTitle}</Text>
              <Text style={[styles.itemPlatform, { color: colors.textMuted }]}>{PAYMENT_INFO.itemPlatform}</Text>
            </View>
          </View>

          {/* --- METADATA LIST --- */}
          <View style={styles.metadataList}>
            {PAYMENT_INFO.details.map((detail, index) => (
              <DetailRow key={index} item={detail} themeColors={colors} />
            ))}
          </View>

          {/* --- PRICE BREAKDOWN --- */}
          <View style={[styles.breakdownCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.breakdownTitle, { color: colors.textLight }]}>PRICE BREAKDOWN</Text>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Subtotal</Text>
              <Text style={[styles.breakdownValue, { color: colors.textMain }]}>{PAYMENT_INFO.breakdown.subtotal}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Discount</Text>
              <Text style={styles.breakdownDiscount}>{PAYMENT_INFO.breakdown.discount}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Tax (GST 18%)</Text>
              <Text style={[styles.breakdownValue, { color: colors.textMain }]}>{PAYMENT_INFO.breakdown.tax}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textMain }]}>Total Paid</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{PAYMENT_INFO.breakdown.total}</Text>
            </View>

            <TouchableOpacity
              style={[styles.downloadBtn, { borderColor: colors.primary, backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={async () => {
                try {
                  const getDetail = (label: string) => PAYMENT_INFO.details.find(d => d.label === label)?.value || 'N/A';
                  const invoiceData = {
                    studentName: getDetail('Billing Name'),
                    email: user?.email || '',
                    courseTitle: PAYMENT_INFO.itemTitle,
                    amount: PAYMENT_INFO.breakdown.total,
                    orderId: getDetail('Order ID'),
                    date: PAYMENT_INFO.date,
                    transactionId: getDetail('Transaction ID'),
                    paymentMethod: getDetail('Payment Method'),
                    upiRef: getDetail('UPI Ref No.'),
                    status: getDetail('Status') === 'Completed' ? 'SUCCESS' : 'FAILED',
                    subtotal: PAYMENT_INFO.breakdown.subtotal,
                    discount: PAYMENT_INFO.breakdown.discount,
                    tax: PAYMENT_INFO.breakdown.tax,
                  };
                  await generateAndOpenInvoice(invoiceData);
                } catch (err) {
                  console.error('Failed to download receipt', err);
                }
              }}
            >
              <Download color={colors.primary} size={16} strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={[styles.downloadBtnText, { color: colors.primary }]}>Download Receipt</Text>
            </TouchableOpacity>
          </View>

          {/* --- SUPPORT CARD --- */}
          <View style={[styles.supportCard, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.12)' : '#F5F8FF', borderColor: isDarkMode ? 'rgba(99,102,241,0.4)' : '#E0E7FF' }]}>
            <View style={styles.supportHeader}>
              <HelpCircle color={colors.primary} size={20} strokeWidth={2.5} style={{ marginRight: 12, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.supportTitle, { color: colors.textMain }]}>Need help with this payment?</Text>
                <Text style={[styles.supportDesc, { color: colors.textMuted }]}>
                  If you notice any issue like double charge, failed payment, or refund query, contact support.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.supportBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
              <Text style={styles.supportBtnText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 4. EXACT STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 10,
    // Subtle shadow for the modal effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIcon: { width: 32, height: 32 },
  headerTitle: { fontSize: 16, fontWeight: '700' },

  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Status Section
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981', // Green
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  itemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 18,
  },
  itemPlatform: {
    fontSize: 11,
  },

  // Metadata List
  metadataList: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailValueSuccess: {
    color: '#10B981',
  },
  copyBtn: {
    marginLeft: 8,
    padding: 2,
  },

  // Price Breakdown
  breakdownCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 13,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  breakdownDiscount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Support Card
  supportCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  supportDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  supportBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});