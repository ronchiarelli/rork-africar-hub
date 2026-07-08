import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import {
  Bell,
  Shield,
  Moon,
  Globe,
  ChevronRight,
  Info,
  FileText,
  Trash2,
  Smartphone,
  LogOut,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

interface SettingItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  value?: string;
  type: 'toggle' | 'navigate' | 'action' | 'destructive';
  isOn?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Request Submitted', 'Your account deletion request has been submitted for review.');
          },
        },
      ]
    );
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => void logout() },
    ]);
  }, [logout]);

  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'push',
          icon: <Bell size={20} color={Colors.orange.primary} />,
          label: 'Push Notifications',
          type: 'toggle',
          isOn: pushNotifications,
          onToggle: setPushNotifications,
        },
        {
          id: 'email',
          icon: <FileText size={20} color={Colors.info} />,
          label: 'Email Notifications',
          type: 'toggle',
          isOn: emailNotifications,
          onToggle: setEmailNotifications,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          id: 'biometric',
          icon: <Smartphone size={20} color={Colors.purple.medium} />,
          label: 'Biometric Authentication',
          type: 'toggle',
          isOn: biometricAuth,
          onToggle: setBiometricAuth,
        },
        {
          id: '2fa',
          icon: <Shield size={20} color={Colors.success} />,
          label: 'Two-Factor Authentication',
          type: 'toggle',
          isOn: twoFactor,
          onToggle: setTwoFactor,
        },
        {
          id: 'change_password',
          icon: <Shield size={20} color={Colors.warning} />,
          label: 'Change Password',
          type: 'navigate',
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'dark_mode',
          icon: <Moon size={20} color={Colors.purple.medium} />,
          label: 'Dark Mode',
          type: 'toggle',
          isOn: darkMode,
          onToggle: setDarkMode,
        },
        {
          id: 'language',
          icon: <Globe size={20} color={Colors.info} />,
          label: 'Language',
          value: 'English',
          type: 'navigate',
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          icon: <Info size={20} color={Colors.gray[600]} />,
          label: 'App Version',
          value: '1.0.0',
          type: 'navigate',
        },
        {
          id: 'terms',
          icon: <FileText size={20} color={Colors.gray[600]} />,
          label: 'Terms of Service',
          type: 'navigate',
        },
        {
          id: 'privacy',
          icon: <Shield size={20} color={Colors.gray[600]} />,
          label: 'Privacy Policy',
          type: 'navigate',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'logout',
          icon: <LogOut size={20} color={Colors.error} />,
          label: 'Logout',
          type: 'destructive',
          onPress: handleLogout,
        },
        {
          id: 'delete',
          icon: <Trash2 size={20} color={Colors.error} />,
          label: 'Delete Account',
          type: 'destructive',
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {sections.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, itemIdx) => (
                <View key={item.id}>
                  {item.type === 'toggle' ? (
                    <View style={styles.row}>
                      <View style={styles.rowLeft}>
                        <View style={styles.iconWrap}>{item.icon}</View>
                        <Text style={styles.label}>{item.label}</Text>
                      </View>
                      <Switch
                        value={item.isOn}
                        onValueChange={item.onToggle}
                        trackColor={{ false: Colors.gray[300], true: Colors.orange.primary + '80' }}
                        thumbColor={item.isOn ? Colors.orange.primary : '#f4f3f4'}
                      />
                    </View>
                  ) : item.type === 'destructive' ? (
                    <Pressable
                      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                      onPress={item.onPress}
                    >
                      <View style={styles.rowLeft}>
                        <View style={styles.iconWrap}>{item.icon}</View>
                        <Text style={styles.destructiveLabel}>{item.label}</Text>
                      </View>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                      onPress={
                        item.onPress ??
                        (() => Alert.alert(item.label, 'This feature is coming soon!'))
                      }
                    >
                      <View style={styles.rowLeft}>
                        <View style={styles.iconWrap}>{item.icon}</View>
                        <Text style={styles.label}>{item.label}</Text>
                      </View>
                      <View style={styles.rowRight}>
                        {item.value && <Text style={styles.value}>{item.value}</Text>}
                        <ChevronRight size={16} color={Colors.gray[400]} />
                      </View>
                    </Pressable>
                  )}
                  {itemIdx < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.footer}>
          <Text style={styles.footerText}>GoCar Hub v1.0.0</Text>
          <Text style={styles.footerSub}>Built for the Ghanaian market</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gray[500],
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowPressed: {
    backgroundColor: Colors.gray[50],
  },
  rowLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.gray[100],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  label: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.gray[800],
  },
  destructiveLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.error,
  },
  value: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.gray[400],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginLeft: 64,
  },
  footer: {
    alignItems: 'center' as const,
    marginTop: 8,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.gray[500],
  },
  footerSub: {
    fontSize: 12,
    color: Colors.gray[400],
  },
});
