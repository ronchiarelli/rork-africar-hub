import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, CalendarDays, User, LayoutDashboard, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface NavItem {
  label: string;
  route: '/' | '/dashboard' | '/bookings' | '/profile' | '/search';
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookings', route: '/bookings', icon: CalendarDays },
  { label: 'Home', route: '/', icon: Home },
  { label: 'Search', route: '/search', icon: Search },
  { label: 'Profile', route: '/profile', icon: User },
];

export default function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const handlePress = useCallback((route: NavItem['route']) => {
    router.push(route);
  }, [router]);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 14) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.route;
          const Icon = item.icon;
          return (
            <Pressable
              key={item.route}
              style={styles.item}
              onPress={() => handlePress(item.route)}
              testID={`nav-${item.label.toLowerCase()}`}
            >
              {isActive ? (
                <View style={styles.bubble}>
                  <Icon size={22} color={Colors.orange.primary} strokeWidth={2.4} />
                </View>
              ) : (
                <Icon size={21} color={Colors.gray[400]} strokeWidth={2} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 68,
    backgroundColor: Colors.purple.deep,
    borderRadius: 34,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 14,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  bubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: -24,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
});
