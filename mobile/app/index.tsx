import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../src/contexts/AuthContext';

function IndexLoading() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 items-center justify-center bg-white px-5"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}
    >
      <ActivityIndicator />
      <Text className="mt-2 text-base text-gray-900">Carregando sessão...</Text>
    </View>
  );
}

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <IndexLoading />;
  }

  if (isAuthenticated) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}
