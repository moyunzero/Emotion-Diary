#!/usr/bin/env node
/**
 * Xcode 27 用 DeviceHub 替换了 Simulator.app；Expo SDK 54 自带的 @expo/cli
 * 仍只认 Simulator，导致 yarn ios 报：
 *   Can't determine id of Simulator app
 * 本脚本幂等修补 node_modules/@expo/cli（yarn install 后需再跑）。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'node_modules', '@expo', 'cli', 'build', 'src', 'start');
const prereq = path.join(root, 'doctor', 'apple', 'SimulatorAppPrerequisite.js');
const ensure = path.join(root, 'platforms', 'ios', 'ensureSimulatorAppRunning.js');

function mustExist(p) {
  if (!fs.existsSync(p)) {
    console.error(`skip: missing ${p}`);
    process.exit(0);
  }
}

mustExist(prereq);
mustExist(ensure);

let a = fs.readFileSync(prereq, 'utf8');
if (!a.includes('DeviceHub') && !a.includes('com.apple.dt.Devices')) {
  a = a.replace(
    `async function getSimulatorAppIdAsync() {
    try {
        return (await (0, _osascript().execAsync)('id of app "Simulator"')).trim();
    } catch  {
    // This error may occur in CI where the users intends to install just the simulators but no Xcode.
    }
    return null;
}`,
    `async function getSimulatorAppIdAsync() {
    // Xcode 27+: DeviceHub replaces Simulator.app
    for (const name of ['Simulator', 'DeviceHub']) {
        try {
            const id = (await (0, _osascript().execAsync)(\`id of app "\${name}"\`)).trim();
            if (id) return id;
        } catch  {
        // try next
        }
    }
    try {
        const { default: spawnAsync } = require("@expo/spawn-async");
        const { stdout } = await spawnAsync('xcode-select', ['--print-path']);
        const dev = stdout.trim();
        for (const rel of [
            'Applications/Simulator.app/Contents/Info.plist',
            '../Applications/DeviceHub.app/Contents/Info.plist',
        ]) {
            try {
                const { stdout: bid } = await spawnAsync('defaults', [
                    'read',
                    require('path').join(dev, rel),
                    'CFBundleIdentifier',
                ]);
                if (bid.trim()) return bid.trim();
            } catch  {
            // try next
            }
        }
    } catch  {
    // ignore
    }
    return null;
}`
  );
  a = a.replace(
    `throw new _Prerequisite.PrerequisiteCommandError('SIMULATOR_APP', "Can't determine id of Simulator app; the Simulator is most likely not installed on this machine. Run \`sudo xcode-select -s /Applications/Xcode.app\`");`,
    `throw new _Prerequisite.PrerequisiteCommandError('SIMULATOR_APP', "Can't determine id of Device Hub or Simulator app; open Device Hub (Xcode 27) or Simulator, or run \`sudo xcode-select -s /Applications/Xcode.app\`");`
  );
  a = a.replace(
    `if (result !== 'com.apple.iphonesimulator' && result !== 'com.apple.CoreSimulator.SimulatorTrampoline') {
            throw new _Prerequisite.PrerequisiteCommandError('SIMULATOR_APP', "Simulator is installed but is identified as '" + result + "'; don't know what that is.");
        }`,
    `if (result !== 'com.apple.dt.Devices' && result !== 'com.apple.iphonesimulator' && result !== 'com.apple.CoreSimulator.SimulatorTrampoline') {
            throw new _Prerequisite.PrerequisiteCommandError('SIMULATOR_APP', "Device Hub/Simulator is installed but is identified as '" + result + "'; don't know what that is.");
        }`
  );
  if (!a.includes('com.apple.dt.Devices')) {
    console.error('FAIL: could not patch SimulatorAppPrerequisite.js (format changed)');
    process.exit(1);
  }
  fs.writeFileSync(prereq, a);
  console.log('patched SimulatorAppPrerequisite.js');
} else {
  console.log('SimulatorAppPrerequisite.js already DeviceHub-aware');
}

let b = fs.readFileSync(ensure, 'utf8');
if (!b.includes('DeviceHub') && b.includes("'Simulator'")) {
  b = b.replace(
    `async function isSimulatorAppRunningAsync() {
    try {
        const zeroMeansNo = (await _osascript().execAsync('tell app "System Events" to count processes whose name is "Simulator"')).trim();
        if (zeroMeansNo === '0') {
            return false;
        }
    } catch (error) {
        if (error.message.includes('Application isn’t running')) {
            return false;
        }
        throw error;
    }
    return true;
}
async function openSimulatorAppAsync(device) {
    const args = [
        '-a',
        'Simulator'
    ];
    if (device.udid) {
        // This has no effect if the app is already running.
        args.push('--args', '-CurrentDeviceUDID', device.udid);
    }
    await (0, _spawnasync().default)('open', args);
}`,
    `async function isSimulatorAppRunningAsync() {
    for (const name of ['Simulator', 'DeviceHub']) {
        try {
            const zeroMeansNo = (await _osascript().execAsync(\`tell app "System Events" to count processes whose name is "\${name}"\`)).trim();
            if (zeroMeansNo !== '0') return true;
        } catch (error) {
            if (!(error.message || '').includes('Application isn’t running')) {
                throw error;
            }
        }
    }
    return false;
}
async function openSimulatorAppAsync(device) {
    // Prefer DeviceHub (Xcode 27+), fall back to Simulator
    const hub = '/Applications/Xcode.app/Contents/Applications/DeviceHub.app';
    if (require('fs').existsSync(hub)) {
        await (0, _spawnasync().default)('open', ['-b', 'com.apple.dt.Devices']);
        return;
    }
    const args = ['-a', 'Simulator'];
    if (device.udid) {
        args.push('--args', '-CurrentDeviceUDID', device.udid);
    }
    await (0, _spawnasync().default)('open', args);
}`
  );
  if (!b.includes('DeviceHub')) {
    console.error('FAIL: could not patch ensureSimulatorAppRunning.js');
    process.exit(1);
  }
  fs.writeFileSync(ensure, b);
  console.log('patched ensureSimulatorAppRunning.js');
} else {
  console.log('ensureSimulatorAppRunning.js already DeviceHub-aware');
}

const manager = path.join(root, 'platforms', 'ios', 'AppleDeviceManager.js');
mustExist(manager);
let c = fs.readFileSync(manager, 'utf8');
if (c.includes('tell application "Simulator" to activate') && !c.includes('tell application "DeviceHub" to activate')) {
  c = c.replace(
    `await _osascript().execAsync(\`tell application "Simulator" to activate\`);`,
    `try {
            await _osascript().execAsync(\`tell application "DeviceHub" to activate\`);
        } catch  {
            await _osascript().execAsync(\`tell application "Simulator" to activate\`);
        }`
  );
  if (!c.includes('DeviceHub')) {
    console.error('FAIL: could not patch AppleDeviceManager.js');
    process.exit(1);
  }
  fs.writeFileSync(manager, c);
  console.log('patched AppleDeviceManager.js');
} else {
  console.log('AppleDeviceManager.js already DeviceHub-aware');
}
