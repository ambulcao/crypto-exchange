import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainTabBar } from '../../src/components/exchange/MainTabBar';
import { useAuth } from '../../src/contexts/AuthContext';
import { ExchangeProvider } from '../../src/contexts/ExchangeContext';

function TabsLoadingScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 items-center justify-center bg-white"
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 8,
      }}
    >
      <ActivityIndicator />
      <Text className="mt-2 text-sm text-gray-600">Carregando...</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <TabsLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <ExchangeProvider>
      <Tabs tabBar={(props) => <MainTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="trade" options={{ title: 'Negociar' }} />
        <Tabs.Screen name="history" options={{ title: 'Histórico' }} />
      </Tabs>
    </ExchangeProvider>
  );
}
