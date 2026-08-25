import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { fetchItemRating } from '../service/ratings.service';

interface Props {
  /** The item's MongoDB _id */
  itemId: string;
  /** Type of item – determines which API to call */
  itemType: 'book' | 'course' | 'test_series';
  /** 
   * Pre-loaded rating from the item object (e.g. course.rating / book.rating).
   * If provided AND > 0, we skip the network fetch entirely.
   */
  preloadedRating?: number;
  /** Pre-loaded review count from the item object */
  preloadedCount?: number;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Auth token – pass through if the endpoint needs it (optional) */
  token?: string;
}

/**
 * RatingBadge
 * -----------
 * Displays a real ★ rating badge.
 *
 * Priority:
 *   1. If preloadedRating > 0 → use it (no network call, instant render)
 *   2. Otherwise → fetch from the real backend review API and cache the result
 *
 * Usage:
 *   <RatingBadge itemId={book._id} itemType="book" preloadedRating={book.rating} preloadedCount={book.reviews} />
 */
const RatingBadge: React.FC<Props> = ({
  itemId,
  itemType,
  preloadedRating,
  preloadedCount,
  size = 'sm',
  token,
}) => {
  const [rating, setRating]   = useState<number>(preloadedRating || 0);
  const [count,  setCount]    = useState<number>(preloadedCount  || 0);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    // If we already have a valid preloaded rating, do NOT hit the network
    if (preloadedRating && preloadedRating > 0) {
      setRating(preloadedRating);
      setCount(preloadedCount || 0);
      setFetched(true);
      return;
    }

    // Otherwise fetch from the real API
    let cancelled = false;
    fetchItemRating(itemId, itemType, token).then(result => {
      if (!cancelled) {
        setRating(result.rating);
        setCount(result.count);
        setFetched(true);
      }
    });
    return () => { cancelled = true; };
  }, [itemId, itemType, preloadedRating, preloadedCount, token]);

  // Don't render anything if there are no reviews yet
  if (rating <= 0 && !fetched) return null;
  if (rating <= 0) return null;

  const isSm = size === 'sm';

  return (
    <View style={styles.row}>
      {/* Filled star badge */}
      <View style={styles.badge}>
        <Star
          size={isSm ? 10 : 12}
          color="#FFFFFF"
          fill="#FFFFFF"
          strokeWidth={0}
        />
        <Text style={[styles.badgeText, isSm ? styles.textSm : styles.textMd]}>
          {Number(rating).toFixed(1)}
        </Text>
      </View>

      {/* Count */}
      {count > 0 && (
        <Text style={[styles.countText, isSm ? styles.textSm : styles.textMd]}>
          ({count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  countText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  textSm: { fontSize: 10 },
  textMd: { fontSize: 12 },
});

export default RatingBadge;
