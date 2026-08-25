import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Image } from 'react-native';

export interface DashboardLoaderProps {
  size?: number;
  showLogo?: boolean;
  logoSource?: ReturnType<typeof require>;
}

const DEFAULT_APP_ICON = require('../../../assets/images/app_icon.png');

export const DashboardLoader: React.FC<DashboardLoaderProps> = ({
  size = 140,
  showLogo = true,
  logoSource,
}) => {
  const rotateOuter = useRef(new Animated.Value(0)).current;
  const rotateInner = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateOuter, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    Animated.loop(
      Animated.timing(rotateInner, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse, rotateInner, rotateOuter]);

  const outerSpin = rotateOuter.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const innerSpin = rotateInner.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.outerRing,
          { transform: [{ rotate: outerSpin }] },
        ]}
      />
      <Animated.View
        style={[
          styles.innerRing,
          { transform: [{ rotate: innerSpin }] },
        ]}
      />
      {showLogo ? (
        <Animated.View
          style={[
            styles.logoWrap,
            { transform: [{ scale: pulseScale }] },
          ]}
        >
          <Image
            source={logoSource || DEFAULT_APP_ICON}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: 999,
    borderWidth: 3,
    borderTopColor: '#6366f1',
    borderBottomColor: '#ec4899',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    shadowColor: '#6366f1',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  innerRing: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 999,
    borderWidth: 3,
    borderRightColor: '#8b5cf6',
    borderLeftColor: '#f59e0b',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    overflow: 'hidden',
    zIndex: 3,
    shadowColor: '#6366F1',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 28,
  },
});

export default DashboardLoader;