import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  DeviceEventEmitter,
  Animated,
} from 'react-native';
import useLiveSessions from '../hooks/useLiveSessions';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { DrawerActions } from '@react-navigation/native';
import {
  Compass,
  Bell,
  Activity,
  Trophy,
  BookOpen,
  Library,
  ClipboardList,
  GraduationCap,
  Video,
  Ticket,
  ClipboardCheck,
  Heart,
  ShoppingBag,
  PenLine,
  Gift as GiftIcon,
  HelpCircle,
  User as UserIcon,
  Settings,
  Smartphone,
  Home as HomeIcon,
  LogOut,
  Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { MainTabNavigator } from './MainTabNavigator';


const APP_LOGO = require('../../assets/images/EduDocsNewLogo.png');

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

type DrawerRoute = { name: string; icon: React.ReactNode; key: string };

const MAIN_ITEMS: Array<{ key: string; icon: React.ComponentType<any>; labelKey: string; target: string }> = [
  { key: 'dashboard', icon: Compass, labelKey: 'sidebar.dashboard', target: 'DashboardTab' },
  { key: 'notifications', icon: Bell, labelKey: 'sidebar.notifications', target: 'Notifications' },
  { key: 'metrics', icon: Activity, labelKey: 'sidebar.metrics', target: 'StudentMetrics' },
  { key: 'leaderboard', icon: Trophy, labelKey: 'sidebar.leaderboard', target: 'Leaderboard' },
  { key: 'myCourses', icon: BookOpen, labelKey: 'sidebar.myCourses', target: 'MyCourses' },
  { key: 'myBooks', icon: Library, labelKey: 'sidebar.myBooks', target: 'MyPurchasedBooks' },
  { key: 'myTestSeries', icon: ClipboardList, labelKey: 'sidebar.myTestSeries', target: 'MyTestSeries' },
  { key: 'exams', icon: GraduationCap, labelKey: 'sidebar.exams', target: 'ExamsList' },
  { key: 'liveSessions', icon: Video, labelKey: 'sidebar.liveSessions', target: 'LiveClasses' },
  { key: 'coupons', icon: Ticket, labelKey: 'sidebar.myCoupons', target: 'Coupons' },
  { key: 'results', icon: ClipboardCheck, labelKey: 'sidebar.results', target: 'ResultsList' },
  { key: 'wishlist', icon: Heart, labelKey: 'sidebar.wishlist', target: 'MyWishlist' },
  { key: 'purchases', icon: ShoppingBag, labelKey: 'sidebar.purchases', target: 'PurchaseHistory' },
  { key: 'blogs', icon: PenLine, labelKey: 'sidebar.blogsWriting', target: 'PublishBlogs' },
  { key: 'rewards', icon: GiftIcon, labelKey: 'sidebar.rewards', target: 'RewardsTab' },
  { key: 'help', icon: HelpCircle, labelKey: 'sidebar.helpAndSupport', target: 'SupportTickets' },
];

const ACCOUNT_ITEMS: Array<{ key: string; icon: React.ComponentType<any>; labelKey: string; target: string }> = [
  { key: 'myProfile', icon: UserIcon, labelKey: 'sidebar.myProfile', target: 'Profile' },
  { key: 'settings', icon: Settings, labelKey: 'sidebar.settings', target: 'Settings' },
  { key: 'manageDevices', icon: Smartphone, labelKey: 'sidebar.manageDevices', target: 'DeviceManagement' },
  { key: 'home', icon: HomeIcon, labelKey: 'sidebar.home', target: 'Home' },
];

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = ({
  navigation,
  state,
}) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const scrollRef = useRef<ScrollView | null>(null);

  // --- Live Sessions Detection (same ±15 min logic as web) ---
  const { sessions: liveSessions } = useLiveSessions();
  const liveCount = liveSessions.filter((s) => {
    const diff = Math.abs(new Date().getTime() - new Date(s.startTime).getTime());
    return diff < 15 * 60 * 1000; // within 15 minutes
  }).length;

  // Pulsing animation for LIVE badge
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (liveCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [liveCount]);

  const activeKey =
    (state.routeNames[state.index] || '').toString().toLowerCase();

  const navigate = (target: string) => {
    try {
      if (typeof (navigation as any).closeDrawer === 'function') {
        (navigation as any).closeDrawer();
      } else {
        navigation.dispatch(DrawerActions.closeDrawer());
      }
    } catch (_) {}

    if (target.endsWith('Tab') || target === 'DashboardTab') {
      navigation.navigate('TabsRoot', { screen: target });
    } else {
      navigation.navigate(target as never);
    }
  };

  const renderItem = (
    item: { key: string; icon: React.ComponentType<any>; labelKey: string; target: string },
    isLast = false
  ) => {
    const Icon = item.icon;
    const isActive = activeKey.includes(item.key.toLowerCase()) ||
      (item.target === 'DashboardTab' && activeKey.includes('tabs'));
    const showLiveBadge = item.key === 'liveSessions' && liveCount > 0;
    return (
      <TouchableOpacity
        key={item.key}
        onPress={() => navigate(item.target)}
        activeOpacity={0.85}
        style={[
          styles.itemRow,
          {
            backgroundColor: isActive
              ? hexToRgba('#6366f1', isDarkMode ? 0.2 : 0.1)
              : 'transparent',
            borderRadius: 12,
            marginBottom: isLast ? 0 : 2,
          },
        ]}
      >
        <View
          style={[
            styles.itemIconWrap,
            {
              backgroundColor: isActive
                ? '#6366f1'
                : hexToRgba('#6366f1', isDarkMode ? 0.1 : 0.06),
            },
          ]}
        >
          <Icon size={18} color={isActive ? '#FFF' : '#6366f1'} />
        </View>
        <Text
          style={[
            styles.itemLabel,
            {
              color: isActive
                ? '#6366f1'
                : isDarkMode
                ? '#F1F5F9'
                : theme.colors.textMain,
              fontWeight: isActive ? '800' : '600',
            },
          ]}
        >
          {t(item.labelKey, { defaultValue: item.key })}
        </Text>
        {showLiveBadge ? (
          <Animated.View style={[styles.liveBadge, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </Animated.View>
        ) : isActive ? (
          <View style={styles.activeDot} />
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderGroupLabel = (label: string) => (
    <Text
      key={label}
      style={[
        styles.groupLabel,
        { color: isDarkMode ? '#94A3B8' : '#64748B' },
      ]}
    >
      {label}
    </Text>
  );

  const userName = user?.name || t('sidebar.portal', { defaultValue: 'Student' });
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    const toggleSub = DeviceEventEmitter.addListener('TOGGLE_MAIN_DRAWER', () => {
      try {
        if (typeof (navigation as any).toggleDrawer === 'function') {
          (navigation as any).toggleDrawer();
        } else {
          navigation.dispatch(DrawerActions.toggleDrawer());
        }
      } catch (_) {}
    });
    const openSub = DeviceEventEmitter.addListener('OPEN_MAIN_DRAWER', () => {
      try {
        if (typeof (navigation as any).openDrawer === 'function') {
          (navigation as any).openDrawer();
        } else {
          navigation.dispatch(DrawerActions.openDrawer());
        }
      } catch (_) {}
    });
    return () => {
      toggleSub.remove();
      openSub.remove();
    };
  }, [navigation]);

  return (
    <View
      style={[
        styles.drawerWrap,
        { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.drawerHeader,
          {
            backgroundColor: isDarkMode ? '#1E1B4B' : '#4338CA',
          },
        ]}
      >
        <View style={styles.brandRow}>
          <Image
            source={APP_LOGO}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Sparkles size={14} color="#FCD34D" />
        </View>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarInitial}>{initials}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email || ''}
            </Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView
        {...{ state, navigation }}
        contentContainerStyle={styles.scroll}
        scrollEnabled
      >
        {/* MAIN GROUP */}
        {renderGroupLabel(t('sidebar.main', { defaultValue: 'MAIN' }).toUpperCase())}
        {MAIN_ITEMS.map((it, idx) =>
          renderItem(it, idx === MAIN_ITEMS.length - 1)
        )}

        <View style={styles.divider} />

        {/* ACCOUNT GROUP */}
        {renderGroupLabel(t('sidebar.account', { defaultValue: 'ACCOUNT' }).toUpperCase())}
        {ACCOUNT_ITEMS.map((it, idx) =>
          renderItem(it, idx === ACCOUNT_ITEMS.length - 1)
        )}

        <View style={styles.divider} />

        {/* LOGOUT */}
        <TouchableOpacity
          onPress={() => {
            logout();
            navigation.closeDrawer();
          }}
          activeOpacity={0.85}
          style={[
            styles.itemRow,
            {
              borderRadius: 12,
              backgroundColor: hexToRgba('#EF4444', isDarkMode ? 0.15 : 0.08),
            },
          ]}
        >
          <View
            style={[
              styles.itemIconWrap,
              { backgroundColor: hexToRgba('#EF4444', 0.18) },
            ]}
          >
            <LogOut size={18} color="#EF4444" />
          </View>
          <Text style={[styles.itemLabel, { color: '#EF4444', fontWeight: '800' }]}>
            {t('sidebar.logout', { defaultValue: 'Logout' })}
          </Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </View>
  );
};

const Drawer = createDrawerNavigator();

export const MainDrawer: React.FC = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: 300,
          backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
        },
        sceneStyle: { backgroundColor: isDarkMode ? '#020617' : theme.colors.background },
      }}
    >
      <Drawer.Screen
        name="TabsRoot"
        component={MainTabNavigator}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerWrap: { flex: 1 },
  drawerHeader: {
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandLogo: { width: 120, height: 30 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 18,
  },
  profileInfo: { flex: 1 },
  profileName: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  scroll: { paddingTop: 14, paddingHorizontal: 14, paddingBottom: 28 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 12,
  },
  itemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 14,
  },
  liveBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default MainDrawer;