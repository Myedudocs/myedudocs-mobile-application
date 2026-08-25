import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export const BookSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Target Image */}
      <SkeletonLoader height={180} borderRadius={12} style={{ marginBottom: 16 }} />
      
      {/* Category */}
      <SkeletonLoader width={80} height={12} borderRadius={4} style={{ marginBottom: 6 }} />

      {/* Title */}
      <SkeletonLoader width="90%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="60%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />

      {/* Author */}
      <SkeletonLoader width={100} height={14} borderRadius={4} style={{ marginBottom: 12 }} />

      {/* Rating */}
      <SkeletonLoader width={70} height={16} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <SkeletonLoader width={60} height={20} borderRadius={4} style={{ marginBottom: 4 }} />
          <SkeletonLoader width={80} height={12} borderRadius={4} />
        </View>
        <SkeletonLoader width={100} height={40} borderRadius={8} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 20, padding: 16, backgroundColor: '#FFFFFF', marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
});

export default BookSkeleton;
