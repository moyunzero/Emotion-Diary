/**
 * Config plugin: ensure iOS App Group entitlement for widget snapshot sink.
 * Does not register the group in Apple Developer portal (user_setup / Phase 17).
 */

const { withEntitlementsPlist } = require('expo/config-plugins');

const APP_GROUP_ID = 'group.com.moyunzero.emotiondiary';
const APP_GROUPS_KEY = 'com.apple.security.application-groups';

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

module.exports = withWidgetSnapshotAppGroup;
