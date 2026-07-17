import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  AlertCircle,
  Repeat,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWallet, useInitiateWalletTopUp } from '@/lib/queries/wallet';
import { useSubscription } from '@/lib/queries/subscriptions';
import { getErrorMessage } from '@/lib/errors';
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
  const router = useRouter();
  const { data: wallet } = useWallet();
  const { data: subscription } = useSubscription();
  const initiateTopUp = useInitiateWalletTopUp();
  const [topUpModalVisible, setTopUpModalVisible] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('');

  const handleTopUp = () => {
    setTopUpAmount('');
    setTopUpModalVisible(true);
  };

  const handleConfirmTopUp = () => {
    const amount = Number(topUpAmount);
    if (!Number.isFinite(amount) || amount < 10) {
      Alert.alert('Invalid amount', 'Enter an amount of at least GH₵10.');
      return;
    }
    initiateTopUp.mutate(amount, {
      onSuccess: (data) => {
        setTopUpModalVisible(false);
        if (Platform.OS === 'web') {
          window.open(data.checkoutUrl, '_blank');
        } else {
          // Presenting the in-app browser in the same tick as dismissing
          // this RN Modal races iOS's own dismiss animation and can leave
          // the app stuck ("Attempt to present view controller while a
          // presentation is in progress") — wait for the close animation
          // to finish first.
          setTimeout(() => {
            void WebBrowser.openBrowserAsync(data.checkoutUrl);
          }, 500);
        }
      },
      onError: (err) => {
        Alert.alert('Could not start top-up', getErrorMessage(err, 'Something went wrong. Please try again.'));
      },
    });
  };

  const transactions = wallet?.transactions ?? [];
  const totalIn = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconWrap}>
              <WalletIcon size={24} color={Colors.white} />
            </View>
            <Text style={styles.balanceLabel}>Subscription Balance</Text>
          </View>
          <Text style={styles.balanceValue}>GH₵{(wallet?.balance ?? 0).toLocaleString()}</Text>
          {subscription?.row && (
            <Text style={styles.balanceSub}>
              {subscription.isActive
                ? `Covers ${Math.floor((wallet?.balance ?? 0) / subscription.row.amount)} more month${Math.floor((wallet?.balance ?? 0) / subscription.row.amount) === 1 ? '' : 's'} at GH₵${subscription.row.amount}/mo`
                : 'Top up to reactivate your subscription'}
            </Text>
          )}
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
          <Pressable style={styles.quickBtn} onPress={() => router.push('/subscription')}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.purple.medium + '15' }]}>
              <Repeat size={20} color={Colors.purple.medium} />
            </View>
            <Text style={styles.quickLabel}>Subscription</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyTxWrap}>
            <Text style={styles.emptyTxText}>No transactions yet</Text>
          </View>
        ) : (
          <View style={styles.txCard}>
            {transactions.map((tx, idx) => (
              <View key={tx.id}>
                <TransactionRow tx={tx} />
                {idx < transactions.length - 1 && <View style={styles.txDivider} />}
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <AlertCircle size={18} color={Colors.orange.primary} />
          <Text style={styles.infoText}>
            This balance is used only to pay your GoCar Hub platform subscription. It has no connection to booking payments, which are arranged directly with your customers.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={topUpModalVisible} transparent animationType="fade" onRequestClose={() => setTopUpModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Top Up Wallet</Text>
            <Text style={styles.modalSubtitle}>Enter an amount to fund via Mobile Money or card (min GH₵10).</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 150"
              placeholderTextColor={Colors.gray[400]}
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              testID="topup-amount-input"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setTopUpModalVisible(false)} disabled={initiateTopUp.isPending}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={handleConfirmTopUp} disabled={initiateTopUp.isPending} testID="topup-confirm-btn">
                <Text style={styles.modalConfirmText}>{initiateTopUp.isPending ? 'Starting…' : 'Continue'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  balanceSub: {
    fontSize: 12,
    color: Colors.gray[400],
    marginTop: 4,
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
  emptyTxWrap: {
    alignItems: 'center' as const,
    paddingVertical: 30,
    marginBottom: 16,
  },
  emptyTxText: {
    fontSize: 14,
    color: Colors.gray[500],
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  modalCard: {
    width: '100%' as const,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 6,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.gray[900],
  },
  modalActions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center' as const,
    backgroundColor: Colors.gray[100],
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gray[700],
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center' as const,
    backgroundColor: Colors.orange.primary,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
