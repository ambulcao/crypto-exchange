import { Pressable, Text, View } from 'react-native';

import { TransactionHistoryList } from '../../src/components/TransactionHistoryList';
import { AuthenticatedScroll } from '../../src/components/exchange/AuthenticatedScroll';
import { useExchange } from '../../src/contexts/ExchangeContext';

export default function HistoryScreen() {
  const { transactions, transactionsLoading, transactionsError, loadTransactions } = useExchange();

  return (
    <AuthenticatedScroll centerVertically>
      <View className="w-full max-w-[380px] gap-1.5 rounded-[10px] border border-gray-200 p-3">
        <Text className="font-bold text-gray-900">Histórico de transações</Text>
        <TransactionHistoryList data={transactions} loading={transactionsLoading} />
        {transactionsError ? <Text className="text-[13px] text-red-800">{transactionsError}</Text> : null}
      </View>

      <View className="w-full max-w-[380px]">
        <Pressable
          className="min-h-[56px] w-full items-center justify-center rounded-xl border border-gray-900 py-4"
          onPress={() => void loadTransactions(true)}
          disabled={transactionsLoading}
        >
          <Text className="font-semibold text-gray-900">Atualizar histórico</Text>
        </Pressable>
      </View>
    </AuthenticatedScroll>
  );
}
