import { buildAsoPreviewEntries } from "@/services/asoPreviewSeed";

describe("asoPreviewSeed", () => {
  it("builds rich Chinese demo entries without engineering jargon", () => {
    const entries = buildAsoPreviewEntries(new Date("2026-10-22T12:00:00"));
    expect(entries.length).toBeGreaterThanOrEqual(12);

    const blob = JSON.stringify(entries);
    expect(blob).not.toMatch(/Maestro|UAT|seed|retention/i);
    expect(blob).toMatch(/朋友/);
    expect(blob).toMatch(/同事/);
    expect(blob).toMatch(/伴侣/);
    expect(blob).toMatch(/家人/);
    expect(entries.some((e) => e.people.includes("朋友"))).toBe(true);
    expect(entries.some((e) => e.status === "resolved")).toBe(true);
    expect(entries.some((e) => e.status === "processing")).toBe(true);
    const people = new Set(entries.flatMap((e) => e.people));
    expect(people.size).toBeGreaterThanOrEqual(4);
  });
});
