import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DirectorySkeleton } from '../../components/skeletons/DirectorySkeleton';
import {
  ChevronRight,
  PlayCircle,
  BookOpen,
  FileText,
  X,
  CheckCircle2,
  Copy,
  Download,
  HelpCircle,
  XCircle,
  Clock,
} from 'lucide-react-native';

// --- IMPORT GLOBAL AUTH & API ---
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../service/api.service';
import { useEffect, useState } from 'react';
import { generateAndOpenInvoice } from '../../utils/invoiceGenerator';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// --------------------------------------------------------
// 1. TYPES
// --------------------------------------------------------
type TransactionType = 'course' | 'ebook' | 'hardcover' | 'test_series' | string;
type Status = 'SUCCESS' | 'FAILED' | 'PENDING';

interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  date: string;
  time: string;
  amount: string;
  status: Status;
  badge?: string;
  orderId: string;
  transactionId: string;
  paymentMethod: string;
  upiRef: string;
  billingName: string;
  subtotal: string;
  discount: string;
  tax: string;
}

// --------------------------------------------------------
// 2. HELPER COMPONENTS
// --------------------------------------------------------
const TransactionIcon = ({ type, isDark }: { type: TransactionType; isDark: boolean }) => {
  switch (type) {
    case 'course':
      return (
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : '#EEF2FF' }]}>
          <PlayCircle color="#6366F6" size={20} strokeWidth={2} />
        </View>
      );
    case 'ebook':
    case 'hardcover':
    case 'book':
      return (
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(59,130,246,0.18)' : '#EFF6FF' }]}>
          <BookOpen color="#3B82F6" size={20} strokeWidth={2} />
        </View>
      );
    case 'test_series':
      return (
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(139,92,246,0.18)' : '#F5F3FF' }]}>
          <FileText color="#8B5CF6" size={20} strokeWidth={2} />
        </View>
      );
    default:
      return (
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : '#EEF2FF' }]}>
          <PlayCircle color="#6366F6" size={20} strokeWidth={2} />
        </View>
      );
  }
};

