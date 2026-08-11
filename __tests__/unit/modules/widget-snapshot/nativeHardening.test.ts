/**
 * Source / resource gates for widget-snapshot native hardening.
 */

import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../../../..');
const moduleRoot = path.join(root, 'modules/widget-snapshot');

describe('widget-snapshot native hardening (source gates)', () => {
  it('layout uses canonical locale-selected string ids (not *_zh)', () => {
    const layout = fs.readFileSync(
      path.join(
        moduleRoot,
        'android-widget/res/layout/widget_snapshot_small.xml',
      ),
      'utf8',
    );
    expect(layout).toContain('@string/widget_open_cta"');
    expect(layout).toContain('@string/widget_cleared_hint"');
    expect(layout).not.toContain('widget_open_cta_zh');
    expect(layout).not.toContain('widget_cleared_hint_zh');
  });

  it('values-en overrides name/description/cta/hint/subtitle; values has no _zh/_en suffixes', () => {
    const zh = fs.readFileSync(
      path.join(moduleRoot, 'android-widget/res/values/strings.xml'),
      'utf8',
    );
    const en = fs.readFileSync(
      path.join(moduleRoot, 'android-widget/res/values-en/strings.xml'),
      'utf8',
    );
    expect(zh).toMatch(/widget_snapshot_name">心晴</);
    expect(zh).toMatch(/widget_open_cta">打开心晴</);
    expect(zh).toMatch(/widget_subtitle_empty">安静的花园</);
    expect(zh).not.toMatch(/widget_\w+_zh/);
    expect(zh).not.toMatch(/widget_\w+_en/);
    expect(en).toMatch(/widget_snapshot_name">Xinqing</);
    expect(en).toMatch(/widget_snapshot_description">See garden weather/);
    expect(en).toMatch(/widget_open_cta">Open Xinqing</);
    expect(en).toMatch(/widget_cleared_hint">Sign in/);
    expect(en).toMatch(/widget_subtitle_empty">Quiet garden</);
  });

  it('WidgetSnapshotProvider uses only canonical string ids', () => {
    const kt = fs.readFileSync(
      path.join(moduleRoot, 'android-widget/WidgetSnapshotProvider.kt'),
      'utf8',
    );
    expect(kt).toContain('R.string.widget_open_cta');
    expect(kt).toContain('R.string.widget_subtitle_empty');
    expect(kt).toContain('R.string.widget_weather_sunny');
    expect(kt).not.toMatch(/R\.string\.widget_\w+_(zh|en)/);
    expect(kt).not.toContain('prefersChinese');
  });

  it('WidgetSnapshotModule fails when SharedPreferences commit returns false', () => {
    const kt = fs.readFileSync(
      path.join(
        moduleRoot,
        'android/src/main/java/expo/modules/widgetsnapshot/WidgetSnapshotModule.kt',
      ),
      'utf8',
    );
    expect(kt).toMatch(/val committed = getPreferences\(\)\.edit\(\)\.putString/);
    expect(kt).toMatch(/val committed = getPreferences\(\)\.edit\(\)\.remove/);
    expect(kt).toMatch(/if \(!committed\)/);
    expect(kt).toMatch(/runCatching/);
    expect(kt).toMatch(/notifyAppWidgets\(\)/);
    const writeBlock = kt.slice(
      kt.indexOf('AsyncFunction("writeSnapshot")'),
      kt.indexOf('AsyncFunction("clearSnapshot")'),
    );
    expect(writeBlock.indexOf('if (!committed)')).toBeLessThan(
      writeBlock.indexOf('notifyAppWidgets()'),
    );
  });

  it('SnapshotReader returns cleared when entryCountActive is negative', () => {
    const swift = fs.readFileSync(
      path.join(moduleRoot, 'ios-widget/SnapshotReader.swift'),
      'utf8',
    );
    expect(swift).toMatch(
      /if entryCount < 0 \{\s*return \.cleared\s*\}/,
    );
  });

  it('app.plugin syncs Android provider only into the Expo module (no host duplicate)', () => {
    const plugin = fs.readFileSync(
      path.join(moduleRoot, 'app.plugin.js'),
      'utf8',
    );
    expect(plugin).toContain('Single source set');
    expect(plugin).toContain('ensureEmbedAppExtensions');
    expect(plugin).toContain(
      'android:name="expo.modules.widgetsnapshot.WidgetSnapshotProvider"',
    );
    // Host app/src/main javaDest path must not receive provider copy.
    expect(plugin).not.toMatch(
      /app['"]?\s*,\s*['"]src['"]?\s*,\s*['"]main['"][\s\S]{0,120}WidgetSnapshotProvider\.kt/,
    );
    expect(plugin).toMatch(
      /copyFile\(\s*providerSrc,\s*path\.join\(moduleJava/,
    );
    // existing-target branch also embeds + PrivacyInfo resource
    expect(plugin).toContain('ensureWidgetPrivacyInfoResource');
    expect(plugin).toMatch(
      /ensureTargetDependency\(project, existing\.uuid\);\s*ensureEmbedAppExtensions\(project, existing\.uuid\);\s*ensureWidgetPrivacyInfoResource\(project, existing\.uuid\);/,
    );
    // pbxTargetByName omits uuid — findWidgetTarget must resolve PBXNativeTarget key
    expect(plugin).toMatch(/return \{ \.\.\.t, uuid: key \}/);
  });

  it('ios-widget ships PrivacyInfo.xcprivacy with UserDefaults 1C8F.1', () => {
    const privacy = fs.readFileSync(
      path.join(moduleRoot, 'ios-widget/PrivacyInfo.xcprivacy'),
      'utf8',
    );
    expect(privacy).toContain('NSPrivacyAccessedAPICategoryUserDefaults');
    expect(privacy).toContain('1C8F.1');
    const podspec = fs.readFileSync(
      path.join(moduleRoot, 'ios/WidgetSnapshot.podspec'),
      'utf8',
    );
    expect(podspec).toContain('PrivacyInfo.xcprivacy');
    expect(podspec).toContain('ios-widget/PrivacyInfo.xcprivacy');
  });

  it('sim-widget-smoke starts Metro before --no-bundler, cleans Metro + pasteboard', () => {
    const script = fs.readFileSync(
      path.join(root, 'scripts/sim-widget-smoke.sh'),
      'utf8',
    );
    expect(script).toContain('npx expo start --dev-client --port 8081');
    expect(script).toContain('npx expo run:ios --device "$UDID" --no-bundler');
    expect(script).toContain('trap cleanup EXIT');
    expect(script).toContain('PlugIns/EmotionDiaryWidget.appex');
    expect(script).toMatch(/printf '' \| pbcopy/);
    expect(script.indexOf('expo start --dev-client')).toBeLessThan(
      script.indexOf('--no-bundler'),
    );
  });

  it('verify-widget-native-link resolves apple and android autolinking', () => {
    const script = fs.readFileSync(
      path.join(root, 'scripts/verify-widget-native-link.js'),
      'utf8',
    );
    expect(script).toContain("assertAutolinkingResolves('apple')");
    expect(script).toContain("assertAutolinkingResolves('android')");
  });

  it('en-US onThisDay hint uses Walk down memory lane idiom', () => {
    const json = JSON.parse(
      fs.readFileSync(path.join(root, 'locales/en-US/onThisDay.json'), 'utf8'),
    );
    expect(json.insightsCard.hint).toBe(
      'Walk down memory lane and meet your past self.',
    );
  });

  it('README documents module-only Android resource sync', () => {
    const readme = fs.readFileSync(
      path.join(moduleRoot, 'README.md'),
      'utf8',
    );
    expect(readme).toMatch(/only into this module/);
    expect(readme).not.toMatch(/into the generated app \(and syncs/);
  });
});
