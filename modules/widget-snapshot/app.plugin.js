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
  const byName =
    project.pbxTargetByName(WIDGET_TARGET_NAME) ||
    project.pbxTargetByName(`"${WIDGET_TARGET_NAME}"`);
  if (!byName) return null;

  // pbxTargetByName returns the target object without its PBXNativeTarget uuid.
  const nativeTargets = project.hash.project.objects.PBXNativeTarget || {};
  for (const key of Object.keys(nativeTargets)) {
    if (key.endsWith('_comment')) continue;
    const t = nativeTargets[key];
    if (!t || typeof t !== 'object') continue;
    const name = String(t.name || '').replace(/"/g, '');
    if (name === WIDGET_TARGET_NAME) {
      return { ...t, uuid: key };
    }
  }
  return byName;
}

const WIDGET_SWIFT_SOURCES = [
  'EmotionDiaryWidget.swift',
  'EmotionDiaryWidgetBundle.swift',
  'SnapshotReader.swift',
];

function findWidgetPbxGroup(project) {
  const groups = project.hash.project.objects.PBXGroup || {};
  for (const gKey of Object.keys(groups)) {
    if (gKey.endsWith('_comment')) continue;
    const g = groups[gKey];
    if (!g || typeof g !== 'object') continue;
    const gName = String(g.name || '').replace(/"/g, '');
    const gPath = String(g.path || '').replace(/"/g, '');
    if (gName === WIDGET_TARGET_NAME || gPath === WIDGET_TARGET_NAME) {
      return { uuid: gKey, group: g };
    }
  }
  return null;
}

/**
 * addBuildPhase often stores path as EmotionDiaryWidget/Foo.swift while the
 * group path is also EmotionDiaryWidget → Xcode looks for nested dir.
 * Collapse to basename AND keep file refs as children of the widget group.
 * Without group membership, basename resolves under ios/ and EAS fails with
 * "Build input files cannot be found: .../ios/EmotionDiaryWidget.swift".
 */
function ensureWidgetSwiftSourcesInGroup(project) {
  const objects = project.hash.project.objects;
  const fileRefs = objects.PBXFileReference || {};
  const groups = objects.PBXGroup || {};
  const basenames = new Set(WIDGET_SWIFT_SOURCES);

  const swiftRefs = [];
  for (const key of Object.keys(fileRefs)) {
    if (key.endsWith('_comment')) continue;
    const fr = fileRefs[key];
    if (!fr || typeof fr !== 'object' || !fr.path) continue;
    const raw = String(fr.path).replace(/"/g, '');
    const base = raw.split('/').pop();
    if (!basenames.has(base)) continue;
    fr.path = base;
    if (!fr.name) fr.name = base;
    fr.sourceTree = '"<group>"';
    swiftRefs.push({ uuid: key, base });
  }

  if (swiftRefs.length === 0) return;

  let widgetGroupEntry = findWidgetPbxGroup(project);
  if (!widgetGroupEntry) {
    const created = project.addPbxGroup(
      [],
      WIDGET_TARGET_NAME,
      WIDGET_TARGET_NAME,
    );
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(created.uuid, mainGroupId);
    widgetGroupEntry = { uuid: created.uuid, group: groups[created.uuid] };
  }

  const { uuid: widgetGroupUuid, group: widgetGroup } = widgetGroupEntry;
  if (!widgetGroup) return;

  widgetGroup.path = WIDGET_TARGET_NAME;
  if (!widgetGroup.name) widgetGroup.name = WIDGET_TARGET_NAME;
  widgetGroup.children = widgetGroup.children || [];

  const uuidSet = new Set(swiftRefs.map((s) => s.uuid));

  // Drop orphan membership under main / other groups (wrong path resolution).
  for (const gKey of Object.keys(groups)) {
    if (gKey.endsWith('_comment') || gKey === widgetGroupUuid) continue;
    const g = groups[gKey];
    if (!g || !Array.isArray(g.children)) continue;
    g.children = g.children.filter((c) => !uuidSet.has(c.value));
  }

  for (const { uuid, base } of swiftRefs) {
    if (!widgetGroup.children.some((c) => c.value === uuid)) {
      widgetGroup.children.push({ value: uuid, comment: base });
    }
  }
}

/**
 * Ensure EmotionDiaryWidget/PrivacyInfo.xcprivacy is in the widget target's
 * Resources phase (existing targets created before PrivacyInfo was added).
 */
function ensureWidgetPrivacyInfoResource(project, targetUuid) {
  if (!targetUuid) return;
  const objects = project.hash.project.objects;
  const fileRefs = objects.PBXFileReference || {};
  const buildFiles = objects.PBXBuildFile || {};
  const privacyBase = 'PrivacyInfo.xcprivacy';
  const privacyRel = `${WIDGET_TARGET_NAME}/${privacyBase}`;

  let fileRefUuid = null;
  for (const key of Object.keys(fileRefs)) {
    if (key.endsWith('_comment')) continue;
    const fr = fileRefs[key];
    if (!fr || typeof fr !== 'object') continue;
    const rawPath = String(fr.path || '').replace(/"/g, '');
    const rawName = String(fr.name || '').replace(/"/g, '');
    // Skip host MO/PrivacyInfo.xcprivacy
    if (rawPath.includes('MO/') || rawPath.startsWith('MO')) continue;
    if (
      rawPath === privacyBase ||
      rawPath === privacyRel ||
      rawName === privacyBase
    ) {
      fileRefUuid = key;
      break;
    }
  }

  if (!fileRefUuid) {
    fileRefUuid = project.generateUuid();
    fileRefs[fileRefUuid] = {
      isa: 'PBXFileReference',
      lastKnownFileType: 'text.xml',
      name: privacyBase,
      path: privacyBase,
      sourceTree: '"<group>"',
      includeInIndex: 1,
    };
    fileRefs[`${fileRefUuid}_comment`] = privacyBase;

    // Attach to EmotionDiaryWidget group when present
    const groups = objects.PBXGroup || {};
    for (const gKey of Object.keys(groups)) {
      if (gKey.endsWith('_comment')) continue;
      const g = groups[gKey];
      if (!g || typeof g !== 'object') continue;
      const gName = String(g.name || g.path || '').replace(/"/g, '');
      if (gName !== WIDGET_TARGET_NAME) continue;
      g.children = g.children || [];
      const already = g.children.some((c) => c.value === fileRefUuid);
      if (!already) {
        g.children.push({ value: fileRefUuid, comment: privacyBase });
      }
      break;
    }
  }

  // Find Resources build phase for this target
  const nativeTargets = objects.PBXNativeTarget || {};
  const targetEntry = nativeTargets[targetUuid];
  if (!targetEntry || !targetEntry.buildPhases) return;

  let resourcesPhaseUuid = null;
  for (const phase of targetEntry.buildPhases) {
    const comment = String(phase.comment || '');
    const phaseObj = objects.PBXResourcesBuildPhase?.[phase.value];
    if (phaseObj || comment === 'Resources') {
      if (objects.PBXResourcesBuildPhase?.[phase.value]) {
        resourcesPhaseUuid = phase.value;
        break;
      }
    }
  }
  if (!resourcesPhaseUuid) return;

  const phase = objects.PBXResourcesBuildPhase[resourcesPhaseUuid];
  phase.files = phase.files || [];

  const alreadyInPhase = phase.files.some((f) => {
    const bf = buildFiles[f.value];
    if (!bf) return false;
    return String(bf.fileRef) === fileRefUuid;
  });
  if (alreadyInPhase) return;

  const buildFileUuid = project.generateUuid();
  buildFiles[buildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: fileRefUuid,
  };
  buildFiles[`${buildFileUuid}_comment`] = `${privacyBase} in Resources`;
  phase.files.push({
    value: buildFileUuid,
    comment: `${privacyBase} in Resources`,
  });
}

/** Ensure en / zh-Hans Localizable.strings are in the widget Resources phase. */
function ensureWidgetLocalizableStrings(project, targetUuid) {
  if (!targetUuid) return;
  const locales = ['en', 'zh-Hans'];
  for (const locale of locales) {
    ensureWidgetResourceFile(
      project,
      targetUuid,
      `${locale}.lproj/Localizable.strings`,
      'text.plist.strings',
    );
  }
}

function ensureWidgetResourceFile(project, targetUuid, relativePath, lastKnownFileType) {
  const objects = project.hash.project.objects;
  const fileRefs = objects.PBXFileReference || {};
  const buildFiles = objects.PBXBuildFile || {};
  const base = relativePath.split('/').pop();

  let fileRefUuid = null;
  for (const key of Object.keys(fileRefs)) {
    if (key.endsWith('_comment')) continue;
    const fr = fileRefs[key];
    if (!fr || typeof fr !== 'object') continue;
    const rawPath = String(fr.path || '').replace(/"/g, '');
    if (rawPath === relativePath || rawPath.endsWith(`/${relativePath}`)) {
      fileRefUuid = key;
      break;
    }
  }

  if (!fileRefUuid) {
    fileRefUuid = project.generateUuid();
    fileRefs[fileRefUuid] = {
      isa: 'PBXFileReference',
      lastKnownFileType,
      name: base,
      path: relativePath,
      sourceTree: '"<group>"',
      includeInIndex: 1,
    };
    fileRefs[`${fileRefUuid}_comment`] = relativePath;

    const groups = objects.PBXGroup || {};
    for (const gKey of Object.keys(groups)) {
      if (gKey.endsWith('_comment')) continue;
      const g = groups[gKey];
      if (!g || typeof g !== 'object') continue;
      const gName = String(g.name || g.path || '').replace(/"/g, '');
      if (gName !== WIDGET_TARGET_NAME) continue;
      g.children = g.children || [];
      if (!g.children.some((c) => c.value === fileRefUuid)) {
        g.children.push({ value: fileRefUuid, comment: relativePath });
      }
      break;
    }
  }

  const nativeTargets = objects.PBXNativeTarget || {};
  const targetEntry = nativeTargets[targetUuid];
  if (!targetEntry || !targetEntry.buildPhases) return;

  let resourcesPhaseUuid = null;
  for (const phase of targetEntry.buildPhases) {
    if (objects.PBXResourcesBuildPhase?.[phase.value]) {
      resourcesPhaseUuid = phase.value;
      break;
    }
  }
  if (!resourcesPhaseUuid) return;

  const phase = objects.PBXResourcesBuildPhase[resourcesPhaseUuid];
  phase.files = phase.files || [];
  if (
    phase.files.some((f) => {
      const bf = buildFiles[f.value];
      return bf && String(bf.fileRef) === fileRefUuid;
    })
  ) {
    return;
  }

  const buildFileUuid = project.generateUuid();
  buildFiles[buildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: fileRefUuid,
  };
  buildFiles[`${buildFileUuid}_comment`] = `${base} in Resources`;
  phase.files.push({
    value: buildFileUuid,
    comment: `${base} in Resources`,
  });
}

function withIosWidgetXcodeTarget(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const hostVersion = cfg.modRequest?.config?.version || config.version || '1.0';

    const existing = findWidgetTarget(project);
    if (existing) {
      if (existing.uuid) {
        ensureTargetDependency(project, existing.uuid);
        ensureEmbedAppExtensions(project, existing.uuid);
        ensureWidgetPrivacyInfoResource(project, existing.uuid);
        ensureWidgetLocalizableStrings(project, existing.uuid);
      }
      updateWidgetTargetBuildSettings(project, hostVersion);
      ensureWidgetSwiftSourcesInGroup(project);
      return cfg;
    }

    const target = project.addTarget(
      WIDGET_TARGET_NAME,
      'app_extension',
      WIDGET_TARGET_NAME,
      WIDGET_BUNDLE_ID,
    );

    // Paths include folder for addBuildPhase; ensureWidgetSwiftSourcesInGroup
    // collapses to basename under the EmotionDiaryWidget PBXGroup.
    project.addBuildPhase(
      WIDGET_SWIFT_SOURCES.map((name) => `${WIDGET_TARGET_NAME}/${name}`),
      'PBXSourcesBuildPhase',
      'Sources',
      target.uuid,
    );

    project.addBuildPhase(
      [
        `${WIDGET_TARGET_NAME}/PrivacyInfo.xcprivacy`,
        `${WIDGET_TARGET_NAME}/en.lproj/Localizable.strings`,
        `${WIDGET_TARGET_NAME}/zh-Hans.lproj/Localizable.strings`,
      ],
      'PBXResourcesBuildPhase',
      'Resources',
      target.uuid,
    );

    project.addBuildPhase(
      ['WidgetKit.framework', 'SwiftUI.framework'],
      'PBXFrameworksBuildPhase',
      'Frameworks',
      target.uuid,
    );

    // Navigator folder; swift file refs are attached by ensureWidgetSwiftSourcesInGroup.
    const widgetGroup = project.addPbxGroup(
      [],
      WIDGET_TARGET_NAME,
      WIDGET_TARGET_NAME,
    );
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(widgetGroup.uuid, mainGroupId);

    ensureWidgetSwiftSourcesInGroup(project);

    // node-xcode skips dependency wiring when PBXTargetDependency section is absent.
    ensureTargetDependency(project, target.uuid);
    ensureEmbedAppExtensions(project, target.uuid);

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

/**
 * Ensure host Embed App Extensions (PlugIns) copies EmotionDiaryWidget.appex once.
 * Reuses an existing PlugIns copy phase (dstSubfolderSpec 13) when present.
 */
function ensureEmbedAppExtensions(project, extensionTargetUuid) {
  const first = project.getFirstTarget();
  if (!first?.uuid) return;

  const objects = project.hash.project.objects;
  const nativeTargets = project.pbxNativeTargetSection();
  const host = nativeTargets[first.uuid];
  const extensionTarget = nativeTargets[extensionTargetUuid];
  if (!host || !extensionTarget) return;

  if (!objects.PBXCopyFilesBuildPhase) {
    objects.PBXCopyFilesBuildPhase = {};
  }

  const productRef = extensionTarget.productReference;
  if (!productRef) return;

  const unquote = (value) =>
    typeof value === 'string' ? value.replace(/^"|"$/g, '') : value;

  const findPlugInsPhaseUuid = () => {
    for (const phase of host.buildPhases || []) {
      const phaseObj = objects.PBXCopyFilesBuildPhase[phase.value];
      if (!phaseObj || typeof phaseObj !== 'object') continue;
      const name = unquote(phaseObj.name);
      const dst = Number(phaseObj.dstSubfolderSpec);
      if (name === 'Embed App Extensions' || dst === 13) {
        return phase.value;
      }
    }
    return null;
  };

  let phaseUuid = findPlugInsPhaseUuid();
  if (!phaseUuid) {
    try {
      const created = project.addBuildPhase(
        [],
        'PBXCopyFilesBuildPhase',
        'Embed App Extensions',
        first.uuid,
        'app_extension',
      );
      phaseUuid = created?.uuid ?? findPlugInsPhaseUuid();
    } catch (error) {
      console.warn(
        '[widget-snapshot] Could not create Embed App Extensions phase:',
        error?.message || error,
      );
      return;
    }
  }

  const phase = objects.PBXCopyFilesBuildPhase[phaseUuid];
  if (!phase || typeof phase !== 'object') return;

  phase.name = '"Embed App Extensions"';
  phase.dstPath = phase.dstPath ?? '""';
  phase.dstSubfolderSpec = 13;

  const files = Array.isArray(phase.files) ? phase.files : [];
  const alreadyEmbedded = files.some((entry) => {
    const buildFile = objects.PBXBuildFile?.[entry.value];
    return buildFile && buildFile.fileRef === productRef;
  });
  if (alreadyEmbedded) return;

  if (!objects.PBXBuildFile) {
    objects.PBXBuildFile = {};
  }

  const buildFileUuid = project.generateUuid();
  objects.PBXBuildFile[buildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: productRef,
    settings: {
      ATTRIBUTES: ['RemoveHeadersOnCopy'],
    },
  };
  objects.PBXBuildFile[`${buildFileUuid}_comment`] =
    'EmotionDiaryWidget.appex in Embed App Extensions';

  files.push({
    value: buildFileUuid,
    comment: 'EmotionDiaryWidget.appex in Embed App Extensions',
  });
  phase.files = files;

  if (!(host.buildPhases || []).some((p) => p.value === phaseUuid)) {
    host.buildPhases = host.buildPhases || [];
    host.buildPhases.push({
      value: phaseUuid,
      comment: 'Embed App Extensions',
    });
  }
}

function withAndroidWidgetResources(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      if (!fs.existsSync(ANDROID_WIDGET_SRC)) {
        console.warn(
          `[widget-snapshot] Missing android-widget sources at ${ANDROID_WIDGET_SRC}`,
        );
        return cfg;
      }

      // Single source set: sync provider + res into the Expo module only
      // (autolinking). Avoid also copying into app/src/main (duplicate class).
      const providerSrc = path.join(
        ANDROID_WIDGET_SRC,
        'WidgetSnapshotProvider.kt',
      );
      const resSrc = path.join(ANDROID_WIDGET_SRC, 'res');
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
      android:name="expo.modules.widgetsnapshot.WidgetSnapshotProvider"
      android:exported="false"
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

    // Keep a single receiver for the Soft Stack provider (FQCN).
    application.receiver = application.receiver.filter((receiver) => {
      const name = receiver.$?.['android:name'] ?? '';
      return !(
        name === WIDGET_PROVIDER_CLASS ||
        name === '.WidgetSnapshotProvider' ||
        name.endsWith('.WidgetSnapshotProvider')
      );
    });

    application.receiver.push({
      $: {
        'android:name': WIDGET_PROVIDER_CLASS,
        'android:exported': 'false',
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
module.exports.ensureEmbedAppExtensions = ensureEmbedAppExtensions;
module.exports.ensureTargetDependency = ensureTargetDependency;
module.exports.ensureWidgetSwiftSourcesInGroup = ensureWidgetSwiftSourcesInGroup;
