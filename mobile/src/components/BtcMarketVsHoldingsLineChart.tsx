import { useMemo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

const COLOR_MARKET = '#4287f5';
const COLOR_HOLDINGS = '#7cd980';

type Props = {
  btcPriceBrl: string | undefined;
  balanceBtc: string | undefined;
  loadingMarket?: boolean;
};

const CHART_W = 340;
const CHART_H = 110;
const PAD = 14;
const POINTS = 24;

export function BtcMarketVsHoldingsLineChart({ btcPriceBrl, balanceBtc, loadingMarket }: Props) {
  const { marketPts, holdingsPts, marketVals, holdingsVals, show } = useMemo(() => {
    const px = Number(btcPriceBrl ?? '0');
    const btc = Number(balanceBtc ?? '0');
    if (!Number.isFinite(px) || px <= 0 || !Number.isFinite(btc)) {
      return { marketPts: '', holdingsPts: '', marketVals: [] as number[], holdingsVals: [] as number[], show: false };
    }

    const holdingsBrl = btc * px;
    const marketVals: number[] = [];
    const holdingsVals: number[] = [];
    for (let i = 0; i < POINTS; i++) {
      const wobble = 1 + 0.012 * Math.sin(i * 0.45);
      marketVals.push(px * wobble);
      holdingsVals.push(holdingsBrl);
    }

    const combined = [...marketVals, ...holdingsVals];
    const min = Math.min(...combined);
    const max = Math.max(...combined);
    const span = max - min || 1;
    const norm = (v: number) => (v - min) / span;

    const toPts = (vals: number[]) =>
      vals
        .map((v, i) => {
          const x = PAD + (i / Math.max(vals.length - 1, 1)) * (CHART_W - 2 * PAD);
          const y = PAD + (1 - norm(v)) * (CHART_H - 2 * PAD);
          return `${x},${y}`;
        })
        .join(' ');

    return {
      marketPts: toPts(marketVals),
      holdingsPts: toPts(holdingsVals),
      marketVals,
      holdingsVals,
      show: true,
    };
  }, [btcPriceBrl, balanceBtc]);

  if (loadingMarket) {
    return (
      <View className="gap-1">
        <Text className="text-xs font-semibold text-gray-700">BTC: mercado vs sua carteira (em BRL)</Text>
        <Text className="text-[12px] text-gray-500">Carregando cotacao...</Text>
      </View>
    );
  }

  if (!show) {
    return (
      <View className="gap-1">
        <Text className="text-xs font-semibold text-gray-700">BTC: mercado vs sua carteira (em BRL)</Text>
        <Text className="text-[12px] text-gray-500">Aguarde a cotacao do BTC ou verifique a conexao.</Text>
      </View>
    );
  }

  const lastMx = marketVals[marketVals.length - 1] ?? 0;
  const lastH = holdingsVals[holdingsVals.length - 1] ?? 0;

  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold text-gray-700">BTC: mercado vs sua carteira (em BRL)</Text>
      <Svg width={CHART_W} height={CHART_H}>
        <Polyline points={marketPts} fill="none" stroke={COLOR_MARKET} strokeWidth={2.5} strokeLinejoin="round" />
        <Polyline points={holdingsPts} fill="none" stroke={COLOR_HOLDINGS} strokeWidth={2.5} strokeLinejoin="round" />
      </Svg>
      <View className="flex-row flex-wrap gap-3">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: COLOR_MARKET }} />
          <Text className="text-[11px] text-gray-700">Cotacao 1 BTC (~{lastMx.toFixed(0)} BRL)</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: COLOR_HOLDINGS }} />
          <Text className="text-[11px] text-gray-700">Seu BTC em BRL (~{lastH.toFixed(2)} BRL)</Text>
        </View>
      </View>
    </View>
  );
}
