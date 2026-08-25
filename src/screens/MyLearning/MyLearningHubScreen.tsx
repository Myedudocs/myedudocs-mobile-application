import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  BookOpen,
  GraduationCap,
  Award,
  Video,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { MyCourses } from '../MyCourses/MyCourses';
import { MyPurchasedBooks } from '../Books/MyPurchasedBooks';
import { MyTestSeries } from '../TestSeries/Testseries';
import { LiveClasses } from '../Liveclasses/LiveClasses';

export const MyLearningHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'courses' | 'books' | 'tests' | 'live'>('courses');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GlobalSafeHeader
        title="My Learning"
        showBack={false}
        showSearch={true}
        showThemeToggle={true}
        showNotifications={true}
      />
      {/* Sub Tab Switcher */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.primaryLight,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('courses')}
          style={[
            styles.tabItem,
            activeTab === 'courses' && [
              styles.tabItemActive,
              { backgroundColor: isDarkMode ? theme.colors.background : theme.colors.surface },
            ],
          ]}
          activeOpacity={0.8}
        >
          <GraduationCap
            size={16}
            color={activeTab === 'courses' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'courses' ? theme.colors.primary : theme.colors.textMuted,
                fontWeight: activeTab === 'courses' ? '800' : '600',
              },
            ]}
          >
            Courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('books')}
          style={[
            styles.tabItem,
            activeTab === 'books' && [
              styles.tabItemActive,
              { backgroundColor: isDarkMode ? theme.colors.background : theme.colors.surface },
            ],
          ]}
          activeOpacity={0.8}
        >
          <BookOpen
            size={16}
            color={activeTab === 'books' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'books' ? theme.colors.primary : theme.colors.textMuted,
                fontWeight: activeTab === 'books' ? '800' : '600',
              },
            ]}
          >
            eBooks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('tests')}
          style={[
            styles.tabItem,
            activeTab === 'tests' && [
              styles.tabItemActive,
              { backgroundColor: isDarkMode ? theme.colors.background : theme.colors.surface },
            ],
          ]}
          activeOpacity={0.8}
        >
          <Award
            size={16}
            color={activeTab === 'tests' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'tests' ? theme.colors.primary : theme.colors.textMuted,
                fontWeight: activeTab === 'tests' ? '800' : '600',
              },
            ]}
          >
            Tests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('live')}
          style={[
            styles.tabItem,
            activeTab === 'live' && [
              styles.tabItemActive,
              { backgroundColor: isDarkMode ? theme.colors.background : theme.colors.surface },
            ],
          ]}
          activeOpacity={0.8}
        >
          <Video
            size={16}
            color={activeTab === 'live' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'live' ? theme.colors.primary : theme.colors.textMuted,
                fontWeight: activeTab === 'live' ? '800' : '600',
              },
            ]}
          >
            Live
          </Text>
        </TouchableOpacity>
      </View>

      {/* Embedded Tab Screen */}
      <View style={styles.screenWrap}>
        {activeTab === 'courses' && <MyCourses hideHeader={true} hideBottomNav={true} />}
        {activeTab === 'books' && <MyPurchasedBooks hideHeader={true} hideBottomNav={true} />}
        {activeTab === 'tests' && <MyTestSeries hideHeader={true} hideBottomNav={true} />}
        {activeTab === 'live' && <LiveClasses hideHeader={true} hideBottomNav={true} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
  },
  screenWrap: {
    flex: 1,
  },
});
