import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  AlertCircle,
  CreditCard,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockWallet } from '@/mocks/cars';
import { WalletTransaction } from '@/types/car';

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === 'credit';
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: isCredit ? Colors.success + '15' : Colors.error + '15' }]}>
        {isCredit ? (
          <ArrowDownLeft size={18} color={Colors.success} />
        ) : (
          <ArrowUpRight size={18} color={Colors.error} />
        )}
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
        <Text style={styles.txDate}>{tx.date}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isCredit ? Colors.success : Colors.error }]}>
          {isCredit ? '+' : '-'}GH₵{tx.amount.toLocaleString()}
        </Text>
        <View style={[styles.txStatusBadge, { backgroundColor: tx.status === 'completed' ? Colors.success + '15' : Colors.warning + '15' }]}>
          <Text style={[styles.txStatus, { color: tx.status === 'completed' ? Colors.success : Colors.warning }]}>
            {tx.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const handleTopUp = () => {
    Alert.alert('Top Up Wallet', 'Choose a top-up method:', [
      { text: 'MTN MoMo', onPress: () => Alert.alert('Success', 'Wallet topped up via MTN MoMo!') },
      { text: 'Vodafone Cash', onPress: () => Alert.alert('Success', 'Wallet topped up via Vodafone Cash!') },
      { text: 'Bank Card', onPress: () => Alert.alert('Success', 'Wallet topped up via Bank Card!') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const totalIn = mockWallet.transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalOut = mockWallet.transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconWrap}>
              <WalletIcon size={24} color={Colors.white} />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceValue}>GH₵{mockWallet.balance.toLocaleString()}</Text>
          <Pressable style={styles.topUpBtn} onPress={handleTopUp}>
            <Plus size={16} color={Colors.purple.deep} />
            <Text style={styles.topUpText}>Top Up</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <ArrowDownLeft size={18} color={Colors.success} />
            <Text style={styles.statAmount}>GH₵{totalIn.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total In</Text>
          </View>
          <View style={styles.statBox}>
            <ArrowUpRight size={18} color={Colors.error} />
            <Text style={styles.statAmount}>GH₵{totalOut.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Out</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Pressable style={styles.quickBtn} onPress={handleTopUp}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.success + '15' }]}>
              <Plus size={20} color={Colors.success} />
            </View>
            <Text style={styles.quickLabel}>Top Up</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => Alert.alert('Coming Soon', 'Withdrawal feature is coming soon!')}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.info + '15' }]}>
              <CreditCard size={20} color={Colors.info} />
            </View>
            <Text style={styles.quickLabel}>Withdraw</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => Alert.alert('Coming Soon', 'Transfer feature is coming soon!')}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.purple.medium + '15' }]}>
              <ArrowUpRight size={20} color={Colors.purple.medium} />
            </View>
            <Text style={styles.quickLabel}>Transfer</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <Pressable onPress={() => Alert.alert('Coming Soon', 'Full transaction history with filtering is coming soon!')}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        <View style={styles.txCard}>
          {mockWallet.transactions.map((tx, idx) => (
            <View key={tx.id}>
              <TransactionRow tx={tx} />
              {idx < mockWallet.transactions.length - 1 && <View style={styles.txDivider} />}
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <AlertCircle size={18} color={Colors.orange.primary} />
          <Text style={styles.infoText}>
            Your wallet is secured with 256-bit encryption. All transactions are monitored for fraud protection.
          </Text>
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
  balanceCard: {
    backgroundColor: Colors.purple.deep,
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  },
  balanceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.gray[400],
    fontWeight: '500' as const,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  topUpBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
    gap: 6,
  },
  topUpText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  quickActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: 24,
  },
  quickBtn: {
    alignItems: 'center' as const,
    gap: 6,
  },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.gray[700],
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
  },
  txCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  txRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[900],
  },
  txDate: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end' as const,
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  txStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txStatus: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'capitalize' as const,
  },
  txDivider: {
    height: 1,
    backgroundColor: Colors.gray[100],
  },
  infoCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: Colors.orange.faint,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.orange.primary,
    lineHeight: 18,
  },
});
