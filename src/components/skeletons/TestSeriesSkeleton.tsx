import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export const TestSeriesSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Tags Row */}
      <View style={styles.tagsRow}>
        <SkeletonLoader width={50} height={14} borderRadius={4} />
        <SkeletonLoader width={60} height={14} borderRadius={4} />
        <SkeletonLoader width={70} height={14} borderRadius={4} />
      </View>

      {/* Title & Actions Row */}
      <View style={styles.titleRow}>
        <SkeletonLoader width="70%" height={20} borderRadius={4} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <SkeletonLoader width={20} height={20} borderRadius={10} />
          <SkeletonLoader width={20} height={20} borderRadius={10} />
        </View>
      </View>

      {/* Description */}
      <SkeletonLoader width="90%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginBottom: 20 }} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <SkeletonLoader width={60} height={16} borderRadius={4} />
        <SkeletonLoader width={60} height={16} borderRadius={4} />
        <SkeletonLoader width={60} height={16} borderRadius={4} />
      </View>

      {/* Button */}
      <SkeletonLoader width="100%" height={48} borderRadius={12} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: { width: 310, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16 },
  tagsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
});

export default TestSeriesSkeleton;
