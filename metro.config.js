/**
 * Metro 打包配置 - 生产构建优化
 * 用于减小 JS 包体积，提升 iOS/Android 商店下载体积极致
 * @see https://docs.expo.dev/guides/minify/
 */
const { getDefaultConfig } = require("expo/metro-config");
const { getDefaultConfig: getDefaultExpoConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
    passes: 2,
    pure_getters: true,
    unsafe_math: true,
    unsafe_proto: true,
  },
  mangle: {
    safari: true,
  },
};



module.exports = config;
