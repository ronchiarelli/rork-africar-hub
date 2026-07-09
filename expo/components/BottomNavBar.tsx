import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, CalendarDays, User, LayoutDashboard } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface NavItem {
  label: string;
  route: '/' | '/dashboard' | '/bookings' | '/profile';
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', route: '/', icon: Home },
  { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookings', route: '/bookings', icon: CalendarDays },
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
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon size={20} color={isActive ? Colors.orange.primary : Colors.gray[400]} strokeWidth={isActive ? 2.5 : 2} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: 12,
    paddingHorizontal: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  item: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconWrapActive: {
    backgroundColor: Colors.orange.faint,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.gray[400],
  },
  labelActive: {
    color: Colors.orange.primary,
    fontWeight: '700' as const,
  },
});
