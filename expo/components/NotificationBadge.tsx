import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface NotificationBadgeProps {
  count: number;
}

// A small pulsing bubble badge — draws the eye to unread/pending items
// (KYC updates, messages, notifications) without a static dot getting lost
// among other UI. Renders nothing when count is 0.
export default function NotificationBadge({ count }: NotificationBadgeProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (count <= 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [count, pulse]);

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale: pulse }] }]} testID="notification-badge">
      <Text style={styles.text}>{count > 9 ? '9+' : count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.orange.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  text: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
  },
});
