import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  useSharedValue, 
  withSequence,
  FadeInDown
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LucideIcon, Plus, ArrowLeft, RefreshCw, Compass } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface NotFoundProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  buttonText?: string;
  onButtonPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  fullScreen?: boolean;
  type?: 'search' | 'empty' | '404' | 'course' | 'book' | 'test_series';
}

// ─── SVG Illustration Components ─────────────────────────────────────────────

interface IllustrationProps {
  isDarkMode: boolean;
  primaryColor: string;
}

const CourseEmptyIllustration: React.FC<IllustrationProps> = ({ isDarkMode, primaryColor }) => {
  const bgCircle = isDarkMode ? 'rgba(99, 102, 241, 0.12)' : '#EEF4FF';
  const cardBack = isDarkMode ? '#1E293B' : '#E0EAFF';
  const cardFront = isDarkMode ? '#0F172A' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#334155' : '#D6E4FF';
  const lineMuted = isDarkMode ? '#334155' : '#E2E8F0';
  const lineLight = isDarkMode ? '#1E293B' : '#F1F5F9';

  return (
    <Svg width="180" height="180" viewBox="0 0 180 180" fill="none">
      <Defs>
        <LinearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#6366F1" />
          <Stop offset="100%" stopColor="#4F46E5" />
        </LinearGradient>
      </Defs>

      {/* Background circular spotlight */}
      <Circle cx="90" cy="90" r="75" fill={bgCircle} />
      
      {/* Decorative floating dots */}
      <Circle cx="40" cy="45" r="4" fill="#6366F1" opacity="0.5" />
      <Circle cx="140" cy="40" r="3" fill="#6366F1" opacity="0.4" />
      <Circle cx="145" cy="120" r="5" fill="#3B82F6" opacity="0.3" />
      <Circle cx="35" cy="115" r="3" fill="#A5B4FC" opacity="0.6" />

      {/* Back Layered Card */}
      <Rect
        x="42"
        y="42"
        width="96"
        height="84"
        rx="14"
        fill={cardBack}
        transform="rotate(-6 90 84)"
      />

      {/* Front Card with Shadow */}
      <Rect
        x="44"
        y="42"
        width="92"
        height="96"
        rx="14"
        fill={cardFront}
        stroke={cardBorder}
        strokeWidth="1.5"
      />

      {/* Header Accent Pill in Front Card */}
      <Rect x="54" y="54" width="34" height="7" rx="3.5" fill="#6366F1" />
      <Circle cx="124" cy="57.5" r="2.5" fill={lineMuted} />
      <Circle cx="116" cy="57.5" r="2.5" fill={lineMuted} />

      {/* Simulated Content Lines */}
      <Rect x="54" y="69" width="72" height="5" rx="2.5" fill={lineMuted} />
      <Rect x="54" y="79" width="56" height="5" rx="2.5" fill={lineLight} />

      {/* Interactive Form/Button Area */}
      <Rect
        x="54"
        y="92"
        width="72"
        height="28"
        rx="8"
        fill={isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#F0F5FF'}
        stroke="#6366F1"
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />

      {/* Video Play Circle / Floating Pointer */}
      <Circle cx="90" cy="106" r="10" fill="url(#blueGrad)" />
      <Path
        d="M87.5 101.5L94.5 106L87.5 110.5V101.5Z"
        fill="#FFFFFF"
      />

      {/* Mini Top-Right Floating Chat Badge */}
      <G transform="translate(112, 24)">
        <Rect width="36" height="24" rx="8" fill="url(#blueGrad)" />
        <Circle cx="12" cy="12" r="2.5" fill="#FFFFFF" />
        <Circle cx="18" cy="12" r="2.5" fill="#FFFFFF" />
        <Circle cx="24" cy="12" r="2.5" fill="#FFFFFF" />
      </G>
    </Svg>
  );
};

const SearchEmptyIllustration: React.FC<IllustrationProps> = ({ isDarkMode }) => {
  const bgCircle = isDarkMode ? 'rgba(99, 102, 241, 0.12)' : '#EEF4FF';
  const cardFront = isDarkMode ? '#0F172A' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#334155' : '#D6E4FF';
  const lineMuted = isDarkMode ? '#334155' : '#E2E8F0';
  const lineLight = isDarkMode ? '#1E293B' : '#F1F5F9';

  return (
    <Svg width="180" height="180" viewBox="0 0 180 180" fill="none">
      <Defs>
        <LinearGradient id="searchGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#3B82F6" />
          <Stop offset="100%" stopColor="#6366F1" />
        </LinearGradient>
      </Defs>

      {/* Background circular spotlight */}
      <Circle cx="90" cy="90" r="75" fill={bgCircle} />

      {/* Decorative Dots */}
      <Circle cx="45" cy="45" r="3.5" fill="#3B82F6" opacity="0.4" />
      <Circle cx="142" cy="50" r="4" fill="#6366F1" opacity="0.4" />
      <Circle cx="35" cy="125" r="4" fill="#6366F1" opacity="0.3" />

      {/* Document Sheet */}
      <Rect
        x="50"
        y="38"
        width="80"
        height="104"
        rx="14"
        fill={cardFront}
        stroke={cardBorder}
        strokeWidth="1.5"
      />

      {/* Document Content Lines */}
      <Rect x="62" y="52" width="40" height="6" rx="3" fill="#6366F1" opacity="0.7" />
      <Rect x="62" y="66" width="56" height="5" rx="2.5" fill={lineMuted} />
      <Rect x="62" y="77" width="48" height="5" rx="2.5" fill={lineLight} />
      <Rect x="62" y="88" width="52" height="5" rx="2.5" fill={lineLight} />

      {/* Center Search Badge / Magnifier */}
      <Circle cx="90" cy="108" r="22" fill="url(#searchGrad)" />
      
      {/* Magnifier Glass Inside */}
      <Circle cx="87" cy="105" r="7.5" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
      <Path d="M92.5 110.5L98 116" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Soft 'X' or sparkle */}
      <Path d="M85 103L89 107M89 103L85 107" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </Svg>
  );
};

