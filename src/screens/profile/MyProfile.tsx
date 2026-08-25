import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAlert } from '../../context/AlertContext';
import {
  User,
  MonitorPlay,
  GraduationCap,
  Briefcase,
  FileText,
  Coins,
  ReceiptText,
  Headphones,
  Settings,
  LogOut,
  ChevronRight,
  Video,
  Book,
  FileQuestion,
  ShoppingBag,
  Target,
  Heart,
  Star as StarIcon,
  Shield,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import SkeletonLoader from '../../components/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS, BASE_URL } from '../../service/api.service';
import { version as appVersion } from '../../../package.json';

const LEARNING_HUB_MENU = [
  { id: 'l1', title: 'Student Dashboard', Icon: Target, color: '#6366F6', bgTint: '#EEF2FF', route: 'StudentDashboard' },
  { id: 'l2', title: 'Performance Analytics', Icon: Target, color: '#F59E0B', bgTint: '#FFFBEB', route: 'StudentMetrics' },
  { id: 'l3', title: 'Top Performers & Rankers', Icon: StarIcon, color: '#8B5CF6', bgTint: '#F5F3FF', route: 'Leaderboard' },
  { id: 'l4', title: 'My Courses', Icon: GraduationCap, color: '#10B981', bgTint: '#ECFDF5', route: 'MyCourses' },
  { id: 'l5', title: 'My eBooks & Notes', Icon: Book, color: '#A855F7', bgTint: '#FAF5FF', route: 'MyPurchasedBooks' },
  { id: 'l6', title: 'My Test Series', Icon: FileQuestion, color: '#F43F5E', bgTint: '#FFF1F2', route: 'MyTestSeries' },
  { id: 'l7', title: 'Live Interactive Sessions', Icon: Video, color: '#EF4444', bgTint: '#FEF2F2', route: 'LiveClasses', badge: 'LIVE' },
];

const ACCOUNT_MENU = [
  { id: 'm1', title: 'Edit Profile & Exam Goal', Icon: User, color: '#8B5CF6', bgTint: '#F5F3FF', route: 'EditProfile' },
  { id: 'm1a', title: 'My Cart & Orders', Icon: ShoppingBag, color: '#6366F6', bgTint: '#EEF2FF', route: 'Cart' },
  { id: 'm2', title: 'Rewards & EduCoins', Icon: Coins, color: '#F59E0B', bgTint: '#FFFBEB', route: 'Rewards' },
  { id: 'm3', title: 'Device Security & Sessions', Icon: Shield, color: '#10B981', bgTint: '#ECFDF5', route: 'DeviceManagement' },
  { id: 'm3a', title: 'App Settings', Icon: Settings, color: '#6366F6', bgTint: '#EEF2FF', route: 'Settings' },
  { id: 'm4', title: 'Purchase & Payment History', Icon: ReceiptText, color: '#3B82F6', bgTint: '#EFF6FF', route: 'PaymentHistory' },
  { id: 'm5', title: 'Saved Wishlist', Icon: Heart, color: '#F43F5E', bgTint: '#FFF1F2', route: 'MyWishlist' },
  { id: 'm6', title: 'Job & Exam Notifications', Icon: Briefcase, color: '#6366F6', bgTint: '#EEF2FF', route: 'JobNotifications' },
  { id: 'm7', title: 'Previous Year Papers', Icon: GraduationCap, color: '#10B981', bgTint: '#ECFDF5', route: 'PreviousPapers' },
];

const SUPPORT_MENU = [
  {
    id: 's1',
    title: 'Help & Support Tickets',
    Icon: Headphones,
    color: '#3B82F6',
    bgTint: '#EFF6FF',
    route: 'SupportTickets',
  },
  {
    id: 's1a',
    title: 'Contact Us',
    Icon: Headphones,
    color: '#10B981',
    bgTint: '#ECFDF5',
    route: 'ContactSupport',
  },
  {
    id: 's2',
    title: 'Terms and Conditions',
    Icon: Settings,
    color: '#64748B',
    bgTint: '#F8FAFC',
    url: 'https://myedudocs.in/tnc',
  },
];

export const Profile = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { theme, isDarkMode } = useTheme();

  const [stats, setStats] = React.useState({
    testsTaken: '0',
    books: '0',
    coins: '350',
    loading: true,
  });

  React.useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id || !user?.token) return;

      try {
        setStats(prev => ({ ...prev, loading: true }));

        const metricsRes = await fetch(ENDPOINTS.GET_STUDENT_METRICS(user.id), {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const metricsJson = await metricsRes.json();

        setStats({
          testsTaken: String(metricsJson?.data?.testsAttempted || '12'),
          books: String(metricsJson?.data?.booksPurchased || '7'),
          coins: String(user?.coins || metricsJson?.data?.coins || '350'),
          loading: false,
        });
      } catch (err) {
        setStats({
          testsTaken: '12',
          books: '7',
          coins: String(user?.coins || '350'),
          loading: false,
        });
      }
    };

    fetchProfileData();
  }, [user]);

  const handleLogout = () => {
    showAlert(
      'Log Out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      'warning'
    );
  };

  const renderMenuItem = (item: any, isLast: boolean, onPress?: () => void) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem,
        {
          backgroundColor: isDarkMode ? '#1E293B' : theme.colors.surface,
        },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDarkMode ? '#0F172A' : item.bgTint },
          ]}
        >
          <item.Icon color={item.color} size={18} strokeWidth={2.5} />
        </View>
        <Text
          style={[
            styles.menuTitle,
            { color: isDarkMode ? '#F8FAFC' : theme.colors.textMain },
          ]}
        >
          {item.title}
        </Text>

        {Boolean(item.badge) && (
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>

      <ChevronRight
        color={isDarkMode ? '#64748B' : theme.colors.textLight}
        size={20}
      />
      {!isLast && (
        <View
          style={[
            styles.menuDivider,
            { backgroundColor: isDarkMode ? '#334155' : theme.colors.border },
          ]}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer
      scroll={true}
      contentStyle={styles.scrollContent}
      header={{
        showLogo: true,
        showBack: false,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
      }}
    >
      {/* Profile Card Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[
          styles.dashboardHeader,
          {
            backgroundColor: isDarkMode ? '#1E293B' : theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.profileInfo}>
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.name || 'Student'
                )}&background=6366F6&color=fff&size=128`,
              }}
              style={[
                styles.avatarImg,
                { borderColor: isDarkMode ? '#334155' : '#EEF2FF' },
              ]}
            />
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Settings color="#FFF" size={13} />
            </TouchableOpacity>
          </View>

          <View style={styles.nameArea}>
            <Text
              style={[
                styles.greetingHeader,
                { color: isDarkMode ? '#94A3B8' : theme.colors.textMuted },
              ]}
            >
              Welcome back,
            </Text>
            <Text
              style={[
                styles.userNameHeader,
                { color: isDarkMode ? '#F8FAFC' : theme.colors.textMain },
              ]}
            >
              {user?.name || 'Aspiring Scholar'}
            </Text>
            <Text
              style={[
                styles.greetingHeader,
                { color: isDarkMode ? '#64748B' : theme.colors.textLight, marginTop: 2 },
              ]}
            >
              {user?.email || 'student@myedudocs.in'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Learning Stats Grid */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.statsGrid}
      >
        <TouchableOpacity
          style={[
            styles.statCard,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#FAF5FF',
              borderColor: isDarkMode ? '#334155' : '#F3E8FF',
            },
          ]}
          onPress={() => navigation.navigate('MyTestSeries')}
        >
          <View
            style={[
              styles.statIconCircle,
              { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <FileQuestion color="#A855F7" size={20} strokeWidth={2.5} />
          </View>
          {stats.loading ? (
            <SkeletonLoader width={40} height={22} borderRadius={4} />
          ) : (
            <Text
              style={[
                styles.statValue,
                { color: isDarkMode ? '#F8FAFC' : theme.colors.textMain },
              ]}
            >
              {stats.testsTaken}
            </Text>
          )}
          <Text
            style={[
              styles.statLabel,
              { color: isDarkMode ? '#94A3B8' : theme.colors.textMuted },
            ]}
          >
            Tests Taken
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#F0FDF4',
              borderColor: isDarkMode ? '#334155' : '#DCFCE7',
            },
          ]}
          onPress={() => navigation.navigate('MyPurchasedBooks')}
        >
          <View
            style={[
              styles.statIconCircle,
              { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <Book color="#10B981" size={20} strokeWidth={2.5} />
          </View>
          {stats.loading ? (
            <SkeletonLoader width={40} height={22} borderRadius={4} />
          ) : (
            <Text
              style={[
                styles.statValue,
                { color: isDarkMode ? '#F8FAFC' : theme.colors.textMain },
              ]}
            >
              {stats.books}
            </Text>
          )}
          <Text
            style={[
              styles.statLabel,
              { color: isDarkMode ? '#94A3B8' : theme.colors.textMuted },
            ]}
          >
            eBooks Owned
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFBEB',
              borderColor: isDarkMode ? '#334155' : '#FEF3C7',
            },
          ]}
          onPress={() => navigation.navigate('Rewards')}
        >
          <View
            style={[
              styles.statIconCircle,
              { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <Coins color="#F59E0B" size={20} strokeWidth={2.5} />
          </View>
          {stats.loading ? (
            <SkeletonLoader width={40} height={22} borderRadius={4} />
          ) : (
            <Text
              style={[
                styles.statValue,
                { color: isDarkMode ? '#F8FAFC' : theme.colors.textMain },
              ]}
            >
              {stats.coins}
            </Text>
          )}
          <Text
            style={[
              styles.statLabel,
              { color: isDarkMode ? '#94A3B8' : theme.colors.textMuted },
            ]}
          >
            EduCoins
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Section 1: Learning Hub */}
      <View style={styles.sectionTitleRow}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#F8FAFC' : theme.colors.textMain },
          ]}
        >
          Learning Hub
        </Text>
      </View>

      <View
        style={[
          styles.menuCard,
          {
            backgroundColor: isDarkMode ? '#1E293B' : theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {LEARNING_HUB_MENU.map((item, index) =>
          renderMenuItem(
            item,
            index === LEARNING_HUB_MENU.length - 1,
            () => item.route && navigation.navigate(item.route)
          )
        )}
      </View>

      {/* Section 2: Account & Settings */}
      <View style={styles.sectionTitleRow}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#F8FAFC' : theme.colors.textMain },
          ]}
        >
          Account & Security
        </Text>
      </View>

      <View
        style={[
          styles.menuCard,
          {
            backgroundColor: isDarkMode ? '#1E293B' : theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {ACCOUNT_MENU.map((item, index) =>
          renderMenuItem(
            item,
            index === ACCOUNT_MENU.length - 1,
            () => item.route && navigation.navigate(item.route)
          )
        )}
      </View>

      {/* Section 3: Support */}
      <View style={styles.sectionTitleRow}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#F8FAFC' : theme.colors.textMain },
          ]}
        >
          Support & Legal
        </Text>
      </View>

      <View
        style={[
          styles.menuCard,
          {
            backgroundColor: isDarkMode ? '#1E293B' : theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {SUPPORT_MENU.map((item, index) =>
          renderMenuItem(
            item,
            index === SUPPORT_MENU.length - 1,
            async () => {
              if (item.route) {
                navigation.navigate(item.route);
              } else if (item.url) {
                const supported = await Linking.canOpenURL(item.url);
                if (supported) await Linking.openURL(item.url);
              }
            }
          )
        )}
      </View>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity
        style={[
          styles.logoutBtn,
          {
            backgroundColor: isDarkMode ? '#450A0A' : '#FEF2F2',
            borderColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
          },
        ]}
        activeOpacity={0.8}
        onPress={handleLogout}
      >
        <LogOut color="#EF4444" size={18} strokeWidth={2.5} />
        <Text style={[styles.logoutText, { color: '#EF4444' }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.versionText,
          { color: isDarkMode ? '#64748B' : theme.colors.textLight },
        ]}
      >
        MyEduDocs App • Version {appVersion}
      </Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  dashboardHeader: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  editBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F6',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nameArea: {
    flex: 1,
  },
  greetingHeader: {
    fontSize: 12,
    fontWeight: '500',
  },
  userNameHeader: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitleRow: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  menuCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    position: 'absolute',
    bottom: 0,
    right: 16,
    left: 62,
    height: 1,
  },
  badgeWrap: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 28,
    gap: 8,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 20,
  },
});
