import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Image,
} from 'react-native';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Receipt,
} from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import { useTheme } from '../../context/ThemeContext';

const APP_ICON = require('../../../assets/images/app_icon.png');

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const value =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((c) => c + c)
          .join('')
      : sanitized;
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface InvoicePurchase {
  _id: string;
  item_details: { name: string; category?: string };
  purchase_type: string;
  payment_gateway?: string;
  payment_completed_at?: string;
  createdAt?: string;
  pricing: {
    final_amount?: number;
    original_price?: number;
    tax_amount?: number;
    discount_amount?: number;
  };
  gateway_details?: {
    order_id?: string;
    payment_id?: string;
  };
}

export interface InvoiceV2ModalProps {
  visible: boolean;
  onClose: () => void;
  purchase: InvoicePurchase | null;
  user?: {
    name?: string;
    email?: string;
  } | null;
}

export const InvoiceV2Modal: React.FC<InvoiceV2ModalProps> = ({
  visible,
  onClose,
  purchase,
  user,
}) => {
  const { theme, isDarkMode } = useTheme();
  const invoiceRef = useRef<View | null>(null);

  if (!purchase) return null;

  const invoiceNumber = `EDU-${purchase._id.slice(-8).toUpperCase()}`;
  const pricing = purchase.pricing || {};
  const amount = pricing.final_amount ?? 0;
  const originalPrice = pricing.original_price ?? amount;
  const discount = pricing.discount_amount ?? 0;
  const paymentDate = new Date(
    purchase.payment_completed_at || purchase.createdAt || new Date().toISOString()
  );
  const paymentMethod = purchase.payment_gateway || 'Online Payment';
  const txnId = purchase.gateway_details?.payment_id || 'N/A';
  const orderId =
    purchase.gateway_details?.order_id || purchase._id.slice(-10);

  const handleDownload = async () => {
    try {
      if (!invoiceRef.current) return;
      const uri = await captureRef(invoiceRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Share.share(
        {
          title: `Invoice-${invoiceNumber}`,
          url: `file://${uri}`,
          message: `Invoice ${invoiceNumber}`,
        },
        { dialogTitle: 'Save or Share Invoice' }
      );
    } catch (err: any) {
      if (err?.message && !/cancel/i.test(err.message)) {
        Alert.alert(
          'Download Failed',
          'Could not generate invoice snapshot. Please try again.'
        );
      }
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Print',
      'Use the Download button to save as image, then print from your device\'s share sheet.'
    );
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
            },
          ]}
        >
          {/* Action bar */}
          <View
            style={[
              styles.actionBar,
              {
                borderBottomColor: theme.colors.border,
                backgroundColor: hexToRgba('#6366f1', 0.02),
              },
            ]}
          >
            <View style={styles.actionBarLeft}>
              <Receipt size={16} color={theme.colors.textMuted} />
              <Text style={[styles.actionBarText, { color: theme.colors.textMuted }]}>
                INVOICE PREVIEW
              </Text>
            </View>
            <View style={styles.actionBarRight}>
              <TouchableOpacity
                onPress={handlePrint}
                style={[
                  styles.smallBtn,
                  { borderColor: theme.colors.border },
                ]}
              >
                <Printer size={14} color={theme.colors.textMain} />
                <Text style={[styles.smallBtnText, { color: theme.colors.textMain }]}>
                  Print
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDownload}
                style={styles.primaryBtn}
              >
                <Download size={14} color="#FFF" />
                <Text style={styles.primaryBtnText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                <X size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View
              ref={invoiceRef}
              collapsable={false}
              style={[
                styles.invoiceBody,
                { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' },
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.brandCol}>
                  <View style={styles.brandLogoWrap}>
                    <Image
                      source={APP_ICON}
                      style={styles.brandLogoImg}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.brandInfo}>
                    <Text style={[styles.brandName, { color: theme.colors.textMain }]}>
                      MyEduDocs
                    </Text>
                    <Text
                      style={[
                        styles.brandSub,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      Sabko Padhao • Quality Learning
                    </Text>
                  </View>
                </View>
                <View style={styles.headerRight}>
                  <View
                    style={[
                      styles.taxChip,
                      { backgroundColor: hexToRgba('#6366f1', 0.1) },
                    ]}
                  >
                    <Text style={styles.taxChipText}>TAX INVOICE</Text>
                  </View>
                  <Text
                    style={[
                      styles.invoiceNumber,
                      { color: theme.colors.textMain },
                    ]}
                  >
                    {invoiceNumber}
                  </Text>
                  <Text
                    style={[
                      styles.issueDate,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Issued on{' '}
                    {paymentDate.toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <View
                    style={[
                      styles.paidChip,
                      {
                        backgroundColor: hexToRgba('#10b981', 0.1),
                        borderColor: hexToRgba('#10b981', 0.25),
                      },
                    ]}
                  >
                    <CheckCircle2 size={14} color="#10b981" />
                    <Text style={styles.paidChipText}>SUCCESSFULLY PAID</Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              {/* Billing */}
              <View style={styles.billingRow}>
                <View style={styles.billingCol}>
                  <Text
                    style={[
                      styles.billingLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    BILL TO
                  </Text>
                  <Text
                    style={[
                      styles.billingName,
                      { color: theme.colors.textMain },
                    ]}
                  >
                    {user?.name || 'Student User'}
                  </Text>
                  <Text
                    style={[
                      styles.billingSub,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {user?.email || 'user@example.com'}
                  </Text>
                </View>
                <View style={styles.billingCol}>
                  <Text
                    style={[
                      styles.billingLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    PAYMENT METHOD
                  </Text>
                  <Text
                    style={[
                      styles.billingName,
                      { color: theme.colors.textMain },
                    ]}
                  >
                    {paymentMethod}
                  </Text>
                  <Text
                    style={[
                      styles.billingSub,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Order ID: {orderId}
                  </Text>
                </View>
                <View style={styles.billingCol}>
                  <Text
                    style={[
                      styles.billingLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    TRANSACTION
                  </Text>
                  <Text
                    style={[
                      styles.billingName,
                      { color: theme.colors.textMain },
                    ]}
                  >
                    TXN #{txnId}
                  </Text>
                  <Text
                    style={[
                      styles.billingSub,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {paymentDate.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Item table */}
              <View
                style={[
                  styles.tableWrap,
                  { borderColor: theme.colors.border },
                ]}
              >
                <View
                  style={[
                    styles.tableHeader,
                    {
                      backgroundColor: hexToRgba('#6366f1', 0.05),
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tableHeaderText,
                      { flex: 1, color: theme.colors.textMuted },
                    ]}
                  >
                    ITEM DESCRIPTION
                  </Text>
                  <Text
                    style={[
                      styles.tableHeaderText,
                      {
                        width: 90,
                        textAlign: 'center',
                        color: theme.colors.textMuted,
                      },
                    ]}
                  >
                    TYPE
                  </Text>
                  <Text
                    style={[
                      styles.tableHeaderText,
                      {
                        width: 60,
                        textAlign: 'center',
                        color: theme.colors.textMuted,
                      },
                    ]}
                  >
                    QTY
                  </Text>
                  <Text
                    style={[
                      styles.tableHeaderText,
                      {
                        width: 110,
                        textAlign: 'right',
                        color: theme.colors.textMuted,
                      },
                    ]}
                  >
                    AMOUNT
                  </Text>
                </View>
                <View style={styles.tableBody}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.itemName,
                        { color: theme.colors.textMain },
                      ]}
                    >
                      {purchase.item_details.name}
                    </Text>
                    <Text
                      style={[
                        styles.itemSub,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {purchase.item_details.category || 'Educational Resource'}
                    </Text>
                  </View>
                  <View style={{ width: 90, alignItems: 'center' }}>
                    <Text
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: hexToRgba('#6366f1', 0.12),
                          color: '#6366f1',
                        },
                      ]}
                    >
                      {(purchase.purchase_type || 'item').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ width: 60, alignItems: 'center' }}>
                    <Text
                      style={[
                        styles.cellText,
                        { color: theme.colors.textMain },
                      ]}
                    >
                      1
                    </Text>
                  </View>
                  <View style={{ width: 110, alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.amountText,
                        { color: theme.colors.textMain },
                      ]}
                    >
                      ₹{amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.summaryWrap}>
                <View style={styles.summaryRow}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Subtotal
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: theme.colors.textMain },
                    ]}
                  >
                    ₹{originalPrice.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Tax (GST 18%)
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: theme.colors.textMain },
                    ]}
                  >
                    Included
                  </Text>
                </View>
                {discount > 0 ? (
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      Discount
                    </Text>
                    <Text style={styles.discountValue}>
                      -₹{discount.toLocaleString()}
                    </Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.totalRow,
                    { backgroundColor: '#0F172A' },
                  ]}
                >
                  <Text style={styles.totalLabel}>TOTAL PAID</Text>
                  <Text style={styles.totalValue}>
                    ₹{amount.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <View
                style={[
                  styles.footerWrap,
                  { borderTopColor: theme.colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.footerLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    TERMS & CONDITIONS
                  </Text>
                  <Text
                    style={[
                      styles.footerText,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Thank you for your purchase from MyEduDocs. This is a
                    computer-generated invoice and does not require a physical
                    signature. Returns and refunds are subject to our standard
                    policy.
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.stamp,
                      { borderColor: '#10b981', transform: [{ rotate: '-3deg' }] },
                    ]}
                  >
                    <Text style={styles.stampText}>PAID & CONFIRMED</Text>
                  </View>
                  <Text
                    style={[
                      styles.refText,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    REF: TXN-
                    {(txnId !== 'N/A'
                      ? txnId
                      : purchase._id
                    )
                      .slice(-8)
                      .toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    flex: 1,
    marginTop: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  actionBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBarText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  actionBarRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallBtnText: { fontSize: 12, fontWeight: '700' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  primaryBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16 },
  invoiceBody: { padding: 16, borderRadius: 14 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  brandCol: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  brandLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  brandInfo: {},
  brandName: { fontWeight: '900', fontSize: 18, letterSpacing: -0.5 },
  brandSub: { fontSize: 11, fontWeight: '600' },
  headerRight: { alignItems: 'flex-end' },
  taxChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  taxChipText: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  invoiceNumber: { fontWeight: '900', fontSize: 20 },
  issueDate: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  paidChip: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidChipText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: { height: 1, marginVertical: 12 },
  billingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  billingCol: { flex: 1, minWidth: 140 },
  billingLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  billingName: { fontWeight: '800', fontSize: 14 },
  billingSub: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  tableWrap: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tableBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  itemName: { fontWeight: '800', fontSize: 14 },
  itemSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  typeChip: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cellText: { fontSize: 14, fontWeight: '600' },
  amountText: { fontSize: 15, fontWeight: '800' },
  summaryWrap: {
    alignSelf: 'flex-end',
    width: '100%',
    maxWidth: 320,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: { fontSize: 12, fontWeight: '500' },
  summaryValue: { fontSize: 12, fontWeight: '700' },
  discountValue: { fontSize: 12, fontWeight: '700', color: '#10b981' },
  totalRow: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { color: '#FFF', fontSize: 12, fontWeight: '600', opacity: 0.9 },
  totalValue: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  footerWrap: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerText: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
  stamp: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 2,
  },
  stampText: {
    color: '#10b981',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  refText: {
    fontSize: 10,
    marginTop: 8,
    fontWeight: '600',
  },
});

export default InvoiceV2Modal;