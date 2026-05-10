import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const isWide = windowWidth >= 600;
  const horizontalPadding = isTablet ? 48 : isWide ? 32 : 20;
  const formMaxWidth = Math.min(isTablet ? 520 : isWide ? 460 : 420, windowWidth - horizontalPadding * 2);
  const gapBeforeSubmit = isTablet ? 32 : 24;
  const inputMinHeight = isTablet ? 52 : 48;

  const router = useRouter();
  const { loginWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

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
        setFormError('A confirmação de senha não confere.');
        return;
      }

      if (!acceptedTerms) {
        setFormError('Você precisa aceitar os termos para continuar.');
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
      router.replace('/dashboard');
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
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: horizontalPadding,
        paddingTop: Math.max(insets.top + (isTablet ? 16 : 12), isTablet ? 32 : 20),
        paddingBottom: Math.max(insets.bottom + (isTablet ? 24 : 16), isTablet ? 40 : 24),
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        className="w-full items-stretch gap-4 self-center"
        style={{ maxWidth: formMaxWidth }}
      >
        <Text
          className={`text-center font-semibold text-gray-900 ${isTablet ? 'text-3xl' : 'text-[22px]'}`}
        >
          Crypto Exchange
        </Text>

        {mode === 'login' ? (
          <View className="items-center gap-1 px-1">
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

        <View className="gap-3">
          {mode === 'register' && (
            <TextInput
              className="rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900"
              style={{ minHeight: inputMinHeight }}
              value={name}
              onChangeText={setName}
              placeholder="Nome completo"
              autoCapitalize="words"
            />
          )}

          <TextInput
            className="rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900"
            style={{ minHeight: inputMinHeight }}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View
            className="w-full flex-row items-center rounded-xl border border-gray-300 bg-white"
            style={{ minHeight: inputMinHeight }}
          >
            <TextInput
              className="flex-1 px-3 py-2 pr-2 text-base text-gray-900"
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
              <View
                className="w-full flex-row items-center rounded-xl border border-gray-300 bg-white"
                style={{ minHeight: inputMinHeight }}
              >
                <TextInput
                  className="flex-1 px-3 py-2 pr-2 text-base text-gray-900"
                  value={passwordConfirmation}
                  onChangeText={setPasswordConfirmation}
                  placeholder="Confirmar senha"
                  secureTextEntry={!showPasswordConfirm}
                  autoCapitalize="none"
                />
                <Pressable
                  accessibilityLabel={
                    showPasswordConfirm ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'
                  }
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
              <Pressable
                className="mt-1 flex-row items-center gap-3 py-1"
                onPress={() => setAcceptedTerms((prev) => !prev)}
              >
                <View
                  className={`h-[18px] w-[18px] rounded border border-gray-600 ${
                    acceptedTerms ? 'bg-gray-900' : 'bg-white'
                  }`}
                />
                <Text className="flex-1 text-base text-gray-900">Aceito os termos de uso.</Text>
              </Pressable>
            </>
          )}
        </View>

        {formError ? (
          <Text className="text-[13px] text-red-800">{formError}</Text>
        ) : null}

        <Pressable
          className={`items-center justify-center rounded-xl bg-gray-900 px-4 py-3.5 ${loadingAction ? 'opacity-70' : ''}`}
          style={{ marginTop: gapBeforeSubmit, minHeight: isTablet ? 54 : 50 }}
          onPress={() => void onSubmit()}
          disabled={loadingAction}
        >
          {loadingAction ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              {mode === 'login' ? 'Entrar na conta' : 'Criar minha conta'}
            </Text>
          )}
        </Pressable>

        {mode === 'login' ? (
          <View className="mt-2 flex-row flex-wrap items-center justify-center gap-1 px-1">
            <Text className="text-center text-sm text-gray-600">Não tem conta?</Text>
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
          <View className="mt-2 flex-row flex-wrap items-center justify-center gap-1 px-1">
            <Text className="text-center text-sm text-gray-600">Já tem conta?</Text>
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

        <StatusBar style="auto" />
      </View>
    </ScrollView>
  );
}
