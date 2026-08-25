import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import {
  User,
  Bell,
  Moon,
  Shield,
  Smartphone,
  Globe,
  Lock,
  LogOut,
  ChevronRight,
  Info,
  Mail,
  HelpCircle,
  Star,
  Trash2,
  Eye,
  Volume2,
  Wifi,
  Check,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { changeStudentLanguage, getStudentLanguage, SupportedLanguage } from '../../i18n';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang: SupportedLanguage = (i18n.language?.startsWith('hi') ? 'hi' : 'en');

  // Robust Google SSO detection matching web parity
  const isGoogleUser = !!(
    (user as any)?.authProvider === 'google' ||
    (user as any)?.googleId ||
    (user as any)?.provider === 'google' ||
    (user?.email && user.email.toLowerCase().includes('@gmail.com'))
  );

  const [notifExams, setNotifExams] = useState(true);
  const [notifLive, setNotifLive] = useState(true);
  const [notifRewards, setNotifRewards] = useState(true);
  const [notifBlogs, setNotifBlogs] = useState(false);
  const [notifJobs, setNotifJobs] = useState(true);
  const [downloadOnWifi, setDownloadOnWifi] = useState(true);
  const [autoplay, setAutoplay] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('settings.logoutConfirmTitle', { defaultValue: 'Log Out' }),
      t('settings.logoutConfirmMsg', {
        defaultValue: 'Are you sure you want to log out of your account?',
      }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('sidebar.logout', { defaultValue: 'Log Out' }),
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const switchLanguage = async (lng: SupportedLanguage) => {
    await changeStudentLanguage(lng);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data, purchases, and progress will be lost. Please contact support to proceed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          onPress: () => navigation.navigate('ContactSupport'),
        },
      ]
    );
  };

  const S = StyleSheet;

  const SectionLabel = ({ label }: { label: string }) => (
    <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>{label}</Text>
  );

  const Row = ({
    icon,
    iconBg,
    iconColor,
    label,
    sublabel,
    onPress,
    right,
    destructive,
  }: {
    icon: React.ReactNode;
    iconBg: string;
    iconColor?: string;
    label: string;
    sublabel?: string;
    onPress?: () => void;
    right?: React.ReactNode;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowLabel,
            {
              color: destructive ? '#EF4444' : theme.colors.textMain,
            },
          ]}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.rowSub, { color: theme.colors.textMuted }]}>{sublabel}</Text>
        ) : null}
      </View>
      {right ?? (
        onPress ? <ChevronRight size={16} color={theme.colors.textLight} /> : null
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GlobalSafeHeader
        title={t('sidebar.settings', { defaultValue: 'Settings' })}
        showBack
        showMenu
        showSearch={false}
        showThemeToggle={false}
        showNotifications={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Profile card */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.85}
          style={[
            styles.profileCard,
            { backgroundColor: isDarkMode ? '#1E293B' : '#4338CA' },
          ]}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Student'}</Text>
            <Text style={styles.profileEmail}>{(user as any)?.email || 'student@myedudocs.com'}</Text>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>View & Edit Profile →</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ACCOUNT */}
        <SectionLabel label="ACCOUNT" />
        <View style={styles.group}>
          <Row
            icon={<User size={18} color="#6366F1" />}
            iconBg={isDarkMode ? '#1E1B4B' : '#EEF2FF'}
            label="Edit Profile"
            sublabel="Name, photo, target exam"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <Row
            icon={<Lock size={18} color="#F59E0B" />}
            iconBg={isDarkMode ? '#451A03' : '#FEF3C7'}
            label="Change Password"
            sublabel={
              isGoogleUser
                ? 'Managed by your Google account'
                : 'Update your login password'
            }
            onPress={() => {
              if (isGoogleUser) {
                Alert.alert(
                  'Signed in with Google',
                  'Your account uses Google SSO for authentication. Password-based login is disabled and managed directly by your Google account.',
                  [
                    {
                      text: 'Manage on Google',
                      onPress: () => Linking.openURL('https://myaccount.google.com/security'),
                    },
                    { text: 'OK', style: 'cancel' },
                  ]
                );
              } else {
                Alert.alert(
                  'Change Password',
                  'A password reset link will be sent to your registered email.',
                  [{ text: 'Send Link' }, { text: 'Cancel', style: 'cancel' }]
                );
              }
            }}
            right={
              isGoogleUser ? (
                <View style={styles.googleLockedBadge}>
                  <Text style={styles.googleLockedText}>Google</Text>
                </View>
              ) : undefined
            }
          />
          <Row
            icon={<Mail size={18} color="#10B981" />}
            iconBg={isDarkMode ? '#022C22' : '#ECFDF5'}
            label="Email & Phone"
            sublabel={(user as any)?.email || 'Manage contact details'}
            onPress={() => navigation.navigate('EditProfile')}
          />
        </View>

        {/* APPEARANCE */}
        <SectionLabel label={t('settings.appearance', { defaultValue: 'APPEARANCE' })} />
        <View style={styles.group}>
          <Row
            icon={<Moon size={18} color="#8B5CF6" />}
            iconBg={isDarkMode ? '#2E1065' : '#F5F3FF'}
            label={t('settings.darkMode', { defaultValue: 'Dark Mode' })}
            sublabel={
              isDarkMode
                ? t('settings.currentlyDark', { defaultValue: 'Currently: Dark' })
                : t('settings.currentlyLight', { defaultValue: 'Currently: Light' })
            }
            right={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                thumbColor="#FFF"
              />
            }
          />
        </View>

        {/* LANGUAGE */}
        <SectionLabel label={t('settings.language', { defaultValue: 'LANGUAGE' })} />
        <View style={styles.group}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => switchLanguage('en')}
            style={[
              styles.langRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor:
                  currentLang === 'en' ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: isDarkMode ? '#0C4A6E' : '#E0F2FE' }]}>
              <Globe size={18} color="#0EA5E9" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: theme.colors.textMain }]}>
                {t('settings.english', { defaultValue: 'English' })}
              </Text>
              <Text style={[styles.rowSub, { color: theme.colors.textMuted }]}>
                {t('settings.englishSub', { defaultValue: 'Default interface language' })}
              </Text>
            </View>
            {currentLang === 'en' ? (
              <View style={[styles.langCheck, { backgroundColor: theme.colors.primary }]}>
                <Check size={14} color="#FFF" />
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => switchLanguage('hi')}
            style={[
              styles.langRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor:
                  currentLang === 'hi' ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: isDarkMode ? '#7C2D12' : '#FED7AA' }]}>
              <Globe size={18} color="#EA580C" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: theme.colors.textMain }]}>
                {t('settings.hindi', { defaultValue: 'हिन्दी (Hindi)' })}
              </Text>
              <Text style={[styles.rowSub, { color: theme.colors.textMuted }]}>
                {t('settings.hindiSub', { defaultValue: 'हिन्दी में देखें' })}
              </Text>
            </View>
            {currentLang === 'hi' ? (
              <View style={[styles.langCheck, { backgroundColor: theme.colors.primary }]}>
                <Check size={14} color="#FFF" />
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* NOTIFICATIONS */}
        <SectionLabel label="NOTIFICATIONS" />
        <View style={styles.group}>
          <Row
            icon={<Bell size={18} color="#EF4444" />}
            iconBg={isDarkMode ? '#450A0A' : '#FEF2F2'}
            label="Exam Reminders"
            sublabel="Get notified before scheduled exams"
            right={
              <Switch
                value={notifExams}
                onValueChange={setNotifExams}
                trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                thumbColor="#FFF"
              />
            }
          />
          <Row
            icon={<Volume2 size={18} color="#F97316" />}
            iconBg={isDarkMode ? '#431407' : '#FFF7ED'}
            label="Live Class Alerts"
            sublabel="Notified when a live session starts"
            right={
              <Switch
                value={notifLive}
                onValueChange={setNotifLive}
                trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                thumbColor="#FFF"
              />
            }
          />
          <Row
            icon={<Star size={18} color="#F59E0B" />}
            iconBg={isDarkMode ? '#451A03' : '#FFFBEB'}
            label="Rewards & Coins"
            sublabel="Daily check-in and coin alerts"
            right={
              <Switch
                value={notifRewards}
                onValueChange={setNotifRewards}
                trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                thumbColor="#FFF"
              />
            }
          />
          <Row
            icon={<Globe size={18} color="#3B82F6" />}
            iconBg={isDarkMode ? '#172554' : '#EFF6FF'}
            label="Blog Updates"
            sublabel="When someone likes your blog"
            right={
              <Switch
                value={notifBlogs}
                onValueChange={setNotifBlogs}
                trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                thumbColor="#FFF"
              />
            }
          />
          <Row
            icon={<Bell size={18} color="#10B981" />}
            iconBg={isDarkMode ? '#022C22' : '#ECFDF5'}
            label="Job Notifications"
            sublabel="New job postings matching your profile"
            right={
              <Switch
                value={notifJobs}
                onValueChange={setNotifJobs}
                trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                thumbColor="#FFF"
              />
            }
          />
        </View>

        {/* PLAYBACK & DOWNLOADS */}
        <SectionLabel label="PLAYBACK & DOWNLOADS" />
        <View style={styles.group}>
          <Row
            icon={<Wifi size={18} color="#6366F1" />}
            iconBg={isDarkMode ? '#1E1B4B' : '#EEF2FF'}
            label="Download on Wi-Fi Only"
            sublabel="Save mobile data when downloading PDFs"
            right={
              <Switch
                value={downloadOnWifi}
                onValueChange={setDownloadOnWifi}
                trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                thumbColor="#FFF"
              />
            }
          />
          <Row
            icon={<Eye size={18} color="#8B5CF6" />}
            iconBg={isDarkMode ? '#2E1065' : '#F5F3FF'}
            label="Autoplay Videos"
            sublabel="Automatically play next lecture"
            right={
              <Switch
                value={autoplay}
                onValueChange={setAutoplay}
                trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                thumbColor="#FFF"
              />
            }
          />
        </View>

        {/* SECURITY */}
        <SectionLabel label="SECURITY & DEVICES" />
        <View style={styles.group}>
          <Row
            icon={<Smartphone size={18} color="#10B981" />}
            iconBg={isDarkMode ? '#022C22' : '#ECFDF5'}
            label="Manage Devices"
            sublabel="View & revoke active login sessions"
            onPress={() => navigation.navigate('DeviceManagement')}
          />
          <Row
            icon={<Shield size={18} color="#6366F1" />}
            iconBg={isDarkMode ? '#1E1B4B' : '#EEF2FF'}
            label="Privacy Policy"
            sublabel="How we handle your data"
            onPress={() => Linking.openURL('https://myedudocs.com/privacy-policy')}
          />
          <Row
            icon={<Info size={18} color="#F59E0B" />}
            iconBg={isDarkMode ? '#451A03' : '#FFFBEB'}
            label="Terms & Conditions"
            sublabel="App usage terms"
            onPress={() => Linking.openURL('https://myedudocs.com/terms')}
          />
        </View>

        {/* SUPPORT */}
        <SectionLabel label="SUPPORT" />
        <View style={styles.group}>
          <Row
            icon={<HelpCircle size={18} color="#3B82F6" />}
            iconBg={isDarkMode ? '#172554' : '#EFF6FF'}
            label="Help & Support"
            sublabel="Raise a ticket or chat with us"
            onPress={() => navigation.navigate('SupportTickets')}
          />
          <Row
            icon={<Star size={18} color="#F59E0B" />}
            iconBg={isDarkMode ? '#451A03' : '#FFFBEB'}
            label="Rate the App"
            sublabel="Help us improve with your feedback"
            onPress={() =>
              Linking.openURL(
                'https://play.google.com/store/apps/details?id=com.myedudocs'
              )
            }
          />
        </View>

        {/* APP INFO */}
        <View
          style={[
            styles.appInfoCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.appInfoText, { color: theme.colors.textMuted }]}>
            MyEduDocs v1.2.0
          </Text>
          <Text style={[styles.appInfoSub, { color: theme.colors.textLight }]}>
            Built with ❤️ for India's competitive exam aspirants
          </Text>
        </View>

        {/* DANGER ZONE */}
        <SectionLabel label="DANGER ZONE" />
        <View style={styles.group}>
          <Row
            icon={<LogOut size={18} color="#EF4444" />}
            iconBg={isDarkMode ? '#450A0A' : '#FEF2F2'}
            label="Log Out"
            destructive
            onPress={handleLogout}
          />
          <Row
            icon={<Trash2 size={18} color="#EF4444" />}
            iconBg={isDarkMode ? '#450A0A' : '#FEF2F2'}
            label="Delete Account"
            sublabel="Permanently remove your account"
            destructive
            onPress={handleDeleteAccount}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
  profileCard: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileAvatarText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: { flex: 1 },
  profileName: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginBottom: 8,
  },
  profileBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  profileBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 8,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  group: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    gap: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 1 },
  appInfoCard: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
    gap: 4,
  },
  appInfoText: { fontSize: 13, fontWeight: '700' },
  appInfoSub: { fontSize: 11 },
  googleLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  googleLockedText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  langCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
