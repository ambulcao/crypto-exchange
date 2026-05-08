import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { api } from './src/services/api';

const BTC_POLLING_INTERVAL_MS = 15000;

export default function App() {
  return (
    <AuthProvider>
      <RootScreen />
    </AuthProvider>
  );
}

const RootScreen = () => {
  const { isAuthenticated, isLoading, signOut, token, loginWithEmail, registerWithEmail } = useAuth();
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
  const [buyAmountBrl, setBuyAmountBrl] = useState('');
  const [sellAmountBtc, setSellAmountBtc] = useState('');
  const [tradeLoading, setTradeLoading] = useState<'buy' | 'sell' | null>(null);
  const [tradeFeedback, setTradeFeedback] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const modeTitle = useMemo(
    () => (mode === 'login' ? 'Entrar na conta' : 'Criar nova conta'),
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
      const response = await api.get<TransactionItem[]>('/transactions');
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
      setBuyAmountBrl('');
      setSellAmountBtc('');
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
  const normalizedBuyAmount = buyAmountBrl.trim().replace(',', '.');
  const normalizedSellAmount = sellAmountBtc.trim().replace(',', '.');
  const availableBrl = Number(wallet?.balance_brl ?? '0');
  const availableBtc = Number(wallet?.balance_btc ?? '0');
  const isBuyAmountValid = isPositiveAmount(normalizedBuyAmount);
  const isSellAmountValid = isPositiveAmount(normalizedSellAmount);
  const buyExceedsBalance = isBuyAmountValid && Number(normalizedBuyAmount) > availableBrl;
  const sellExceedsBalance = isSellAmountValid && Number(normalizedSellAmount) > availableBtc;
  const canBuy = tradeLoading === null && isBuyAmountValid && !buyExceedsBalance;
  const canSell = tradeLoading === null && isSellAmountValid && !sellExceedsBalance;

  const onBuy = async () => {
    const amount = normalizedBuyAmount;
    setTradeFeedback(null);
    setTradeError(null);

    if (!isPositiveAmount(amount)) {
      setTradeError('Informe um valor BRL valido (ate 8 casas decimais).');
      return;
    }
    if (Number(amount) > availableBrl) {
      setTradeError('Valor de compra maior que saldo BRL disponivel.');
      return;
    }

    try {
      setTradeLoading('buy');
      const response = await api.post('/trade/buy', { amount_brl: amount });
      const successMessage = response.data?.message ?? 'Compra realizada com sucesso.';
      setTradeFeedback(successMessage);
      Alert.alert('Compra confirmada', successMessage);
      setBuyAmountBrl('');
      await Promise.all([loadWallet(), loadMarketPrice(false), loadTransactions(false)]);
    } catch (error) {
      setTradeError(mapApiError(error, 'Falha ao comprar BTC.'));
    } finally {
      setTradeLoading(null);
    }
  };

  const onSell = async () => {
    const amount = normalizedSellAmount;
    setTradeFeedback(null);
    setTradeError(null);

    if (!isPositiveAmount(amount)) {
      setTradeError('Informe um valor BTC valido (ate 8 casas decimais).');
      return;
    }
    if (Number(amount) > availableBtc) {
      setTradeError('Valor de venda maior que saldo BTC disponivel.');
      return;
    }

    try {
      setTradeLoading('sell');
      const response = await api.post('/trade/sell', { amount_btc: amount });
      const successMessage = response.data?.message ?? 'Venda realizada com sucesso.';
      setTradeFeedback(successMessage);
      Alert.alert('Venda confirmada', successMessage);
      setSellAmountBtc('');
      await Promise.all([loadWallet(), loadMarketPrice(false), loadTransactions(false)]);
    } catch (error) {
      setTradeError(mapApiError(error, 'Falha ao vender BTC.'));
    } finally {
      setTradeLoading(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Carregando sessao...</Text>
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crypto Exchange</Text>

      {isAuthenticated ? (
        <>
          <Text style={styles.subtitle}>Sessao autenticada com Sanctum.</Text>
          <View style={styles.walletCard}>
            <Text style={styles.walletTitle}>Saldo da Wallet</Text>

            {walletLoading ? (
              <View style={styles.walletLoadingRow}>
                <ActivityIndicator />
                <Text style={styles.walletMetaText}>Carregando saldos...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.walletValue}>BRL: {wallet?.balance_brl ?? '--'}</Text>
                <Text style={styles.walletValue}>BTC: {wallet?.balance_btc ?? '--'}</Text>
              </>
            )}

            {walletError ? <Text style={styles.errorText}>{walletError}</Text> : null}
          </View>

          <View style={styles.walletCard}>
            <Text style={styles.walletTitle}>Mercado BTC</Text>

            {marketLoading ? (
              <View style={styles.walletLoadingRow}>
                <ActivityIndicator />
                <Text style={styles.walletMetaText}>Carregando cotacao...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.walletValue}>Par: {marketPrice?.symbol ?? '--'}</Text>
                <Text style={styles.walletValue}>
                  Preco: {marketPrice?.price ?? '--'} {marketPrice?.currency ?? ''}
                </Text>
                <Text style={styles.walletMetaText}>Atualizacao automatica a cada 15s.</Text>
              </>
            )}

            {marketError ? <Text style={styles.errorText}>{marketError}</Text> : null}
          </View>

          <View style={styles.walletCard}>
            <Text style={styles.walletTitle}>Negociacao</Text>

            <Text style={styles.walletMetaText}>Compra (BRL)</Text>
            <View style={styles.tradeRow}>
              <TextInput
                style={[styles.input, styles.tradeInput]}
                value={buyAmountBrl}
                onChangeText={setBuyAmountBrl}
                placeholder="Ex: 2500.00000000"
                keyboardType="decimal-pad"
              />
              <Pressable
                style={[styles.button, !canBuy && styles.buttonDisabled]}
                onPress={() => void onBuy()}
                disabled={!canBuy}
              >
                {tradeLoading === 'buy' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Comprar</Text>
                )}
              </Pressable>
            </View>
            {buyExceedsBalance ? <Text style={styles.errorText}>Valor maior que o saldo BRL disponivel.</Text> : null}

            <Text style={styles.walletMetaText}>Venda (BTC)</Text>
            <View style={styles.tradeRow}>
              <TextInput
                style={[styles.input, styles.tradeInput]}
                value={sellAmountBtc}
                onChangeText={setSellAmountBtc}
                placeholder="Ex: 0.01000000"
                keyboardType="decimal-pad"
              />
              <Pressable
                style={[styles.buttonSecondary, !canSell && styles.buttonDisabled]}
                onPress={() => void onSell()}
                disabled={!canSell}
              >
                {tradeLoading === 'sell' ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.buttonSecondaryText}>Vender</Text>
                )}
              </Pressable>
            </View>
            {sellExceedsBalance ? <Text style={styles.errorText}>Valor maior que o saldo BTC disponivel.</Text> : null}

            {tradeFeedback ? <Text style={styles.successText}>{tradeFeedback}</Text> : null}
            {tradeError ? <Text style={styles.errorText}>{tradeError}</Text> : null}
          </View>

          <View style={styles.walletCard}>
            <Text style={styles.walletTitle}>Historico de transacoes</Text>

            {transactionsLoading ? (
              <View style={styles.walletLoadingRow}>
                <ActivityIndicator />
                <Text style={styles.walletMetaText}>Carregando historico...</Text>
              </View>
            ) : transactions.length === 0 ? (
              <Text style={styles.walletMetaText}>Nenhuma transacao registrada ainda.</Text>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.slice(0, 8).map((item) => (
                  <View key={item.id} style={styles.transactionItem}>
                    <Text style={styles.transactionType}>{item.type.toUpperCase()}</Text>
                    <Text style={styles.walletMetaText}>
                      BRL: {item.amount_brl} | BTC: {item.amount_btc}
                    </Text>
                    <Text style={styles.walletMetaText}>
                      Preco BTC: {item.btc_price} | {formatExecutedAt(item.executed_at)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {transactionsError ? <Text style={styles.errorText}>{transactionsError}</Text> : null}
          </View>

          <View style={styles.authButtonsRow}>
            <Pressable style={styles.buttonSecondary} onPress={() => void loadWallet()} disabled={walletLoading}>
              <Text style={styles.buttonSecondaryText}>Atualizar saldo</Text>
            </Pressable>
            <Pressable
              style={styles.buttonSecondary}
              onPress={() => void loadTransactions(true)}
              disabled={transactionsLoading}
            >
              <Text style={styles.buttonSecondaryText}>Atualizar historico</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => void signOut()}>
              <Text style={styles.buttonText}>Sair</Text>
            </Pressable>
          </View>

          <Text style={styles.tokenText}>Token: {token ?? 'nenhum'}</Text>
        </>
      ) : (
        <View style={styles.form}>
          <View style={styles.modeSwitcher}>
            <Pressable
              style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
              onPress={() => setMode('login')}
            >
              <Text style={styles.modeButtonText}>Login</Text>
            </Pressable>
            <Pressable
              style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
              onPress={() => setMode('register')}
            >
              <Text style={styles.modeButtonText}>Registro</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>{modeTitle}</Text>

          {mode === 'register' && (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nome completo"
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Senha"
            secureTextEntry
          />

          {mode === 'register' && (
            <>
              <TextInput
                style={styles.input}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                placeholder="Confirmar senha"
                secureTextEntry
              />
              <Pressable style={styles.checkboxRow} onPress={() => setAcceptedTerms((prev) => !prev)}>
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]} />
                <Text style={styles.checkboxText}>Aceito os termos de uso.</Text>
              </Pressable>
            </>
          )}

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <Pressable style={styles.button} onPress={() => void onSubmit()} disabled={loadingAction}>
            {loadingAction ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{mode === 'login' ? 'Entrar' : 'Registrar'}</Text>
            )}
          </Pressable>
        </View>
      )}

      <StatusBar style="auto" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#374151',
  },
  form: {
    width: '100%',
    maxWidth: 380,
    gap: 10,
  },
  modeSwitcher: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: '#111827',
    backgroundColor: '#f3f4f6',
  },
  modeButtonText: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  tokenText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
  },
  walletCard: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  walletTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  walletValue: {
    fontSize: 15,
    color: '#111827',
  },
  walletLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletMetaText: {
    color: '#4b5563',
  },
  authButtonsRow: {
    width: '100%',
    maxWidth: 380,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tradeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tradeInput: {
    flex: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#111827',
  },
  checkboxText: {
    color: '#111827',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  successText: {
    color: '#166534',
    fontSize: 13,
  },
  button: {
    flex: 1,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#111827',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  transactionsList: {
    gap: 8,
  },
  transactionItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  transactionType: {
    fontWeight: '700',
    color: '#111827',
  },
});

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

type TransactionItem = {
  id: number;
  type: 'buy' | 'sell';
  amount_brl: string;
  amount_btc: string;
  btc_price: string;
  executed_at: string;
};

const formatExecutedAt = (iso: string) => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString();
};
