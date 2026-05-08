import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { api } from './src/services/api';

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
    <View style={styles.container}>
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

          <View style={styles.authButtonsRow}>
            <Pressable style={styles.buttonSecondary} onPress={() => void loadWallet()} disabled={walletLoading}>
              <Text style={styles.buttonSecondaryText}>Atualizar saldo</Text>
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
    </View>
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
    gap: 10,
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
});
