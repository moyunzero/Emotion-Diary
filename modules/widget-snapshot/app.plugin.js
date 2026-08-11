/**
 * Config plugin: App Group + EmotionDiaryWidget (iOS) + WidgetSnapshotProvider (Android).
 * Hand-rolled — do not add expo-widgets or @bacons/apple-targets unless human gate approves.
 */

const fs = require('fs');
const path = require('path');
const {
  withEntitlementsPlist,
  withXcodeProject,
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('expo/config-plugins');

const APP_GROUP_ID = 'group.com.moyunzero.emotiondiary';
const APP_GROUPS_KEY = 'com.apple.security.application-groups';
const WIDGET_TARGET_NAME = 'EmotionDiaryWidget';
const WIDGET_BUNDLE_ID = 'com.moyunzero.emotiondiary.widget';
const WIDGET_PROVIDER_CLASS = 'expo.modules.widgetsnapshot.WidgetSnapshotProvider';
const DEPLOYMENT_TARGET = '15.1';

const MODULE_ROOT = __dirname;
const IOS_WIDGET_SRC = path.join(MODULE_ROOT, 'ios-widget');
const ANDROID_WIDGET_SRC = path.join(MODULE_ROOT, 'android-widget');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const from = path.join(srcDir, entry.name);
    const to = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(from, to);
    } else {
      copyFile(from, to);
    }
  }
}

/** Pattern 2 — EAS credentials for EmotionDiaryWidget + App Group. */
function withEasAppExtensions(config) {
  config.extra = config.extra ?? {};
  config.extra.eas = config.extra.eas ?? {};
  const eas = config.extra.eas;
  eas.build = eas.build ?? {};
  eas.build.experimental = eas.build.experimental ?? {};
  eas.build.experimental.ios = eas.build.experimental.ios ?? {};

  const extensions = Array.isArray(eas.build.experimental.ios.appExtensions)
    ? [...eas.build.experimental.ios.appExtensions]
    : [];

  const existingIdx = extensions.findIndex(
    (ext) =>
      ext &&
      (ext.targetName === WIDGET_TARGET_NAME ||
        ext.bundleIdentifier === WIDGET_BUNDLE_ID),
  );

  const declaration = {
    targetName: WIDGET_TARGET_NAME,
    bundleIdentifier: WIDGET_BUNDLE_ID,
    entitlements: {
      [APP_GROUPS_KEY]: [APP_GROUP_ID],
    },
  };

  if (existingIdx >= 0) {
    extensions[existingIdx] = { ...extensions[existingIdx], ...declaration };
  } else {
    extensions.push(declaration);
  }

  eas.build.experimental.ios.appExtensions = extensions;
  return config;
}

function withWidgetSnapshotAppGroup(config) {
  return withEntitlementsPlist(config, (cfg) => {
    const existing = cfg.modResults[APP_GROUPS_KEY];
    const groups = Array.isArray(existing) ? [...existing] : [];
    if (!groups.includes(APP_GROUP_ID)) {
      groups.push(APP_GROUP_ID);
    }
    cfg.modResults[APP_GROUPS_KEY] = groups;
    return cfg;
  });
}

