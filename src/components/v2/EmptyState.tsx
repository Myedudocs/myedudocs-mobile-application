import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import {
  Inbox,
  BookOpen,
  Library,
  GraduationCap,
  ClipboardList,
  Heart,
  ShoppingBag,
  PenLine,
  Video,
  Coins,
  AlertTriangle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

export type EmptyStateType =
  | 'no-data'
  | 'no-courses'
  | 'no-books'
  | 'no-exams'
  | 'no-results'
  | 'no-wishlist'
  | 'no-purchases'
  | 'no-blogs'
  | 'no-sessions'
  | 'no-rewards'
  | 'no-notifications'
  | 'no-coupons'
  | 'no-transactions'
  | 'error';

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

const TYPE_META: Record<
  EmptyStateType,
  {
    color: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    i18nTitle: string;
    i18nDescription: string;
  }
> = {
  'no-data': { color: '#6366F1', icon: Inbox, i18nTitle: 'common.noData', i18nDescription: 'common.noDataDesc' },
  'no-courses': { color: '#10B981', icon: BookOpen, i18nTitle: 'courses.noCourses', i18nDescription: 'courses.noCoursesSubtitle' },
  'no-books': { color: '#F59E0B', icon: Library, i18nTitle: 'books.noBooks', i18nDescription: 'books.noBooksSubtitle' },
  'no-exams': { color: '#EC4899', icon: GraduationCap, i18nTitle: 'exams.noExams', i18nDescription: 'exams.noExamsSubtitle' },
  'no-results': { color: '#8B5CF6', icon: ClipboardList, i18nTitle: 'results.noResults', i18nDescription: 'results.noResultsSubtitle' },
  'no-wishlist': { color: '#EF4444', icon: Heart, i18nTitle: 'wishlist.emptyWishlist', i18nDescription: 'wishlist.emptyWishlistSubtitle' },
  'no-purchases': { color: '#0EA5E9', icon: ShoppingBag, i18nTitle: 'purchases.noPurchases', i18nDescription: 'purchases.noPurchasesSubtitle' },
  'no-blogs': { color: '#F59E0B', icon: PenLine, i18nTitle: 'blogs.noBlogs', i18nDescription: 'blogs.noBlogsSubtitle' },
  'no-sessions': { color: '#8B5CF6', icon: Video, i18nTitle: 'liveSessions.noLiveSessions', i18nDescription: 'liveSessions.noLiveSessionsSubtitle' },
  'no-rewards': { color: '#F59E0B', icon: Coins, i18nTitle: 'rewards.title', i18nDescription: 'rewards.subtitle' },
  'no-notifications': { color: '#6366F1', icon: Inbox, i18nTitle: 'notifications.emptyTitle', i18nDescription: 'notifications.emptyDescription' },
  'no-coupons': { color: '#6366F1', icon: Inbox, i18nTitle: 'myCoupons.emptyTitle', i18nDescription: 'myCoupons.emptyDescription' },
  'no-transactions': { color: '#F59E0B', icon: Coins, i18nTitle: 'myCoupons.noTransactions', i18nDescription: 'myCoupons.noTransactionsSubtitle' },
  'error': { color: '#EF4444', icon: AlertTriangle, i18nTitle: 'common.error', i18nDescription: 'common.tryAgain' },
};

export interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const sizeMap = {
  small: { iconSize: 56, titleSize: 16, descSize: 13, padding: 24 },
  medium: { iconSize: 80, titleSize: 18, descSize: 14, padding: 36 },
  large: { iconSize: 104, titleSize: 22, descSize: 15, padding: 48 },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  actionLabel,
  onAction,
  icon,
  size = 'medium',
  style,
}) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const dims = sizeMap[size];
  const meta = TYPE_META[type] || TYPE_META['no-data'];
  const IconComp = meta.icon;
  const resolvedTitle = title ?? t(meta.i18nTitle, { defaultValue: meta.i18nTitle });
  const resolvedDesc = description ?? t(meta.i18nDescription, { defaultValue: meta.i18nDescription });

  return (
    <View
      style={[
        styles.wrap,
        {
          padding: dims.padding,
          backgroundColor: hexToRgba(meta.color, isDarkMode ? 0.04 : 0.02),
          borderColor: hexToRgba(meta.color, 0.18),
        },
        style,
      ]}
    >
      {/* Decorative circles */}
      <View
        style={[
          styles.bgCircleTopRight,
          { backgroundColor: hexToRgba(meta.color, 0.06) },
        ]}
      />
      <View
        style={[
          styles.bgCircleBottomLeft,
          { backgroundColor: hexToRgba(meta.color, 0.05) },
        ]}
      />

      {icon ?? (
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: hexToRgba(meta.color, 0.12),
            },
          ]}
        >
          <IconComp size={dims.iconSize * 0.6} color={meta.color} />
        </View>
      )}

      <Text
        style={[
          styles.title,
          { fontSize: dims.titleSize, color: theme.colors.textMain },
        ]}
      >
        {resolvedTitle}
      </Text>

      <Text
        style={[
          styles.description,
          { fontSize: dims.descSize, color: theme.colors.textMuted },
        ]}
      >
        {resolvedDesc}
      </Text>

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.85}
          style={[styles.actionBtn, { backgroundColor: meta.color }]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircleTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  bgCircleBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: 380,
  },
  actionBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default EmptyState;