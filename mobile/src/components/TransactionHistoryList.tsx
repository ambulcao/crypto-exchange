import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { TransactionListItem } from './TransactionListItem';

import type { TransactionRow } from './transactionTypes';

type Props = {
  data: TransactionRow[];
  loading: boolean;
  emptyMessage?: string;
};

const DEFAULT_EMPTY = 'Nenhuma transação encontrada.';

export function TransactionHistoryList({ data, loading, emptyMessage = DEFAULT_EMPTY }: Props) {
  if (loading) {
    return (
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <ActivityIndicator />
          <Text className="text-sm text-gray-600">Carregando historico...</Text>
        </View>
        {[0, 1, 2].map((key) => (
          <View key={key} className="h-[72px] rounded-lg bg-gray-200 opacity-50" />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      scrollEnabled={data.length > 4}
      style={{ maxHeight: 360 }}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => <TransactionListItem item={item} />}
      ListEmptyComponent={
        <Text className="py-4 text-center text-sm text-gray-600">{emptyMessage}</Text>
      }
    />
  );
}
