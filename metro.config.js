/**
 * Metro 打包配置 - 生产构建优化
 * 用于减小 JS 包体积，提升 iOS/Android 商店下载体积极致
 * @see https://docs.expo.dev/guides/minify/
 */
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// 生产构建时移除 console，减小体积并避免泄露调试信息
config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
  },
};

module.exports = config;
