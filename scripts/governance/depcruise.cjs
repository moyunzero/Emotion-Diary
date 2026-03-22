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
};
