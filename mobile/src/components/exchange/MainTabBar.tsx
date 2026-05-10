import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { ArrowLeftRight, History, LayoutDashboard } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';

export function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const bottomPad = Math.max(insets.bottom, 12);

  const go = (routeName: string) => {
    navigation.navigate(routeName as never);
  };

  const active = state.routes[state.index]?.name;

  const Item = ({
    routeName,
    label,
    Icon,
    small,
  }: {
    routeName: string;
    label: string;
    Icon: typeof LayoutDashboard;
    small?: boolean;
  }) => {
    const isActive = active === routeName;
    const color = isActive ? '#ffffff' : '#111827';
    return (
      <Pressable
        accessibilityRole="button"
        className={`min-w-0 flex-1 items-center rounded-xl py-2.5 ${isActive ? 'bg-gray-900' : 'bg-transparent'}`}
        onPress={() => go(routeName)}
      >
        <Icon size={24} color={color} strokeWidth={2} />
        <Text
          className={`mt-0.5 text-center font-medium ${small ? 'text-[9px] leading-tight' : 'text-[10px]'} ${
            isActive ? 'text-white' : 'text-gray-600'
          }`}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="border-t border-gray-100 bg-white pt-2" style={{ paddingBottom: bottomPad }}>
      <View className="mx-auto w-full max-w-[380px] flex-row justify-center gap-1 rounded-2xl border border-gray-200 bg-white p-1.5">
        <Item routeName="dashboard" label="Dashboard" Icon={LayoutDashboard} />
        <Item routeName="trade" label="Negociar" Icon={ArrowLeftRight} />
        <Item
          routeName="history"
          label={'Histórico\ncompra/venda'}
          Icon={History}
          small
        />
      </View>

      <Pressable
        accessibilityRole="button"
        className="mt-3 mb-1 min-h-[48px] self-center justify-center rounded-full border border-gray-300 px-8 py-3"
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#e8eef9' : '#ffffff',
        })}
        onPress={() => {
          void (async () => {
            await signOut();
            router.replace('/login');
          })();
        }}
      >
        <Text className="text-base font-semibold text-gray-800">Sair da conta</Text>
      </Pressable>
    </View>
  );
}
