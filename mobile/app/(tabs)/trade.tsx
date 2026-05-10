import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AuthenticatedScroll } from '../../src/components/exchange/AuthenticatedScroll';
import { COLOR_TRADE_BUY, COLOR_TRADE_SELL } from '../../src/constants/tradeColors';
import { useExchange } from '../../src/contexts/ExchangeContext';

export default function TradeScreen() {
  const {
    tradeSide,
    setTradeSide,
    tradeAmount,
    setTradeAmount,
    tradeLoading,
    tradeFeedback,
    tradeError,
    loadWallet,
    walletLoading,
    onSubmitTrade,
    tradeExceedsBalance,
    canSubmitTrade,
  } = useExchange();

  return (
    <AuthenticatedScroll centerVertically>
      <View className="w-full max-w-[380px] gap-1.5 rounded-[10px] border border-gray-200 p-3">
        <Text className="font-bold text-gray-900">Negociação</Text>

        <View className="flex-row gap-2">
          <Pressable
            className="min-h-[52px] flex-1 items-center justify-center rounded-xl border py-4"
            style={
              tradeSide === 'buy'
                ? { backgroundColor: COLOR_TRADE_BUY, borderColor: COLOR_TRADE_BUY }
                : { backgroundColor: '#fff', borderColor: '#d1d5db' }
            }
            onPress={() => setTradeSide('buy')}
          >
            <Text className="font-semibold" style={{ color: tradeSide === 'buy' ? '#fff' : '#374151' }}>
              Comprar
            </Text>
          </Pressable>
          <Pressable
            className="min-h-[52px] flex-1 items-center justify-center rounded-xl border py-4"
            style={
              tradeSide === 'sell'
                ? { backgroundColor: COLOR_TRADE_SELL, borderColor: COLOR_TRADE_SELL }
                : { backgroundColor: '#fff', borderColor: '#d1d5db' }
            }
            onPress={() => setTradeSide('sell')}
          >
            <Text className="font-semibold" style={{ color: tradeSide === 'sell' ? '#fff' : '#374151' }}>
              Vender
            </Text>
          </Pressable>
        </View>

        <Text className="text-sm text-gray-600">
          {tradeSide === 'buy' ? 'Valor da compra (BRL)' : 'Valor da venda (BTC)'}
        </Text>
        <TextInput
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5"
          value={tradeAmount}
          onChangeText={setTradeAmount}
          placeholder={tradeSide === 'buy' ? 'Ex: 2500.00000000' : 'Ex: 0.01000000'}
          keyboardType="decimal-pad"
        />

        <Pressable
          className={`min-h-[52px] items-center justify-center rounded-xl px-4 py-4 ${!canSubmitTrade ? 'opacity-50' : ''}`}
          style={{
            backgroundColor: tradeSide === 'buy' ? COLOR_TRADE_BUY : COLOR_TRADE_SELL,
          }}
          onPress={() => void onSubmitTrade()}
          disabled={!canSubmitTrade}
        >
          {tradeLoading === tradeSide ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">{tradeSide === 'buy' ? 'Comprar' : 'Vender'}</Text>
          )}
        </Pressable>

        {tradeExceedsBalance ? (
          <Text className="text-[13px] text-red-800">
            {tradeSide === 'buy'
              ? 'Valor maior que o saldo BRL disponível.'
              : 'Valor maior que o saldo BTC disponível.'}
          </Text>
        ) : null}

        {tradeFeedback ? <Text className="text-[13px] text-green-800">{tradeFeedback}</Text> : null}
        {tradeError ? <Text className="text-[13px] text-red-800">{tradeError}</Text> : null}
      </View>

      <View className="w-full max-w-[380px]">
        <Pressable
          className="min-h-[56px] w-full items-center justify-center rounded-xl border border-gray-900 py-4"
          onPress={() => void loadWallet()}
          disabled={walletLoading}
        >
          <Text className="font-semibold text-gray-900">Atualizar saldo</Text>
        </Pressable>
      </View>
    </AuthenticatedScroll>
  );
}
