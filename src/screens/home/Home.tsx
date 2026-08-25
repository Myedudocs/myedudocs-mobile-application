import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  InteractionManager,
  Linking
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Layers,
  Sparkles,
  Globe,
  ArrowRight,
  TrendingUp
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';

import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { PopularExams } from './PopularExams';
import { PopularBooks } from './PopularBooks';
import { PlatformStats } from './PlatformStats';
import { Achievers } from './Achievers';
import { FAQSection } from './FAQSection';
import { PopularTestSeries } from '../TestSeries/PopularTestSeries';
import { PopularBlogs } from '../Blogs/BlogsHomeone';
import { Instagram, Youtube, Send as Telegram } from 'lucide-react-native';
import { BASE_URL } from '../../service/api.service';
import { getImageUrl } from '../../utils/image.utils';
import SkeletonLoader from '../../components/SkeletonLoader';
import Svg, { Path } from 'react-native-svg';
import BottomNav from './BottomNav';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = width * 0.88;
const ITEM_SPACING = (width - SLIDE_WIDTH) / 2;
const BANNER_ASPECT_RATIO = 2.8;
const BANNER_HEIGHT = SLIDE_WIDTH / BANNER_ASPECT_RATIO;
const SLIDE_MARGIN = 12;
const SNAP_INTERVAL = SLIDE_WIDTH + SLIDE_MARGIN;

// --------------------------------------------------------
// 1. DYNAMIC HOME SLIDER (Using Fetch API)
// --------------------------------------------------------
const HomeSlider = React.memo(() => {
  const { theme, isDarkMode } = useTheme();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(`${BASE_URL}/admin/banner/all?deviceType=mobile`);
        const json = await response.json();

        if (json?.data) {
          const validBanners = json.data.filter(
            (b: any) => b.isActive && b.imageUrl
          );
          setBanners(validBanners);
        }
      } catch (err) {
        console.error("Banner fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    const task = InteractionManager.runAfterInteractions(() => {
      fetchBanners();
    });
    return () => task.cancel();
  }, []);

  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= banners.length) return;
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.sliderContainer}>
        <View style={[styles.slideCard, { marginHorizontal: ITEM_SPACING, height: BANNER_HEIGHT }]}>
          <SkeletonLoader width="100%" height="100%" borderRadius={16} />
        </View>
      </View>
    );
  }

  if (banners.length === 0) return null;

  return (
    <View style={styles.sliderContainer}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: ITEM_SPACING }}
        keyExtractor={(_, index) => index.toString()}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.slideCard,
              {
                height: BANNER_HEIGHT,
                width: SLIDE_WIDTH,
                marginRight: SLIDE_MARGIN,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
          >
            <Image
              source={{ uri: getImageUrl(item.imageUrl) || '' }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      />

      {/* Navigation Controls */}
      <View style={styles.navControls}>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => scrollToIndex(currentIndex - 1)}
          activeOpacity={0.7}
        >
          <ChevronLeft color={theme.colors.textMuted} size={18} />
        </TouchableOpacity>

        <View style={styles.dotContainer}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' },
                currentIndex === i && [styles.activeDot, { backgroundColor: theme.colors.primary }]
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => scrollToIndex(currentIndex + 1)}
          activeOpacity={0.7}
        >
          <ChevronRight color={theme.colors.textMuted} size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// --------------------------------------------------------
