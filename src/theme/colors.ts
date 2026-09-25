/**
 * 颜色 tokens。
 * 组件里只能引用这里的名字，不许写死色值；以后换设计只改这个文件。
 * 只做浅色主题。
 */
export const colors = {
  background: '#EFE9DE', // 页面背景
  surface: '#FFFDF8', // 卡片
  surfaceMuted: '#F6F1E8', // 次一级的底色：面板、输入框、标签
  text: '#1B2130', // 正文
  textSubtle: '#3A3E49', // 稍弱的正文：译文、解析
  textMuted: '#72737B', // 次要文字：说明、日期
  border: 'rgba(27,33,48,0.10)',
  borderStrong: 'rgba(27,33,48,0.22)',
  primary: '#24345E', // 主色：主按钮、选中状态
  onPrimary: '#FFFFFF', // 主色上的文字
  info: '#3A67A0', // 重点词下划线、长难句
  infoSoft: 'rgba(58,103,160,0.09)',
  highlight: '#F3DDB0', // 已收藏的词、朗读中的段落
  success: '#2F7A4E', // 答对
  successSoft: 'rgba(63,122,90,0.12)',
  danger: '#B0452F', // 答错
  dangerSoft: 'rgba(176,69,47,0.10)',
  warning: '#A95E33', // 裸读超时
  scrim: 'rgba(10,12,16,0.28)', // 底部卡片后面的遮罩
} as const;

/** 三种练法各自的颜色：main 用于文字和边框，soft 用于浅色底 */
export const modeColors = {
  deep: { main: '#9A5B12', soft: 'rgba(214,146,52,0.14)' }, // 精读补上
  accurate: { main: '#3F7A5A', soft: 'rgba(63,122,90,0.10)' }, // 读准
  challenge: { main: '#4F45A6', soft: 'rgba(99,88,200,0.11)' }, // 挑战
} as const;

export type ColorName = keyof typeof colors;
