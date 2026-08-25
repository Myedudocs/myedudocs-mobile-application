import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export const BlogSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Image Area */}
      <SkeletonLoader width="100%" height={140} borderRadius={12} style={{ marginBottom: 14 }} />

      {/* Tags Row */}
      <View style={styles.tagsRow}>
        <SkeletonLoader width={60} height={12} borderRadius={4} />
        <SkeletonLoader width={70} height={12} borderRadius={4} />
      </View>

      {/* Title */}
      <SkeletonLoader width="100%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonLoader width="70%" height={18} borderRadius={4} style={{ marginBottom: 10 }} />

      {/* Excerpt */}
      <SkeletonLoader width="95%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="80%" height={12} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Footer Row */}
      <View style={styles.footerRow}>
        <SkeletonLoader width={80} height={12} borderRadius={4} />
        <SkeletonLoader width={70} height={14} borderRadius={4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { width: 280, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 12 },
  tagsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
});

export default BlogSkeleton;
