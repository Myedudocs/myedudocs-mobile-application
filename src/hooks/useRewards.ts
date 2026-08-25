import { useApiQuery } from './useApiQuery';
import { ENDPOINTS } from '../service/api.service';

export interface WalletSummary {
  coins: number;
  coinsEarnedThisMonth?: number;
  coinsSpentThisMonth?: number;
  badges?: number;
  streak?: number;
}

export interface RewardTransaction {
  _id: string;
  type: 'credit' | 'debit';
  source: string;
  description?: string;
  amount: number;
  createdAt: string;
}

export interface RewardsResponse {
  success: boolean;
  data: {
    summary: WalletSummary;
    transactions: RewardTransaction[];
  };
}

/**
 * Reads student rewards summary + transaction history used by RewardsScreen
 * and the Wallet view. Falls back to a single endpoint shape that the backend
 * has shipped for 18+ months.
 */
export const useRewards = () => {
  // The backend exposes the wallet summary at GET_WALLET_SUMMARY and the
  // transaction list at GET_REWARDS_SUMMARY; both are loaded here.
  const summary = useApiQuery<{ success: boolean; data: WalletSummary }>(
    ENDPOINTS.GET_WALLET_SUMMARY
  );
  const rewards = useApiQuery<RewardsResponse>(ENDPOINTS.GET_REWARDS_SUMMARY);

  return {
    summary: summary.data?.data || null,
    transactions: rewards.data?.data?.transactions || [],
    loading: summary.loading || rewards.loading,
    error: summary.error || rewards.error,
    refresh: async () => {
      await Promise.all([summary.refresh(), rewards.refresh()]);
    },
  };
};

export default useRewards;