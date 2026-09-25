# 英语精读 APP · 项目说明（给 AI 和开发者）

面向大学生的英语精读订阅 APP。每周推几篇精读文章（300–450 词原创英文 + 全套拆解），
每篇走固定学习流程，收藏的词和句子用间隔复习推回来。文章可以属于一个"拆书系列"。

- 原始需求：`PROMPT.md`（产品规则以它为准）
- 交互原型：`docs/demo-reference.html`（流程逻辑参考，视觉不照搬）
- 本文件记录：目录结构、各层职责、内容格式、业务规则摘要、已拍板的产品决定、技术选择

## 开发进度

- [x] 阶段 0：计划、目录、类型草稿；产品问题已确认（全部按默认，见"已拍板的产品决定"）
- [x] 阶段 1：Expo 项目、路由骨架、theme tokens、本文件
- [x] 阶段 2：内容层（schema、交叉校验、ContentRepository、`npm run content`）
- [ ] 阶段 3：store + `src/logic/` 纯函数 + 单元测试
- [ ] 阶段 4：页面串联
- [ ] 阶段 5：自测 + README

## 技术栈（已定，不要替换）

Expo SDK 57 + TypeScript（strict）· expo-router · zustand + persist（AsyncStorage）· zod ·
expo-speech · @expo-google-fonts/lora · jest-expo（只测纯逻辑）。没有后端、登录、支付。
**加新库之前先问项目负责人。**

## 常用命令

```bash
npm start            # 先自动跑 npm run content，再启动开发服务器，手机 Expo Go 扫码
npm run content      # 校验 content/ 下的 JSON 并生成 content/index.ts
npm test             # 跑单元测试
npm run typecheck    # TypeScript 类型检查
```

## 目录结构

```
app/                      只放路由和页面拼装，不写业务逻辑
  _layout.tsx             根布局：加载 Lora 字体、Stack 导航
  (tabs)/_layout.tsx      底部三个标签：今日 / 知识库 / 单词；右上角"设置"
  (tabs)/index.tsx        今日
  (tabs)/library.tsx      知识库
  (tabs)/words.tsx        单词（收藏 + 复习入口）
  series/[id].tsx         系列详情
  article/[id].tsx        文章页（定向 → 裸读 → 检测 → 练习，四步在这一页里切换）
  text/[id].tsx           只读原文（?p=段落id，高亮并滚动到该段；不影响学习进度）
  favorite/[id].tsx       收藏详情（词或句子），能跳到只读原文
  review.tsx              复习
  settings.tsx            设置
content/
  articles/*.json         文章（一个文件一篇，文件名 = id）
  series/*.json           系列
  index.ts                脚本自动生成，别手改；会提交进仓库
src/
  content/
    schema.ts             zod schema：内容格式的唯一标准
    types.ts              从 schema 推出的 TS 类型 + 栏目 / 难度的中文名
    validate.ts           交叉校验（纯函数，脚本和测试共用）
    repository.ts         ContentRepository 接口
    localRepository.ts    LocalContentRepository：读 content/index.ts
    index.ts              导出当前用的 contentRepository（换云端只改这里）
  store/                  zustand store：用户数据（阶段 3）
  logic/                  纯函数：学习流程、分流、复习调度、今日选文、连续天数、日期工具（阶段 3）
  components/             可复用组件（AppText、Button、Card、Screen……）
  hooks/                  React hooks（useToday 等，阶段 3–4）
  analytics/track.ts      埋点 track(event, props)，现在只 console.log
  theme/                  颜色、字号、间距 tokens
scripts/
  content.ts              npm run content：扫描 → 校验 → 生成 content/index.ts
  renderIndex.ts          生成 index.ts 的文本
docs/                     原型等参考资料
```

路径别名：`@/xxx` = `src/xxx`（tsconfig 的 paths，jest 里用 moduleNameMapper 对应）。

## 各层职责和硬规矩

1. **页面（app/）只拼装**：取数据、调 store 动作、调 logic 函数、渲染组件。不写业务判断。
2. **业务规则全在 `src/logic/`**，写成纯函数（不读时钟、不读存储；"今天"作为参数传进去），每条规则都有单元测试。
3. **数据访问走 `ContentRepository` 接口**。现在用 `LocalContentRepository` 读打包的 JSON；以后换腾讯云 CloudBase 只加一个实现、改一行导出，页面不动。
4. **样式全部走 `src/theme/` tokens**：组件里不许写死颜色、字号、间距。文字统一用 `<AppText variant tone>`。只做浅色主题。
5. **埋点**：开始读、读完、检测得分、切换练法、收藏、复习评分都调用 `track()`，事件名见 `src/analytics/track.ts`。
6. 界面文字用中文；关键逻辑写中文注释。

