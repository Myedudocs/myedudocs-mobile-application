import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import {
  Package,
  Truck,
  CheckCircle2,
  Box,
  X,
  Copy,
  ExternalLink,
  MapPin,
  CircleDot,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  Clock,
  Bike,
  Home,
  Check,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Clipboard } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getImageUrl } from '../../utils/image.utils';

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

interface Props {
  visible: boolean;
  onClose: () => void;
  order?: any;
}

export const OrderTrackerModal: React.FC<Props> = ({ visible, onClose, order }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const rawStatus = (order?.deliveryStatus || order?.deliveryDetails?.status || 'pending').toLowerCase();
  
  // Resolve current active stage
  let currentStage = 'pending';
  if (rawStatus.includes('deliver')) currentStage = 'delivered';
  else if (rawStatus.includes('out') || rawStatus.includes('reach')) currentStage = 'out_for_delivery';
  else if (rawStatus.includes('ship') || rawStatus.includes('transit')) currentStage = 'shipped';
  else if (rawStatus.includes('pack')) currentStage = 'packed';
  else currentStage = 'pending';

  const stages = [
    {
      key: 'pending',
      title: 'Order Confirmed',
      desc: order?.purchaseDate ? `Verified • ${new Date(order.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Order confirmed & payment verified',
      icon: CheckCircle2,
      active: true,
      color: '#10B981',
    },
    {
      key: 'packed',
      title: 'Packed & Dispatched',
      desc: order?.deliveryDetails?.packed_at ? `Packed • ${new Date(order.deliveryDetails.packed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Securely packaged with tamper-proof seal',
      icon: Box,
      active: ['packed', 'shipped', 'out_for_delivery', 'delivered'].includes(currentStage),
      color: '#6366F1',
    },
    {
      key: 'shipped',
      title: 'Shipped with Courier',
      desc: order?.deliveryDetails?.courier ? `${order.deliveryDetails.courier} (In Transit)` : 'Handed over to logistics carrier',
      icon: Truck,
      active: ['shipped', 'out_for_delivery', 'delivered'].includes(currentStage),
      color: '#3B82F6',
    },
    {
      key: 'out_for_delivery',
      title: 'Out for Delivery',
      desc: 'Package is with your local delivery agent',
      icon: Bike,
      active: ['out_for_delivery', 'delivered'].includes(currentStage),
      color: '#F59E0B',
    },
    {
      key: 'delivered',
      title: 'Delivered',
      desc: order?.deliveryDetails?.delivered_at ? `Delivered on ${new Date(order.deliveryDetails.delivered_at).toLocaleDateString('en-IN')}` : 'Package safely handed over',
      icon: Home,
      active: currentStage === 'delivered',
      color: '#10B981',
    },
  ];

  const currentStageIdx = stages.findIndex((s) => s.key === currentStage);

  const trackingId =
    order?.deliveryDetails?.tracking_id ||
    order?.trackingId ||
    order?.awb ||
    `OD-${(order?.purchaseId || '12345678').slice(-8).toUpperCase()}`;

  const courier = order?.deliveryDetails?.courier || order?.courier || 'Express Logistics';
  const courierUrl =
    order?.trackingUrl ||
    `https://www.delhivery.com/track/package/${trackingId}`;

  const addressObj = order?.deliveryDetails?.address || order?.customerDetails?.address || {};
  const house = addressObj.house || addressObj.street || addressObj.addressLine1 || '';
  const area = addressObj.area || addressObj.landmark || addressObj.addressLine2 || '';
  const streetLine = [house, area].filter(Boolean).join(', ') || 'Primary Registered Address';
  const city = addressObj.city || addressObj.district || '';
  const state = addressObj.state || '';
  const pincode = addressObj.pincode || addressObj.zipCode || '';
  const cityStateLine = [city, state ? `${state}${pincode ? ' - ' + pincode : ''}` : pincode].filter(Boolean).join(', ');
  const recipientName = addressObj.fullName || order?.customerDetails?.name || 'Student';
  const phone = addressObj.phone || order?.customerDetails?.phone || 'Registered Phone';

  const handleCopy = async () => {
    try {
      Clipboard.setString(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      Alert.alert('Notice', 'Copied tracking ID to clipboard');
    }
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
            { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.headerIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <Truck size={18} color="#6366F1" />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.colors.textMain }]}>
                  Delivery Tracker
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                  Live package & courier timeline
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Book Item Snapshot */}
            <View
              style={[
                styles.itemCard,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {order?.book?.coverImage ? (
                <Image
                  source={{ uri: getImageUrl(order.book.coverImage) }}
                  style={styles.bookThumb}
                />
              ) : (
                <View style={[styles.bookThumb, { backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' }]}>
                  <Box size={24} color="#FFF" />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: hexToRgba(currentStage === 'delivered' ? '#10B981' : '#6366F1', 0.12) }]}>
                    <Text style={[styles.statusBadgeText, { color: currentStage === 'delivered' ? '#10B981' : '#6366F1' }]}>
                      {currentStage.toUpperCase().replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.bookTitle, { color: theme.colors.textMain }]} numberOfLines={2}>
                  {order?.book?.title || 'Physical Hardcopy Edition'}
                </Text>
                <Text style={[styles.bookAuthor, { color: theme.colors.textMuted }]}>
                  By {order?.book?.author || 'MyEduDocs Editorial'}
                </Text>
              </View>
            </View>

            {/* Courier & AWB Action Card */}
            <View
              style={[
                styles.trackingCard,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.trackingInfoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trackingLabel, { color: theme.colors.textLight }]}>
                    COURIER PARTNER
                  </Text>
                  <Text style={[styles.trackingValue, { color: theme.colors.textMain }]}>
                    {courier}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[styles.trackingLabel, { color: theme.colors.textLight }]}>
                    AWB / TRACKING ID
                  </Text>
                  <TouchableOpacity onPress={handleCopy} style={styles.copyPill}>
                    <Text style={[styles.trackingIdText, { color: '#6366F1' }]}>
                      {trackingId}
                    </Text>
                    {copied ? (
                      <Check size={13} color="#10B981" />
                    ) : (
                      <Copy size={13} color="#6366F1" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => Linking.openURL(courierUrl).catch(() => {})}
                activeOpacity={0.85}
                style={[styles.openCarrierBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.openCarrierBtnText}>Open Carrier Live Portal</Text>
                <ExternalLink size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* 5-Stage Visual Stepper */}
            <View style={styles.stepperContainer}>
              <Text style={[styles.sectionHeading, { color: theme.colors.textMain }]}>
                Shipment Journey
              </Text>

              {stages.map((stage, idx) => {
                const Icon = stage.icon;
                const isCurrent = stage.key === currentStage;
                const isCompleted = idx <= currentStageIdx;
                const isLast = idx === stages.length - 1;

                return (
                  <View key={stage.key} style={styles.stageRow}>
                    {/* Left Icon & Connecting Line */}
                    <View style={styles.stageLeft}>
                      <View
                        style={[
                          styles.stageIconBox,
                          {
                            backgroundColor: isCompleted
                              ? stage.color
                              : isDarkMode
                              ? '#334155'
                              : '#E2E8F0',
                          },
                        ]}
                      >
                        <Icon
                          size={15}
                          color={isCompleted ? '#FFFFFF' : '#94A3B8'}
                        />
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.connectingLine,
                            {
                              backgroundColor: isCompleted && idx < currentStageIdx
                                ? '#10B981'
                                : isDarkMode
                                ? '#334155'
                                : '#E2E8F0',
                            },
                          ]}
                        />
                      )}
                    </View>

                    {/* Right Content */}
                    <View style={styles.stageRight}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text
                          style={[
                            styles.stageTitle,
                            {
                              color: isCompleted
                                ? theme.colors.textMain
                                : theme.colors.textLight,
                              fontWeight: isCurrent ? '800' : '700',
                            },
                          ]}
                        >
                          {stage.title}
                        </Text>
                        {isCurrent && (
                          <View style={[styles.currentTag, { backgroundColor: hexToRgba(stage.color, 0.15) }]}>
                            <Text style={[styles.currentTagText, { color: stage.color }]}>
                              Active Status
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.stageDesc, { color: theme.colors.textMuted }]}>
                        {stage.desc}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Delivery Address Card */}
            <View
              style={[
                styles.addressCard,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.addressHeader}>
                <MapPin size={16} color="#6366F1" />
                <Text style={[styles.addressTitle, { color: theme.colors.textMain }]}>
                  Delivery Destination
                </Text>
              </View>

              <View style={styles.addressBody}>
                <Text style={[styles.recipientName, { color: theme.colors.textMain }]}>
                  {recipientName}
                </Text>
                <Text style={[styles.addressText, { color: theme.colors.textMuted }]}>
                  {streetLine}
                </Text>
                {cityStateLine ? (
                  <Text style={[styles.addressText, { color: theme.colors.textMuted }]}>
                    {cityStateLine}
                  </Text>
                ) : null}
                <View style={styles.phoneRow}>
                  <Phone size={12} color={theme.colors.textLight} />
                  <Text style={[styles.phoneText, { color: theme.colors.textLight }]}>
                    {phone}
                  </Text>
                </View>
              </View>
            </View>

            {/* Support Note */}
            <View style={[styles.supportCard, { backgroundColor: hexToRgba('#10B981', 0.08), borderColor: hexToRgba('#10B981', 0.2) }]}>
              <ShieldCheck size={16} color="#10B981" />
              <Text style={[styles.supportText, { color: isDarkMode ? '#A7F3D0' : '#065F46' }]}>
                100% Guaranteed & Insured Delivery. Need help with this shipment? Reach out via Live Chat anytime.
              </Text>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 20,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  /* Book item card */
  itemCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  bookThumb: {
    width: 48,
    height: 64,
    borderRadius: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  bookTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 11.5,
    marginTop: 2,
  },

  /* Courier Card */
  trackingCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  trackingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trackingLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  trackingValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trackingIdText: {
    fontSize: 12,
    fontWeight: '800',
  },
  openCarrierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  openCarrierBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* Stepper */
  stepperContainer: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 12,
  },
  stageRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  stageLeft: {
    alignItems: 'center',
    marginRight: 14,
    width: 28,
  },
  stageIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  stageRight: {
    flex: 1,
    paddingBottom: 16,
  },
  stageTitle: {
    fontSize: 13.5,
  },
  currentTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  stageDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },

  /* Address */
  addressCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  addressBody: {
    paddingLeft: 22,
    gap: 2,
  },
  recipientName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 11.5,
  },

  /* Support */
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  supportText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});

export default OrderTrackerModal;