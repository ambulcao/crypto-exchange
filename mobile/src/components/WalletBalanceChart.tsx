import { ActivityIndicator, Text, View } from 'react-native';

type Props = {
  balanceBrl: string | undefined;
  balanceBtc: string | undefined;
  btcPriceBrl: string | undefined;
  loading?: boolean;
};

export function WalletBalanceChart({ balanceBrl, balanceBtc, btcPriceBrl, loading }: Props) {
  if (loading) {
    return (
      <View className="items-center justify-center py-6">
        <ActivityIndicator />
        <Text className="mt-2 text-sm text-gray-600">Carregando gráfico...</Text>
      </View>
    );
  }

  const brl = Number(balanceBrl ?? '0');
  const btc = Number(balanceBtc ?? '0');
  const px = Number(btcPriceBrl ?? '0');
  const btcValueInBrl = px > 0 ? btc * px : 0;
  const total = brl + btcValueInBrl;

  if (btc > 0 && px <= 0) {
    return (
      <Text className="text-center text-sm leading-5 text-gray-600">
        Você tem BTC na carteira. Abra a aba Negociação para carregar a cotação e o gráfico mostrar o valor estimado em
        BRL.
      </Text>
    );
  }

  if (total <= 0) {
    return (
      <Text className="text-center text-sm text-gray-600">
        Sem saldo para exibir. Deposite ou negocie para ver a composição.
      </Text>
    );
  }

  const brlPct = (brl / total) * 100;
  const btcPct = (btcValueInBrl / total) * 100;

  return (
    <View className="gap-3">
      <Text className="text-xs leading-4 text-gray-600">
        Composição estimada do patrimônio: parte em reais na carteira e BTC avaliado pela cotação atual (simulada).
      </Text>

      <View className="h-10 w-full flex-row overflow-hidden rounded-xl bg-gray-100">
        {brlPct > 0.5 ? (
          <View style={{ flex: Math.max(brlPct, 0.01) }} className="min-w-[4px] bg-gray-800" />
        ) : null}
        {btcPct > 0.5 ? (
          <View style={{ flex: Math.max(btcPct, 0.01) }} className="min-w-[4px] bg-amber-500" />
        ) : null}
      </View>

      <View className="flex-row flex-wrap justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <View className="h-3 w-3 rounded-sm bg-gray-800" />
          <Text className="text-[13px] text-gray-800">
            BRL na carteira · {brlPct.toFixed(1)}%
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-3 w-3 rounded-sm bg-amber-500" />
          <Text className="text-[13px] text-gray-800">
            BTC (valor em BRL) · {btcPct.toFixed(1)}%
          </Text>
        </View>
      </View>

    </View>
  );
}
