import type { PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WalletSaldoCard } from './WalletSaldoCard';

type Props = PropsWithChildren<{
  centerVertically?: boolean;
}>;

/** Espaço extra abaixo do título para notch / Dynamic Island / status bar. */
const HEADER_BELOW_INSET = 10;

export function AuthenticatedScroll({ children, centerVertically = false }: Props) {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + HEADER_BELOW_INSET;

  return (
    <ScrollView
      className="flex-1 bg-white"
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        {
          paddingTop,
          paddingBottom: 28,
        },
        centerVertically ? { flexGrow: 1, justifyContent: 'center' } : undefined,
      ]}
    >
      <View className="items-center gap-3 px-5 pb-6 pt-2">
        <Text className="text-[22px] font-semibold text-gray-900">Crypto Exchange</Text>
        <WalletSaldoCard />
        {children}
      </View>
    </ScrollView>
  );
}
