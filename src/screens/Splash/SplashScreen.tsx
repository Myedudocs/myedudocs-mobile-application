import React, { useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  View,
  Image
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolation,
  withDelay
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const APP_ICON = require('../../../assets/images/app_icon.png');

export const SplashScreen = () => {
  const { theme, isDarkMode } = useTheme();

  // Shared Values for Animation
  const pulse = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Loop the Pulse
    pulse.value = withRepeat(
      withTiming(1, { duration: 2500 }),
      -1,
      false
    );

    // 2. Pop-in Logo with extra "premium" spring
    logoScale.value = withSpring(1, { damping: 8, stiffness: 90 });
    logoOpacity.value = withTiming(1, { duration: 1000 });

    // 3. Slide in Text with Delay
    textTranslateY.value = withDelay(600, withSpring(0, { damping: 12 }));
    textOpacity.value = withDelay(600, withTiming(1, { duration: 1000 }));
  }, []);

  // Animated Styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 2.8]) }],
    opacity: interpolate(pulse.value, [0, 0.5, 1], [0.4, 0.2, 0], Extrapolation.CLAMP),
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      {/* --- PREMIUM PULSE BACKGROUND --- */}
      <View style={styles.centerRef}>
        <Animated.View style={[styles.pulseCircle, pulseStyle]} />
        <Animated.View style={[styles.pulseCircle, { width: 150, height: 150, borderRadius: 75 }, pulseStyle]} />
      </View>

      {/* --- CENTRAL LOGO --- */}
      <Animated.View style={[styles.logoContainer, logoStyle, { backgroundColor: theme.colors.surface }]}>
        <Image
          source={APP_ICON}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* --- BOTTOM TEXT AREA --- */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        <View style={[styles.accentBar, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)' }]} />
        <View style={styles.titleWrap}>
          <Animated.Text style={styles.appTitle}>MyEduDocs</Animated.Text>
          <View style={[styles.taglineBox, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <Animated.Text style={styles.tagline}>Sabko Padhao</Animated.Text>
          </View>
        </View>
      </Animated.View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerRef: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  logoContainer: {
    width: 132,
    height: 132,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
    zIndex: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  textContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: height * 0.1,
  },
  accentBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },
  titleWrap: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  taglineBox: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;