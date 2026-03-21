#!/usr/bin/env node

const { spawnSync } = require("child_process");

const isDryRun = process.argv.includes("--dry-run");

const SMOKE_PATHS = [
  {
    id: "record",
    title: "Record path smoke",
    rationale: "Covers create/edit persistence behavior through storage-facing tests.",
    command: "npx",
    args: [
      "jest",
      "--runInBand",
      "--watchman=false",
      "__tests__/unit/store/storage.test.ts",
    ],
  },
  {
    id: "export",
    title: "Export path smoke",
    rationale:
      "Structured assertions only: validates derived stats and export text consistency without pixel snapshots.",
    command: "npx",
    args: [
      "jest",
      "--runInBand",
      "--watchman=false",
      "__tests__/unit/utils/reviewExportDerived.test.ts",
      "__tests__/unit/utils/reviewExportClosingInput.test.ts",
    ],
  },
  {
    id: "sync",
    title: "Sync path smoke",
    rationale: "Includes sync status behaviors to guard cloud sync flow regressions.",
    command: "npx",
    args: [
      "jest",
      "--runInBand",
      "--watchman=false",
      "__tests__/unit/store/syncStatus.test.ts",
      "__tests__/unit/store/pendingSyncQueue.test.ts",
    ],
  },
];

function printHeader() {
  console.log("=== Governance critical-path smoke ===");
  console.log(`Mode: ${isDryRun ? "dry-run" : "execute"}`);
  console.log("Paths: record | export | sync");
}

function runItem(item) {
  console.log(`\n[${item.id}] ${item.title}`);
  console.log(`- Rationale: ${item.rationale}`);
  console.log(`- Command: ${item.command} ${item.args.join(" ")}`);

  if (isDryRun) {
    console.log("- Result: skipped (dry-run)");
    return { ok: true, skipped: true, id: item.id };
  }

  const result = spawnSync(item.command, item.args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    return { ok: false, skipped: false, id: item.id, status: result.status };
  }

  return { ok: true, skipped: false, id: item.id };
}

function printSummary(results) {
  console.log("\n=== Smoke summary ===");
  results.forEach((result, index) => {
    const status = result.ok ? "PASS" : "FAIL";
    const mode = result.skipped ? " (dry-run)" : "";
    console.log(`${index + 1}. ${result.id}: ${status}${mode}`);
  });
  console.log("Structured assertions only for export path (no pixel snapshot checks).");
}

function main() {
  printHeader();
  const results = [];
  for (const item of SMOKE_PATHS) {
    const result = runItem(item);
    results.push(result);
    if (!result.ok) {
      printSummary(results);
      process.exit(result.status || 1);
    }
  }
  printSummary(results);
}

main();
