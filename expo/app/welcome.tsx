import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import AppLogo from '@/components/AppLogo';



export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80' }}
        style={styles.bgImage}
        contentFit="cover"
      />
      <View style={styles.overlay} />

      <Animated.View style={[styles.content, { paddingTop: insets.top + 40, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <AppLogo size={56} />

        <View style={styles.heroText}>
          <Text style={styles.title}>Premium Car{'\n'}Rental in Ghana</Text>
          <Text style={styles.subtitle}>
            Discover luxury vehicles, book seamlessly, and hit the road with confidence.
          </Text>
        </View>

        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <ChevronRight size={18} color={Colors.white} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.purple.deep,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 10, 46, 0.82)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between' as const,
  },
  heroText: {
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: '900' as const,
    color: Colors.white,
    lineHeight: 48,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[400],
    marginTop: 14,
    lineHeight: 24,
  },
  bottomSection: {},
  primaryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.orange.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 6,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  secondaryBtn: {
    alignItems: 'center' as const,
    paddingVertical: 16,
    marginTop: 8,
  },
  secondaryBtnText: {
    color: Colors.gray[400],
    fontSize: 15,
    fontWeight: '500' as const,
  },
});
