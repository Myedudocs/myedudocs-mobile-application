import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  DeviceEventEmitter,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import {
  ChevronLeft,
  Sun,
  Moon,
  Bell,
  Sparkles,
  Search,
  Menu,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const APP_LOGO = require('../../../assets/images/EduDocsNewLogo.png');

export interface GlobalSafeHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showLogo?: boolean;
  showThemeToggle?: boolean;
  showSearch?: boolean;
  onSearchPress?: () => void;
  showCoins?: boolean;
  showNotifications?: boolean;
  showMenu?: boolean;
  onMenuPress?: () => void;
  rightElement?: React.ReactNode;
  transparent?: boolean;
}

export const GlobalSafeHeader: React.FC<GlobalSafeHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  showLogo = false,
  showThemeToggle = true,
  showSearch = true,
  onSearchPress,
  showCoins = false,
  showNotifications = true,
  showMenu = false,
  onMenuPress,
  rightElement,
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleMenu = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }
    const nav: any = navigation;
    const parent = nav.getParent?.();
    const grandParent = parent?.getParent?.();

    if (typeof nav?.toggleDrawer === 'function') {
      nav.toggleDrawer();
    } else if (typeof nav?.openDrawer === 'function') {
      nav.openDrawer();
    } else if (typeof parent?.toggleDrawer === 'function') {
      parent.toggleDrawer();
    } else if (typeof parent?.openDrawer === 'function') {
      parent.openDrawer();
    } else if (typeof grandParent?.toggleDrawer === 'function') {
      grandParent.toggleDrawer();
    } else if (typeof grandParent?.openDrawer === 'function') {
      grandParent.openDrawer();
    } else {
      DeviceEventEmitter.emit('TOGGLE_MAIN_DRAWER');
    }
  };

  const handleCoinsPress = () => {
    navigation.navigate('MainTabs', { screen: 'RewardsTab' });
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  const topPadding = insets.top + 4;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          backgroundColor: transparent
            ? 'transparent'
            : isDarkMode
            ? '#0F172A'
            : theme.colors.surface,
          borderBottomColor: isDarkMode ? '#1E293B' : theme.colors.border,
          borderBottomWidth: transparent ? 0 : 1,
        },
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={transparent ? 'transparent' : isDarkMode ? '#0F172A' : theme.colors.surface}
        translucent
      />

      <View style={styles.contentRow}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <ChevronLeft
                size={22}
                color={isDarkMode ? '#F8FAFC' : theme.colors.textMain}
              />
            </TouchableOpacity>
          ) : showMenu ? (
            <TouchableOpacity
              onPress={handleMenu}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityLabel="Open menu"
            >
              <Menu
                size={20}
                color={isDarkMode ? '#F8FAFC' : theme.colors.textMain}
              />
            </TouchableOpacity>
          ) : showLogo ? (
            <TouchableOpacity
              style={styles.logoTouch}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Home')}
            >
              <Image
                source={APP_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : null}

          {title ? (
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.titleText,
                  { color: isDarkMode ? '#F8FAFC' : theme.colors.textMain },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitleText,
                    { color: isDarkMode ? '#94A3B8' : theme.colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightElement ? (
            rightElement
          ) : (
            <>
              {/* Search Icon */}
              {showSearch && (
                <TouchableOpacity
                  onPress={() => {
                    if (onSearchPress) {
                      onSearchPress();
                    } else {
                      DeviceEventEmitter.emit('openGlobalSearch');
                    }
                  }}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                    },
                  ]}
                  activeOpacity={0.7}
                  accessibilityLabel="Search"
                >
                  <Search
                    size={18}
                    color={isDarkMode ? '#F8FAFC' : theme.colors.textMain}
                  />
                </TouchableOpacity>
              )}

              {/* Coin Pill (Optional override) */}
              {showCoins && (
                <TouchableOpacity
                  onPress={handleCoinsPress}
                  style={[
                    styles.coinsPill,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#FEF3C7',
                      borderColor: isDarkMode ? '#334155' : '#FDE68A',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Sparkles size={14} color="#D97706" />
                  <Text
                    style={[
                      styles.coinsPillText,
                      { color: isDarkMode ? '#FBBF24' : '#B45309' },
                    ]}
                  >
                    {user?.coins || 350}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Theme Toggle Button */}
              {showThemeToggle && (
                <TouchableOpacity
                  onPress={toggleTheme}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                    },
                  ]}
                  activeOpacity={0.7}
                  accessibilityLabel="Toggle Dark/Light Theme"
                >
                  {isDarkMode ? (
                    <Sun size={18} color="#FBBF24" />
                  ) : (
                    <Moon size={18} color="#4338CA" />
                  )}
                </TouchableOpacity>
              )}

              {/* Notifications Bell */}
              {showNotifications && (
                <TouchableOpacity
                  onPress={handleNotificationsPress}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                    },
                  ]}
                  activeOpacity={0.7}
                  accessibilityLabel="Notifications"
                >
                  <Bell
                    size={18}
                    color={isDarkMode ? '#F8FAFC' : theme.colors.textMain}
                  />
                  <View style={styles.notifDot} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 50,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  logoTouch: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoImage: {
    width: 145,
    height: 38,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  coinsPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});

export default GlobalSafeHeader;
