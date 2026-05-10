import { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';

import {
  COLOR_CHART_MARKET_ORANGE,
  COLOR_COTACAO_BLUE,
  COLOR_REFRESH_QUOTE,
} from '../constants/tradeColors';

const BG = '#ffffff';
const GRID = '#e5e7eb';
const AXIS_TEXT = '#374151';

const PLOT_W = 286;
const PLOT_H = 152;
const PAD_X = 4;
const PAD_Y = 6;
const SEGMENTS = 64;

type Pt = { x: number; y: number };

function formatBrlSpotApi(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(value);
}

function formatBrlAxis(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

type Props = {
  btcPriceBrl: string | undefined;
  balanceBtc: string | undefined;
  loadingMarket?: boolean;
  onRefreshQuote?: () => void;
  marketError?: string | null;
};

function ChartSeriesLegend() {
  return (
    <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1">
      <View className="flex-row items-center gap-1.5">
        <View className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: COLOR_CHART_MARKET_ORANGE }} />
        <Text className="text-[11px] font-medium text-gray-800">Mercado</Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <View className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: COLOR_COTACAO_BLUE }} />
        <Text className="text-[11px] font-medium text-gray-800">Minha carteira</Text>
      </View>
    </View>
  );
}

function BtcQuoteToolbar({
  loadingMarket,
  marketError,
  onRefreshQuote,
}: {
  loadingMarket?: boolean;
  marketError?: string | null;
  onRefreshQuote?: () => void;
}) {
  return (
    <View className="gap-2">
      {loadingMarket ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator />
          <Text className="text-sm text-gray-700">Carregando cotação...</Text>
        </View>
      ) : (
        <>
          <Text className="text-sm text-gray-700">Atualização automática a cada 15s.</Text>
        </>
      )}
      {onRefreshQuote ? (
        <Pressable
          className="mt-1 items-center rounded-lg py-2.5"
          style={{ backgroundColor: COLOR_REFRESH_QUOTE }}
          onPress={() => onRefreshQuote()}
          disabled={loadingMarket}
        >
          <Text className="font-semibold text-gray-900">Atualizar cotação</Text>
        </Pressable>
      ) : null}
      {marketError ? <Text className="text-[13px] text-red-800">{marketError}</Text> : null}
    </View>
  );
}

