#!/usr/bin/env node
/**
 * Gate: widget-snapshot must be yarn-linked so Expo autolinking registers
 * WidgetSnapshotModule. Without this, publishWidgetSnapshot silently uses NoOp
 * and Soft Stack stays cleared.
 *
 * Usage: yarn verify:widget-native
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let failed = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed += 1;
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dep = pkg.dependencies && pkg.dependencies['widget-snapshot'];
if (!dep || !String(dep).includes('modules/widget-snapshot')) {
  fail(
    `package.json must depend on "widget-snapshot": "file:./modules/widget-snapshot" (got ${JSON.stringify(dep)})`,
  );
} else {
  ok(`package.json → widget-snapshot (${dep})`);
}

const linked = path.join(root, 'node_modules', 'widget-snapshot');
if (!fs.existsSync(linked)) {
  fail('node_modules/widget-snapshot missing — run yarn install');
} else {
  ok('node_modules/widget-snapshot present');
}

const expoConfig = path.join(linked, 'expo-module.config.json');
if (!fs.existsSync(expoConfig)) {
  fail('widget-snapshot expo-module.config.json missing');
} else {
  const cfg = JSON.parse(fs.readFileSync(expoConfig, 'utf8'));
  const modules = (cfg.apple && cfg.apple.modules) || [];
  if (!modules.includes('WidgetSnapshotModule')) {
    fail('expo-module.config.json apple.modules must include WidgetSnapshotModule');
  } else {
    ok('expo-module.config.json declares WidgetSnapshotModule');
  }
}

const provider = path.join(
  root,
  'ios/Pods/Target Support Files/Pods-MO/ExpoModulesProvider.swift',
);
if (!fs.existsSync(provider)) {
  fail('ExpoModulesProvider.swift missing — run cd ios && pod install');
} else {
  const src = fs.readFileSync(provider, 'utf8');
  if (!src.includes('WidgetSnapshotModule')) {
    fail(
      'ExpoModulesProvider.swift does not register WidgetSnapshotModule — pod install after linking widget-snapshot',
    );
  } else {
    ok('ExpoModulesProvider.swift registers WidgetSnapshotModule');
  }
  if (!/import\s+WidgetSnapshot\b/.test(src)) {
    fail('ExpoModulesProvider.swift missing `import WidgetSnapshot`');
  } else {
    ok('ExpoModulesProvider.swift imports WidgetSnapshot');
  }
}

if (failed > 0) {
  console.error(`\nverify-widget-native-link: ${failed} failure(s)`);
  process.exit(1);
}

console.log('\nverify-widget-native-link: all checks passed');