function writeWidgetEntitlements(destPath) {
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>${APP_GROUPS_KEY}</key>
	<array>
		<string>${APP_GROUP_ID}</string>
	</array>
</dict>
</plist>
`;
  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, plist, 'utf8');
}

function withIosWidgetSources(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const projectRoot = cfg.modRequest.platformProjectRoot;
      const widgetDir = path.join(projectRoot, WIDGET_TARGET_NAME);

      if (!fs.existsSync(IOS_WIDGET_SRC)) {
        console.warn(
          `[widget-snapshot] Missing ios-widget sources at ${IOS_WIDGET_SRC}`,
        );
        return cfg;
      }

      copyDirRecursive(IOS_WIDGET_SRC, widgetDir);

      // node-xcode defaults INFOPLIST_FILE to EmotionDiaryWidget/EmotionDiaryWidget-Info.plist
      const infoSrc = path.join(widgetDir, 'Info.plist');
      if (fs.existsSync(infoSrc)) {
        copyFile(infoSrc, path.join(widgetDir, `${WIDGET_TARGET_NAME}-Info.plist`));
      }

      writeWidgetEntitlements(
        path.join(widgetDir, `${WIDGET_TARGET_NAME}.entitlements`),
      );

      return cfg;
    },
  ]);
}

function updateWidgetTargetBuildSettings(project, hostVersion = '1.0') {
  const configs = project.pbxXCBuildConfigurationSection();
  const entitlementsRel = `${WIDGET_TARGET_NAME}/${WIDGET_TARGET_NAME}.entitlements`;
  const infoPlistRel = `${WIDGET_TARGET_NAME}/Info.plist`;
  const marketing = String(hostVersion || '1.0').replace(/"/g, '');

  for (const key of Object.keys(configs)) {
    const entry = configs[key];
    if (
      typeof entry !== 'object' ||
      !entry.buildSettings ||
      !entry.buildSettings.PRODUCT_NAME
    ) {
      continue;
    }
    const productName = String(entry.buildSettings.PRODUCT_NAME).replace(/"/g, '');
    if (productName !== WIDGET_TARGET_NAME) continue;

    entry.buildSettings.INFOPLIST_FILE = `"${infoPlistRel}"`;
    entry.buildSettings.CODE_SIGN_ENTITLEMENTS = `"${entitlementsRel}"`;
    entry.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${WIDGET_BUNDLE_ID}"`;
    entry.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = DEPLOYMENT_TARGET;
    entry.buildSettings.SWIFT_VERSION = '5.0';
    entry.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
    entry.buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
    entry.buildSettings.CLANG_ENABLE_MODULES = 'YES';
    entry.buildSettings.APPLICATION_EXTENSION_API_ONLY = 'YES';
    entry.buildSettings.LD_RUNPATH_SEARCH_PATHS =
      '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
    entry.buildSettings.MARKETING_VERSION = `"${marketing}"`;
    entry.buildSettings.CURRENT_PROJECT_VERSION =
      entry.buildSettings.CURRENT_PROJECT_VERSION || '1';
  }
}

/** node-xcode stores target names with quotes; lookup must try both forms. */
function findWidgetTarget(project) {
  return (
    project.pbxTargetByName(WIDGET_TARGET_NAME) ||
    project.pbxTargetByName(`"${WIDGET_TARGET_NAME}"`) ||
    null
  );
}

/**
 * addBuildPhase often stores path as EmotionDiaryWidget/Foo.swift while the
 * group path is also EmotionDiaryWidget → Xcode looks for nested dir. Collapse
 * to basename and attach refs under the widget group when missing.
 */
function normalizeWidgetSourcePaths(project) {
  const objects = project.hash.project.objects;
  const fileRefs = objects.PBXFileReference || {};
  const basenames = new Set([
    'EmotionDiaryWidget.swift',
    'EmotionDiaryWidgetBundle.swift',
    'SnapshotReader.swift',
  ]);

  for (const key of Object.keys(fileRefs)) {
    const fr = fileRefs[key];
    if (!fr || typeof fr !== 'object' || !fr.path) continue;
    const raw = String(fr.path).replace(/"/g, '');
    const base = raw.split('/').pop();
    if (!basenames.has(base)) continue;
    if (raw !== base) {
      fr.path = base;
    }
    fr.sourceTree = '"<group>"';
  }
}

function withIosWidgetXcodeTarget(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const hostVersion = cfg.modRequest?.config?.version || config.version || '1.0';

    const existing = findWidgetTarget(project);
    if (existing) {
      if (existing.uuid) {
        ensureTargetDependency(project, existing.uuid);
      }
      updateWidgetTargetBuildSettings(project, hostVersion);
      normalizeWidgetSourcePaths(project);
      return cfg;
    }

    const target = project.addTarget(
      WIDGET_TARGET_NAME,
      'app_extension',
      WIDGET_TARGET_NAME,
      WIDGET_BUNDLE_ID,
    );

    // Filenames only — group path is EmotionDiaryWidget/ (avoid double nesting).
    const swiftFiles = [
      'EmotionDiaryWidget.swift',
      'EmotionDiaryWidgetBundle.swift',
      'SnapshotReader.swift',
    ];

    project.addBuildPhase(
      swiftFiles.map((name) => `${WIDGET_TARGET_NAME}/${name}`),
      'PBXSourcesBuildPhase',
      'Sources',
      target.uuid,
    );

    project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);

    project.addBuildPhase(
      ['WidgetKit.framework', 'SwiftUI.framework'],
      'PBXFrameworksBuildPhase',
      'Frameworks',
      target.uuid,
    );

    // Navigator folder only (sources already in Sources phase — avoid duplicate file refs).
    const widgetGroup = project.addPbxGroup(
      [],
      WIDGET_TARGET_NAME,
      WIDGET_TARGET_NAME,
    );
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(widgetGroup.uuid, mainGroupId);

    // Normalize source fileRef paths to basename under the widget group.
    normalizeWidgetSourcePaths(project);

    // node-xcode skips dependency wiring when PBXTargetDependency section is absent.
    ensureTargetDependency(project, target.uuid);

    updateWidgetTargetBuildSettings(project, hostVersion);
    return cfg;
  });
}

