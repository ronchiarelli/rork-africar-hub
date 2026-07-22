import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Car, ShieldCheck, MessageCircle, Store, Bell } from 'lucide-react-native';
import Colors from '@/constants/colors';
import AppLogo from '@/components/AppLogo';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: <Car size={20} color={Colors.orange.primary} />,
    title: 'Rent Premium Cars',
    description: 'Browse and book verified vehicles across Ghana in just a few taps.',
  },
  {
    icon: <ShieldCheck size={20} color={Colors.orange.primary} />,
    title: 'Verified & Secure',
    description: 'KYC verification keeps every renter and owner safe and trustworthy.',
  },
  {
    icon: <MessageCircle size={20} color={Colors.orange.primary} />,
    title: 'Chat Directly',
    description: 'Message car owners and dealers in real time to arrange your trip.',
  },
  {
    icon: <Store size={20} color={Colors.orange.primary} />,
    title: 'Buy or Sell Cars',
    description: 'Explore the Marketplace for used and new cars for sale, not just rentals.',
  },
  {
    icon: <Bell size={20} color={Colors.orange.primary} />,
    title: 'Stay Updated',
    description: 'Get notified instantly on booking approvals, messages, and payments.',
  },
];

interface WelcomeFeaturesModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function WelcomeFeaturesModal({ visible, onDismiss }: WelcomeFeaturesModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <AppLogo size={48} />
            <Text style={styles.title}>Welcome to GoCar Hub!</Text>
            <Text style={styles.subtitle}>Here&apos;s what you can do</Text>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {FEATURES.map((feature) => (
              <View key={feature.title} style={styles.featureRow}>
                <View style={styles.iconWrap}>{feature.icon}</View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.ctaBtn} onPress={onDismiss} testID="welcome-features-dismiss">
            <Text style={styles.ctaBtnText}>Get Started</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%' as const,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 18,
  },
  title: {
    fontSize: 21,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginTop: 14,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 4,
  },
  list: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginBottom: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.orange.faint,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
    lineHeight: 17,
  },
  ctaBtn: {
    backgroundColor: Colors.orange.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  ctaBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
