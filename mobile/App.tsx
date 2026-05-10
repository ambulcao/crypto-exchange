import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { TransactionHistoryList } from './src/components/TransactionHistoryList';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { api } from './src/services/api';
import type { TransactionRow } from './src/components/transactionTypes';

const BTC_POLLING_INTERVAL_MS = 15000;

export default function App() {
  return (
    <AuthProvider>
      <RootScreen />
    </AuthProvider>
  );
}

const RootScreen = () => {
  const { isAuthenticated, isLoading, signOut, loginWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [wallet, setWallet] = useState<{ balance_brl: string; balance_btc: string } | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [marketPrice, setMarketPrice] = useState<{ symbol: string; price: string; currency: string } | null>(null);
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
  const modeTitle = useMemo(
    () =>
      mode === 'login'
        ? 'Bem-vindo de volta! Use seu email e senha para continuar.'
        : 'Preencha os dados abaixo para criar sua conta.',
    [mode]
  );

  const loadWallet = async () => {
    if (!isAuthenticated) {
      setWallet(null);
      setWalletError(null);
      return;
    }

    try {
      setWalletLoading(true);
      setWalletError(null);
      const response = await api.get('/wallet');
      setWallet(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel carregar a carteira.';
      setWalletError(message);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    void loadWallet();
  }, [isAuthenticated]);

  const loadMarketPrice = async (showLoader = true) => {
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
      const response = await api.get('/market/btc');
      setMarketPrice(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel carregar a cotacao.';
      setMarketError(message);
    } finally {
      if (showLoader) {
        setMarketLoading(false);
      }
    }
  };

  const loadTransactions = async (showLoader = true) => {
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
      const message = error instanceof Error ? error.message : 'Nao foi possivel carregar o historico.';
      setTransactionsError(message);
    } finally {
      if (showLoader) {
        setTransactionsLoading(false);
      }
    }
  };

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

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

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
      setTradeError('Valor de compra maior que saldo BRL disponivel.');
      return;
    }
    if (tradeSide === 'sell' && Number(amount) > availableBtc) {
      setTradeError('Valor de venda maior que saldo BTC disponivel.');
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-5">
        <Text className="text-base text-gray-900">Carregando sessao...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  const onSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setFormError(null);

    if (!normalizedEmail.includes('@')) {
      setFormError('Informe um email valido.');
      return;
    }

    if (password.length < 8) {
      setFormError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setFormError('Informe seu nome.');
        return;
      }

      if (password !== passwordConfirmation) {
        setFormError('A confirmacao de senha nao confere.');
        return;
      }

      if (!acceptedTerms) {
        setFormError('Voce precisa aceitar os termos para continuar.');
        return;
      }
    }

    try {
      setLoadingAction(true);
      if (mode === 'login') {
        await loginWithEmail(normalizedEmail, password);
      } else {
        await registerWithEmail({
          name: name.trim(),
          email: normalizedEmail,
          password,
          passwordConfirmation,
          acceptedTerms,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao autenticar.';
      setFormError(message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      nestedScrollEnabled
      contentContainerStyle={
        isAuthenticated ? { paddingBottom: 32 } : { flexGrow: 1, justifyContent: 'center' }
      }
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center gap-3 px-5 py-6">
        <Text className="text-[22px] font-semibold text-gray-900">Crypto Exchange</Text>

        {isAuthenticated ? (
          <>
            <Text className="text-center text-sm text-gray-700">
              Voce esta conectado com seguranca. Acompanhe sua carteira e o mercado abaixo.
            </Text>
            <View className="w-full max-w-[380px] gap-1.5 rounded-[10px] border border-gray-200 p-3">
              <Text className="font-bold text-gray-900">Saldo da Wallet</Text>

              {walletLoading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator />
                  <Text className="text-sm text-gray-600">Carregando saldos...</Text>
                </View>
              ) : (
                <>
                  <Text className="text-[15px] text-gray-900">BRL: {wallet?.balance_brl ?? '--'}</Text>
                  <Text className="text-[15px] text-gray-900">BTC: {wallet?.balance_btc ?? '--'}</Text>
                </>
              )}

              {walletError ? <Text className="text-[13px] text-red-800">{walletError}</Text> : null}
            </View>

            <View className="w-full max-w-[380px] gap-1.5 rounded-[10px] border border-gray-200 p-3">
              <Text className="font-bold text-gray-900">Mercado BTC</Text>

              {marketLoading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator />
                  <Text className="text-sm text-gray-600">Carregando cotacao...</Text>
                </View>
              ) : (
                <>
                  <Text className="text-[15px] text-gray-900">Par: {marketPrice?.symbol ?? '--'}</Text>
                  <Text className="text-[15px] text-gray-900">
                    Preco: {marketPrice?.price ?? '--'} {marketPrice?.currency ?? ''}
                  </Text>
                  <Text className="text-sm text-gray-600">Atualizacao automatica a cada 15s.</Text>
                </>
              )}

              <Pressable
                className="mt-1 items-center rounded-lg border border-gray-900 py-2"
                onPress={() => void loadMarketPrice(true)}
                disabled={marketLoading}
              >
                <Text className="font-semibold text-gray-900">Atualizar cotacao</Text>
              </Pressable>

              {marketError ? <Text className="text-[13px] text-red-800">{marketError}</Text> : null}
            </View>

            <View className="w-full max-w-[380px] gap-1.5 rounded-[10px] border border-gray-200 p-3">
              <Text className="font-bold text-gray-900">Negociacao</Text>

              <View className="flex-row gap-2">
                <Pressable
                  className={`flex-1 items-center rounded-lg border py-2 ${
                    tradeSide === 'buy' ? 'border-gray-900 bg-gray-100' : 'border-gray-300 bg-white'
                  }`}
                  onPress={() => setTradeSide('buy')}
                >
                  <Text className="font-semibold text-gray-900">Comprar</Text>
                </Pressable>
                <Pressable
                  className={`flex-1 items-center rounded-lg border py-2 ${
                    tradeSide === 'sell' ? 'border-gray-900 bg-gray-100' : 'border-gray-300 bg-white'
                  }`}
                  onPress={() => setTradeSide('sell')}
                >
                  <Text className="font-semibold text-gray-900">Vender</Text>
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
                className={`items-center rounded-lg px-4 py-2.5 ${
                  tradeSide === 'buy' ? 'bg-gray-900' : 'border border-gray-900 bg-transparent'
                } ${!canSubmitTrade ? 'opacity-50' : ''}`}
                onPress={() => void onSubmitTrade()}
                disabled={!canSubmitTrade}
              >
                {tradeLoading === tradeSide ? (
                  <ActivityIndicator color={tradeSide === 'buy' ? '#fff' : '#111827'} />
                ) : (
                  <Text
                    className={`font-semibold ${tradeSide === 'buy' ? 'text-white' : 'text-gray-900'}`}
                  >
                    {tradeSide === 'buy' ? 'Comprar' : 'Vender'}
                  </Text>
                )}
              </Pressable>

              {tradeExceedsBalance ? (
                <Text className="text-[13px] text-red-800">
                  {tradeSide === 'buy'
                    ? 'Valor maior que o saldo BRL disponivel.'
                    : 'Valor maior que o saldo BTC disponivel.'}
                </Text>
              ) : null}

              {tradeFeedback ? <Text className="text-[13px] text-green-800">{tradeFeedback}</Text> : null}
              {tradeError ? <Text className="text-[13px] text-red-800">{tradeError}</Text> : null}
            </View>

            <View className="w-full max-w-[380px] gap-1.5 rounded-[10px] border border-gray-200 p-3">
              <Text className="font-bold text-gray-900">Historico de transacoes</Text>

              <TransactionHistoryList data={transactions} loading={transactionsLoading} />

              {transactionsError ? <Text className="text-[13px] text-red-800">{transactionsError}</Text> : null}
            </View>

            <View className="w-full max-w-[380px] flex-row flex-wrap gap-2.5">
              <Pressable
                className="min-w-[140px] flex-1 items-center rounded-lg border border-gray-900 py-2.5"
                onPress={() => void loadWallet()}
                disabled={walletLoading}
              >
                <Text className="font-semibold text-gray-900">Atualizar saldo</Text>
              </Pressable>
              <Pressable
                className="min-w-[140px] flex-1 items-center rounded-lg border border-gray-900 py-2.5"
                onPress={() => void loadTransactions(true)}
                disabled={transactionsLoading}
              >
                <Text className="font-semibold text-gray-900">Atualizar historico</Text>
              </Pressable>
              <Pressable
                className="min-w-[140px] flex-1 items-center rounded-lg bg-gray-900 py-2.5"
                onPress={() => void signOut()}
              >
                <Text className="font-semibold text-white">Sair</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View className="w-full max-w-[380px] gap-2.5">
            <View className="flex-row gap-2">
              <Pressable
                className={`flex-1 items-center rounded-lg border py-2 ${
                  mode === 'login' ? 'border-gray-900 bg-gray-100' : 'border-gray-300 bg-white'
                }`}
                onPress={() => setMode('login')}
              >
                <Text className="font-semibold text-gray-900">Login</Text>
              </Pressable>
              <Pressable
                className={`flex-1 items-center rounded-lg border py-2 ${
                  mode === 'register' ? 'border-gray-900 bg-gray-100' : 'border-gray-300 bg-white'
                }`}
                onPress={() => setMode('register')}
              >
                <Text className="font-semibold text-gray-900">Registro</Text>
              </Pressable>
            </View>

            <Text className="text-center text-sm leading-5 text-gray-700">{modeTitle}</Text>

            {mode === 'register' && (
              <TextInput
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                value={name}
                onChangeText={setName}
                placeholder="Nome completo"
                autoCapitalize="words"
              />
            )}

            <TextInput
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5"
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5"
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              secureTextEntry
            />

            {mode === 'register' && (
              <>
                <TextInput
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                  value={passwordConfirmation}
                  onChangeText={setPasswordConfirmation}
                  placeholder="Confirmar senha"
                  secureTextEntry
                />
                <Pressable className="flex-row items-center gap-2" onPress={() => setAcceptedTerms((prev) => !prev)}>
                  <View
                    className={`h-[18px] w-[18px] rounded border border-gray-600 ${
                      acceptedTerms ? 'bg-gray-900' : 'bg-white'
                    }`}
                  />
                  <Text className="text-gray-900">Aceito os termos de uso.</Text>
                </Pressable>
              </>
            )}

            {formError ? <Text className="text-[13px] text-red-800">{formError}</Text> : null}

            <Pressable
              className={`items-center rounded-lg bg-gray-900 px-4 py-2.5 ${loadingAction ? 'opacity-70' : ''}`}
              onPress={() => void onSubmit()}
              disabled={loadingAction}
            >
              {loadingAction ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-semibold text-white">{mode === 'login' ? 'Entrar' : 'Registrar'}</Text>
              )}
            </Pressable>
          </View>
        )}

        <StatusBar style="auto" />
      </View>
    </ScrollView>
  );
};

const mapApiError = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const message =
    (error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined)?.message ??
    Object.values(
      (error.response?.data as { errors?: Record<string, string[]> } | undefined)?.errors ?? {}
    )[0]?.[0];

  return message ?? fallback;
};