const TransactionItem = ({
  item,
  index,
  onPress,
  themeColors,
  isDark,
}: {
  item: Transaction;
  index: number;
  onPress: () => void;
  themeColors: any;
  isDark: boolean;
}) => {
  const getStatusConfig = () => {
    switch (item.status) {
      case 'SUCCESS':
        return {
          bg: isDark ? 'rgba(34,197,94,0.15)' : '#DCFCE7',
          color: '#16A34A',
          label: 'SUCCESS',
        };
      case 'PENDING':
        return {
          bg: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7',
          color: '#D97706',
          label: 'PENDING',
        };
      default:
        return {
          bg: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2',
          color: '#DC2626',
          label: 'FAILED',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            shadowColor: isDark ? '#000' : '#64748B',
          },
        ]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <TransactionIcon type={item.type} isDark={isDark} />

        <View style={styles.cardContent}>
          <Text style={[styles.titleText, { color: themeColors.textMain }]} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
              {item.date} • {item.time}
            </Text>
            {item.badge ? (
              <View style={[styles.badgeWrap, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
                <BookOpen color="#6366F6" size={10} style={{ marginRight: 3 }} />
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.amountText, { color: themeColors.textMain }]}>{item.amount}</Text>
          <ChevronRight color={themeColors.textMuted} size={16} style={{ marginTop: 6 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --------------------------------------------------------
// 3. PAYMENT DETAILS MODAL COMPONENT
// --------------------------------------------------------
const PaymentDetailsModal = ({
  visible,
  transaction,
  user,
  onClose,
  themeColors,
  isDark,
}: {
  visible: boolean;
  transaction: Transaction | null;
  user: any;
  onClose: () => void;
  themeColors: any;
  isDark: boolean;
}) => {
  if (!transaction) return null;

  const isSuccess = transaction.status === 'SUCCESS';
  const isPending = transaction.status === 'PENDING';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: themeColors.surface }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={themeColors.textSecondary} size={24} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.textMain }]}>Payment Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            {/* Status Icon & Amount */}
            <View style={styles.statusSection}>
              <View
                style={[
                  styles.largeIconWrap,
                  isSuccess
                    ? { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }
                    : isPending
                    ? { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7' }
                    : { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2' },
                ]}
              >
                {isSuccess ? (
                  <CheckCircle2 color="#10B981" size={32} />
                ) : isPending ? (
                  <Clock color="#F59E0B" size={32} />
                ) : (
                  <XCircle color="#EF4444" size={32} />
                )}
              </View>
              <Text
                style={[
                  styles.statusMainText,
                  isSuccess ? styles.textSuccess : isPending ? styles.textPending : styles.textFailed,
                ]}
              >
                PAYMENT {transaction.status}
              </Text>
              <Text style={[styles.largeAmount, { color: themeColors.textMain }]}>{transaction.amount}</Text>
              <Text style={[styles.modalDate, { color: themeColors.textSecondary }]}>
                {transaction.date} at {transaction.time}
              </Text>
            </View>

            {/* Item Details */}
            <View style={[styles.itemDetailCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
              <TransactionIcon type={transaction.type} isDark={isDark} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemDetailTitle, { color: themeColors.textMain }]} numberOfLines={2}>
                  {transaction.title}
                </Text>
                <Text style={[styles.itemDetailSubtitle, { color: themeColors.textSecondary }]}>
                  {transaction.badge ? `${transaction.badge} • ` : ''}
                  {transaction.type.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Transaction Info List */}
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Order ID</Text>
                <View style={styles.infoValueWrap}>
                  <Text style={[styles.infoValue, { color: themeColors.textMain }]}>{transaction.orderId}</Text>
                  <TouchableOpacity style={{ marginLeft: 6 }}>
                    <Copy color={themeColors.textMuted} size={14} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Transaction ID</Text>
                <View style={styles.infoValueWrap}>
                  <Text style={[styles.infoValue, { color: themeColors.textMain }]}>{transaction.transactionId}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Payment Method</Text>
                <Text style={[styles.infoValue, { color: themeColors.textMain }]}>{transaction.paymentMethod}</Text>
              </View>

              {transaction.upiRef ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>UPI Reference No.</Text>
                  <Text style={[styles.infoValue, { color: themeColors.textMain }]}>{transaction.upiRef}</Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Payment Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isSuccess
                      ? { backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#DCFCE7' }
                      : isPending
                      ? { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7' }
                      : { backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#FEE2E2' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isSuccess ? styles.statusTextSuccess : isPending ? styles.statusTextPending : styles.statusTextFailed,
                    ]}
                  >
                    • {isSuccess ? 'Completed' : isPending ? 'Pending' : 'Failed'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Price Breakdown */}
            <View style={[styles.breakdownCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
              <Text style={[styles.breakdownTitle, { color: themeColors.textMuted }]}>PRICE BREAKDOWN</Text>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: themeColors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.breakdownValue, { color: themeColors.textMain }]}>{transaction.subtotal}</Text>
              </View>

              {transaction.discount !== '₹0' && (
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: themeColors.textSecondary }]}>Discount</Text>
                  <Text style={[styles.breakdownValue, styles.textSuccess]}>{transaction.discount}</Text>
                </View>
              )}

              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: themeColors.textSecondary }]}>Tax</Text>
                <Text style={[styles.breakdownValue, { color: themeColors.textMain }]}>{transaction.tax}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
              <View style={styles.breakdownRow}>
                <Text style={[styles.totalLabel, { color: themeColors.textMain }]}>Total Paid</Text>
                <Text style={styles.totalValue}>{transaction.amount}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.downloadBtn,
                  {
                    borderColor: isDark ? 'rgba(99,102,241,0.4)' : '#C7D2FE',
                    backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#FFFFFF',
                  },
                ]}
                onPress={async () => {
                  try {
                    const invoiceData = {
                      studentName: transaction.billingName || user?.name || 'Student',
                      email: user?.email || '',
                      courseTitle: transaction.title,
                      amount: transaction.amount,
                      orderId: transaction.orderId,
                      date: `${transaction.date} • ${transaction.time}`,
                      transactionId: transaction.transactionId,
                      paymentMethod: transaction.paymentMethod,
                      upiRef: transaction.upiRef,
                      status: transaction.status,
                      subtotal: transaction.subtotal,
                      discount: transaction.discount,
                      tax: transaction.tax,
                    };
                    await generateAndOpenInvoice(invoiceData);
                  } catch (err) {
                    console.error('Failed to download receipt', err);
                  }
                }}
              >
                <Download color="#6366F6" size={16} style={{ marginRight: 8 }} />
                <Text style={styles.downloadBtnText}>Download Receipt</Text>
              </TouchableOpacity>
            </View>

            {/* Support Box */}
            <View style={[styles.supportBox, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#EEF2FF' }]}>
              <View style={styles.supportHeader}>
                <HelpCircle color="#6366F6" size={20} style={{ marginRight: 8 }} />
                <Text style={[styles.supportTitle, { color: themeColors.textMain }]}>Need help with this payment?</Text>
              </View>
              <Text style={[styles.supportText, { color: themeColors.textSecondary }]}>
                If you notice any issue like double charge, failed payment, or refund query, contact support.
              </Text>
              <TouchableOpacity style={styles.supportBtn}>
                <Text style={styles.supportBtnText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// --------------------------------------------------------
// 4. MAIN COMPONENT
// --------------------------------------------------------
export const PaymentHistory = () => {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [olderTransactions, setOlderTransactions] = useState<Transaction[]>([]);

  // Modal State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openDetails = (tx: Transaction) => {
    setSelectedTx(tx);
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/student/purchases?page=1`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();

        if (data.success && data.data) {
          const mappedData: Transaction[] = data.data.map((p: any) => {
            const d = new Date(p.createdAt);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            let badge;
            if (p.purchase_type === 'ebook') badge = 'Ebook';
            if (p.purchase_type === 'book') badge = 'Hardcover';

            let status: Status = 'FAILED';
            if (p.payment_status === 'paid') status = 'SUCCESS';
            else if (p.payment_status === 'pending') status = 'PENDING';

            let title = 'Purchased Item';
            if (p.item_type === 'book' && p.book_id) {
              title = p.book_id.title;
            } else if (p.item_type === 'course' && p.course_id) {
              title = p.course_id.title;
            } else if (p.item_type === 'test_series' && p.test_series_id) {
              title = p.test_series_id.name || p.test_series_id.title;
            }

            return {
              id: p._id,
              type: p.item_type || 'course',
              title: title || 'Educational Material',
              date: dateStr,
              time: timeStr,
              amount: `₹${p.amount_paid || 0}`,
              status: status,
              badge: badge,
              orderId: p.order_id || 'N/A',
              transactionId: p.payment_id || 'N/A',
              paymentMethod: p.payment_gateway ? p.payment_gateway.toUpperCase() : 'UPI / Gateway',
              upiRef: p.upi_ref_no || '',
              billingName: p.billing_address?.full_name || '',
              subtotal: `₹${p.amount_paid || 0}`,
              discount: '₹0',
              tax: '₹0 (Included)',
            };
          });

          setRecentTransactions(mappedData.slice(0, 3));
          setOlderTransactions(mappedData.slice(3));
        }
      } catch (e) {
        console.error('Error fetching purchases:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const colors = theme.colors;

  return (
    <ScreenContainer
      header={{ title: 'Payment History', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
    >
      {loading ? (
        <DirectorySkeleton type="list" count={5} />
      ) : recentTransactions.length === 0 && olderTransactions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>🛒</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textMain, marginBottom: 8 }}>No Purchases Yet</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>When you buy courses or books, your transaction history will appear here.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* --- RECENT TRANSACTIONS --- */}
          {recentTransactions.length > 0 && (
            <View style={styles.listContainer}>
              {recentTransactions.map((tx, index) => (
                <TransactionItem
                  key={tx.id}
                  item={tx}
                  index={index}
                  onPress={() => openDetails(tx)}
                  themeColors={colors}
                  isDark={isDarkMode}
                />
              ))}
            </View>
          )}

          {/* --- OLDER TRANSACTIONS SECTION --- */}
          {olderTransactions.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>OLDER TRANSACTIONS</Text>
              <View style={styles.listContainer}>
                {olderTransactions.map((tx, index) => (
                  <TransactionItem
                    key={tx.id}
                    item={tx}
                    index={index + recentTransactions.length}
                    onPress={() => openDetails(tx)}
                    themeColors={colors}
                    isDark={isDarkMode}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* --- PAYMENT DETAILS MODAL --- */}
      <PaymentDetailsModal
        visible={modalVisible}
        transaction={selectedTx}
        user={user}
        onClose={() => setModalVisible(false)}
        themeColors={colors}
        isDark={isDarkMode}
      />
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 5. STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listContainer: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F6',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextSuccess: {
    color: '#16A34A',
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextFailed: {
    color: '#DC2626',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 6,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '900',
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  closeButton: { padding: 4 },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  largeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusMainText: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  textSuccess: { color: '#10B981' },
  textPending: { color: '#F59E0B' },
  textFailed: { color: '#EF4444' },
  largeAmount: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  modalDate: { fontSize: 13 },

  itemDetailCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  itemDetailTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  itemDetailSubtitle: { fontSize: 12 },

  infoList: {
    marginBottom: 24,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 13 },
  infoValueWrap: { flexDirection: 'row', alignItems: 'center' },
  infoValue: { fontSize: 13, fontWeight: '700' },

  breakdownCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  breakdownTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  breakdownLabel: { fontSize: 13 },
  breakdownValue: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, marginVertical: 12 },
  totalLabel: { fontSize: 14, fontWeight: '800' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#6366F6' },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 20,
  },
  downloadBtnText: { fontSize: 14, fontWeight: '700', color: '#6366F6' },

  supportBox: {
    borderRadius: 16,
    padding: 16,
  },
  supportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  supportTitle: { fontSize: 14, fontWeight: '800' },
  supportText: { fontSize: 12, lineHeight: 18, marginBottom: 16 },
  supportBtn: {
    backgroundColor: '#6366F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  supportBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default PaymentHistory;