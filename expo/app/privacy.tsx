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
    heading: '1. Introduction',
    body: [
      'GoCar Hub ("we", "us", "our") operates a marketplace mobile and web application connecting customers with independent car rental fleet owners and vehicle dealers/garages in Ghana. This Privacy Policy explains what information we collect, how we use it, and the choices you have.',
      'By creating an account or using GoCar Hub, you agree to the collection and use of information as described in this policy.',
    ],
  },
  {
    heading: '2. Information We Collect',
    body: [
      'Account information: your name, email address, phone number, and profile photo when you register.',
      'Identity verification (KYC) documents: a government-issued ID (Ghana Card or Passport), driver’s license, and a selfie photo, submitted to verify your identity before you can book or list a vehicle.',
      'Listing and booking information: details you provide about vehicles you list for rent or sale, and booking requests you make or receive, including pickup/return dates and locations.',
      'Communications: messages, reviews, and support requests you submit through the app.',
      'Usage and device information: how you interact with the app, your device type and operating system, and general location (e.g. city) used to show relevant listings.',
    ],
  },
  {
    heading: '3. How We Use Your Information',
    body: [
      'To create and manage your account and role (customer, fleet owner, dealership, or admin).',
      'To verify your identity through our KYC review process, which helps keep the marketplace trustworthy for everyone.',
      'To facilitate bookings and sale inquiries between customers and fleet owners/dealers.',
      'To process subscription billing for fleet owner and dealership accounts (see Section 5).',
      'To send you notifications about your bookings, listings, and account activity.',
      'To maintain the security of the platform, prevent fraud, and enforce our Terms of Service.',
    ],
  },
  {
    heading: '4. How Identity Verification (KYC) Documents Are Handled',
    body: [
      'Your ID documents and selfie are stored in a private, access-controlled storage bucket. They are visible only to you and to authorized GoCar Hub administrators performing identity review — they are never publicly accessible or shown to other users.',
      'These documents are used solely to confirm your identity and eligibility to book or list vehicles on the platform. We do not sell or share your ID documents with any third party, except where required by law.',
    ],
  },
  {
    heading: '5. Payments',
    body: [
      'GoCar Hub is not a party to, and does not process payment for, any vehicle rental or sale — those payments are arranged directly between the customer and the fleet owner or dealer, off-platform.',
      'Fleet owner and dealership accounts pay GoCar Hub a monthly platform subscription fee. Subscription payments are processed by our payment partner, Hubtel. We do not store your Mobile Money PIN or full card details — these are handled directly by Hubtel’s secure payment systems.',
    ],
  },
  {
    heading: '6. How We Share Information',
    body: [
      'With other users, but only as needed to facilitate a booking or sale inquiry: for example, a fleet owner receives a customer’s name and phone number once a booking request is made, and a dealer receives a customer’s contact details when they express interest in a vehicle.',
      'With service providers who help us operate the platform, including Supabase (database, authentication, and file storage) and Hubtel (subscription payment processing). These providers only access what they need to perform their service for us.',
      'When required by law, to protect the rights, safety, or property of GoCar Hub, our users, or the public.',
      'We do not sell your personal information to third parties.',
    ],
  },
  {
    heading: '7. Data Storage & Security',
    body: [
      'Your data is stored using Supabase’s cloud infrastructure with encryption in transit and database-level access controls that restrict each user to their own data unless a specific, narrow exception applies (such as a fleet owner seeing a customer’s contact details for their own booking).',
      'No method of electronic storage or transmission is 100% secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    heading: '8. Data Retention',
    body: [
      'We retain your information for as long as your account is active. If you request account deletion, we will delete or anonymize your personal information, except where we are required to retain certain records for legal, tax, or fraud-prevention purposes.',
    ],
  },
  {
    heading: '9. Your Rights',
    body: [
      'You can review and update your profile information at any time from within the app.',
      'You can request a copy of your data, or request deletion of your account and associated data, by contacting us using the details below.',
    ],
  },
  {
    heading: '10. Children’s Privacy',
    body: [
      'GoCar Hub is not directed to individuals under the age of 18, and we do not knowingly collect personal information from children.',
    ],
  },
  {
    heading: '11. Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy in the app with a new "Last updated" date.',
    ],
  },
  {
    heading: '12. Contact Us',
    body: [
      'If you have questions about this Privacy Policy or how your information is handled, contact us at support@gocarhub.gh.',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>
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
