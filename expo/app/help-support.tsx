import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  Mail,
  Send,
  BookOpen,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSendSupportEnquiry, useStartSupportConversation } from '@/lib/queries/chat';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/lib/errors';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'How do I book a car?',
    answer: 'Browse the available cars on the Home or Search tab, tap on a car to view details, then tap "Rent Now" to select your pickup/return dates and location and submit your request. The fleet owner will review and approve it.',
  },
  {
    id: '2',
    question: 'What documents do I need?',
    answer: 'You need a valid driver\'s license and a government-issued ID (Ghana Card or Passport). Upload these in the KYC Verification section of your Profile to get verified.',
  },
  {
    id: '3',
    question: 'Can I cancel my booking?',
    answer: 'Yes. Reach out to the fleet owner directly using the WhatsApp or Call button on your booking to arrange a cancellation.',
  },
  {
    id: '4',
    question: 'How do I pay for my rental?',
    answer: 'GoCar Hub connects you with the fleet owner. Once your booking is approved, you\'ll receive their contact details to arrange payment and pickup directly with them.',
  },
  {
    id: '5',
    question: 'How do I contact the car owner?',
    answer: 'Once your booking is approved, you\'ll receive the owner\'s contact details. You can also use the WhatsApp button on the car detail page for pre-booking questions.',
  },
  {
    id: '6',
    question: 'Is insurance included?',
    answer: 'Insurance arrangements for a rental are between you and the fleet owner — ask them directly when you connect about your booking.',
  },
  {
    id: '7',
    question: 'Can I buy a car from the Marketplace?',
    answer: 'Yes! Browse the Cars For Sale section on the Home tab or go to the full Marketplace. Tap "Chat on WhatsApp" or "Request Call" to connect with the dealer.',
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.faqCard}>
      <Pressable style={styles.faqHeader} onPress={() => setOpen(!open)}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        {open ? (
          <ChevronUp size={18} color={Colors.orange.primary} />
        ) : (
          <ChevronDown size={18} color={Colors.gray[400]} />
        )}
      </Pressable>
      {open && (
        <View style={styles.faqBody}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const sendEnquiry = useSendSupportEnquiry();
  const startSupportConversation = useStartSupportConversation();

  const handleSend = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both subject and message.');
      return;
    }
    sendEnquiry.mutate(`${subject.trim()}: ${message.trim()}`, {
      onSuccess: (conv) => {
        setSubject('');
        setMessage('');
        Alert.alert('Message Sent', 'Our support team will get back to you soon.', [
          { text: 'View Conversation', onPress: () => router.push({ pathname: '/chat', params: { id: conv.id } }) },
          { text: 'OK', style: 'cancel' },
        ]);
      },
      onError: (err) => Alert.alert('Could not send', getErrorMessage(err, 'Please try again.')),
    });
  };

  const handleWhatsApp = () => {
    void Linking.openURL('https://wa.me/233241234567?text=Hi%20GoCar%20Hub%20Support');
  };

  const handleCall = () => {
    void Linking.openURL('tel:+233241234567');
  };

  const handleEmail = () => {
    void Linking.openURL('mailto:support@gocarhub.gh');
  };

  const handleChat = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    startSupportConversation.mutate(undefined, {
      onSuccess: (conv) => router.push({ pathname: '/chat', params: { id: conv.id } }),
      onError: (err) => Alert.alert('Could not start chat', getErrorMessage(err, 'Please try again.')),
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.contactRow}>
          <Pressable style={[styles.contactBtn, { backgroundColor: Colors.orange.primary }]} onPress={handleChat} disabled={startSupportConversation.isPending} testID="support-chat-btn">
            <MessageCircle size={22} color={Colors.white} />
            <Text style={styles.contactBtnText}>Chat</Text>
          </Pressable>
          <Pressable style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
            <MessageCircle size={22} color={Colors.white} />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
          </Pressable>
          <Pressable style={[styles.contactBtn, { backgroundColor: Colors.info }]} onPress={handleCall}>
            <Phone size={22} color={Colors.white} />
            <Text style={styles.contactBtnText}>Call Us</Text>
          </Pressable>
          <Pressable style={[styles.contactBtn, { backgroundColor: Colors.purple.medium }]} onPress={handleEmail}>
            <Mail size={22} color={Colors.white} />
            <Text style={styles.contactBtnText}>Email</Text>
          </Pressable>
        </View>

        <View style={styles.quickHelpCard}>
          <BookOpen size={20} color={Colors.orange.primary} />
          <View style={styles.quickHelpContent}>
            <Text style={styles.quickHelpTitle}>Quick Help Center</Text>
            <Text style={styles.quickHelpSub}>Find answers to common questions below</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq) => (
          <FAQAccordion key={faq.id} item={faq} />
        ))}

        <Text style={styles.sectionTitle}>Contact Support</Text>
        <View style={styles.formCard}>
          <View style={styles.inputWrap}>
            <HelpCircle size={16} color={Colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="Subject"
              placeholderTextColor={Colors.gray[400]}
              value={subject}
              onChangeText={setSubject}
            />
          </View>
          <View style={[styles.inputWrap, styles.messageWrap]}>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Describe your issue..."
              placeholderTextColor={Colors.gray[400]}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          <Pressable
            style={[styles.sendBtn, sendEnquiry.isPending && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sendEnquiry.isPending}
            testID="support-send-btn"
          >
            <Send size={16} color={Colors.white} />
            <Text style={styles.sendBtnText}>{sendEnquiry.isPending ? 'Sending…' : 'Send Message'}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Support Hours: Mon–Fri 8AM–6PM</Text>
          <Text style={styles.footerSub}>Sat 9AM–4PM · Sun Closed</Text>
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
  contactRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  contactBtn: {
    flexBasis: '47%' as const,
    flexGrow: 1,
    alignItems: 'center' as const,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  contactBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  quickHelpCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.purple.deep,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  quickHelpContent: {
    flex: 1,
  },
  quickHelpTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  quickHelpSub: {
    fontSize: 12,
    color: Colors.gray[400],
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginBottom: 14,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden' as const,
  },
  faqHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[900],
    flex: 1,
    marginRight: 12,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.gray[600],
    lineHeight: 20,
    marginTop: 10,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    gap: 12,
  },
  inputWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  messageWrap: {
    alignItems: 'flex-start' as const,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[900],
  },
  messageInput: {
    height: 100,
    lineHeight: 20,
  },
  sendBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.orange.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  footer: {
    alignItems: 'center' as const,
    marginTop: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.gray[600],
  },
  footerSub: {
    fontSize: 12,
    color: Colors.gray[400],
  },
});
