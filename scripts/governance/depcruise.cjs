const GOVERNANCE_SCOPE = [
  "^app/",
  "^components/",
  "^store/",
  "^utils/",
  "^hooks/",
  "^services/",
  "^lib/",
  "^features/",
  "^shared/",
];

const CANDIDATES_FOR_ERROR = [
  "no-cross-layer-boundary",
  "no-new-circular",
  "no-new-unused-export",
];

module.exports = {
  forbidden: [
    // D-11 candidate: cross-layer boundary imports
    {
      name: "no-cross-layer-boundary",
      comment:
        "Cross-layer imports are visible as warn first, then can be promoted to error by gate policy.",
      severity: "error",
      from: { path: "^store/" },
      to: { path: "^app/" },
    },
    {
      name: "no-features-to-app",
      comment: "features 不可 import app",
      severity: "error",
      from: { path: "^features/" },
      to: { path: "^app/" },
    },
    {
      name: "no-features-to-features",
      comment: "features 之间不可互相 import",
      severity: "error",
      from: { path: "^features/" },
      to: { path: "^features/" },
    },
    {
      name: "no-component-imports-from-app",
      comment:
        "Components should not depend on route layer implementation details.",
      severity: "warn",
      from: { path: "^components/" },
      to: { path: "^app/" },
    },
    // D-11 candidate: new circular dependencies
    {
      name: "no-new-circular",
      comment:
        "Circular dependencies are tracked as warn by default and can be promoted after two clean PR rounds.",
      severity: "error",
      from: { path: GOVERNANCE_SCOPE },
      to: { circular: true },
    },
    // D-11 candidate: new unused exports (bridged from allowlist snapshot process)
    {
      name: "no-new-unused-export",
      comment:
        "Unused exports are managed with knip baseline + allowlist and raised as warn initially.",
      severity: "error",
      from: { path: GOVERNANCE_SCOPE },
      to: { pathNot: "\\.(test|spec)\\.(ts|tsx|js|jsx)$" },
    },
    // Keep unresolved warnings visible but non-blocking at baseline stage.
    {
      name: "no-unresolvable",
      severity: "report",
      from: { path: GOVERNANCE_SCOPE },
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: {
      path: "(node_modules|\\.expo|dist|ios|android)",
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
  metadata: {
    gatePolicy: {
      defaultLevel: "report",
      focusedLevel: "warn",
      promoteToErrorWhen: "Two consecutive PR rounds with zero new violations",
    },
    candidatesForError: CANDIDATES_FOR_ERROR,
    scope: ["app", "components", "store", "utils", "hooks", "services", "lib", "features", "shared"],
  },
};