const TestSeriesEmptyIllustration: React.FC<IllustrationProps> = ({ isDarkMode }) => {
  const bgCircle = isDarkMode ? 'rgba(99, 102, 241, 0.12)' : '#EEF4FF';
  const cardBack = isDarkMode ? '#1E293B' : '#E0EAFF';
  const cardFront = isDarkMode ? '#0F172A' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#334155' : '#D6E4FF';
  const lineMuted = isDarkMode ? '#334155' : '#E2E8F0';

  return (
    <Svg width="180" height="180" viewBox="0 0 180 180" fill="none">
      <Defs>
        <LinearGradient id="testGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#6366F1" />
          <Stop offset="100%" stopColor="#4F46E5" />
        </LinearGradient>
      </Defs>

      {/* Background circular spotlight */}
      <Circle cx="90" cy="90" r="75" fill={bgCircle} />

      {/* Floating Sparkles & Dots */}
      <Circle cx="40" cy="45" r="3.5" fill="#6366F1" opacity="0.5" />
      <Circle cx="140" cy="120" r="4" fill="#3B82F6" opacity="0.4" />

      {/* Top Stacked Card */}
      <G transform="translate(38, 40)">
        <Rect width="104" height="28" rx="8" fill={cardBack} />
        <Circle cx="16" cy="14" r="7" fill="url(#testGrad)" />
        <Path d="M14 12C14 10.8 15 10 16 10C17 10 18 10.8 18 12C18 13.2 16.5 13.5 16.5 14.5M16.5 17H16.51" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
        <Rect x="30" y="11" width="55" height="5" rx="2.5" fill={lineMuted} />
      </G>

      {/* Middle Active Card */}
      <G transform="translate(32, 74)">
        <Rect width="116" height="34" rx="10" fill={cardFront} stroke={cardBorder} strokeWidth="1.5" />
        <Circle cx="18" cy="17" r="8" fill="url(#testGrad)" />
        <Path d="M14.5 17L17 19.5L21.5 14.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="34" y="12" width="60" height="5.5" rx="2.75" fill="#6366F1" opacity="0.8" />
        <Rect x="34" y="21" width="40" height="4" rx="2" fill={lineMuted} />
      </G>

      {/* Bottom Stacked Card */}
      <G transform="translate(42, 114)">
        <Rect width="96" height="28" rx="8" fill={cardBack} />
        <Circle cx="16" cy="14" r="7" fill="url(#testGrad)" />
        <Path d="M14 12C14 10.8 15 10 16 10C17 10 18 10.8 18 12C18 13.2 16.5 13.5 16.5 14.5M16.5 17H16.51" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
        <Rect x="30" y="11" width="48" height="5" rx="2.5" fill={lineMuted} />
      </G>
    </Svg>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const NotFound: React.FC<NotFoundProps> = ({
  title,
  subtitle,
  buttonText,
  onButtonPress,
  showBackButton,
  onBackPress,
  fullScreen = true,
  type = 'empty'
}) => {
  const { theme, isDarkMode } = useTheme();
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const renderIllustration = () => {
    switch (type) {
      case 'search':
        return <SearchEmptyIllustration isDarkMode={isDarkMode} primaryColor={theme.colors.primary} />;
      case 'test_series':
        return <TestSeriesEmptyIllustration isDarkMode={isDarkMode} primaryColor={theme.colors.primary} />;
      case 'course':
      case 'book':
      case 'empty':
      default:
        return <CourseEmptyIllustration isDarkMode={isDarkMode} primaryColor={theme.colors.primary} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: fullScreen ? theme.colors.background : 'transparent' }, !fullScreen && styles.embeddedContainer]}>
      <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.content}>
        
        {/* Animated Vector Illustration */}
        <Animated.View style={[styles.graphicWrapper, floatingStyle]}>
          {renderIllustration()}
        </Animated.View>

        {/* Title and Subtitle */}
        <Animated.View entering={FadeInDown.delay(150).duration(500).springify()} style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.textMain }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
        </Animated.View>

        {/* Action Button: Styled like the Modern Pill in user's mockup */}
        <Animated.View entering={FadeInDown.delay(300).duration(500).springify()} style={styles.btnWrapper}>
          {buttonText && onButtonPress && (
            <TouchableOpacity 
              style={[styles.pillBtn, { backgroundColor: theme.colors.primary }]} 
              activeOpacity={0.85}
              onPress={onButtonPress}
            >
              {type === 'search' ? (
                <RefreshCw color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
              ) : type === 'course' ? (
                <Compass color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
              ) : (
                <Plus color="#FFFFFF" size={17} strokeWidth={2.5} style={{ marginRight: 4 }} />
              )}
              <Text style={styles.pillBtnText}>{buttonText}</Text>
            </TouchableOpacity>
          )}

          {showBackButton && onBackPress && (
            <TouchableOpacity 
              style={[styles.outlineBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} 
              activeOpacity={0.7}
              onPress={onBackPress}
            >
              <ArrowLeft color={theme.colors.primary} size={16} style={{ marginRight: 6 }} />
              <Text style={[styles.outlineBtnText, { color: theme.colors.textMain }]}>Go Back</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  embeddedContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 32,
    minHeight: 280,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  graphicWrapper: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 320,
  },
  btnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pill button matching reference design
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  pillBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
    borderWidth: 1.5,
    marginTop: 10,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default NotFound;
