import { areOrderedStringArraysEqual } from "../../../utils/arrayEquality";

describe("memo array helper behavior", () => {
  it("treats null and undefined as equal", () => {
    expect(areOrderedStringArraysEqual(null, undefined)).toBe(true);
  });

  it("returns false when one side is missing", () => {
    expect(areOrderedStringArraysEqual(["a"], undefined)).toBe(false);
  });

  it("checks ordered equality", () => {
    expect(areOrderedStringArraysEqual(["a", "b"], ["a", "b"])).toBe(true);
    expect(areOrderedStringArraysEqual(["a", "b"], ["b", "a"])).toBe(false);
    expect(areOrderedStringArraysEqual(["x"], ["x"])).toBe(true);
    expect(areOrderedStringArraysEqual(["x"], ["y"])).toBe(false);
  });
});
