import Constants from 'expo-constants';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmButton } from '@/components/ConfirmButton';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { usePublishedArticles } from '@/content/hooks';
import { useToday } from '@/hooks/useToday';
import { articleStatus, articleStatusLabel } from '@/logic/flow';
import { useUserStore } from '@/store/userStore';
import { colors, space } from '@/theme';

/** 设置：重置某一篇的进度；开发环境下还有预览、模拟日期、清空数据 */
export default function SettingsScreen() {
  const today = useToday();
  const progress = useUserStore((s) => s.progress);
  const settings = useUserStore((s) => s.settings);
  const resetArticle = useUserStore((s) => s.resetArticle);
  const setPreview = useUserStore((s) => s.setPreviewUnpublished);
  const shiftDevDate = useUserStore((s) => s.shiftDevDate);
  const resetDevDate = useUserStore((s) => s.resetDevDate);
  const clearAllData = useUserStore((s) => s.clearAllData);
  // 这里要列出有进度的所有文章（包括未发布的），只用来取标题
  const articles = usePublishedArticles(today, true);

  const started = Object.keys(progress);
  const titleOf = (id: string) => articles.data?.find((a) => a.id === id)?.titleEn ?? id;

  return (
    <Screen>
      <Section title="学习进度" hint="重置后这篇回到「未读」，收藏和打卡记录不受影响">
        {started.length === 0 ? (
          <AppText variant="small" tone="textMuted">
            还没有开始读任何文章。
          </AppText>
        ) : (
          started.map((id) => (
            <Card key={id}>
              <Row spread gap="md">
                <View style={styles.flex}>
                  <AppText variant="enBody">{titleOf(id)}</AppText>
                  <AppText variant="caption" tone="textMuted">
                    {articleStatusLabel(articleStatus(progress[id]))}
                  </AppText>
                </View>
                <ConfirmButton small title="重置" confirmTitle="确认重置" onConfirm={() => resetArticle(id)} />
              </Row>
            </Card>
          ))
        )}
      </Section>

      {__DEV__ ? (
        <Section title="开发者选项" hint="只在开发环境显示">
          <Card>
            <Row spread gap="md">
              <View style={styles.flex}>
                <AppText variant="body">预览未发布内容</AppText>
                <AppText variant="caption" tone="textMuted">
                  打开后，publishAt 晚于今天的文章也会显示
                </AppText>
              </View>
              <Switch
                value={settings.previewUnpublished}
                onValueChange={setPreview}
                trackColor={{ true: colors.primary, false: colors.borderStrong }}
                thumbColor={colors.surface}
              />
            </Row>
          </Card>
          <Card>
            <AppText variant="body">模拟日期</AppText>
            <AppText variant="caption" tone="textMuted">
              当前"今天"：{today}
              {settings.devDateOffsetDays !== 0 ? `（偏移 ${settings.devDateOffsetDays > 0 ? '+' : ''}${settings.devDateOffsetDays} 天）` : '（真实日期）'}
            </AppText>
            <Row gap="sm" wrap>
              <Button small title="+1 天" onPress={() => shiftDevDate(1)} />
              <Button small variant="secondary" title="-1 天" onPress={() => shiftDevDate(-1)} />
              <Button small variant="ghost" title="恢复真实日期" onPress={resetDevDate} />
            </Row>
          </Card>
          <Card>
            <AppText variant="body">清空全部本地数据</AppText>
            <AppText variant="caption" tone="textMuted">
              进度、收藏、打卡、设置全部清空，回到刚安装的状态
            </AppText>
            <ConfirmButton small title="清空" confirmTitle="确认清空全部数据" onConfirm={clearAllData} />
          </Card>
        </Section>
      ) : null}

      <AppText variant="caption" tone="textMuted">
        英语精读 · 版本 {Constants.expoConfig?.version ?? '-'}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.xxs },
});
