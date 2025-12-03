# 情绪日记 (Emotion Diary)

<div align="center">

![Emotion Diary Logo](./assets/images/icon.png)

**一款精美的情绪记录与管理应用**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.25-000)](https://expo.dev/)

[中文文档](./README.md) | [English](./README.en.md)

</div>

## 📱 应用预览

### 🌟 核心功能

- **🌤️ 情绪气象站** - 创新的天气隐喻可视化关系健康状态
- **📝 智能记录** - 5级情绪强度，多维度标签系统
- **📊 数据洞察** - 情绪分布图表，关系健康分析
<!-- - **🤖 AI助手** - Gemini驱动的和解建议与换位思考 -->
- **🔥 气话焚烧** - 治愈系情绪释放功能
- **📱 离线优先** - 完全本地存储，保护用户隐私

### 🎨 设计亮点

- 统一的粉红色系主题色彩
- 流畅的动画与微交互
- 直观的情绪可视化
- 响应式设计适配各种屏幕

## 🚀 快速开始

### ⚡ 一分钟体验

```bash
# 克隆项目
git clone https://github.com/your-username/emotion-diary.git
cd emotion-diary

# 安装依赖
yarn install

# 启动开发服务器
yarn start
```

### 📱 三种体验方式

1. **📲 Expo Go预览** - 手机安装[Expo Go](https://expo.dev/go)，扫描开发服务器二维码
2. **📲 APK下载** - 从[Releases](https://github.com/your-username/emotion-diary/releases)下载预编译APK
3. **🌐 Web版本** - 运行 `yarn web` 在浏览器中体验

## 🛠️ 技术栈

| 类别 | 技术选型 | 版本 |
|------|----------|------|
| **框架** | React Native + Expo | 0.81.5 + 54.0.25 |
| **路由** | Expo Router | ~6.0.15 |
| **状态管理** | React Context + AsyncStorage | - |
| **UI组件** | 自定义组件 + Lucide React Native | - |
| **图表** | React Native Chart Kit | ^6.12.0 |
| **图形渲染** | React Native Skia | ~2.2.12 |
| **动画** | React Native Reanimated | ~4.1.1 |
<!-- | **AI集成** | Google Generative AI (Gemini) | - | -->
| **类型支持** | TypeScript | ~5.9.2 |
| **构建工具** | EAS Build | - |

## 📱 应用打包指南

### 🤖 Android应用打包

#### 方法一：EAS云端构建（推荐）

**优势：** 无需本地Android开发环境，自动处理签名，支持多种设备配置

**1. 安装EAS CLI**

```bash
npm install -g eas-cli
```

**2. 配置EAS项目**

```bash
# 在项目根目录运行
eas build:configure
# 按提示选择平台（选择All支持iOS和Android）
# 会自动生成 eas.json 配置文件
```

**3. 构建APK文件**

```bash
# 构建测试版本（推荐首次使用）
 

# 构建生产版本（用于发布）
eas build --platform android --profile production

# 构建开发版本（包含调试工具）
eas build --platform android --profile development
```

**4. 获取APK文件**

构建完成后（约5-10分钟）：

- 📧 **邮件通知** - 会收到构建完成的邮件，包含下载链接
- 🌐 **EAS控制台** - 访问 [expo.dev](https://expo.dev) 下载APK文件
- 📱 **二维码安装** - 构建结果中包含二维码，可直接扫码安装

**5. 安装到Android设备**

```bash
# 方法一：直接安装
# 下载APK到手机，点击安装（需开启"允许安装未知来源应用"）

# 方法二：ADB命令
adb install your-app.apk

# 方法三：二维码安装
# 扫描构建结果中的二维码直接下载
```

#### 方法二：本地构建

```bash
# 需要配置完整的Android开发环境
eas build --platform android --profile preview --local
```

#### 构建类型说明

| 配置文件 | 输出格式 | 用途 | 签名 |
|----------|----------|------|------|
| `preview` | APK | 内部测试、用户测试 | EAS默认签名 |
| `production` | AAB | Google Play发布 | EAS默认签名 |
| `development` | APK | 开发调试 | 开发者签名 |

#### 发布到Google Play

1. **构建AAB文件**：

   ```bash
   eas build --platform android --profile production
   ```

2. **上传到Google Play Console**：
   - 登录 [Google Play Console](https://play.google.com/console)
   - 创建新应用或选择现有应用
   - 上传AAB文件
   - 填写应用信息、截图和隐私政策
   - 提交审核

---

### 🍎 iOS应用打包

#### 方法一：EAS云端构建（推荐）

**优势：** 无需Mac电脑，无需Apple Developer账号（测试版）

**1. 安装EAS CLI**

```bash
npm install -g eas-cli
```

**2. 配置EAS项目**

```bash
# 如果之前没有配置过
eas build:configure
```

**3. 构建iOS应用**

```bash
# 构建测试版本（模拟器）
eas build --platform ios --profile preview

# 构建生产版本（需要Apple Developer账号）
eas build --platform ios --profile production

# 构建开发版本
eas build --platform ios --profile development
```

**4. 获取iOS应用**

- 📧 **邮件通知** - 构建完成后收到邮件
- 🌐 **EAS控制台** - 下载IPA文件或安装链接
- 📱 **TestFlight** - 生产版本可直接邀请测试

**5. 安装到iOS设备**

```bash
# 方法一：TestFlight安装（推荐）
# 生产版本可通过TestFlight邀请测试用户

# 方法二：Xcode安装
# 1. 下载IPA文件
# 2. 使用Xcode安装到设备

# 方法三：AltStore安装
# 1. 安装AltStore到iPhone
# 2. 通过AltStore安装IPA文件
```

#### 方法二：本地构建（需要Mac）

**环境要求：**

- macOS 12+
- Xcode 14+
- Apple Developer账号（发布版）

**1. 安装依赖**

```bash
# 安装CocoaPods（如果尚未安装）
sudo gem install cocoapods

# 安装iOS依赖
npx expo install:ios

# 或者使用EAS本地构建
eas build --platform ios --profile preview --local
```

**2. 配置签名**

```bash
# 配置Apple开发者账号
eas credentials

# 选择iOS平台，按照提示配置证书和描述文件
```

**3. 构建应用**

```bash
# 开发构建
npx expo run:ios

# 或使用EAS构建
eas build --platform ios --profile production --local
```

#### 发布到App Store

1. **配置App Store Connect**
   - 登录 [App Store Connect](https://appstoreconnect.apple.com/)
   - 创建新应用
   - 填写应用信息

2. **构建发布版本**

   ```bash
   eas build --platform ios --profile production
   ```

3. **上传到App Store**

   ```bash
   eas submit --platform ios
   ```

4. **提交审核**
   - 在App Store Connect中填写版本信息
   - 上传截图和隐私政策
   - 提交审核

---

## ⚙️ 高级配置

### 自定义构建配置

编辑 `eas.json` 文件自定义构建选项：

```json
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 应用图标和启动画面

替换以下文件来自定义应用外观：

```
assets/images/
├── icon.png                    # 应用图标 (1024x1024)
├── android-icon-foreground.png # Android前景图标
├── android-icon-background.png # Android背景图标
├── android-icon-monochrome.png # Android单色图标
├── splash-icon.png             # 启动画面图标
└── favicon.png                 # Web版本图标
```

### 应用签名配置

#### Android签名

```json
// eas.json
{
  "build": {
    "production": {
      "android": {
        "buildType": "aab",
        "keystore": {
          "keystorePath": "./android.keystore",
          "keystorePassword": "your-password",
          "keyAlias": "your-key-alias",
          "keyPassword": "your-key-password"
        }
      }
    }
  }
}
```

#### iOS签名

```json
// eas.json
{
  "build": {
    "production": {
      "ios": {
        "provisioningProfilePath": "./ios/profile.mobileprovision"
      }
    }
  }
}
```

## 🔧 开发配置

<!-- 
### AI功能配置（可选）

要使用AI功能，需要配置Google Gemini API密钥：

1. **获取API密钥**
   - 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 创建新的API密钥

2. **配置环境变量**
   ```bash
   # 在项目根目录创建 .env 文件
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

3. **重启开发服务器**
   ```bash
   yarn start
   ```

> ⚠️ 注意：AI功能为可选功能，不影响应用的核心功能使用。
-->

### 开发环境设置

```bash
# 安装依赖
yarn install

# 启动开发服务器
yarn start

# 运行在模拟器/真机
yarn ios        # iOS模拟器
yarn android    # Android模拟器
yarn web        # Web浏览器

# 代码检查
yarn lint

# 重置项目
yarn reset-project
```

## 📁 项目结构

```
emotion-diary/
├── app/                    # Expo Router页面
│   ├── _layout.tsx         # 根布局配置
│   └── (tabs)/             # 标签页路由组
│       ├── _layout.tsx     # 标签导航布局
│       ├── index.tsx       # 主页面 (Dashboard)
│       ├── record.tsx      # 记录页面
│       └── insights.tsx    # 洞察页面
├── components/             # 可复用UI组件
│   ├── Dashboard.tsx       # 主页面组件
│   ├── Record.tsx          # 记录页面组件
│   ├── Insights.tsx        # 洞察页面组件
│   ├── WeatherStation.tsx  # 情绪气象站组件
│   ├── EntryCard.tsx       # 情绪记录卡片
│   ├── Fireplace.tsx       # 气话焚烧动画
│   └── Navigation.tsx      # 底部导航组件
├── context/                # 状态管理
│   └── AppContext.tsx      # 全局状态Context
├── services/               # 服务层
<!-- │   └── geminiService.ts    # AI服务 -->
├── assets/                 # 资源文件
│   └── images/             # 图片资源
├── types.ts               # TypeScript类型定义
├── constants.ts           # 应用常量配置
├── app.json               # Expo应用配置
├── eas.json               # EAS构建配置
├── tsconfig.json          # TypeScript配置
└── README.md              # 项目文档
```

## 🐛 常见问题

### 构建相关问题

**Q: 构建失败怎么办？**

- 检查 `eas.json` 配置是否正确
- 确保包名唯一性：`com.yourcompany.emotiondiary`
- 查看构建日志中的详细错误信息
- 确保网络连接稳定

**Q: Android构建时间太长？**

- 首次构建需要更长时间（约10-15分钟）
- 后续构建会更快（约5-10分钟）
- 可以使用本地构建选项：`eas build --local`

**Q: iOS构建需要Mac吗？**

- 不需要，EAS云端构建无需Mac
- 本地构建和真机调试需要Mac
- 发布到App Store需要Apple Developer账号

### 安装相关问题

**Q: Android安装提示"应用未安装"？**

- 检查APK文件是否完整
- 确保Android版本兼容性
- 卸载旧版本后重新安装

**Q: iOS安装提示"不受信任的开发者"？**

- 设置 → 通用 → VPN与设备管理 → 信任开发者
- 或使用TestFlight安装（推荐）

**Q: 应用闪退怎么办？**

- 检查设备兼容性
- 查看崩溃日志
- 确保所有依赖正确安装

### 开发相关问题

**Q: 如何自定义主题色彩？**

- 修改 `constants.ts` 中的颜色配置
- 更新各组件中的样式定义

**Q: 如何添加新的情绪类型？**

- 在 `constants.ts` 中的 `MOOD_CONFIG` 添加新配置
- 更新相关的类型定义

## 📋 版本历史

### v1.0.0 (当前版本)

- ✅ 基础情绪记录功能
- ✅ 情绪气象站可视化
- ✅ 数据洞察分析
- ✅ 气话焚烧功能
- ✅ Android/iOS应用打包
<!-- - ✅ AI助手集成 -->

### 未来计划
<!-- - 🤖 更多AI辅助功能 -->
- 📊 高级数据分析
- 🎨 主题定制系统
- 🌍 多语言支持
- ☁️ 可选云端同步
- 📱 数据导出功能

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork项目** - 点击右上角Fork按钮
2. **创建功能分支** - `git checkout -b feature/amazing-feature`
3. **提交更改** - `git commit -m 'Add amazing feature'`
4. **推送分支** - `git push origin feature/amazing-feature`
5. **创建Pull Request** - 提交PR并详细描述更改

### 开发规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint代码规范
- 添加必要的注释和文档
- 确保所有功能正常工作后再提交
- 保持代码风格一致

### 报告问题

如果发现bug或有功能建议：

1. 检查是否已有相关Issue
2. 创建新Issue，详细描述问题
3. 提供复现步骤和环境信息
4. 添加相关截图或日志

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📞 联系我们

- 📧 **邮箱**：<your-email@example.com>
- 🐛 **问题反馈**：[GitHub Issues](https://github.com/your-username/emotion-diary/issues)
- 💬 **讨论**：[GitHub Discussions](https://github.com/your-username/emotion-diary/discussions)
- ⭐ **支持**：如果这个项目对你有帮助，请给个Star支持我们！

---

<div align="center">

**💖 感谢使用情绪日记，让情绪管理更简单！**

Made with ❤️ by Your Team

[🔝 回到顶部](#情绪-diary-emotion-diary)

</div>
