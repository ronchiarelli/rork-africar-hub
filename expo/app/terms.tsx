import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '@/constants/colors';

const LAST_UPDATED = 'July 9, 2026';

interface Section {
  heading: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    heading: '1. Acceptance of Terms',
    body: [
      'These Terms of Service ("Terms") govern your use of the GoCar Hub mobile and web application (the "Service"), operated by GoCar Hub. By creating an account or using the Service, you agree to be bound by these Terms.',
    ],
  },
  {
    heading: '2. Description of Service',
    body: [
      'GoCar Hub is a marketplace that connects customers with independent, third-party fleet owners (for car rentals) and vehicle dealers/garages (for car sales) in Ghana.',
      'GoCar Hub is not a car rental company, is not a car dealer, and is not a party to any rental agreement or sale transaction made between users. We do not own, inspect, or guarantee the condition of any vehicle listed on the platform.',
      'Payment for a rental or a vehicle purchase is arranged directly between the customer and the fleet owner or dealer, entirely off-platform. GoCar Hub does not process, hold, or guarantee any such payment.',
    ],
  },
  {
    heading: '3. Eligibility & Account Registration',
    body: [
      'You must be at least 18 years old and capable of forming a binding contract to use GoCar Hub.',
      'You agree to provide accurate, current information when creating your account, and to keep it up to date.',
      'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.',
    ],
  },
  {
    heading: '4. Identity Verification (KYC)',
    body: [
      'To help keep the marketplace trustworthy, you must complete our identity verification process before you can create a booking, or list a vehicle for rent or sale. This requires submitting a government-issued ID and a selfie photo for review.',
      'GoCar Hub may approve, reject, or revoke a verification at its discretion if submitted information appears inaccurate, fraudulent, or otherwise fails our review.',
    ],
  },
  {
    heading: '5. Fleet Owner & Dealership Subscriptions',
    body: [
      'Fleet owner and dealership accounts require an active monthly platform subscription to list vehicles. The current subscription fee is GH₵150/month, which includes an initial free trial period.',
      'Subscriptions are billed through our payment partner, Hubtel, and renew automatically each period unless cancelled. If a subscription lapses, your vehicle listings are hidden from the marketplace until it is reactivated.',
      'GoCar Hub may change subscription pricing with reasonable notice to affected accounts.',
    ],
  },
  {
    heading: '6. User Conduct',
    body: [
      'You agree to use GoCar Hub honestly and lawfully, including: providing accurate vehicle listings and pricing, communicating in good faith with other users, and not using the platform for any fraudulent, illegal, or harmful purpose.',
      'You agree not to attempt to circumvent, disable, or interfere with the security or proper functioning of the Service.',
    ],
  },
  {
    heading: '7. Bookings, Sales & Disclaimer',
    body: [
      'All rental terms (pricing, duration, condition, insurance, fuel policy, etc.) and all vehicle sale terms are agreed directly between the customer and the fleet owner or dealer. GoCar Hub is not responsible for, and disclaims all liability for, the accuracy of any listing, the condition or roadworthiness of any vehicle, the conduct of any user, or the outcome of any transaction arranged through the platform.',
      'Any dispute arising from a rental or sale is between the customer and the fleet owner or dealer involved; GoCar Hub is not a party to and does not mediate such disputes, though we may assist in good faith where possible.',
    ],
  },
  {
    heading: '8. Reviews & User Content',
    body: [
      'Any reviews, messages, or other content you submit must be honest and lawful. GoCar Hub may remove content that violates these Terms or that we determine, in our discretion, to be harmful, misleading, or inappropriate.',
    ],
  },
  {
    heading: '9. Account Suspension & Termination',
    body: [
      'GoCar Hub may suspend or terminate your account at any time, with or without notice, if we reasonably believe you have violated these Terms, engaged in fraudulent or harmful conduct, or misused the platform.',
      'You may stop using the Service and request account deletion at any time through Settings or by contacting us.',
    ],
  },
  {
    heading: '10. Disclaimer of Warranties & Limitation of Liability',
    body: [
      'The Service is provided "as is" and "as available" without warranties of any kind, express or implied. GoCar Hub does not warrant that the Service will be uninterrupted, error-free, or secure.',
      'To the fullest extent permitted by law, GoCar Hub shall not be liable for any indirect, incidental, special, or consequential damages, or for any loss arising from a transaction, vehicle, or interaction between users arranged through the platform.',
    ],
  },
  {
    heading: '11. Governing Law',
    body: [
      'These Terms are governed by the laws of the Republic of Ghana, without regard to conflict-of-law principles.',
    ],
  },
  {
    heading: '12. Changes to These Terms',
    body: [
      'We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.',
    ],
  },
  {
    heading: '13. Contact Us',
    body: [
      'Questions about these Terms can be sent to support@gocarhub.gh.',
    ],
  },
];

export default function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

      {SECTIONS.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.body.map((paragraph, idx) => (
            <Text key={idx} style={styles.paragraph}>{paragraph}</Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  updated: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 4,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.gray[700],
    marginBottom: 8,
  },
});
