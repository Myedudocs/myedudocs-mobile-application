import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import {
  Bell,
  Award,
  BookOpen,
  Sparkles,
  CreditCard,
  CheckCheck,
  ChevronRight,
  Inbox,
  Trash2,
  Ticket,
  FileText,
  Clock,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../service/api.service';
import { getSocket } from '../../service/socketService';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { localizeNotificationTitle } from '../../i18n/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_WIDTH = 80;

export interface NotificationItem {
  _id: string;
  recipient?: string;
  senderName?: string;
  type?: string;
  title: string;
  message: string;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

// --------------------------------------------------------
// SLIDING SWIPEABLE ITEM COMPONENT
// --------------------------------------------------------
const SwipeableNotificationItem: React.FC<{
  item: NotificationItem;
  theme: any;
  isDarkMode: boolean;
  onPress: () => void;
  onDelete: (id: string) => void;
  category: 'academic' | 'purchases' | 'rewards' | 'system';
  iconConfig: any;
  formatTime: (date: string) => string;
}> = ({ item, theme, isDarkMode, onPress, onDelete, iconConfig, formatTime }) => {
  const pan = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const Icon = iconConfig.icon;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          // Swiping left
          pan.setValue(Math.max(gestureState.dx, -BUTTON_WIDTH - 20));
        } else if (isOpen.current && gestureState.dx > 0) {
          // Closing
          pan.setValue(Math.min(-BUTTON_WIDTH + gestureState.dx, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -BUTTON_WIDTH / 2) {
          // Open Delete Action
          Animated.spring(pan, {
            toValue: -BUTTON_WIDTH,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
          isOpen.current = true;
        } else {
          // Reset to Closed
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  const resetSwipe = () => {
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    isOpen.current = false;
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Background Delete Action Button */}
      <View style={styles.deleteBackground}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            resetSwipe();
            onDelete(item._id);
          }}
          activeOpacity={0.85}
        >
          <Trash2 size={20} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground Sliding Card */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ translateX: pan }],
            backgroundColor: theme.colors.surface,
            borderColor: !item.isRead ? theme.colors.primary : theme.colors.border,
          },
          !item.isRead && {
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardContentInner}
          onPress={() => {
            if (isOpen.current) {
              resetSwipe();
            } else {
              onPress();
            }
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
            <Icon size={20} color={iconConfig.color} strokeWidth={2.2} />
          </View>

          <View style={styles.cardTextContent}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.titleText,
                  { color: theme.colors.textMain },
                  !item.isRead && styles.unreadTitle,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>

            <Text
              style={[styles.messageText, { color: theme.colors.textMuted }]}
              numberOfLines={2}
            >
              {item.message}
            </Text>

            <View style={styles.footerRow}>
              <View style={styles.timeRow}>
                <Clock size={11} color={theme.colors.textLight} />
                <Text style={[styles.timeText, { color: theme.colors.textLight }]}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          <ChevronRight size={16} color={theme.colors.textLight} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// --------------------------------------------------------
// MAIN NOTIFICATIONS SCREEN
// --------------------------------------------------------
export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isHindi = (i18n.language || 'en').startsWith('hi');

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'academic' | 'purchases' | 'rewards'>('all');
  const [search, setSearch] = useState('');

  // Fetch live notifications from /notifications
  const fetchNotifications = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      const resData = await response.json();
      if (resData?.success && Array.isArray(resData?.data)) {
        setNotifications(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Real-time socket listener
    const sock = getSocket();
    const onNew = (payload: any) => {
      const incoming: NotificationItem = {
        _id: String(payload._id || payload.id || `live-${Date.now()}`),
        title: localizeNotificationTitle(payload.title || 'New Notification', isHindi),
        message: payload.message || '',
        type: payload.type || 'general',
        isRead: false,
        createdAt: payload.createdAt || new Date().toISOString(),
      };
      setNotifications((prev) => [incoming, ...prev]);
    };
    sock?.on?.('notification:new', onNew);

    return () => {
      sock?.off?.('notification:new', onNew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isHindi]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Mark single as read
  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
    );

    try {
      await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Failed to mark read on server:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (notifications.every(n => n.isRead)) return;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Delete notification on swipe or click
  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    try {
      fetch(`${BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Failed to delete notification on server:', err);
    }
  };

  // Category determination based on type and content
  const getCategory = (item: NotificationItem): 'academic' | 'purchases' | 'rewards' | 'system' => {
    const type = (item.type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();

    if (
      type.includes('purchase') ||
      title.includes('purchase') ||
      title.includes('order') ||
      title.includes('invoice') ||
      title.includes('enrolled') ||
      msg.includes('purchase') ||
      msg.includes('order') ||
      msg.includes('invoice') ||
      msg.includes('enrolled')
    ) {
      return 'purchases';
    }

    if (
      type.includes('coupon') ||
      type.includes('coin') ||
      type.includes('reward') ||
      type.includes('streak') ||
      title.includes('coupon') ||
      title.includes('coin') ||
      title.includes('reward') ||
      title.includes('streak') ||
      msg.includes('coupon') ||
      msg.includes('coin') ||
      msg.includes('reward') ||
      msg.includes('streak')
    ) {
      return 'rewards';
    }

    if (
      type.includes('test') ||
      type.includes('exam') ||
      type.includes('result') ||
      type.includes('syllabus') ||
      type.includes('pyq') ||
      type.includes('course') ||
      title.includes('test') ||
      title.includes('exam') ||
      title.includes('result') ||
      title.includes('syllabus') ||
      title.includes('pyq') ||
      title.includes('course') ||
      msg.includes('test') ||
      msg.includes('exam') ||
      msg.includes('result')
    ) {
      return 'academic';
    }

    return 'system';
  };

  // Redirection when tapping notification
  const handleNotificationPress = (item: NotificationItem) => {
    handleMarkAsRead(item._id);

    const type = (item.type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();

    if (type.includes('coupon') || title.includes('coupon') || msg.includes('coupon')) {
      navigation.navigate('MainTabs', { screen: 'RewardsTab' });
    } else if (
      type.includes('purchase') ||
      type.includes('order') ||
      title.includes('order') ||
      title.includes('invoice') ||
      msg.includes('tax invoice')
    ) {
      navigation.navigate('PaymentHistory');
    } else if (
      type.includes('test') ||
      title.includes('test') ||
      title.includes('mock') ||
      msg.includes('test series')
    ) {
      navigation.navigate('MainTabs', { screen: 'TestSeriesTab' });
    } else if (
      type.includes('course') ||
      title.includes('course') ||
      msg.includes('course')
    ) {
      navigation.navigate('MainTabs', { screen: 'LearningTab' });
    } else if (
      type.includes('book') ||
      title.includes('ebook') ||
      title.includes('book') ||
      msg.includes('book')
    ) {
      navigation.navigate('MyPurchasedBooks');
    } else if (
      title.includes('coin') ||
      title.includes('streak') ||
      msg.includes('educoin')
    ) {
      navigation.navigate('MainTabs', { screen: 'RewardsTab' });
    }
  };

  // Helper for notification icons and styling
  const getIconConfig = (category: string, item: NotificationItem) => {
    const title = (item.title || '').toLowerCase();

    switch (category) {
      case 'academic':
        if (title.includes('result') || title.includes('score')) {
          return {
            icon: Award,
            color: '#6366F1',
            bg: isDarkMode ? 'rgba(99,102,241,0.2)' : '#EEF2FF',
          };
        }
        if (title.includes('book') || title.includes('ebook')) {
          return {
            icon: BookOpen,
            color: '#3B82F6',
            bg: isDarkMode ? 'rgba(59,130,246,0.2)' : '#EFF6FF',
          };
        }
        return {
          icon: FileText,
          color: '#8B5CF6',
          bg: isDarkMode ? 'rgba(139,92,246,0.2)' : '#F5F3FF',
        };

      case 'purchases':
        return {
          icon: CreditCard,
          color: '#10B981',
          bg: isDarkMode ? 'rgba(16,185,129,0.2)' : '#ECFDF5',
        };

      case 'rewards':
        if (title.includes('coupon')) {
          return {
            icon: Ticket,
            color: '#EC4899',
            bg: isDarkMode ? 'rgba(236,72,153,0.2)' : '#FDF2F8',
          };
        }
        return {
          icon: Sparkles,
          color: '#F59E0B',
          bg: isDarkMode ? 'rgba(245,158,11,0.2)' : '#FFFBEB',
        };

      default:
        return {
          icon: Bell,
          color: '#06B6D4',
          bg: isDarkMode ? 'rgba(6,182,212,0.2)' : '#ECFEFF',
        };
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter(n => {
      if (activeTab === 'unread' && n.isRead) return false;
      if (activeTab !== 'all' && activeTab !== 'unread') {
        const cat = getCategory(n);
        if (cat !== activeTab) return false;
      }
      if (q) {
        const hay = `${n.title || ''} ${n.message || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notifications, activeTab, search]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Global Safe Header */}
      <GlobalSafeHeader
        title={t('notifications.title', { defaultValue: 'Notifications' })}
        showBack={navigation.canGoBack()}
        showMenu
        showThemeToggle={true}
        showNotifications={false}
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={[
                styles.markReadBtn,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF',
                  borderColor: theme.colors.primary,
                },
              ]}
              activeOpacity={0.8}
            >
              <CheckCheck size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            { key: 'academic', label: 'Academic' },
            { key: 'purchases', label: 'Purchases' },
            { key: 'rewards', label: 'Rewards' },
          ].map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    { color: active ? '#FFFFFF' : theme.colors.textMuted },
                    active && styles.tabPillTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List with Slide-to-Delete */}
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
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
              Syncing notifications...
            </Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Inbox size={48} color={theme.colors.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>
              All Caught Up!
            </Text>
            <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
              You have no new alerts. Updates about test series, orders, and coins will appear here.
            </Text>
          </View>
        ) : (
          filteredNotifications.map(item => {
            const category = getCategory(item);
            const iconConfig = getIconConfig(category, item);

            return (
              <SwipeableNotificationItem
                key={item._id}
                item={item}
                theme={theme}
                isDarkMode={isDarkMode}
                onPress={() => handleNotificationPress(item)}
                onDelete={handleDeleteNotification}
                category={category}
                iconConfig={iconConfig}
                formatTime={formatTime}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markReadBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 12,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  swipeContainer: {
    position: 'relative',
    borderRadius: 16,
    marginBottom: 4,
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: BUTTON_WIDTH,
    backgroundColor: '#EF4444',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardContentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 6,
  },
  titleText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
  },
  unreadTitle: {
    fontWeight: '900',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  messageText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
});

export default NotificationsScreen;
