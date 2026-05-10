import { ActivityIndicator, Text, View } from 'react-native';

import { COLOR_WALLET_BRL, COLOR_WALLET_BTC } from '../../constants/tradeColors';
import { useExchange } from '../../contexts/ExchangeContext';

export function WalletSaldoCard() {
  const { wallet, walletLoading, walletError } = useExchange();

  return (
    <View className="w-full max-w-[380px] gap-2 rounded-xl border border-gray-200 bg-white p-4">
      <Text className="text-xs font-semibold uppercase tracking-wide text-gray-600">Saldo da wallet</Text>

      {walletLoading ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator />
          <Text className="text-sm text-gray-600">Carregando saldos...</Text>
        </View>
      ) : (
        <View className="gap-1.5">
          <Text className="text-lg font-semibold" style={{ color: COLOR_WALLET_BRL }}>
            BRL disponível: {wallet?.balance_brl ?? '--'}
          </Text>
          <Text className="text-base font-semibold" style={{ color: COLOR_WALLET_BTC }}>
            BTC disponível: {wallet?.balance_btc ?? '--'}
          </Text>
        </View>
      )}

      <Text className="text-xs leading-4 text-gray-700">
        Use estes valores ao comprar (BRL) ou vender (BTC).
      </Text>

      {walletError ? <Text className="text-[13px] text-red-800">{walletError}</Text> : null}
    </View>
  );
}
