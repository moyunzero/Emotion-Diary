# App 体积优化实施计划

- [ ] 1. 清理无用资源文件
  - [ ] 1.1 删除废弃的应用图标
    - 删除 `assets/images/app-icon_old.png`
    - 验证其他资源文件无冗余

  - [ ] 1.2 压缩现有图片资源
    - 对 `assets/images/` 下的 PNG/JPEG 进行无损压缩
    - 考虑将部分图标转换为 WebP 格式（iOS 13+ 支持）

- [ ] 2. 增强 Metro 打包配置
  - [ ] 2.1 更新 metro.config.js 压缩配置
    - 已完成：增强 compress 选项（passes, pure_getters, unsafe_math, unsafe_proto）
    - 已完成：添加 mangle.safari 配置
    - 验证构建后 JS bundle 体积变化

  - [ ] 2.2 验证 Hermes 引擎优化效果
    - 确认 eas.json 中 NODE_ENV=production 已启用
    - 检查 Hermes 是否正常编译为字节码

- [ ] 3. 依赖审计与清理
  - [ ] 3.1 扫描未使用的依赖
    - 运行 `npx depcruise --include '**/node_modules/!(react-native)' --output-type json | jq -r '.modules[].name'`
    - 检查 js-md5 是否实际使用

  - [ ] 3.2 分析大型依赖
    - 分析 @shopify/react-native-skia 的使用范围
    - 评估替换为轻量级替代方案的可行性（如 react-native-svg + reanimated）

- [ ] 4. 启用 App Thinning 按需加载
  - [ ] 4.1 确认 EAS Build 配置
    - 验证 iOS 构建使用 App Store 最佳实践
    - 配置 assetBundlePatterns 确保资源按需打包

  - [ ] 4.2 图片资源优化
    - 为不同屏幕密度提供适当尺寸的资源
    - 避免打包过大的默认资源

- [ ] 5. 字体资源优化
  - [ ] 5.1 分析字体使用情况
    - 检查 @expo-google-fonts/lato 的实际使用字符范围
    - 考虑使用 fonteditor-core 裁剪字体文件

  - [ ] 5.2 实现动态字体加载
    - 仅加载当前语言/场景需要的字体子集
    - 使用 expo-font 的按需加载能力

- [ ] 6. 代码分割与懒加载
  - [ ] 6.1 分析路由级代码分割
    - 使用 expo-router 的自动代码分割
    - 验证各页面 bundle 独立打包

  - [ ] 6.2 实现组件级懒加载
    - 对重型组件（如 Charts、复杂动画）使用 React.lazy
    - 减少首屏加载的 JS 体积

- [ ] 7. 检查点 - 验证构建结果
  - [ ] 7.1 体积对比分析
    - 构建基准版本（优化前）
    - 构建优化版本（优化后）
    - 记录 JS bundle 大小变化

  - [ ] 7.2 功能回归验证
    - 验证所有页面正常加载
    - 验证核心交互功能正常
    - 如有疑问请询问用户

- [ ] 8. 更新 EAS Build 配置
  - [ ] 8.1 优化 iOS 构建配置
    - 已完成：移除 simulator 选项
    - 验证 production 构建使用 release 模式

  - [ ] 8.2 添加工具链优化
    - 考虑添加 bundler: "hermes" 加速编译
    - 验证构建缓存策略
