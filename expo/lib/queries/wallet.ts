import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/lib/errors';
import type { WalletRow, WalletTransactionRow } from '@/types/database';
import type { WalletInfo, WalletTransaction } from '@/types/car';

function mapTransaction(row: WalletTransactionRow): WalletTransaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    description: row.description ?? '',
    date: row.created_at,
    status: row.status,
  };
}

export function useWallet(): { data: WalletInfo | undefined; isLoading: boolean } {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const walletQuery = useQuery({
    queryKey: ['wallet', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId as string).single();
      if (error) throw error;
      return data as WalletRow;
    },
    enabled: !!userId,
  });

  const txQuery = useQuery({
    queryKey: ['wallet_transactions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', userId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as WalletTransactionRow[]).map(mapTransaction);
    },
    enabled: !!userId,
  });

  if (!walletQuery.data) {
    return { data: undefined, isLoading: walletQuery.isLoading || txQuery.isLoading };
  }

  return {
    data: {
      balance: walletQuery.data.balance,
      currency: 'GH₵',
      transactions: txQuery.data ?? [],
    },
    isLoading: walletQuery.isLoading || txQuery.isLoading,
  };
}

export function useInitiateWalletTopUp() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const { data, error } = await supabase.functions.invoke<{ checkoutUrl: string; clientReference: string }>(
        'initiate-wallet-topup',
        { body: { amount } }
      );
      if (error) {
        const context = (error as { context?: Response }).context;
        const body = context ? await context.clone().json().catch(() => null) : null;
        throw new Error(body?.error ?? getErrorMessage(error, 'Could not start top-up'));
      }
      if (!data?.checkoutUrl) throw new Error('Could not start top-up');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallet_transactions', userId] });
    },
  });
}
