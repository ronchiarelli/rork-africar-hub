import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lightbulb, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

interface TipBannerProps {
  id: string;
  text: string;
  testID?: string;
}

export default function TipBanner({ id, text, testID }: TipBannerProps) {
  const { currentUser } = useAuth();
  const storageKey = `tip_dismissed:${currentUser?.id ?? 'anon'}:${id}`;
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey).then((value) => {
      if (!cancelled) setDismissed(value === '1');
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    void AsyncStorage.setItem(storageKey, '1');
  }, [storageKey]);

  if (dismissed !== false) return null;

  return (
    <View style={styles.banner} testID={testID}>
      <Lightbulb size={16} color={Colors.orange.primary} />
      <Text style={styles.text}>{text}</Text>
      <Pressable onPress={handleDismiss} hitSlop={8} testID={testID ? `${testID}-dismiss` : undefined}>
        <X size={16} color={Colors.gray[500]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: Colors.orange.faint,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[700],
    lineHeight: 18,
  },
});
