/**
 * Xcode 27 rejects Pod targets with IPHONEOS_DEPLOYMENT_TARGET < 15.0.
 * Ensure every CocoaPods target is bumped after react_native_post_install.
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# with-ios-min-deployment-target';
const HOOK = `
    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
      end
    end
`;

function withIosMinDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    async (mod) => {
      const podfilePath = path.join(mod.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (contents.includes(MARKER)) {
        return mod;
      }
      if (!contents.includes('react_native_post_install(')) {
        throw new Error(
          'with-ios-min-deployment-target: react_native_post_install not found in Podfile',
        );
      }
      // Insert after the react_native_post_install(...) call block's closing paren line.
      // Match the common Expo template: react_native_post_install( ... )
      contents = contents.replace(
        /react_native_post_install\([\s\S]*?^\s*\)\s*$/m,
        (match) => `${match}\n${HOOK}`,
      );
      if (!contents.includes(MARKER)) {
        throw new Error(
          'with-ios-min-deployment-target: failed to patch Podfile post_install',
        );
      }
      fs.writeFileSync(podfilePath, contents);
      return mod;
    },
  ]);
}

module.exports = withIosMinDeploymentTarget;
