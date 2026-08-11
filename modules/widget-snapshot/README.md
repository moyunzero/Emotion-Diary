# Widget Snapshot (local Expo module)

QUAL-03 native sink for the privacy whitelist snapshot. **No widget UI** (Phase 17).

## Storage

| Platform | Mechanism | Key | Notes |
|----------|-----------|-----|--------|
| iOS | `UserDefaults(suiteName:)` App Group | `widget_snapshot_v1` | Suite: `group.com.moyunzero.emotiondiary` |
| Android | `SharedPreferences` `MODE_PRIVATE` | `widget_snapshot_v1` | File: `{packageName}.widget_snapshot` |

Must **not** use AsyncStorage as the sole/permanent SoT. Must **not** use world-readable external storage on Android.

## Apple App Group (user setup — Phase 17 device)

Register App Group `group.com.moyunzero.emotiondiary` on the Apple Developer account for App ID `com.moyunzero.emotiondiary` (and the future widget extension) before real-device App Group persistence works. Portal: **Apple Developer → Identifiers → App Groups / App ID capabilities**. Phase 16 ships entitlements scaffolding only; portal registration does **not** block this plan.

## Privacy Manifest (UserDefaults)

App Group `UserDefaults` access should declare Privacy Manifest reason **`1C8F.1`** (`NSPrivacyAccessedAPICategoryUserDefaults`) when shipping App Store builds that call this API. See `ios/PrivacyInfo.xcprivacy` in this module (merged/consumed at prebuild/EAS as applicable). Confirm reason codes against current Apple docs before release.

## JS API

- `createNativeWidgetSnapshotSink()` → `{ write, clear, read? }` wrapping one JSON string under `widget_snapshot_v1`
- Lazy `requireNativeModule('WidgetSnapshot')` — web/Jest use NoOp/Memory via `services/widgetSnapshot`

## Expo config

- Autolinking: `./modules` (default)
- `app.json` plugins: `./modules/widget-snapshot/app.plugin.js`
- `ios.entitlements` includes `com.apple.security.application-groups`
