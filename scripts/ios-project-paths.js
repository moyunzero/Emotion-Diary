/**
 * Resolve native iOS paths after expo prebuild (folder name varies, e.g. ios/MO).
 */
const fs = require('fs');
const path = require('path');

function getIosRoot() {
  return path.join(process.cwd(), 'ios');
}

function findNativeAppDirName() {
  const iosRoot = getIosRoot();
  if (!fs.existsSync(iosRoot)) {
    return null;
  }

  for (const entry of fs.readdirSync(iosRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'Pods' || entry.name === 'build') continue;
    if (entry.name.endsWith('.xcodeproj') || entry.name.endsWith('.xcworkspace')) {
      continue;
    }
    const infoPlist = path.join(iosRoot, entry.name, 'Info.plist');
    if (fs.existsSync(infoPlist)) {
      return entry.name;
    }
  }

  if (fs.existsSync(path.join(iosRoot, 'app', 'Info.plist'))) {
    return 'app';
  }

  return null;
}

function getNativeAppFile(...segments) {
  const dirName = findNativeAppDirName();
  if (!dirName) {
    return null;
  }
  return path.join(getIosRoot(), dirName, ...segments);
}

function findXcodePbxprojPath() {
  const iosRoot = getIosRoot();
  if (!fs.existsSync(iosRoot)) {
    return null;
  }

  const legacy = path.join(iosRoot, 'app.xcodeproj', 'project.pbxproj');
  if (fs.existsSync(legacy)) {
    return legacy;
  }

  for (const entry of fs.readdirSync(iosRoot)) {
    if (entry.endsWith('.xcodeproj')) {
      const pbxproj = path.join(iosRoot, entry, 'project.pbxproj');
      if (fs.existsSync(pbxproj)) {
        return pbxproj;
      }
    }
  }

  return null;
}

function hasIosNativeProject() {
  return findNativeAppDirName() !== null || findXcodePbxprojPath() !== null;
}

module.exports = {
  getIosRoot,
  findNativeAppDirName,
  getNativeAppFile,
  findXcodePbxprojPath,
  hasIosNativeProject,
};
