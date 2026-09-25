import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
  useFonts,
} from '@expo-google-fonts/lora';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { colors, textVariants } from '@/theme';

/**
 * 根布局：先加载英文字体，再渲染页面。
 * 所有非标签页（系列、文章、复习、设置……）都挂在这个 Stack 上。
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_500Medium,
    Lora_600SemiBold,
  });

  // 字体没加载完前先显示空白背景，避免英文先用系统字体闪一下
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { ...textVariants.subheading, color: colors.text },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="series/[id]" options={{ title: '系列' }} />
        <Stack.Screen name="article/[id]" options={{ title: '' }} />
        <Stack.Screen name="text/[id]" options={{ title: '原文' }} />
        <Stack.Screen name="favorite/[id]" options={{ title: '收藏详情' }} />
        <Stack.Screen name="review" options={{ title: '复习' }} />
        <Stack.Screen name="settings" options={{ title: '设置' }} />
      </Stack>
    </>
  );
}
