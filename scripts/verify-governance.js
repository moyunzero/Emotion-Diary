#!/usr/bin/env node

const { spawnSync } = require("child_process");

const GOVERNANCE_SCOPE = [
  "app",
  "components",
  "store",
  "utils",
  "hooks",
  "services",
  "lib",
  "features",
  "shared",
];

const STAGES = [
  {
    id: "knip",
    title: "Stage 1/3: knip (unused exports/dependencies)",
    command: "npx",
    args: ["knip"],
  },
  {
    id: "dependency-cruiser",
    title: "Stage 2/3: dependency-cruiser (dependency graph checks)",
    command: "npx",
    args: ["depcruise", "--config", "scripts/governance/depcruise.cjs", ...GOVERNANCE_SCOPE],
  },
  {
    id: "eslint-plugin-boundaries",
    title: "Stage 3/3: eslint-plugin-boundaries (import boundaries)",
    command: "npx",
    args: [
      "eslint",
      ...GOVERNANCE_SCOPE,
      "--ext",
      ".ts,.tsx,.js,.jsx",
      "--rule",
      "boundaries/element-types:error",
    ],
  },
];

const isDryRun = process.argv.includes("--dry-run");

function section(title) {
  console.log(`\n=== ${title} ===`);
}

function runStage(stage) {
  section(stage.title);
  console.log(`Command: ${stage.command} ${stage.args.join(" ")}`);

  if (isDryRun) {
    console.log("Dry run mode: skipped actual execution.");
    return { ok: true, skipped: true };
  }

  const result = spawnSync(stage.command, stage.args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    return { ok: false, skipped: false, status: result.status };
  }
  return { ok: true, skipped: false };
}

function printSummary(results) {
  section("Governance summary");
  results.forEach((r, index) => {
    const status = r.ok ? "PASS" : "FAIL";
    const dryMark = r.skipped ? " (dry-run)" : "";
    console.log(`${index + 1}. ${r.id}: ${status}${dryMark}`);
  });

  console.log("\nScope:", GOVERNANCE_SCOPE.join(", "));
  console.log(
    "Repro command (local/CI): npm run verify:governance -- --dry-run"
  );
}

function main() {
  section("Phase 06 Governance Baseline");
  console.log("Execution order: knip -> dependency-cruiser -> eslint-plugin-boundaries");
  console.log(`Mode: ${isDryRun ? "dry-run" : "execute"}`);

  const results = [];
  for (const stage of STAGES) {
    const result = runStage(stage);
    results.push({ id: stage.id, ...result });
    if (!result.ok) {
      printSummary(results);
      process.exit(result.status || 1);
    }
  }

  printSummary(results);
}

main();
