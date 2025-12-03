# Emotion Diary

<div align="center">

![Emotion Diary Logo](./assets/images/icon.png)

**A Beautiful Emotion Tracking & Management App**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.25-000)](https://expo.dev/)

[中文文档](./README.md) | [English](./README.en.md)

</div>

## 📱 App Preview

### 🌟 Core Features

- **🌤️ Emotion Weather Station** - Innovative weather metaphor for visualizing relationship health
- **📝 Smart Recording** - 5-level emotion intensity with multi-dimensional tagging system
- **📊 Data Insights** - Emotion distribution charts and relationship health analysis
<!-- - **🤖 AI Assistant** - Gemini-powered reconciliation suggestions and perspective switching -->
- **🔥 Vent Burning** - Therapeutic emotional release feature
- **📱 Offline-First** - Complete local storage to protect user privacy

### 🎨 Design Highlights

- Unified pink color theme
- Smooth animations and micro-interactions
- Intuitive emotion visualization
- Responsive design for various screen sizes

## 🚀 Quick Start

### ⚡ One-Minute Experience

```bash
# Clone the project
git clone https://github.com/your-username/emotion-diary.git
cd emotion-diary

# Install dependencies
yarn install

# Start development server
yarn start
```

### 📱 Three Ways to Experience

1. **📲 Expo Go Preview** - Install [Expo Go](https://expo.dev/go) on your phone, scan the QR code
2. **📲 APK Download** - Download pre-compiled APK from [Releases](https://github.com/your-username/emotion-diary/releases)
3. **🌐 Web Version** - Run `yarn web` to experience in browser

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React Native + Expo | 0.81.5 + 54.0.25 |
| **Routing** | Expo Router | ~6.0.15 |
| **State Management** | React Context + AsyncStorage | - |
| **UI Components** | Custom Components + Lucide React Native | - |
| **Charts** | React Native Chart Kit | ^6.12.0 |
| **Graphics** | React Native Skia | ~2.2.12 |
| **Animations** | React Native Reanimated | ~4.1.1 |
<!-- | **AI Integration** | Google Generative AI (Gemini) | - | -->
| **Type Support** | TypeScript | ~5.9.2 |
| **Build Tools** | EAS Build | - |

## 📱 App Build Guide

### 🤖 Android App Building

#### Method 1: EAS Cloud Build (Recommended)

**Benefits:** No local Android development environment needed, automatic signing, multi-device support

**1. Install EAS CLI**

```bash
npm install -g eas-cli
```

**2. Configure EAS Project**

```bash
# Run in project root
eas build:configure
# Follow prompts to select platforms (choose All for iOS and Android)
# Will automatically generate eas.json configuration file
```

**3. Build APK File**

```bash
# Build preview version (recommended for first time)
eas build --platform android --profile preview

# Build production version (for release)
eas build --platform android --profile production

# Build development version (with debug tools)
eas build --platform android --profile development
```

**4. Get APK File**

After build completion (about 5-10 minutes):

- 📧 **Email Notification** - You'll receive an email with download link
- 🌐 **EAS Dashboard** - Visit [expo.dev](https://expo.dev) to download APK file
- 📱 **QR Code Install** - Build results include QR code for direct installation

**5. Install on Android Device**

```bash
# Method 1: Direct Installation
# Download APK to phone, click to install (enable "Install unknown apps")

# Method 2: ADB Command
adb install your-app.apk

# Method 3: QR Code Installation
# Scan QR code from build results to download directly
```

#### Method 2: Local Build

```bash
# Requires complete Android development environment setup
eas build --platform android --profile preview --local
```

#### Build Type Comparison

| Config | Output Format | Purpose | Signing |
|--------|--------------|---------|---------|
| `preview` | APK | Internal testing, user testing | EAS default signing |
| `production` | AAB | Google Play release | EAS default signing |
| `development` | APK | Development debugging | Developer signing |

#### Publish to Google Play

1. **Build AAB File:**

   ```bash
   eas build --platform android --profile production
   ```

2. **Upload to Google Play Console:**
   - Login to [Google Play Console](https://play.google.com/console)
   - Create new app or select existing app
   - Upload AAB file
   - Fill app info, screenshots and privacy policy
   - Submit for review

---

### 🍎 iOS App Building

#### Method 1: EAS Cloud Build (Recommended)

**Benefits:** No Mac needed, no Apple Developer account required (for testing)

**1. Install EAS CLI**

```bash
npm install -g eas-cli
```

**2. Configure EAS Project**

```bash
# If not configured before
eas build:configure
```

**3. Build iOS App**

```bash
# Build preview version (simulator)
eas build --platform ios --profile preview

# Build production version (requires Apple Developer account)
eas build --platform ios --profile production

# Build development version
eas build --platform ios --profile development
```

**4. Get iOS App**

- 📧 **Email Notification** - Receive email after build completion
- 🌐 **EAS Dashboard** - Download IPA file or installation link
- 📱 **TestFlight** - Production version can directly invite testers

**5. Install on iOS Device**

```bash
# Method 1: TestFlight Installation (Recommended)
# Production version can invite test users through TestFlight

# Method 2: Xcode Installation
# 1. Download IPA file
# 2. Install to device using Xcode

# Method 3: AltStore Installation
# 1. Install AltStore on iPhone
# 2. Install IPA file through AltStore
```

#### Method 2: Local Build (Requires Mac)

**Requirements:**

- macOS 12+
- Xcode 14+
- Apple Developer account (for release)

**1. Install Dependencies**

```bash
# Install CocoaPods if not installed
sudo gem install cocoapods

# Install iOS dependencies
npx expo install:ios

# Or use EAS local build
eas build --platform ios --profile preview --local
```

**2. Configure Signing**

```bash
# Configure Apple Developer account
eas credentials

# Select iOS platform, follow prompts to configure certificates and profiles
```

**3. Build App**

```bash
# Development build
npx expo run:ios

# Or use EAS build
eas build --platform ios --profile production --local
```

#### Publish to App Store

1. **Configure App Store Connect**
   - Login to [App Store Connect](https://appstoreconnect.apple.com/)
   - Create new app
   - Fill app information

2. **Build Release Version**

   ```bash
   eas build --platform ios --profile production
   ```

3. **Upload to App Store**

   ```bash
   eas submit --platform ios
   ```

4. **Submit for Review**
   - Fill version information in App Store Connect
   - Upload screenshots and privacy policy
   - Submit for review

---

## ⚙️ Advanced Configuration

### Custom Build Configuration

Edit `eas.json` file to customize build options:

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

### App Icons and Splash Screen

Replace the following files to customize app appearance:

```
assets/images/
├── icon.png                    # App icon (1024x1024)
├── android-icon-foreground.png # Android foreground icon
├── android-icon-background.png # Android background icon
├── android-icon-monochrome.png # Android monochrome icon
├── splash-icon.png             # Splash screen icon
└── favicon.png                 # Web version icon
```

### App Signing Configuration

#### Android Signing

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

#### iOS Signing

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

## 🔧 Development Setup

<!-- 
### AI Feature Configuration (Optional)

To use AI features, you need to configure Google Gemini API key:

1. **Get API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create new API key

2. **Configure Environment Variables**
   ```bash
   # Create .env file in project root
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

3. **Restart Development Server**
   ```bash
   yarn start
   ```

> ⚠️ Note: AI features are optional and do not affect core app functionality.
-->

### Development Environment Setup

```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Run on simulator/device
yarn ios        # iOS simulator
yarn android    # Android emulator
yarn web        # Web browser

# Code linting
yarn lint

# Reset project
yarn reset-project
```

## 📁 Project Structure

```
emotion-diary/
├── app/                    # Expo Router pages
│   ├── _layout.tsx         # Root layout configuration
│   └── (tabs)/             # Tab navigation group
│       ├── _layout.tsx     # Tab navigation layout
│       ├── index.tsx       # Home page (Dashboard)
│       ├── record.tsx      # Record page
│       └── insights.tsx    # Insights page
├── components/             # Reusable UI components
│   ├── Dashboard.tsx       # Dashboard page component
│   ├── Record.tsx          # Record page component
│   ├── Insights.tsx        # Insights page component
│   ├── WeatherStation.tsx  # Emotion weather station component
│   ├── EntryCard.tsx       # Emotion record card
│   ├── Fireplace.tsx       # Vent burning animation
│   └── Navigation.tsx      # Bottom navigation component
├── context/                # State management
│   └── AppContext.tsx      # Global state Context
├── services/               # Service layer
<!-- │   └── geminiService.ts    # AI service -->
├── assets/                 # Asset files
│   └── images/             # Image assets
├── types.ts               # TypeScript type definitions
├── constants.ts           # App constant configuration
├── app.json               # Expo app configuration
├── eas.json               # EAS build configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## 🐛 Frequently Asked Questions

### Build Related Issues

**Q: What to do if build fails?**

- Check if `eas.json` configuration is correct
- Ensure package name uniqueness: `com.yourcompany.emotiondiary`
- Check detailed error messages in build logs
- Ensure stable network connection

**Q: Android build takes too long?**

- First build takes longer (about 10-15 minutes)
- Subsequent builds are faster (about 5-10 minutes)
- Can use local build option: `eas build --local`

**Q: iOS build requires Mac?**

- No, EAS cloud build doesn't require Mac
- Local build and device debugging require Mac
- Publishing to App Store requires Apple Developer account

### Installation Related Issues

**Q: Android installation shows "App not installed"?**

- Check if APK file is complete
- Ensure Android version compatibility
- Uninstall old version and reinstall

**Q: iOS installation shows "Untrusted Developer"?**

- Settings → General → VPN & Device Management → Trust Developer
- Or use TestFlight installation (recommended)

**Q: App crashes on startup?**

- Check device compatibility
- Check crash logs
- Ensure all dependencies are correctly installed

### Development Related Issues

**Q: How to customize theme colors?**

- Modify color configuration in `constants.ts`
- Update style definitions in various components

**Q: How to add new emotion types?**

- Add new configuration in `MOOD_CONFIG` in `constants.ts`
- Update related type definitions

## 📋 Version History

### v1.0.0 (Current Version)

- ✅ Basic emotion recording functionality
- ✅ Emotion weather station visualization
- ✅ Data insights analysis
- ✅ Vent burning feature
- ✅ Android/iOS app building
<!-- - ✅ AI assistant integration -->

### Future Plans
<!-- - 🤖 More AI-assisted features -->
- 📊 Advanced data analysis
- 🎨 Theme customization system
- 🌍 Multi-language support
- ☁️ Optional cloud sync
- 📱 Data export functionality

## 🤝 Contributing Guidelines

We welcome all forms of contributions!

### How to Contribute

1. **Fork the Project** - Click the Fork button in the top right
2. **Create Feature Branch** - `git checkout -b feature/amazing-feature`
3. **Commit Changes** - `git commit -m 'Add amazing feature'`
4. **Push Branch** - `git push origin feature/amazing-feature`
5. **Create Pull Request** - Submit PR with detailed description of changes

### Development Standards

- Use TypeScript for type-safe development
- Follow ESLint code standards
- Add necessary comments and documentation
- Ensure all features work properly before submitting
- Maintain consistent code style

### Reporting Issues

If you find bugs or have feature suggestions:

1. Check if related Issue already exists
2. Create new Issue with detailed problem description
3. Provide reproduction steps and environment information
4. Add relevant screenshots or logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 📞 Contact Us

- 📧 **Email**: <your-email@example.com>
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/emotion-diary/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/emotion-diary/discussions)
- ⭐ **Support**: If this project helps you, please give us a Star!

---

<div align="center">

**💖 Thanks for using Emotion Diary, making emotion management simpler!**

Made with ❤️ by Your Team

[🔝 Back to Top](#emotion-diary)

</div>
