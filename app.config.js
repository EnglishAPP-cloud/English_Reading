// 在 app.json 的基础上补充只有"打包网页版"时才需要的设置，平时（手机 Expo Go 开发）不受影响。
//
// 网页版发布到 GitHub Pages，网址带仓库名前缀（https://<用户名>.github.io/English_Reading/），
// 打包时用环境变量 WEB_BASE_URL=/English_Reading 告诉 Expo 这个前缀（见 npm run build:web）。
// 不写进 app.json，是因为 baseUrl 也会改开发服务器给手机的地址。
module.exports = ({ config }) => {
  const baseUrl = process.env.WEB_BASE_URL;
  if (!baseUrl) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl } };
};
