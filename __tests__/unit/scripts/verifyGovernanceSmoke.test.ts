import path from "path";
import { spawnSync } from "child_process";

describe("verify-governance-smoke script", () => {
  it("prints three critical paths in dry-run mode", () => {
    const scriptPath = path.resolve(
      __dirname,
      "../../../..",
      "scripts/verify-governance-smoke.js"
    );

    const result = spawnSync("node", [scriptPath, "--dry-run"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("record");
    expect(result.stdout).toContain("export");
    expect(result.stdout).toContain("sync");
    expect(result.stdout).toContain("Structured assertions only");
  });
});