function ensureTargetDependency(project, extensionTargetUuid) {
  const objects = project.hash.project.objects;
  if (!objects.PBXTargetDependency) {
    objects.PBXTargetDependency = {};
  }
  if (!objects.PBXContainerItemProxy) {
    objects.PBXContainerItemProxy = {};
  }

  const first = project.getFirstTarget();
  if (!first?.uuid) return;

  const nativeTargets = project.pbxNativeTargetSection();
  const host = nativeTargets[first.uuid];
  if (!host) return;

  const already = (host.dependencies || []).some((dep) => {
    const depObj = objects.PBXTargetDependency[dep.value];
    return depObj && depObj.target === extensionTargetUuid;
  });
  if (already) return;

  try {
    project.addTargetDependency(first.uuid, [extensionTargetUuid]);
  } catch (error) {
    console.warn(
      '[widget-snapshot] Could not add EmotionDiaryWidget target dependency:',
      error?.message || error,
    );
  }
}

function withAndroidWidgetResources(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.platformProjectRoot;
      const appSrcMain = path.join(projectRoot, 'app', 'src', 'main');
      const javaDest = path.join(
        appSrcMain,
        'java',
        'expo',
        'modules',
        'widgetsnapshot',
      );
      const resDest = path.join(appSrcMain, 'res');

      if (!fs.existsSync(ANDROID_WIDGET_SRC)) {
        console.warn(
          `[widget-snapshot] Missing android-widget sources at ${ANDROID_WIDGET_SRC}`,
        );
        return cfg;
      }

      const providerSrc = path.join(
        ANDROID_WIDGET_SRC,
        'WidgetSnapshotProvider.kt',
      );
      if (fs.existsSync(providerSrc)) {
        copyFile(
          providerSrc,
          path.join(javaDest, 'WidgetSnapshotProvider.kt'),
        );
      }

      const resSrc = path.join(ANDROID_WIDGET_SRC, 'res');
      if (fs.existsSync(resSrc)) {
        copyDirRecursive(resSrc, resDest);
      }

      // Also sync into the local Expo module so autolinking builds the provider
      // when the host app does not own the Kotlin source set alone.
      const moduleJava = path.join(
        MODULE_ROOT,
        'android',
        'src',
        'main',
        'java',
        'expo',
        'modules',
        'widgetsnapshot',
      );
      const moduleRes = path.join(MODULE_ROOT, 'android', 'src', 'main', 'res');
      if (fs.existsSync(providerSrc)) {
        copyFile(
          providerSrc,
          path.join(moduleJava, 'WidgetSnapshotProvider.kt'),
        );
      }
      if (fs.existsSync(resSrc)) {
        copyDirRecursive(resSrc, moduleRes);
      }

      const moduleManifest = path.join(
        MODULE_ROOT,
        'android',
        'src',
        'main',
        'AndroidManifest.xml',
      );
      writeModuleAndroidManifest(moduleManifest);

      return cfg;
    },
  ]);
}

function writeModuleAndroidManifest(manifestPath) {
  const xml = `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application>
    <receiver
      android:name=".WidgetSnapshotProvider"
      android:exported="true"
      android:label="@string/widget_snapshot_name">
      <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
      </intent-filter>
      <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_snapshot_info" />
    </receiver>
  </application>
</manifest>
`;
  ensureDir(path.dirname(manifestPath));
  fs.writeFileSync(manifestPath, xml, 'utf8');
}

function withAndroidWidgetManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    if (!application.receiver) {
      application.receiver = [];
    }

    const already = application.receiver.some((receiver) => {
      const name = receiver.$?.['android:name'] ?? '';
      return (
        name === WIDGET_PROVIDER_CLASS ||
        name === '.WidgetSnapshotProvider' ||
        name.endsWith('.WidgetSnapshotProvider')
      );
    });

    if (!already) {
      application.receiver.push({
        $: {
          'android:name': WIDGET_PROVIDER_CLASS,
          'android:exported': 'true',
          'android:label': '@string/widget_snapshot_name',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/widget_snapshot_info',
            },
          },
        ],
      });
    }

    // Never set android:process isolation (MODE_PRIVATE prefs must stay same-UID).
    return cfg;
  });
}

function withWidgetSnapshot(config) {
  config = withEasAppExtensions(config);
  config = withWidgetSnapshotAppGroup(config);
  config = withIosWidgetSources(config);
  config = withIosWidgetXcodeTarget(config);
  config = withAndroidWidgetResources(config);
  config = withAndroidWidgetManifest(config);
  return config;
}

module.exports = withWidgetSnapshot;
