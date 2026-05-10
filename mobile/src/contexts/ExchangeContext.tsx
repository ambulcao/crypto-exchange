import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { api } from '../services/api';
import { mapApiError } from '../utils/mapApiError';
import type { TransactionRow } from '../components/transactionTypes';
import { useAuth } from './AuthContext';

const BTC_POLLING_INTERVAL_MS = 15000;

type MarketPrice = { symbol: string; price: string; currency: string };
type Wallet = { balance_brl: string; balance_btc: string };

type ExchangeContextValue = {
  wallet: Wallet | null;
  walletLoading: boolean;
  walletError: string | null;
  marketPrice: MarketPrice | null;
  marketLoading: boolean;
  marketError: string | null;
  transactions: TransactionRow[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  tradeSide: 'buy' | 'sell';
  setTradeSide: (s: 'buy' | 'sell') => void;
  tradeAmount: string;
  setTradeAmount: (v: string) => void;
  tradeLoading: 'buy' | 'sell' | null;
  tradeFeedback: string | null;
  tradeError: string | null;
  loadWallet: () => Promise<void>;
  loadMarketPrice: (showLoader?: boolean) => Promise<void>;
  loadTransactions: (showLoader?: boolean) => Promise<void>;
  onSubmitTrade: () => Promise<void>;
  isPositiveAmount: (value: string) => boolean;
  availableBrl: number;
  availableBtc: number;
  canSubmitTrade: boolean;
  tradeExceedsBalance: boolean;
  normalizedTradeAmount: string;
};

const ExchangeContext = createContext<ExchangeContextValue | undefined>(undefined);

export function ExchangeProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeLoading, setTradeLoading] = useState<'buy' | 'sell' | null>(null);
  const [tradeFeedback, setTradeFeedback] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    if (!isAuthenticated) {
      setWallet(null);
      setWalletError(null);
      return;
    }
    try {
      setWalletLoading(true);
      setWalletError(null);
      const response = await api.get<Wallet>('/wallet');
      setWallet(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar a carteira.';
      setWalletError(message);
    } finally {
      setWalletLoading(false);
    }
  }, [isAuthenticated]);

  const loadMarketPrice = useCallback(
    async (showLoader = true) => {
      if (!isAuthenticated) {
        setMarketPrice(null);
        setMarketError(null);
        return;
      }
      try {
        if (showLoader) {
          setMarketLoading(true);
        }
        setMarketError(null);
        const response = await api.get<MarketPrice>('/market/btc');
        setMarketPrice(response.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível carregar a cotação.';
        setMarketError(message);
      } finally {
        if (showLoader) {
          setMarketLoading(false);
        }
      }
    },
    [isAuthenticated]
  );

  const loadTransactions = useCallback(
    async (showLoader = true) => {
      if (!isAuthenticated) {
        setTransactions([]);
        setTransactionsError(null);
        return;
      }
      try {
        if (showLoader) {
          setTransactionsLoading(true);
        }
        setTransactionsError(null);
        const response = await api.get<TransactionRow[]>('/transactions');
        setTransactions(response.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível carregar o histórico.';
        setTransactionsError(message);
      } finally {
        if (showLoader) {
          setTransactionsLoading(false);
        }
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMarketPrice(null);
      setMarketError(null);
      setTradeSide('buy');
      setTradeAmount('');
      setTradeFeedback(null);
      setTradeError(null);
      return;
    }
    void loadMarketPrice(true);
    void loadTransactions(true);
    const intervalId = setInterval(() => {
      void loadMarketPrice(false);
    }, BTC_POLLING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, loadMarketPrice, loadTransactions]);

  const isPositiveAmount = (value: string) => /^\d+(\.\d{1,8})?$/.test(value) && Number(value) > 0;
  const normalizedTradeAmount = tradeAmount.trim().replace(',', '.');
  const availableBrl = Number(wallet?.balance_brl ?? '0');
  const availableBtc = Number(wallet?.balance_btc ?? '0');
  const isTradeAmountValid = isPositiveAmount(normalizedTradeAmount);
  const tradeExceedsBalance =
    isTradeAmountValid &&
    (tradeSide === 'buy'
      ? Number(normalizedTradeAmount) > availableBrl
      : Number(normalizedTradeAmount) > availableBtc);
  const canSubmitTrade = tradeLoading === null && isTradeAmountValid && !tradeExceedsBalance;

  const onSubmitTrade = async () => {
    const amount = normalizedTradeAmount;
    setTradeFeedback(null);
    setTradeError(null);

    if (!isTradeAmountValid) {
      setTradeError(
        tradeSide === 'buy'
          ? 'Informe um valor BRL valido (ate 8 casas decimais).'
          : 'Informe um valor BTC valido (ate 8 casas decimais).'
      );
      return;
    }
    if (tradeSide === 'buy' && Number(amount) > availableBrl) {
      setTradeError('Valor de compra maior que saldo BRL disponível.');
      return;
    }
    if (tradeSide === 'sell' && Number(amount) > availableBtc) {
      setTradeError('Valor de venda maior que saldo BTC disponível.');
      return;
    }

    try {
      setTradeLoading(tradeSide);
      const response =
        tradeSide === 'buy'
          ? await api.post('/trade/buy', { amount_brl: amount })
          : await api.post('/trade/sell', { amount_btc: amount });
      const successMessage =
        response.data?.message ?? (tradeSide === 'buy' ? 'Compra realizada com sucesso.' : 'Venda realizada com sucesso.');
      setTradeFeedback(successMessage);
      Alert.alert(tradeSide === 'buy' ? 'Compra confirmada' : 'Venda confirmada', successMessage);
      setTradeAmount('');
      await Promise.all([loadWallet(), loadMarketPrice(false), loadTransactions(false)]);
    } catch (error) {
      setTradeError(mapApiError(error, tradeSide === 'buy' ? 'Falha ao comprar BTC.' : 'Falha ao vender BTC.'));
    } finally {
      setTradeLoading(null);
    }
  };

  const value = useMemo<ExchangeContextValue>(
    () => ({
      wallet,
      walletLoading,
      walletError,
      marketPrice,
      marketLoading,
      marketError,
      transactions,
      transactionsLoading,
      transactionsError,
      tradeSide,
      setTradeSide,
      tradeAmount,
      setTradeAmount,
      tradeLoading,
      tradeFeedback,
      tradeError,
      loadWallet,
      loadMarketPrice,
      loadTransactions,
      onSubmitTrade,
      isPositiveAmount,
      availableBrl,
      availableBtc,
      canSubmitTrade,
      tradeExceedsBalance,
      normalizedTradeAmount,
    }),
    [
      wallet,
      walletLoading,
      walletError,
      marketPrice,
      marketLoading,
      marketError,
      transactions,
      transactionsLoading,
      transactionsError,
      tradeSide,
      tradeAmount,
      tradeLoading,
      tradeFeedback,
      tradeError,
      loadWallet,
      loadMarketPrice,
      loadTransactions,
      availableBrl,
      availableBtc,
      canSubmitTrade,
      tradeExceedsBalance,
      normalizedTradeAmount,
    ]
  );

  return <ExchangeContext.Provider value={value}>{children}</ExchangeContext.Provider>;
}

export function useExchange() {
  const ctx = useContext(ExchangeContext);
  if (!ctx) {
    throw new Error('useExchange must be used within ExchangeProvider.');
  }
  return ctx;
}
