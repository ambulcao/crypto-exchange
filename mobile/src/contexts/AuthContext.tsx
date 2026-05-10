import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { api, setAuthToken } from '../services/api';

const AUTH_TOKEN_KEY = 'auth_token';

/** Evita spinner infinito se AsyncStorage demorar (emulador / Fabric). */
const HYDRATE_TIMEOUT_MS = 2000;

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  acceptedTerms: boolean;
};

type AuthContextData = {
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    /** Nao cancelar no cleanup do effect: em Strict Mode o primeiro mount desmonta antes de 2s e remover o timeout deixava `isLoading` preso se AsyncStorage demorar. */
    const failSafeTimer = setTimeout(() => {
      setIsLoading(false);
    }, HYDRATE_TIMEOUT_MS);

    const hydrate = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (!cancelled) {
          setToken(storedToken);
          setAuthToken(storedToken);
        }
      } catch {
        if (!cancelled) {
          setToken(null);
          setAuthToken(null);
        }
      } finally {
        clearTimeout(failSafeTimer);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (nextToken: string) => {
    setToken(nextToken);
    setAuthToken(nextToken);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, nextToken);
  };

  const signOut = async () => {
    setToken(null);
    setAuthToken(null);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const response = await api.post('/login', {
        email,
        password,
      });

      await signIn(response.data.token);
    } catch (error) {
      throw mapApiError(error);
    }
  };

  const registerWithEmail = async (payload: RegisterPayload) => {
    try {
      const response = await api.post('/register', {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.passwordConfirmation,
        accepted_terms: payload.acceptedTerms,
      });

      await signIn(response.data.token);
    } catch (error) {
      throw mapApiError(error);
    }
  };

  const value = useMemo<AuthContextData>(
    () => ({
      token,
      isLoading,
      isAuthenticated: Boolean(token),
      signIn,
      loginWithEmail,
      registerWithEmail,
      signOut,
    }),
    [isLoading, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
};

const mapApiError = (error: unknown): Error => {
  if (!axios.isAxiosError(error)) {
    return new Error('Erro inesperado. Tente novamente.');
  }

  if (!error.response) {
    return new Error('Falha de conexão. Verifique rede e URL da API.');
  }

  const status = error.response.status;
  const data = error.response.data as { message?: string; errors?: Record<string, string[]> } | undefined;

  if (status === 401) {
    return new Error('Email ou senha inválidos.');
  }

  if (status === 422) {
    const firstField = data?.errors ? Object.keys(data.errors)[0] : null;
    const firstError = firstField ? data?.errors?.[firstField]?.[0] : null;
    return new Error(firstError ?? data?.message ?? 'Dados inválidos. Revise os campos.');
  }

  return new Error(data?.message ?? 'Erro na requisição. Tente novamente.');
};
