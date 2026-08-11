# Widget Snapshot (local Expo module)

QUAL-03 native sink for the privacy whitelist snapshot, plus **iOS WidgetKit Soft Stack** and **Android AppWidget Soft Stack** (Phase 17). Config plugin injects both targets on every `expo prebuild` / EAS native generation.

## Storage

| Platform | Mechanism | Key | Notes |
|----------|-----------|-----|--------|
| iOS | `UserDefaults(suiteName:)` App Group | `widget_snapshot_v1` | Suite: `group.com.moyunzero.emotiondiary` |
| Android | `SharedPreferences` `MODE_PRIVATE` | `widget_snapshot_v1` | File: `{packageName}.widget_snapshot` |

Must **not** use AsyncStorage as the sole/permanent SoT. Must **not** use world-readable external storage on Android. Must **not** set `android:process` isolation on the AppWidget provider (MODE_PRIVATE would become unreachable).

## Config plugin (`app.plugin.js`)

Listed in `app.json` → `plugins` as `./modules/widget-snapshot/app.plugin.js`.

On each prebuild the plugin:

1. Ensures main-app App Group entitlement `group.com.moyunzero.emotiondiary`
2. Declares EAS `extra.eas.build.experimental.ios.appExtensions` for **EmotionDiaryWidget** (`com.moyunzero.emotiondiary.widget`) + App Group (also mirrored in `app.json`)
3. **iOS:** copies `ios-widget/` → `ios/EmotionDiaryWidget/`, writes extension entitlements, injects WidgetKit `app_extension` target via `withXcodeProject` (WidgetKit + SwiftUI frameworks)
4. **Android:** copies `android-widget/` Kotlin + `res/` into the generated app (and syncs into this module’s `android/src/main`), registers `WidgetSnapshotProvider` via `withAndroidManifest` — never `android:process`

### Prebuild smoke

```bash
# iOS (repo already has ios/)
npx expo prebuild --platform ios --no-install

# Android (generate android/ when missing — do not invent a committed tree)
npx expo prebuild --platform android --no-install
```

After prebuild, expect:

- iOS: `EmotionDiaryWidget` target / sources under `ios/EmotionDiaryWidget/`
- Android: `WidgetSnapshotProvider` + `widget_snapshot_small` / `widget_snapshot_info` in the merged app (or module) resources

If local `android/` is absent, use the Android prebuild command above or an EAS `development` / `preview` APK build — that is the verification route (see `17-UAT.md`).

### EAS profiles

Use existing `eas.json` profiles:

| Profile | Use |
|---------|-----|
| `development` | Dev client; Android APK — add widget on device/emulator |
| `preview` | Internal distribution APK / iOS internal |
| `production` | Store builds (after App Group portal + credentials OK) |

Confirm EmotionDiaryWidget appears under EAS iOS credentials after `appExtensions` lands (`eas credentials` / Expo dashboard).

### Dependency policy (hard)

- **Do not** install `expo-widgets` or raise Expo SDK solely for widgets
- **Do not** install `@bacons/apple-targets` unless Plan 17-04 human gate explicitly approves the SUS escape hatch after a documented hand-roll failure
- **Do not** add in-app “how to add widget” education screens (D-17)

## iOS widget (`ios-widget/`)

Hand-rolled WidgetKit Soft Stack sources (SoT). Plugin injects them into the Xcode extension target.

| File | Role |
|------|------|
| `SnapshotReader.swift` | App Group suite read only — never `UserDefaults.standard` |
| `EmotionDiaryWidget.swift` | TimelineProvider + Soft Stack A; `.systemSmall` only; `widgetURL` = `emotiondiary:///` |
| `EmotionDiaryWidgetBundle.swift` | `@main` WidgetBundle |
| `Info.plist` | Extension point `com.apple.widgetkit-extension`; display name「心晴」 |

Target: display `EmotionDiaryWidget`, bundle id `com.moyunzero.emotiondiary.widget`.

## Apple App Group (user setup — portal)

Register App Group `group.com.moyunzero.emotiondiary` on the Apple Developer account for **both**:

1. Main App ID `com.moyunzero.emotiondiary`
2. Widget extension App ID `com.moyunzero.emotiondiary.widget`

Portal: **Apple Developer → Identifiers → App Groups / App ID capabilities**. Without the group on the extension App ID, `SnapshotReader` cannot see writes from `WidgetSnapshotModule`.

## Privacy Manifest (UserDefaults)

App Group `UserDefaults` access should declare Privacy Manifest reason **`1C8F.1`** (`NSPrivacyAccessedAPICategoryUserDefaults`) when shipping App Store builds. See `ios/PrivacyInfo.xcprivacy` in this module.

## Timeline reload (iOS)

`WidgetSnapshotModule.writeSnapshot` and `clearSnapshot` both call `WidgetCenter.shared.reloadAllTimelines()` after mutating the App Group key.

## Android widget (`android-widget/`)

Hand-rolled AppWidget Soft Stack sources (SoT). Plugin merges Kotlin + `res/` on prebuild/EAS.

| File / path | Role |
|-------------|------|
| `WidgetSnapshotProvider.kt` | `AppWidgetProvider`; MODE_PRIVATE prefs; Soft Stack; PendingIntent → `emotiondiary:///` |
| `res/layout/widget_snapshot_small.xml` | RemoteViews Soft Stack (~2×2) |
| `res/xml/widget_snapshot_info.xml` | ~2×2 picker metadata |

Provider class: `expo.modules.widgetsnapshot.WidgetSnapshotProvider`.

## AppWidget refresh (Android)

`WidgetSnapshotModule.writeSnapshot` / `clearSnapshot` broadcast `ACTION_APPWIDGET_UPDATE` for `WidgetSnapshotProvider`.

## JS API

- `createNativeWidgetSnapshotSink()` → `{ write, clear, read? }` wrapping one JSON string under `widget_snapshot_v1`
- Lazy `requireNativeModule('WidgetSnapshot')` — web/Jest use NoOp/Memory via `services/widgetSnapshot`

## UAT

Dual-OS device/EAS checklist: `.planning/phases/17-widget-native-shell/17-UAT.md` (App Group portal, Soft Stack, Dashboard deep link, logout clear, Web NoOp).

## Expo config

- Autolinking: `./modules` (default)
- `app.json` plugins: `./modules/widget-snapshot/app.plugin.js`
- `ios.entitlements` + EAS `appExtensions` include App Group for main + EmotionDiaryWidget
