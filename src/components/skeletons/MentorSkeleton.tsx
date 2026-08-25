import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export const MentorSkeleton = () => {
  return (
    <View style={styles.card}>
      <SkeletonLoader width={80} height={80} borderRadius={24} style={{ marginBottom: 12 }} />
      <SkeletonLoader width={100} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonLoader width={80} height={12} borderRadius={4} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    width: 140, 
    padding: 12, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    backgroundColor: '#FFFFFF', 
    alignItems: 'center',
  },
});

export default MentorSkeleton;
