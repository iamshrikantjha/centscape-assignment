import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const LoadingSkeleton: React.FC = () => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = () => {
      shimmerAnimation.setValue(0);
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => shimmer());
    };
    shimmer();
  }, [shimmerAnimation]);

  const animatedStyle = {
    opacity: shimmerAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.8, 0.3],
    }),
  };

  const SkeletonCard = () => (
    <Animated.View style={[styles.skeletonCard, animatedStyle]}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonDetails}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonTitleSecond} />
          <View style={styles.skeletonPrice} />
          <View style={styles.skeletonSite} />
          <View style={styles.skeletonDate} />
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skeletonRow: {
    flexDirection: 'row',
  },
  skeletonImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e1e1e1',
  },
  skeletonDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    marginBottom: 6,
    width: '85%',
  },
  skeletonTitleSecond: {
    height: 16,
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonPrice: {
    height: 18,
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    marginBottom: 8,
    width: '40%',
  },
  skeletonSite: {
    height: 14,
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    marginBottom: 8,
    width: '50%',
  },
  skeletonDate: {
    height: 12,
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    width: '30%',
  },
});