## 内容 JSON 格式

权威定义是 `src/content/schema.ts`（字段后面有中文注释）；样例见 `content/articles/hkp-01.json`
和 `content/series/how-to-know-a-person.json`。多写、少写、拼错字段都会报错。

**文章** `content/articles/<id>.json`（文件名 = id，id 只用小写字母、数字、连字符）：

| 字段 | 说明 |
|---|---|
| id, column, level | column：`thought` / `news` / `pro`；level：`cet4` / `cet6` |
| seriesId, seriesIndex | 可选，属于系列时两个都写 |
| titleEn, titleZh, wordCount, minutes, sourceNote | 基本信息 |
| publishAt | `YYYY-MM-DD`，晚于今天不显示 |
| intro | 可选，暂不使用 |
| orientation { background, question } | 定向 |
| rawReadSeconds | 裸读倒计时秒数 |
| paragraphs[] { id, en, zh } | 段落，id 如 p1，文内不重复 |
| vocab[] { word, lemma, phonetic, meaning, level, paragraphId } | word 要作为完整单词原样出现在该段（区分大小写） |
| sentences[] { paragraphId, text, analysis[], translation } | 长难句；text 是该段英文的原样片段 |
| questions[] { prompt, answer, paragraphId, explanation } | 读准题；answer 是该段英文的原样片段 |
| check[] { type, prompt, options[], answer, explanation } | 检测题，至少 1 题；answer 是选项下标（从 0 开始） |
| headings { options[], answers{段落id: 下标}, note? } | 挑战；每一段都要有答案 |
| output { template, example }, action | 一句话输出、本周小练习 |

**系列** `content/series/<id>.json`：id, titleEn, titleZh, author, year, total（计划期数）, oneLiner,
scenarios[], insights[{claim, detail}], issues[{index, articleId?, titleEn, titleZh, chapters, level, status: ready|soon}],
glossary[{en, zh, note, issue}], sourceNote, mindmap{root, rootZh, branches[{issue, title, leaves[]}]}。

**校验规则**（`npm run content`，全部问题一次列出，带文件和字段路径，比如 `vocab[2].word`）：
schema；文件名 = id；id 不重复；段落 id 不重复；seriesId / seriesIndex 同写同不写；vocab.word 在对应段落里；
sentences.text、questions.answer 是对应段落的原样子串；check.answer、headings 下标不越界；headings 覆盖每一段；
文章的 seriesId 存在；系列里写了的 articleId 存在、那篇文章的 seriesId / seriesIndex 和这一期对得上；
status 为 ready 必须有 articleId；期号不重复且不超过 total。

## 怎么加一篇新文章

1. 复制 `content/articles/hkp-01.json`，改名为新 id（比如 `hkp-02.json`），把 `id` 改成一样的。
2. 填内容。`publishAt` 写发布日期（本地时区）。
3. 属于系列的：文章里写 `seriesId`、`seriesIndex`；在系列 JSON 对应那一期写上 `articleId`，`status` 改成 `ready`。
4. 运行 `npm run content`，按报错改到通过（`npm start` 也会自动先跑它）。
5. 提交时连同重新生成的 `content/index.ts` 一起提交。

## 业务规则摘要（PROMPT.md 第 6–8 节 + 已拍板的决定）

### 学习流程（每篇文章，4 步）

定向 → 裸读 → 检测 → 练习。复习是全局的，不属于某一篇。

