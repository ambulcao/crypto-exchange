import axios from 'axios';
import { Platform } from 'react-native';

const getDefaultBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2/api';
  }

  return 'http://127.0.0.1/api';
};

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultBaseUrl();

export const api = axios.create({
  baseURL,
  timeout: 10000,
});

export const setAuthToken = (token: string | null) => {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};
