import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export const DetailsSkeleton = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <SkeletonLoader width={150} height={20} borderRadius={4} />
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <SkeletonLoader width="100%" height={240} borderRadius={0} />

        <View style={styles.paddingContainer}>
          {/* Tags */}
          <View style={styles.row}>
            <SkeletonLoader width={70} height={20} borderRadius={4} />
            <SkeletonLoader width={80} height={20} borderRadius={4} />
          </View>

          {/* Title */}
          <SkeletonLoader width="85%" height={28} borderRadius={4} style={{ marginTop: 16 }} />
          <SkeletonLoader width="60%" height={28} borderRadius={4} style={{ marginTop: 8 }} />

          {/* Stats */}
          <View style={[styles.row, { marginTop: 20 }]}>
            <SkeletonLoader width={100} height={20} borderRadius={4} />
            <SkeletonLoader width={100} height={20} borderRadius={4} />
          </View>

          {/* Highlights */}
          <View style={styles.highlightsCard}>
            <SkeletonLoader width="30%" height={60} borderRadius={8} />
            <SkeletonLoader width="30%" height={60} borderRadius={8} />
            <SkeletonLoader width="30%" height={60} borderRadius={8} />
          </View>

          {/* Tabs */}
          <View style={[styles.row, { marginTop: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
            <SkeletonLoader width="45%" height={40} borderRadius={8} />
            <SkeletonLoader width="45%" height={40} borderRadius={8} />
          </View>

          {/* Body Content */}
          <SkeletonLoader width="50%" height={22} borderRadius={4} style={{ marginTop: 24, marginBottom: 12 }} />
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} width="100%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <SkeletonLoader width={100} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonLoader width={120} height={24} borderRadius={4} />
        </View>
        <SkeletonLoader width="45%" height={50} borderRadius={12} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  paddingContainer: { padding: 20 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  highlightsCard: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16 },
  footer: { height: 90, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
});

export default DetailsSkeleton;
