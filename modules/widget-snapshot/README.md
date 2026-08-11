# Widget Snapshot (local Expo module)

QUAL-03 native sink for the privacy whitelist snapshot, plus **iOS WidgetKit Soft Stack** (Phase 17 Plan 02) and **Android AppWidget Soft Stack** sources (Phase 17 Plan 03). Config-plugin manifest/layout injection lands in Plan 17-04.

## Storage

| Platform | Mechanism | Key | Notes |
|----------|-----------|-----|--------|
| iOS | `UserDefaults(suiteName:)` App Group | `widget_snapshot_v1` | Suite: `group.com.moyunzero.emotiondiary` |
| Android | `SharedPreferences` `MODE_PRIVATE` | `widget_snapshot_v1` | File: `{packageName}.widget_snapshot` |

Must **not** use AsyncStorage as the sole/permanent SoT. Must **not** use world-readable external storage on Android. Must **not** set `android:process` isolation on the AppWidget provider (MODE_PRIVATE would become unreachable).

## iOS widget (`ios-widget/`)

Hand-rolled WidgetKit Soft Stack sources live under `modules/widget-snapshot/ios-widget/` (not only under generated `ios/`). Plan 17-04 injects them into the Xcode extension target.

| File | Role |
|------|------|
| `SnapshotReader.swift` | App Group suite read only — never `UserDefaults.standard` |
| `EmotionDiaryWidget.swift` | TimelineProvider + Soft Stack A (weather → growth → brand); `.systemSmall` only; `widgetURL` = `emotiondiary:///` |
| `EmotionDiaryWidgetBundle.swift` | `@main` WidgetBundle |
| `Info.plist` | Extension point `com.apple.widgetkit-extension`; display name「心晴」 |

Target names (for Plan 17-04 / EAS): display target `EmotionDiaryWidget`, bundle id `com.moyunzero.emotiondiary.widget`.

## Apple App Group (user setup — portal)

Register App Group `group.com.moyunzero.emotiondiary` on the Apple Developer account for **both**:

1. Main App ID `com.moyunzero.emotiondiary`
2. Widget extension App ID `com.moyunzero.emotiondiary.widget`

Portal: **Apple Developer → Identifiers → App Groups / App ID capabilities**. Without the group on the extension App ID, `SnapshotReader` cannot see writes from `WidgetSnapshotModule`.

## Privacy Manifest (UserDefaults)

App Group `UserDefaults` access should declare Privacy Manifest reason **`1C8F.1`** (`NSPrivacyAccessedAPICategoryUserDefaults`) when shipping App Store builds that call this API. See `ios/PrivacyInfo.xcprivacy` in this module (merged/consumed at prebuild/EAS as applicable). Confirm reason codes against current Apple docs before release.

## Timeline reload (iOS)

`WidgetSnapshotModule.writeSnapshot` and `clearSnapshot` both call `WidgetCenter.shared.reloadAllTimelines()` after mutating the App Group key. Publish from the app process and logout clear therefore refresh home-screen Soft Stack chrome without waiting for the coarse timeline policy.

## Android widget (`android-widget/`)

Hand-rolled AppWidget Soft Stack sources live under `modules/widget-snapshot/android-widget/` — **not** under generated `android/` (that tree is not the source of truth). Plan 17-04 / prebuild / EAS must merge these Kotlin + `res/` assets into the host app and register the receiver in the manifest.

| File / path | Role |
|-------------|------|
| `WidgetSnapshotProvider.kt` | `AppWidgetProvider`; reads `{packageName}.widget_snapshot` + `widget_snapshot_v1` with `MODE_PRIVATE`; Soft Stack chrome; root `PendingIntent` → `emotiondiary:///` |
| `res/layout/widget_snapshot_small.xml` | RemoteViews Soft Stack (~2×2); padding 16dp |
| `res/xml/widget_snapshot_info.xml` | `minWidth`/`minHeight` ~110dp; `targetCellWidth`/`Height` = 2 |
| `res/drawable/ic_weather_*.xml` | Material-style vector weather glyphs (no production emoji) |
| `res/drawable/widget_bg_*.xml` | Active rose / empty gray / cleared washes |
| `res/values/strings.xml` | OS picker name/description + Soft Stack copy |

Provider class (for Plan 17-04): `expo.modules.widgetsnapshot.WidgetSnapshotProvider`. Do **not** install `react-native-android-widget` or `expo-widgets`.

## AppWidget refresh (Android)

`WidgetSnapshotModule.writeSnapshot` and `clearSnapshot` both notify `AppWidgetManager` via `ACTION_APPWIDGET_UPDATE` for `WidgetSnapshotProvider` after mutating the MODE_PRIVATE key. JS publish / logout clear therefore refreshes home-screen Soft Stack chrome (same intent as iOS `reloadAllTimelines`). Prefs key `widget_snapshot_v1` and file suffix `.widget_snapshot` are shared constants with the provider.

## JS API

- `createNativeWidgetSnapshotSink()` → `{ write, clear, read? }` wrapping one JSON string under `widget_snapshot_v1`
- Lazy `requireNativeModule('WidgetSnapshot')` — web/Jest use NoOp/Memory via `services/widgetSnapshot`

## Expo config

- Autolinking: `./modules` (default)
- `app.json` plugins: `./modules/widget-snapshot/app.plugin.js`
- `ios.entitlements` includes `com.apple.security.application-groups`
