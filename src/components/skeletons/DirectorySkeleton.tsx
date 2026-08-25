import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DirectorySkeletonProps {
  type?: 'card' | 'list' | 'test';
  count?: number;
}

export const DirectorySkeleton = ({ type = 'card', count = 4 }: DirectorySkeletonProps) => {
  const opacity = new Animated.Value(0.3);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const renderSkeletonItem = (index: number) => {
    if (type === 'card') {
      return (
        <View key={index} style={styles.card}>
          <Animated.View style={[styles.cardImage, { opacity }]} />
          <View style={styles.cardContent}>
            <Animated.View style={[styles.titleLine, { opacity }]} />
            <Animated.View style={[styles.subTitleLine, { opacity, width: '60%' }]} />
            <View style={styles.footerRow}>
              <Animated.View style={[styles.priceLine, { opacity }]} />
              <Animated.View style={[styles.btnPlaceholder, { opacity }]} />
            </View>
          </View>
        </View>
      );
    }

    if (type === 'list') {
      return (
        <View key={index} style={styles.listRow}>
          <Animated.View style={[styles.listImage, { opacity }]} />
          <View style={styles.listContent}>
            <Animated.View style={[styles.titleLine, { opacity }]} />
            <Animated.View style={[styles.subTitleLine, { opacity, width: '40%' }]} />
            <Animated.View style={[styles.subTitleLine, { opacity, width: '80%', marginTop: 8 }]} />
          </View>
        </View>
      );
    }

    if (type === 'test') {
        return (
          <View key={index} style={styles.testCard}>
            <View style={styles.testHeader}>
              <Animated.View style={[styles.testIcon, { opacity }]} />
              <View style={{ flex: 1 }}>
                <Animated.View style={[styles.titleLine, { opacity, width: '90%' }]} />
                <Animated.View style={[styles.subTitleLine, { opacity, width: '50%' }]} />
              </View>
            </View>
            <View style={styles.testFooter}>
              <Animated.View style={[styles.testStat, { opacity }]} />
              <Animated.View style={[styles.testStat, { opacity }]} />
              <Animated.View style={[styles.testStat, { opacity }]} />
            </View>
          </View>
        );
      }

    return null;
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => renderSkeletonItem(i))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardImage: {
    height: 140,
    backgroundColor: '#E2E8F0',
  },
  cardContent: {
    padding: 12,
  },
  titleLine: {
    height: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  subTitleLine: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  priceLine: {
    height: 20,
    width: 60,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  btnPlaceholder: {
    height: 32,
    width: 80,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  listRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  listImage: {
    width: 80,
    height: 80,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  testIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  testFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testStat: {
    height: 30,
    width: '30%',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
});
