import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeftRight, Eye, EyeOff, LayoutDashboard } from 'lucide-react-native';

import { TransactionHistoryList } from './src/components/TransactionHistoryList';
import { BtcMarketVsHoldingsLineChart } from './src/components/BtcMarketVsHoldingsLineChart';
import { WalletBalanceChart } from './src/components/WalletBalanceChart';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { api } from './src/services/api';
import type { TransactionRow } from './src/components/transactionTypes';

const BTC_POLLING_INTERVAL_MS = 15000;

const COLOR_TRADE_BUY = '#4287f5';
const COLOR_TRADE_SELL = '#bf3d4a';
const COLOR_REFRESH_QUOTE = '#d1c5c6';
const COLOR_WALLET_BALANCE = '#7cd980';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [mainTab, setMainTab] = useState<'dashboard' | 'trade'>('dashboard');

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
      setMainTab('dashboard');
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
            <Text className="text-center text-sm text-gray-700">Acompanhe sua carteira e o mercado abaixo.</Text>

            <View className="w-full max-w-[380px] gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">Saldo da wallet</Text>

              {walletLoading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator />
                  <Text className="text-sm text-gray-600">Carregando saldos...</Text>
                </View>
              ) : (
                <View className="gap-1.5">
                  <Text className="text-lg font-semibold" style={{ color: COLOR_WALLET_BALANCE }}>
                    BRL disponivel: {wallet?.balance_brl ?? '--'}
                  </Text>
                  <Text className="text-base font-semibold" style={{ color: COLOR_WALLET_BALANCE }}>
                    BTC disponivel: {wallet?.balance_btc ?? '--'}
                  </Text>
                </View>
              )}

              <Text className="text-xs leading-4 text-gray-600">
                Use estes valores ao comprar (BRL) ou vender (BTC).
              </Text>

              <BtcMarketVsHoldingsLineChart
                btcPriceBrl={marketPrice?.price}
                balanceBtc={wallet?.balance_btc}
                loadingMarket={marketLoading}
              />

              {walletError ? <Text className="text-[13px] text-red-800">{walletError}</Text> : null}
            </View>

            {mainTab === 'dashboard' ? (
              <>
                <View className="w-full max-w-[380px] gap-3 rounded-[10px] border border-gray-200 p-3">
                  <Text className="font-bold text-gray-900">Seu patrimonio</Text>
                  <WalletBalanceChart
                    balanceBrl={wallet?.balance_brl}
                    balanceBtc={wallet?.balance_btc}
                    btcPriceBrl={marketPrice?.price}
                    loading={walletLoading}
                  />
                </View>

                <View className="w-full max-w-[380px] gap-1.5 rounded-[10px] border border-gray-200 p-3">
                  <Text className="font-bold text-gray-900">Historico de transacoes</Text>
                  <TransactionHistoryList data={transactions} loading={transactionsLoading} />
                  {transactionsError ? <Text className="text-[13px] text-red-800">{transactionsError}</Text> : null}
                </View>
              </>
            ) : (
              <>
                {/*
                <View className="w-full max-w-[380px] gap-2 rounded-[10px] border border-gray-200 p-3">
                  <Text className="font-bold text-gray-900">Saldo para negociar</Text>
                  <Text className="text-sm text-gray-600">
                    Use estes valores ao comprar (BRL) ou vender (BTC).
                  </Text>
                  {walletLoading ? (
                    <ActivityIndicator />
                  ) : (
                    <>
                      <Text className="text-[15px] text-gray-900">BRL disponivel: {wallet?.balance_brl ?? '--'}</Text>
                      <Text className="text-[15px] text-gray-900">BTC disponivel: {wallet?.balance_btc ?? '--'}</Text>
                    </>
                  )}
                </View>
                */}

                <View className="w-full max-w-[380px] gap-2 rounded-[10px] border border-gray-200 p-3">
                  <Text className="font-bold text-gray-900">Mercado BTC</Text>
                  <Text className="text-xs leading-4 text-gray-600">
                    O codigo <Text className="font-semibold text-gray-800">{marketPrice?.symbol ?? 'BTCBRL'}</Text> e o par
                    de negociacao: cotacao de 1 Bitcoin em Reais brasileiros (quanto de BRL equivale a 1 BTC neste app
                    simulado).
                  </Text>

                  {marketLoading ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator />
                      <Text className="text-sm text-gray-600">Carregando cotacao...</Text>
                    </View>
                  ) : (
                    <>
                      <Text className="text-[15px] font-medium" style={{ color: COLOR_TRADE_BUY }}>
                        Cotacao: {marketPrice?.price ?? '--'} {marketPrice?.currency ?? 'BRL'} por 1 BTC
                      </Text>
                      <Text className="text-sm text-gray-600">Atualizacao automatica a cada 15s.</Text>
                    </>
                  )}

                  <Pressable
                    className="mt-1 items-center rounded-lg py-2.5"
                    style={{ backgroundColor: COLOR_REFRESH_QUOTE }}
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
                      className="flex-1 items-center rounded-lg border py-2.5"
                      style={
                        tradeSide === 'buy'
                          ? { backgroundColor: COLOR_TRADE_BUY, borderColor: COLOR_TRADE_BUY }
                          : { backgroundColor: '#fff', borderColor: '#d1d5db' }
                      }
                      onPress={() => setTradeSide('buy')}
                    >
                      <Text
                        className="font-semibold"
                        style={{ color: tradeSide === 'buy' ? '#fff' : '#374151' }}
                      >
                        Comprar
                      </Text>
                    </Pressable>
                    <Pressable
                      className="flex-1 items-center rounded-lg border py-2.5"
                      style={
                        tradeSide === 'sell'
                          ? { backgroundColor: COLOR_TRADE_SELL, borderColor: COLOR_TRADE_SELL }
                          : { backgroundColor: '#fff', borderColor: '#d1d5db' }
                      }
                      onPress={() => setTradeSide('sell')}
                    >
                      <Text
                        className="font-semibold"
                        style={{ color: tradeSide === 'sell' ? '#fff' : '#374151' }}
                      >
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
                    className={`items-center rounded-lg px-4 py-3 ${!canSubmitTrade ? 'opacity-50' : ''}`}
                    style={{
                      backgroundColor: tradeSide === 'buy' ? COLOR_TRADE_BUY : COLOR_TRADE_SELL,
                    }}
                    onPress={() => void onSubmitTrade()}
                    disabled={!canSubmitTrade}
                  >
                    {tradeLoading === tradeSide ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="font-semibold text-white">
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

                <View className="w-full max-w-[380px] flex-row flex-wrap gap-2">
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
                </View>
              </>
            )}

            <View className="mt-2 w-full max-w-[380px] flex-row justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-2">
              <Pressable
                accessibilityLabel="Ir para inicio"
                accessibilityRole="button"
                className={`flex-1 items-center rounded-xl py-3 ${
                  mainTab === 'dashboard' ? 'bg-gray-900' : 'bg-transparent'
                }`}
                onPress={() => setMainTab('dashboard')}
              >
                <LayoutDashboard
                  size={26}
                  color={mainTab === 'dashboard' ? '#ffffff' : '#111827'}
                  strokeWidth={2}
                />
                <Text
                  className={`mt-1 text-center text-[11px] font-medium ${
                    mainTab === 'dashboard' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Inicio
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Ir para negociacao"
                accessibilityRole="button"
                className={`flex-1 items-center rounded-xl py-3 ${
                  mainTab === 'trade' ? 'bg-gray-900' : 'bg-transparent'
                }`}
                onPress={() => setMainTab('trade')}
              >
                <ArrowLeftRight
                  size={26}
                  color={mainTab === 'trade' ? '#ffffff' : '#111827'}
                  strokeWidth={2}
                />
                <Text
                  className={`mt-1 text-center text-[11px] font-medium ${
                    mainTab === 'trade' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Negociar
                </Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              className="mt-3 self-center rounded-full border border-gray-300 px-8 py-3.5"
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#e8eef9' : '#ffffff',
              })}
              onPress={() => void signOut()}
            >
              <Text className="text-base font-semibold text-gray-800">Sair da conta</Text>
            </Pressable>
          </>
        ) : (
          <View className="w-full max-w-[380px] gap-2.5">
            {mode === 'login' ? (
              <View className="items-center gap-0.5 px-1">
                <Text className="text-center text-base font-semibold text-gray-900">Bem-vindo de volta!</Text>
                <Text className="text-center text-sm leading-5 text-gray-700">
                  Use seu email e senha para continuar.
                </Text>
              </View>
            ) : (
              <Text className="text-center text-sm leading-5 text-gray-700">
                Preencha os dados abaixo para criar sua conta.
              </Text>
            )}

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
            <View className="w-full flex-row items-center rounded-lg border border-gray-300 bg-white">
              <TextInput
                className="min-h-[44px] flex-1 px-3 py-2.5 pr-2"
                value={password}
                onChangeText={setPassword}
                placeholder="Senha"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="px-2 py-2"
                hitSlop={8}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <EyeOff size={22} color="#6b7280" strokeWidth={2} />
                ) : (
                  <Eye size={22} color="#6b7280" strokeWidth={2} />
                )}
              </Pressable>
            </View>

            {mode === 'register' && (
              <>
                <View className="w-full flex-row items-center rounded-lg border border-gray-300 bg-white">
                  <TextInput
                    className="min-h-[44px] flex-1 px-3 py-2.5 pr-2"
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    placeholder="Confirmar senha"
                    secureTextEntry={!showPasswordConfirm}
                    autoCapitalize="none"
                  />
                  <Pressable
                    accessibilityLabel={showPasswordConfirm ? 'Ocultar confirmacao de senha' : 'Mostrar confirmacao de senha'}
                    className="px-2 py-2"
                    hitSlop={8}
                    onPress={() => setShowPasswordConfirm((prev) => !prev)}
                  >
                    {showPasswordConfirm ? (
                      <EyeOff size={22} color="#6b7280" strokeWidth={2} />
                    ) : (
                      <Eye size={22} color="#6b7280" strokeWidth={2} />
                    )}
                  </Pressable>
                </View>
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
                <Text className="font-semibold text-white">
                  {mode === 'login' ? 'Entrar na conta' : 'Criar minha conta'}
                </Text>
              )}
            </Pressable>

            {mode === 'login' ? (
              <View className="flex-row flex-wrap items-center justify-center gap-1 px-1">
                <Text className="text-center text-sm text-gray-600">Nao tem conta?</Text>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    setFormError(null);
                    setMode('register');
                  }}
                >
                  <Text className="text-sm font-semibold text-gray-900 underline">Cadastre-se</Text>
                </Pressable>
              </View>
            ) : (
              <View className="flex-row flex-wrap items-center justify-center gap-1 px-1">
                <Text className="text-center text-sm text-gray-600">Ja tem conta?</Text>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    setFormError(null);
                    setMode('login');
                  }}
                >
                  <Text className="text-sm font-semibold text-gray-900 underline">Fazer login</Text>
                </Pressable>
              </View>
            )}
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