export function BtcMarketVsHoldingsLineChart({
  btcPriceBrl,
  balanceBtc,
  loadingMarket,
  onRefreshQuote,
  marketError,
}: Props) {
  const computed = useMemo(() => {
    const px = Number(btcPriceBrl ?? '0');
    const btc = Number(balanceBtc ?? '0');
    if (!Number.isFinite(px) || px <= 0) {
      return null;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dayMs = 24 * 60 * 60 * 1000;
    const elapsed = Math.min(1, Math.max(0.02, (Date.now() - startOfDay.getTime()) / dayMs));

    const holdingsBrl = Number.isFinite(btc) && btc > 0 ? btc * px : 0;

    const marketVals: number[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const wobble = 1 + 0.008 * Math.sin(i * 0.42) + 0.003 * Math.cos(i * 0.17);
      marketVals.push(px * wobble);
    }

    const holdingsVals = marketVals.map(() => holdingsBrl);

    const combined = [...marketVals, ...holdingsVals];
    const rawMin = Math.min(...combined);
    const rawMax = Math.max(...combined);
    const pad = Math.max((rawMax - rawMin) * 0.12, rawMax * 0.002);
    const min = rawMin - pad;
    const max = rawMax + pad;
    const span = max - min || 1;

    const innerW = PLOT_W - 2 * PAD_X;
    const innerH = PLOT_H - 2 * PAD_Y;
    const bottomY = PAD_Y + innerH;

    const normY = (v: number) => PAD_Y + (1 - (v - min) / span) * innerH;

    const marketPts: Pt[] = marketVals.map((v, i) => {
      const t = (i / SEGMENTS) * elapsed;
      const x = PAD_X + t * innerW;
      return { x, y: normY(v) };
    });

    const holdingsPts: Pt[] = marketVals.map((_, i) => {
      const t = (i / SEGMENTS) * elapsed;
      const x = PAD_X + t * innerW;
      return { x, y: normY(holdingsBrl) };
    });

    const yTicks = 4;
    const tickVals: number[] = [];
    for (let i = 0; i < yTicks; i++) {
      tickVals.push(min + (span * i) / (yTicks - 1));
    }

    const gridLines = tickVals.map((tv) => ({
      y: normY(tv),
      label: formatBrlAxis(tv),
    }));

    const marketPolyline = marketPts.map((p) => `${p.x},${p.y}`).join(' ');
    const holdingsPolyline = holdingsPts.map((p) => `${p.x},${p.y}`).join(' ');

    const fillPolygon =
      marketPts.length > 1
        ? [
            ...marketPts.map((p) => `${p.x},${p.y}`),
            `${marketPts[marketPts.length - 1]!.x},${bottomY}`,
            `${marketPts[0]!.x},${bottomY}`,
          ].join(' ')
        : '';

    return {
      marketPolyline,
      holdingsPolyline,
      fillPolygon,
      gridLines,
      marketPts,
    };
  }, [btcPriceBrl, balanceBtc]);

  if (!computed) {
    return (
      <View className="gap-3">
        {/*<Text className="text-center text-xs font-semibold text-gray-900">
          BTC: mercado X minha carteira (hoje)
        </Text>*/}
        <ChartSeriesLegend />
        <BtcQuoteToolbar
          loadingMarket={loadingMarket}
          marketError={marketError}
          onRefreshQuote={onRefreshQuote}
        />
        <Text className="text-center text-[12px] text-gray-600">
          {loadingMarket ? 'Carregando gráfico...' : 'Aguarde a cotação ou verifique a conexão.'}
        </Text>
      </View>
    );
  }

  const { marketPolyline, holdingsPolyline, fillPolygon, gridLines, marketPts } = computed;
  const lastPt = marketPts[marketPts.length - 1];

  return (
    <View className="gap-2">
      {/*<Text className="text-center text-xs font-semibold text-gray-900">
        BTC: mercado X minha carteira (hoje)
      </Text>*/}
      <ChartSeriesLegend />

      <View className="flex-row">
        <View className="w-[52px] justify-between py-1">
          {[...gridLines].reverse().map((g) => (
            <Text key={g.label} className="text-[10px] leading-[12px]" style={{ color: AXIS_TEXT }}>
              {g.label}
            </Text>
          ))}
        </View>

        <View className="overflow-hidden rounded-md border border-gray-200" style={{ backgroundColor: BG }}>
          <Svg width={PLOT_W} height={PLOT_H}>
            <Defs>
              <LinearGradient id="marketAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={COLOR_CHART_MARKET_ORANGE} stopOpacity="0.35" />
                <Stop offset="1" stopColor={COLOR_CHART_MARKET_ORANGE} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {gridLines.map((g) => (
              <Line
                key={g.y}
                x1={PAD_X}
                y1={g.y}
                x2={PLOT_W - PAD_X}
                y2={g.y}
                stroke={GRID}
                strokeWidth={1}
              />
            ))}

            {fillPolygon ? <Polygon points={fillPolygon} fill="url(#marketAreaGrad)" /> : null}

            {/* Azul: minha carteira (BTC em BRL). Laranja: mercado (cotação 1 BTC) — desenhar mercado por cima. */}
            <Polyline
              points={holdingsPolyline}
              fill="none"
              stroke={COLOR_COTACAO_BLUE}
              strokeWidth={2.25}
              strokeLinejoin="round"
            />
            <Polyline
              points={marketPolyline}
              fill="none"
              stroke={COLOR_CHART_MARKET_ORANGE}
              strokeWidth={2.75}
              strokeLinejoin="round"
            />

            {lastPt ? (
              <Line
                x1={lastPt.x}
                y1={PAD_Y}
                x2={lastPt.x}
                y2={PLOT_H - PAD_Y}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ) : null}
          </Svg>
        </View>
      </View>

      <View className="flex-row justify-between px-1 pl-[52px]">
        {(['00:00', '06:00', '12:00', '18:00'] as const).map((label) => (
          <Text key={label} className="text-[10px]" style={{ color: AXIS_TEXT }}>
            {label}
          </Text>
        ))}
      </View>

      {lastPt ? (
        <View className="self-center rounded-full border border-orange-200 bg-orange-50 px-3 py-2">
          <Text className="text-center text-[13px] font-semibold text-gray-900">
            Cotação: {formatBrlSpotApi(Number(btcPriceBrl ?? '0'))} BRL por 1 BTC * agora
          </Text>
        </View>
      ) : null}

      <View className="mt-1">
        <BtcQuoteToolbar
          loadingMarket={loadingMarket}
          marketError={marketError}
          onRefreshQuote={onRefreshQuote}
        />
      </View>

      <Text className="text-center text-[10px] leading-4 text-gray-600">
        Referência CoinGecko (agregado BRL). Corretoras, buscas e atrasos de dados podem mostrar valores diferentes.
      </Text>
    </View>
  );
}