1. **定向**：显示 `orientation.background` 和 `orientation.question`，按钮"开始裸读"。
2. **裸读**：倒计时 `rawReadSeconds`；正文不加任何标注、不显示中文。只累计"停在裸读页且 APP 在前台"的秒数，离开暂停、回来接着计。点"读完了"记下用时。时间到只提示，不强制跳转。
3. **检测**：`check` 选择题，全部答完才能提交；提交后显示对错和解析，不能改。
4. **分流**（显示在检测页底部，点"开始练习"进入第 4 步）：得分率 = 答对数 / 题数。全对 → 挑战；≥ 一半 → 读准；否则 → 精读补上。
5. **练习**：进入推荐练法，可随时切换另外两种。
   - 精读补上：开关"基础"（每段中文大意）和"进阶"（标出重点词和长难句），默认都开、不保存。点词弹底部卡片（音标、本文释义、级别、所在句子、上次遇到、收藏、发音）；点长难句展开拆解和译文，可收藏这句；按段朗读并高亮当前段。
   - 读准：显示 `questions`，点"在原文中标出答案"高亮原句并显示解析。
   - 挑战：每段上方下拉选小标题，全部选完才能检查；检查后显示对错和参考答案，可"重新选"。
   - 共同部分：一句话输出（模板 + 范例，填了就存本地）、本周小练习、读后反馈（多选：时间刚好 / 有点长 / 有点难 / 想看下一期）、"读完了"按钮。
6. 点"读完了" = 本篇完成，记录完成时间，并算一次当天打卡。
7. 每篇都重新检测、重新分流，不存用户"固定水平"。
8. 每篇进度都保存（当前步骤、到过的最远步骤、裸读用时、检测选项和结果、当前练法、小标题选择、已显示的答案、一句话输出、反馈），退出再进接着来。
- **回看**：检测提交前只能往前走（不能回裸读，防止翻原文答题）；提交后，步骤条上到过的步骤都能点回去看（回看裸读不计时、不改用时）。
- **已完成的文章**再打开停在练习步骤、保留当时状态，顶部显示"已完成"。
- **重置某一篇**（设置页）：清空这篇的全部进度（含完成时间，知识库回到"未读"）；不删收藏，不删打卡记录。

### 收藏与复习

- 词收藏：lemma、原文写法、音标、释义、所在句子、articleId、paragraphId。**一个 lemma 只存一条，以第一次为准**，不会被别的文章覆盖；在别的文章里点开显示"已收藏"，再点是取消收藏。
- 句子收藏：原文、译文、articleId、paragraphId。
- 可以取消收藏（底部卡片、收藏详情页）。
- 新收藏：等级 0，下次复习 = 明天。间隔按等级 `[1, 2, 4, 7, 15, 30]` 天。
  - 记得：等级 +1，下次 = 今天 + 新等级对应天数；到 6 = 已掌握，不再出现
  - 模糊：等级不变，明天再来
  - 忘了：等级回 0，明天再来
- 今天要复习的 = 下次复习日期 ≤ 今天且没掌握。排序：下次复习日期早的在前，同一天按收藏时间。
- 复习卡：词卡正面 = 原句挖空 + 中文提示（释义去掉括号备注），背面 = 词、音标、完整原句；句卡正面 = 中文译文，背面 = 英文原句。
- **复习完一轮 = 今天到期的卡全部评完（待复习数变成 0 的那一下）**，算一次当天打卡；中途退出下次接着评。今天没有到期卡时复习不产生打卡。
- 上次遇到：点开一个词，如果这个 lemma 收藏过，显示当时收藏的那句话和日期；否则显示"第一次遇到这个词"。
- 单词页：顶部"今天要复习 N 个"+ 开始按钮；下面分"学习中 / 已掌握"。点一项进收藏详情，能跳到只读原文那一段。

### 今日页、知识库、连续天数

- 今日：已发布、还没读完的文章里 `publishAt` 最晚的一篇（同一天多篇按 id 排序取第一篇）；全读完显示"去复习 N 个"（N=0 时显示今天没有要复习的）。同时显示连续打卡天数和今天待复习数。
- 知识库：上面系列卡片（已读 x / 共 `total` 期），下面单篇列表（包含全部已发布文章，系列文章标"系列名 · 第 n 期"）。按栏目筛选：选"全部"显示所有系列；选某栏目时只显示含该栏目已发布文章的系列。每项状态：未读 / 读到第 n 步·步骤名 / 已完成。
- 系列详情：一句话介绍、适合什么时候读、关键洞察、思维导图（树形列表）、各期目录、名词卡。某一期**能读**的条件：status 为 ready、articleId 对应的文章存在、且已发布（或打开了预览）；否则显示"即将上线"。
- 连续天数：有打卡的日期连成的天数，以今天或昨天结尾才算，否则为 0。
- 发布：`publishAt`（YYYY-MM-DD，本地时区）晚于今天的文章不显示。设置页开发环境下有"预览未发布内容"开关。
- 所有日期按本地时区 YYYY-MM-DD 处理，用 `src/logic/date.ts`，不引入日期库。

