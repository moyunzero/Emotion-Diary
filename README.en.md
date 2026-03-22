# Fenyu

<div align="center">

![Fenyu Logo](./assets/images/icon.png)

**A Healing-Focused Emotion Tracking & Management App**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.30-000)](https://expo.dev/)

[中文文档](./README.md) | [English](./README.en.md)

</div>

## 📱 About

**Fenyu** is an open-source **Mood Tracker** & **Mental Health App** built with **React Native** and **Expo**. Through unique concepts like "Emotion Weather Station" and "Mind Garden", it helps users record, understand, and manage their emotions, turning every emotional record and resolution into a process of nurturing their inner garden. Whether you are looking for a tool to manage your mental health or want to learn React Native development, this project is an excellent choice.

## 👩‍💻 Developer quick start

### Clone and install

```bash
git clone <repository-url>
cd emotion-diary
```

Use **Yarn** with the repository `yarn.lock`. Run `yarn install` locally; to match CI, use `yarn install --frozen-lockfile`.

**Default branch:** `master`.

### Environment

Copy `.env.example` to `.env` and fill values as needed (do not commit real secrets).

### Minimal checks

```bash
yarn typecheck
yarn lint
yarn test:ci
```

### CI summary

- **Pull requests:** runs `yarn lint`, `yarn typecheck`, and `yarn test:ci`.
- **Push to `master`:** also runs `yarn verify:governance` and `node scripts/verify-governance-smoke.js`.

### Community & docs

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [SECURITY.md](./SECURITY.md)
- [openspec/README.md](./openspec/README.md) · [.planning/codebase/STACK.md](./.planning/codebase/STACK.md)

## 🌟 Core Features

### 🌤️ Emotion Weather Station
- Innovative weather metaphor for visualizing relationship health
- Weather icons (droplet, cloud, lightning, etc.) to express emotion intensity
- Real-time display of current "relationship weather" and emotion index

### ✍️ Smart Recording
- **5-Level Emotion Intensity**: From "Slightly Upset" to "Emotional Explosion"
- **Weather-Themed Icons**: Using Droplet, Cloud, CloudRain, CloudLightning, Zap icons
- **Multi-Dimensional Tagging**: Support for people tags and emotion trigger tags, with custom tags
- **Flexible Timeline**: Today, This Week, This Month, Later, Self-Digest options
- **Auto Draft Saving**: Automatically saves drafts during editing, no data loss on accidental exit
- **Edit History Tracking**: Complete modification history to track emotion changes
- **Warm Copywriting**: Lower the barrier to recording, encouraging expression

### 🌱 Mind Garden (Insights Page)
A newly designed insights page using plant growth metaphors to show emotion management progress:

- **Weekly Emotion Weather**: 7-day emotion status at a glance, each day showing weather icon and flower status
- **Healing Progress**: Circular progress bar showing emotion resolution rate, growth stages from seed to bloom
- **Relationship Pots**: Each person corresponds to a flower pot, showing relationship health (Blooming/Growing/Needs Water)
- **Trigger Insights**: Analyze Top 3 emotion triggers with warm "gardening advice"
- **Encouraging Footer**: Dynamically generated positive feedback to show growth

### 🔥 Vent Burning
- Therapeutic emotional release feature
- Cool Skia burning animation effect
- Let negative emotions dissipate with the flames

### 🤖 AI Smart Assistant
- **Emotion Forecasting**: Predicts emotional trends for the next 7 days based on historical data
- **Emotion Podcast**: AI-generated personalized emotional healing podcast content
- **Emotion Prescription**: Personalized advice and coping strategies for specific triggers
- **Smart Analysis**: Deep analysis of emotion cycles and triggering factors
- Uses Groq API, supports offline use (shows default content without API Key)

### ☁️ Data Sync
- **Offline-First**: Local storage protects user privacy
- **Cloud Backup**: Optional Supabase cloud sync for data security
- **Smart Data Migration**: Seamless switching between guest data and logged-in user data

## 🎨 Design Highlights

- **Healing Color Scheme**: Pink-green gradient theme, warm and comfortable
- **Weather-Themed Icons**: Unified Lucide icon library, avoiding emoji compatibility issues
- **Mind Garden Metaphor**: Transform emotion management into nurturing a garden
- **Positive Reinforcement**: Emphasize growth and healing, not problems and conflicts
- **Smooth Animations**: Micro-interactions powered by React Native Reanimated
- **Responsive Design**: Adapts to various screen sizes

## 🚀 Quick Start

### ⚡ One-Minute Experience

```bash
# Clone the project
git clone <repository-url>
cd emotion-diary

# Install dependencies
yarn install

# Start development server
yarn start
```

### 📱 Three Ways to Experience

1. **📲 Expo Go Preview** - Install [Expo Go](https://expo.dev/go) on your phone, scan the QR code
2. **📲 APK Download** - Download pre-compiled APK from Releases page
3. **🌐 Web Version** - Run `yarn web` to experience in browser

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React Native + Expo | 0.81.5 + ~54.0.30 |
| **Routing** | Expo Router | ~6.0.21 |
| **State Management** | Zustand | ^5.0.9 |
| **Data Persistence** | AsyncStorage + Supabase | - |
| **AI Service** | Groq SDK | ^0.37.0 |
| **UI Components** | Custom Components + Lucide React Native | ^0.554.0 |
| **Graphics Rendering** | React Native Skia | 2.2.12 |
| **Animations** | React Native Reanimated | ~4.1.1 |
| **SVG Support** | React Native SVG | 15.12.1 |
| **Type Support** | TypeScript | ~5.9.2 |
| **Build Tools** | EAS Build | - |

## 📁 Project Structure

```
fenyu-emotion-diary/
├── app/                    # Expo Router pages
│   ├── _layout.tsx         # Root layout configuration
│   ├── profile.tsx         # Profile page
│   └── (tabs)/             # Tab navigation group
│       ├── _layout.tsx     # Tab navigation layout
│       ├── index.tsx       # Home page (Dashboard)
│       ├── record.tsx      # Record page
│       └── insights.tsx    # Insights page (Mind Garden)
├── components/             # Reusable UI components
│   ├── Dashboard.tsx       # Dashboard component
│   ├── Record.tsx          # Record component (weather icon selector)
│   ├── Insights.tsx        # Insights component (Mind Garden theme)
│   ├── WeatherStation.tsx  # Emotion weather station component
│   ├── EntryCard.tsx       # Emotion record card (with burn animation)
│   ├── EditEntryModal.tsx  # Edit entry modal
│   ├── Toast.tsx           # Toast notification component
│   └── ai/                 # AI feature components
│       └── EmotionPodcast.tsx  # AI emotion podcast component
├── store/                  # State management (Zustand)
│   └── useAppStore.ts      # Global state Store
├── lib/                    # Utility libraries
│   └── supabase.ts         # Supabase client configuration
├── utils/                  # Utility functions
│   ├── dateUtils.ts        # Date processing utilities
│   ├── aiService.ts        # AI service (Groq API integration)
│   ├── moodIconUtils.tsx   # Mood icon utilities
│   └── draftManager.ts     # Draft management utilities
├── hooks/                  # Custom Hooks
│   └── useHapticFeedback.ts # Haptic feedback Hook
├── assets/                 # Asset files
│   └── images/             # Image assets
├── types.ts               # TypeScript type definitions
├── constants.ts           # App constant configuration (emotion icon mapping)
├── app.json               # Expo app configuration
├── eas.json               # EAS build configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## 🔧 Development Setup

### Environment Setup

#### 1. Install Dependencies

```bash
yarn install
```

#### 2. Configure Supabase (Optional, for cloud sync)

If you need cloud sync functionality:

1. **Create Supabase Project**
   - Visit [Supabase](https://supabase.com) to create a new project
   - Get project URL and anon key

2. **Configure Environment Variables**
   - Create `.env` file in project root (if not exists)
   - Add the following:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Initialize Database**
   - Execute scripts in Supabase SQL Editor (in order):
     - `supabase/create_entries_table.sql` - Create entries table
     - `supabase/rls_policies.sql` - Configure row-level security policies
   - Optional: Execute `supabase/diagnose_entries.sql` for diagnostics

> 💡 **Tip**: The app works without Supabase configuration, but cloud sync will be unavailable. All data will be stored locally only.

#### 3. Start Development Server

```bash
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

## 📱 App Build Guide

### 🤖 Android App Building

#### EAS Cloud Build (Recommended)

**Benefits:** No local Android development environment needed, automatic signing, multi-device support

**1. Install EAS CLI**

```bash
npm install -g eas-cli
```

**2. Configure EAS Project**

```bash
eas build:configure
```

**3. Build APK File**

```bash
# Build preview version (recommended for first time)
eas build --platform android --profile preview

# Build production version (for release)
eas build --platform android --profile production
```

**4. Get APK File**

After build completion (about 5-10 minutes):
- 📧 **Email Notification** - You'll receive an email with download link
- 🌐 **EAS Dashboard** - Visit [expo.dev](https://expo.dev) to download APK file
- 📱 **QR Code Install** - Build results include QR code for direct installation

### 🍎 iOS App Building

#### EAS Cloud Build (Recommended)

**Benefits:** No Mac needed, no Apple Developer account required (for testing)

```bash
# Build preview version
eas build --platform ios --profile preview

# Build production version (requires Apple Developer account)
eas build --platform ios --profile production
```

## 🐛 FAQ

### Development Related

**Q: How to customize theme colors?**

- Modify color configuration in `constants.ts`
- Modify `COLORS` constant in `components/Insights.tsx`
- Update style definitions in various components

**Q: How to add new emotion types?**

- Add new type to `MoodLevel` enum in `types.ts`
- Add new configuration in `MOOD_CONFIG` in `constants.ts` (including iconName and iconColor)
- Add new icon mapping in `getMoodIcon` function in `Record.tsx` and `EntryCard.tsx`

**Q: How to modify gardening advice text?**

- Modify `TRIGGER_ADVICE` object in `components/Insights.tsx`
- You can add corresponding advice for new triggers

## 📋 Version History

### v1.1.0 (Current Version)

- ✅ Weather-themed icon system (replacing emoji)
- ✅ Mind Garden insights page (completely redesigned)
- ✅ Optimized record page copywriting
- ✅ Healing progress circular chart
- ✅ Relationship pots visualization
- ✅ Trigger insights with gardening advice

### v1.0.0

- ✅ Basic emotion recording functionality
- ✅ Emotion weather station visualization
- ✅ Data insights analysis
- ✅ Vent burning feature
- ✅ Android/iOS app building

### Future Plans

- 📊 More data analysis dimensions
- 🎨 Theme customization system
- 🌍 Multi-language support
- 📱 Data export functionality
- 🔔 Emotion reminder feature

## 🤝 Contributing Guidelines

We welcome all forms of contributions!

### How to Contribute

1. **Fork the Project** - Click the Fork button in the top right
2. **Create Feature Branch** - `git checkout -b feature/amazing-feature`
3. **Commit Changes** - `git commit -m 'Add amazing feature'`
4. **Push Branch** - `git push origin feature/amazing-feature`
5. **Create Pull Request** - Submit PR with detailed description

### Development Standards

- Use TypeScript for type-safe development
- Follow ESLint code standards
- Add necessary comments and documentation
- Ensure all features work properly before submitting
- Maintain consistent code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 📞 Contact Us

- 🐛 **Bug Reports**: Please create an Issue in the project repository
- 💬 **Discussions**: Welcome to start discussions in the project repository
- ⭐ **Support**: If this project helps you, please give us a Star!

---

<div align="center">

**🌱 Thanks for using Fenyu, may your mind garden flourish!**

Made with ❤️ by Your Team

[🔝 Back to Top](#fenyu)

</div>
