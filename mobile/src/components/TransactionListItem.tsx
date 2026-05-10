import { Text, View } from 'react-native';

import { formatBrl, formatBtc, formatTransactionDate } from '../utils/format';

import type { TransactionRow } from './transactionTypes';

type Props = {
  item: TransactionRow;
};


export function TransactionListItem({ item }: Props) {
  const isBuy = item.type === 'buy';

  return (
    <View
      className={`mb-2 rounded-lg border border-gray-200 p-3 ${
        isBuy ? 'border-l-4 border-l-green-600 bg-green-50' : 'border-l-4 border-l-red-600 bg-red-50'
      }`}
    >
      <Text className={`text-base font-bold ${isBuy ? 'text-green-800' : 'text-red-800'}`}>
        {isBuy ? 'Compra' : 'Venda'}
      </Text>
      <Text className="text-sm text-gray-800">
        {formatBtc(item.amount_btc)} · {formatBrl(item.amount_brl)}
      </Text>
      <Text className="text-sm text-gray-600">{formatTransactionDate(item.executed_at)}</Text>
    </View>
  );
}