### 开发专用（只在 `__DEV__` 下显示）

设置页：预览未发布内容、模拟日期 +1 天 / 恢复（验收复习和连续天数用）、清空全部本地数据。

## 已拍板的产品决定（阶段 0 确认，全部按默认）

1. 文章页 4 步；分流结果显示在检测页底部。
2. 检测提交前不能回裸读；提交后可回看到过的步骤。
3. 裸读只计前台停留在裸读页的秒数。
4. 一个 lemma 一条收藏，第一次为准；可取消收藏。
5. 收藏详情跳到只读原文页 `text/[id]?p=段落id`。
6. 知识库单篇列表包含系列文章；按栏目筛选时系列卡片按"含有该栏目文章"显示。
7. 栏目：`thought` 思想 / `news` 资讯 / `pro` 专业；难度：`cet4` 四级 / `cet6` 六级（要加新值先改 schema）。
8. 复习一轮 = 今天到期的卡全部评完。
9. 读后反馈标签：时间刚好 / 有点长 / 有点难 / 想看下一期。
10. 今日页同一天多篇按 id 排序取第一篇。
11. 重置清空该篇全部进度（含完成），不动收藏和打卡。
12. 开发工具：模拟日期、清空数据。
13. 允许开发依赖 `tsx`（跑 TypeScript 写的内容脚本）。

## 技术选择记录

- **Expo SDK 57**（写代码时的最新稳定版）。Expo 每个 SDK 都有破坏性变更，碰 Expo / RN API 前先看 `package.json` 里的 expo 大版本，查对应版本文档（https://docs.expo.dev/versions/v57.0.0/）。
- **装库用 `npx expo install <包名>`**，它会挑和 SDK 匹配的版本；网络连不上 Expo API 时加 `EXPO_OFFLINE=1`。
- expo-router 57 的标签栏从 `expo-router/js-tabs` 引入（`expo-router` 里直接导出的 `Tabs` 已标记废弃）；`Stack` 从 `expo-router` 引入。
- 为了让 npm 依赖解析一致，显式装了 expo-router 需要的几个配套包，版本都是 SDK 57 自带的版本：`react-dom`、`react-native-reanimated`、`react-native-worklets`、`react-native-gesture-handler`。它们不是新功能库，不要删；否则 npm 会装上不匹配的版本，导致 Expo Go 报错。
- 测试：jest-expo 需要 `jest`、`@types/jest`、`@react-native/jest-preset`；脚本类型检查用 `@types/node`。TypeScript 6 默认不再自动加载 `@types/*`，所以 tsconfig 里写了 `"types": ["jest", "node"]`。
- tsconfig 开了 `noUncheckedIndexedAccess`：数组 / 对象按下标取值会被当成可能是 undefined，逼着处理内容缺失的情况。
- 标签栏图标暂时用单个汉字（今 / 库 / 词），没有引入图标库；等设计稿来了再换。
- 底部卡片、下拉框用 React Native 自带的 `Modal` 实现，不引入 UI 库。
- 内容脚本用 `tsx` 运行（`scripts/content.ts`），和 APP 共用 `src/content/schema.ts` / `validate.ts`，规则只有一份。
- zod 4：报错用中文（`z.locales.zhCN()`），并开了 `jitless`（不用 `new Function`，避免手机 JS 引擎不支持）。
- `LocalContentRepository` 在 APP 启动时再用 zod 解析一遍内容：正常情况下脚本已拦住错误；万一有人跳过脚本，会直接报错。
- 文章 schema 校验失败时不做交叉检查（结构都不对，没法查对应关系），报错末尾会提示"改好后重跑会继续查"。
- 找单词（`findWholeWord`）是"完整单词、区分大小写"；为兼容手机 JS 引擎，没有用正则后行断言。校验和页面高亮用同一个函数。
- `content/index.ts` 提交进仓库，这样新拉代码不跑脚本也能通过类型检查；内容改了记得一起提交。
- Lora 字体在 `app/_layout.tsx` 加载完才渲染页面；Lora 的粗细靠字体名区分（安卓不认 fontWeight）。