// 2. FREE STUDY RESOURCES QUICK DISCOVERY TILES
// --------------------------------------------------------
const QuickResourceHub = React.memo(() => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();

  const quickLinks = [
    {
      title: 'Previous Papers',
      subtitle: 'Solved PYQs & Keys',
      icon: FileText,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      darkBg: 'rgba(139,92,246,0.15)',
      route: 'PreviousPapers',
    },
    {
      title: 'Exam Syllabus',
      subtitle: 'Pattern & Marks',
      icon: Layers,
      color: '#06B6D4',
      bg: '#ECFEFF',
      darkBg: 'rgba(6,182,212,0.15)',
      route: 'Syllabus',
    },
    {
      title: 'Current Affairs',
      subtitle: 'Daily Updates & Quiz',
      icon: TrendingUp,
      color: '#F59E0B',
      bg: '#FFFBEB',
      darkBg: 'rgba(245,158,11,0.15)',
      route: 'CurrentAffairs',
    },
    {
      title: 'Study Library',
      subtitle: '100% Free Resources',
      icon: BookOpen,
      color: '#10B981',
      bg: '#ECFDF5',
      darkBg: 'rgba(16,185,129,0.15)',
      route: 'FreeResources',
    },
  ];

  return (
    <View style={styles.resourceSection}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceTitleRow}>
          <Sparkles size={16} color={theme.colors.primary} />
          <Text style={[styles.resourceSectionTitle, { color: theme.colors.textMain }]}>
            Free Learning Vault
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('FreeResources')}
          style={styles.exploreAllBtn}
          activeOpacity={0.8}
        >
          <Text style={[styles.exploreAllText, { color: theme.colors.primary }]}>Explore All</Text>
          <ArrowRight size={13} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickGrid}>
        {quickLinks.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickTile,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.quickIconCircle,
                  {
                    backgroundColor: isDarkMode ? item.darkBg : item.bg,
                  },
                ]}
              >
                <Icon size={20} color={item.color} strokeWidth={2.2} />
              </View>
              <Text style={[styles.quickTitle, { color: theme.colors.textMain }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.quickSub, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

// --------------------------------------------------------
// 3. MAIN HOME SCREEN ASSEMBLY
// --------------------------------------------------------
export const Home: React.FC<{ hideBottomNav?: boolean }> = ({ hideBottomNav = false }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.mainScreenWrapper, { backgroundColor: theme.colors.background }]}>
      <ScreenContainer
        header={{
          showLogo: true,
          showThemeToggle: true,
          showSearch: true,
          showCoins: false,
          showNotifications: true,
        }}
        bgVariant="screen"
        scroll
        contentStyle={styles.scrollArea}
      >
        {/* 1. Quick Free Resources Hub */}
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <QuickResourceHub />
        </Animated.View>

        {/* 2. Hero Banners Slider */}
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
          <HomeSlider />
        </Animated.View>

        {/* 3. Popular Competitive Exams */}
        <Animated.View entering={FadeInDown.delay(150).duration(400).springify()}>
          <PopularExams />
        </Animated.View>

        {/* 4. Popular Books & eBooks */}
        <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
          <PopularBooks />
        </Animated.View>

        {/* 5. Popular Test Series */}
        <Animated.View entering={FadeInDown.delay(250).duration(400).springify()}>
          <PopularTestSeries />
        </Animated.View>

        {/* 6. Curated Blogs & Insights */}
        <Animated.View entering={FadeInDown.delay(300).duration(400).springify()}>
          <PopularBlogs />
        </Animated.View>

        {/* 7. Platform Numbers & Impact */}
        <Animated.View entering={FadeInDown.delay(350).duration(400).springify()}>
          <PlatformStats />
        </Animated.View>

        {/* 8. Success Stories & Achievers */}
        <Animated.View entering={FadeInDown.delay(400).duration(400).springify()}>
          <Achievers />
        </Animated.View>

        {/* 9. Community Channels Join Card */}
        <View
          style={[
            styles.socialHub,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.socialTitle, { color: theme.colors.textMuted }]}>
            JOIN OUR LEARNING COMMUNITY
          </Text>
          <Text style={[styles.socialSub, { color: theme.colors.textMain }]}>
            Get instant study alerts, PDF notes & free quizzes
          </Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#FF000015' }]}
              onPress={() => Linking.openURL('https://www.youtube.com/@MyEdudocs')}
              activeOpacity={0.8}
            >
              <Youtube color="#FF0000" size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#E1306C15' }]}
              onPress={() => Linking.openURL('https://www.instagram.com/myedudocs/')}
              activeOpacity={0.8}
            >
              <Instagram color="#E1306C" size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#0088CC15' }]}
              onPress={() => Linking.openURL('https://t.me/myedudocstelegram')}
              activeOpacity={0.8}
            >
              <Telegram color="#0088CC" size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#25D36615' }]}
              onPress={() => Linking.openURL('https://whatsapp.com/channel/0029Vb68EnMGufJ5M3KRM72A')}
              activeOpacity={0.8}
            >
              <Svg width={22} height={22} viewBox="0 0 448 512">
                <Path
                  fill="#25D366"
                  d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3.2 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* 10. Frequently Asked Questions */}
        <Animated.View entering={FadeInDown.delay(450).duration(400).springify()}>
          <FAQSection />
        </Animated.View>
      </ScreenContainer>

      {/* Fixed bottom navigation */}
      {!hideBottomNav && <BottomNav />}
    </View>
  );
};

// --------------------------------------------------------
// 4. STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  mainScreenWrapper: {
    flex: 1,
  },
  scrollArea: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 24,
  },
  sliderContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  slideCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginTop: 10,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    borderRadius: 3,
  },

  // Resource Hub
  resourceSection: {
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resourceSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  exploreAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  exploreAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickTile: {
    width: (width - 50) / 2,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  quickSub: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Social Community Hub
  socialHub: {
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 20,
    marginVertical: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  socialTitle: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  socialSub: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  socialBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default Home;