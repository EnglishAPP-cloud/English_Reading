import { Link } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, fontSize, space, textVariants } from '@/theme';

/** 标签栏内容区高度（不含手机底部的安全区）。默认 49 放中文标签偏紧，加高一点 */
const TAB_BAR_CONTENT_HEIGHT = space.xxxl + space.lg + space.xs;

/** 标签栏图标：先用一个字代替图标，之后按设计稿换 */
function TabGlyph({ glyph, color }: { glyph: string; color: ColorValue }) {
  // 行高收紧到和字号差不多，标签栏只给图标留了 28 左右的高度
  return <AppText style={{ color, fontSize: fontSize.lg, lineHeight: fontSize.lg + space.xs }}>{glyph}</AppText>;
}

/** 右上角"设置"入口，三个标签页都有 */
function SettingsLink() {
  return (
    <Link href="/settings" asChild>
      <Pressable accessibilityRole="button" hitSlop={space.sm} style={styles.settings}>
        <AppText variant="small" tone="primary">
          设置
        </AppText>
      </Pressable>
    </Link>
  );
}

/** 底部三个标签：今日 / 知识库 / 单词 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { ...textVariants.subheading, color: colors.text },
        headerShadowVisible: false,
        headerRight: () => <SettingsLink />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // 自定义高度时要自己把底部安全区（iPhone 底部横条）加上
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '今日', tabBarIcon: ({ color }) => <TabGlyph glyph="今" color={color} /> }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: '知识库', tabBarIcon: ({ color }) => <TabGlyph glyph="库" color={color} /> }}
      />
      <Tabs.Screen
        name="words"
        options={{ title: '单词', tabBarIcon: ({ color }) => <TabGlyph glyph="词" color={color} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  settings: { paddingHorizontal: space.lg },
});
