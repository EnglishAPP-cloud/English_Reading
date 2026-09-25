# 英语精读

面向大学生的英语精读订阅 APP。每周推几篇精读文章（300–450 词原创英文 + 全套拆解），
每篇走"定向 → 裸读 → 检测 → 练习"的学习流程，收藏的词和句子第二天用间隔复习推回来。

- 技术：Expo SDK 57 + TypeScript + expo-router + zustand + zod
- 没有后端、登录、支付；数据都存在手机本地
- 项目结构、业务规则、技术约定见 [`CLAUDE.md`](./CLAUDE.md)（给 AI 和开发者看的完整说明）

## 一、安装

需要：

- **Node.js**：20.19.4 及以上的 20.x，或 22.13.0 及以上（推荐 22 LTS）。终端运行 `node -v` 查看版本。
- **手机**：安装最新版 **Expo Go**（要支持 SDK 57）
  - iPhone：App Store 搜索 "Expo Go"
  - 安卓：Google Play 搜索 "Expo Go"；打不开 Google Play 的话，到 https://expo.dev/go 下载安装包

```bash
git clone <仓库地址>
cd English_Reading
npm install
```

`npm install` 很慢或失败时，可以换国内镜像：`npm config set registry https://registry.npmmirror.com`。

## 二、在手机上运行

```bash
npm start
```

1. 它会先自动检查 `content/` 里的文章 JSON（见第四节），通过后启动开发服务器，终端里出现一个二维码。
2. 手机和电脑连**同一个 Wi-Fi**。
3. iPhone 用系统相机扫码；安卓打开 Expo Go 点 "Scan QR code" 扫码。
4. 改了代码，手机上会自动刷新。

连不上时：

- 手机和电脑不在同一个网络（或公司 / 学校网络有隔离），改用 `npx expo start --tunnel`
- 提示 SDK 版本不匹配：把手机上的 Expo Go 更新到最新版

## 三、常用命令

| 命令 | 作用 |
|---|---|
| `npm start` | 校验内容 → 启动开发服务器 |
| `npm run content` | 只做内容校验，并生成 `content/index.ts` |
| `npm test` | 跑单元测试（业务逻辑、内容校验、store） |
| `npm run typecheck` | TypeScript 类型检查 |

## 四、怎么加一篇新文章

1. 复制 `content/articles/hkp-01.json`，改名为新的 id，比如 `hkp-02.json`。
   文件名必须和 JSON 里的 `id` 一样，id 只用小写字母、数字和连字符。
2. 改内容。每个字段是什么，看 `src/content/schema.ts`（每个字段后面都有中文注释）或 `CLAUDE.md` 的"内容 JSON 格式"。几个容易错的地方：
   - `publishAt` 写发布日期（`YYYY-MM-DD`）。晚于今天的文章不会显示。
   - `vocab[].word` 必须**原样**出现在对应段落的英文里（完整单词、大小写一致）。
   - `sentences[].text`、`questions[].answer` 必须是对应段落英文里**一字不差**的片段（包括标点）。
   - `check[].answer`、`headings.answers` 里的数字是选项下标，**从 0 开始**。
   - `headings.answers` 每一段都要有。
3. 属于某个拆书系列的：
   - 文章里写 `seriesId`（系列的 id）和 `seriesIndex`（第几期）；
   - 在 `content/series/<系列id>.json` 的 `issues` 里找到这一期，写上 `"articleId": "hkp-02"`，`status` 改成 `"ready"`。
4. 运行：

   ```bash
   npm run content
   ```

   有问题会列出**哪个文件、哪个字段、哪里不对**，例如：

   ```
   content/articles/hkp-02.json
     · vocab[2].word："Diminisherz" 没有作为完整单词原样出现在段落 p2 的英文里（区分大小写）
     · check[0].answer：答案下标 4 超出范围：只有 4 个选项（下标从 0 到 3）
   ```

   按提示改到显示 `✓ 内容校验通过`。
5. 把新的 JSON 和自动更新的 `content/index.ts` 一起提交。

加新系列：同样复制 `content/series/how-to-know-a-person.json` 改名、改内容，再跑 `npm run content`。

## 五、开发时的小工具

设置页（今日 / 知识库 / 单词页右上角"设置"）在**开发环境**下多出几个选项，正式版里看不到：

- **预览未发布内容**：显示 `publishAt` 晚于今天的文章
- **模拟日期 +1 天 / -1 天 / 恢复**：不用改手机日期就能测试复习和连续打卡
- **清空全部本地数据**：回到刚安装的状态

另外，设置页任何时候都可以**重置某一篇文章的进度**。

## 六、常见问题

- **朗读没有声音**：朗读用的是手机系统语音。检查手机是否静音；安卓需要在系统设置里装好英文语音包（文字转语音）。
- **新加的文章在手机上看不到**：新增 JSON 文件后要跑 `npm run content` 重新生成 `content/index.ts`
  （`npm start` 只在启动时自动跑一次）。改已有文件会自动刷新，但也建议跑一遍校验。
- **想从头测一遍**：设置页 → 清空全部本地数据（开发环境），或者重置某一篇。
