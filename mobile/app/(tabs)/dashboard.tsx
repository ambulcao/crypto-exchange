import { Text, View } from 'react-native';

import { BtcMarketVsHoldingsLineChart } from '../../src/components/BtcMarketVsHoldingsLineChart';
import { AuthenticatedScroll } from '../../src/components/exchange/AuthenticatedScroll';
import { WalletBalanceChart } from '../../src/components/WalletBalanceChart';
import { useExchange } from '../../src/contexts/ExchangeContext';

export default function DashboardScreen() {
  const {
    wallet,
    walletLoading,
    marketPrice,
    marketLoading,
    marketError,
    loadMarketPrice,
  } = useExchange();

  return (
    <AuthenticatedScroll>
      <View className="w-full max-w-[380px] gap-2 rounded-xl border border-gray-200 bg-white p-4">
        <BtcMarketVsHoldingsLineChart
          btcPriceBrl={marketPrice?.price}
          balanceBtc={wallet?.balance_btc}
          loadingMarket={marketLoading}
          onRefreshQuote={() => void loadMarketPrice(true)}
          marketError={marketError}
        />
      </View>

      <View className="w-full max-w-[380px] gap-3 rounded-[10px] border border-gray-200 p-3">
        <Text className="font-bold text-gray-900">Seu patrimônio</Text>
        <WalletBalanceChart
          balanceBrl={wallet?.balance_brl}
          balanceBtc={wallet?.balance_btc}
          btcPriceBrl={marketPrice?.price}
          loading={walletLoading}
        />
      </View>
    </AuthenticatedScroll>
  );
}
