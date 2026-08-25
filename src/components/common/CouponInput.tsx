import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Tag, CheckCircle2, X, Ticket } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export interface AppliedCouponData {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  description?: string;
  calculatedDiscount: number;
}

interface CouponInputProps {
  couponCode: string;
  onChangeCode: (text: string) => void;
  onApply: () => void;
  onRemove: () => void;
  appliedCoupon: AppliedCouponData | null;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  title?: string;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  couponCode,
  onChangeCode,
  onApply,
  onRemove,
  appliedCoupon,
  loading = false,
  placeholder = 'COUPON CODE',
  disabled = false,
  containerStyle,
  title = 'Have a Coupon Code?',
}) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {title ? (
        <View style={styles.titleRow}>
          <Tag color={theme.colors.primary} size={15} />
          <Text style={[styles.title, { color: theme.colors.textMain }]}>{title}</Text>
        </View>
      ) : null}

      {appliedCoupon ? (
        <View
          style={[
            styles.appliedCard,
            {
              backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
              borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
            },
          ]}
        >
          <View style={styles.appliedLeft}>
            <View
              style={[
                styles.appliedIconCircle,
                { backgroundColor: isDarkMode ? '#065F46' : '#D1FAE5' },
              ]}
            >
              <CheckCircle2 color="#10B981" size={18} />
            </View>
            <View style={styles.appliedTextWrap}>
              <View style={styles.codeRow}>
                <Text style={[styles.appliedCode, { color: isDarkMode ? '#34D399' : '#047857' }]}>
                  {appliedCoupon.code}
                </Text>
                <View
                  style={[
                    styles.discountBadge,
                    { backgroundColor: isDarkMode ? '#064E3B' : '#059669' },
                  ]}
                >
                  <Text style={styles.discountBadgeText}>
                    {appliedCoupon.discountType === 'percentage'
                      ? `${appliedCoupon.discountValue}% OFF`
                      : `FLAT ₹${appliedCoupon.discountValue} OFF`}
                  </Text>
                </View>
              </View>
              <Text style={[styles.appliedSavings, { color: isDarkMode ? '#A7F3D0' : '#065F46' }]}>
                Saved ₹{appliedCoupon.calculatedDiscount} on this purchase
              </Text>
              {appliedCoupon.description ? (
                <Text
                  style={[styles.appliedDesc, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {appliedCoupon.description}
                </Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.removeBtn, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEE2E2' }]}
            onPress={onRemove}
            activeOpacity={0.7}
            disabled={disabled || loading}
          >
            <X color="#EF4444" size={14} strokeWidth={2.5} />
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ticket color={theme.colors.textLight} size={16} style={{ marginLeft: 10 }} />
            <TextInput
              style={[styles.input, { color: theme.colors.textMain }]}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textLight}
              value={couponCode}
              onChangeText={(val) => onChangeCode(val.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!disabled && !loading}
              returnKeyType="done"
              onSubmitEditing={onApply}
            />
            {couponCode.length > 0 && !loading && (
              <TouchableOpacity
                onPress={() => onChangeCode('')}
                style={styles.clearBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X color={theme.colors.textMuted} size={14} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.applyBtn,
              {
                backgroundColor:
                  !couponCode.trim() || disabled
                    ? isDarkMode
                      ? '#334155'
                      : '#CBD5E1'
                    : theme.colors.primary,
              },
            ]}
            onPress={onApply}
            disabled={!couponCode.trim() || disabled || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.applyBtnText}>Apply</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  clearBtn: {
    padding: 6,
    marginRight: 4,
  },
  applyBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  appliedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appliedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedTextWrap: {
    flex: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  appliedCode: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  appliedSavings: {
    fontSize: 12,
    fontWeight: '600',
  },
  appliedDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
