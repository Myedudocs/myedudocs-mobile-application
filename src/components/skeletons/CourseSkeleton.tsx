import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export const CourseSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Target Image */}
      <SkeletonLoader height={140} borderRadius={10} style={{ marginBottom: 16 }} />
      
      {/* Tags Row */}
      <View style={styles.tagsRow}>
        <View style={styles.leftTags}>
          <SkeletonLoader width={60} height={16} borderRadius={4} />
          <SkeletonLoader width={50} height={16} borderRadius={4} />
        </View>
        <SkeletonLoader width={80} height={28} borderRadius={6} />
      </View>

      {/* Title Row */}
      <View style={styles.titleRow}>
        <SkeletonLoader width="70%" height={20} borderRadius={4} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <SkeletonLoader width={20} height={20} borderRadius={10} />
          <SkeletonLoader width={20} height={20} borderRadius={10} />
        </View>
      </View>

      {/* Mentor */}
      <SkeletonLoader width="40%" height={14} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Rating */}
      <SkeletonLoader width={60} height={20} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <SkeletonLoader width="25%" height={16} borderRadius={4} />
        <SkeletonLoader width="25%" height={16} borderRadius={4} />
        <SkeletonLoader width="25%" height={16} borderRadius={4} />
      </View>

      {/* Footer Row */}
      <View style={styles.footerRow}>
        <View>
          <SkeletonLoader width={80} height={22} borderRadius={4} style={{ marginBottom: 4 }} />
          <SkeletonLoader width={100} height={14} borderRadius={4} />
        </View>
        <SkeletonLoader width={100} height={42} borderRadius={8} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 16, padding: 14, backgroundColor: '#FFFFFF', marginBottom: 16 },
  tagsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leftTags: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
});

export default CourseSkeleton;
