/**
 * Property-Based Tests for EntryCard Memoization
 *
 * Feature: react-native-optimization
 * Property 3: Memo comparison functions perform correct equality
 *
 * Validates: Requirements 3.4, 5.1
 *
 * These tests use fast-check to verify that the EntryCard memo comparison
 * function correctly performs deep equality checks on arrays (people, triggers)
 * and handles edge cases (null, undefined, empty arrays).
 */

import fc from "fast-check";
import { areEntryCardPropsEqual } from "../../components/EntryCard";
import { MoodLevel, Status } from "../../types";

// Mock Skia before importing components that use it (needed for EntryCard import)
jest.mock("@shopify/react-native-skia", () => ({
  Skia: {
    Image: {
      MakeImageFromEncoded: jest.fn(),
    },
    Paint: jest.fn(),
    Path: jest.fn(),
    Canvas: jest.fn(),
  },
  Canvas: "Canvas",
  Path: "Path",
  SkImage: "SkImage",
  useImage: jest.fn(),
  useFont: jest.fn(),
}));

// Mock dependencies
jest.mock("../../store/useAppStore", () => ({
  useAppStore: jest.fn(),
}));

jest.mock("../../hooks/useHapticFeedback", () => ({
  useHapticFeedback: () => ({
    trigger: jest.fn(),
  }),
}));

jest.mock("../../utils/devicePerformance", () => ({
  isLowEndDevice: jest.fn().mockResolvedValue(false),
}));

jest.mock("react-native-view-shot", () => ({
  captureRef: jest.fn(),
}));

// Arbitraries for generating test data
const moodLevelArbitrary = fc.constantFrom(
  MoodLevel.ANNOYED,
  MoodLevel.UPSET,
  MoodLevel.ANGRY,
  MoodLevel.FURIOUS,
  MoodLevel.EXPLOSIVE,
);

const statusArbitrary = fc.constantFrom(
  Status.ACTIVE,
  Status.RESOLVED,
  Status.BURNED,
);

const moodEntryArbitrary = fc.record({
  id: fc.uuid(),
  timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
  moodLevel: moodLevelArbitrary,
  content: fc.string({ minLength: 1, maxLength: 200 }),
  deadline: fc.constantFrom("今天", "本周", "本月", "随时"),
  people: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
    minLength: 0,
    maxLength: 5,
  }),
  triggers: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
    minLength: 0,
    maxLength: 5,
  }),
  status: statusArbitrary,
  resolvedAt: fc.option(
    fc.integer({ min: 1000000000000, max: 9999999999999 }),
    { nil: undefined },
  ),
  burnedAt: fc.option(fc.integer({ min: 1000000000000, max: 9999999999999 }), {
    nil: undefined,
  }),
});

describe("Feature: react-native-optimization, Property 3: Memo comparison functions perform correct equality", () => {
  /**
   * Test that comparison returns true for equal props with different array references
   * This is the key test for deep array equality
   */
  it("should return true for equal props with different array references", () => {
    fc.assert(
      fc.property(moodEntryArbitrary, (entry) => {
        const onBurn = jest.fn();
        const props1 = { entry, onBurn };

        // Create new entry with same values but different array references
        const entryWithNewArrayRefs = {
          ...entry,
          people: [...entry.people], // New array reference, same values
          triggers: [...entry.triggers], // New array reference, same values
        };
        const props2 = { entry: entryWithNewArrayRefs, onBurn };

        // Should return true because deep equality should detect arrays are equal
        expect(areEntryCardPropsEqual(props1, props2)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Test that comparison returns false when people array differs
   */
  it("should return false when people array differs", () => {
    fc.assert(
      fc.property(
        moodEntryArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        (entry, newPerson) => {
          // Ensure newPerson is not already in the array
          fc.pre(!entry.people.includes(newPerson));

          const onBurn = jest.fn();
          const props1 = { entry, onBurn };

          // Create entry with different people array
          const entryWithDifferentPeople = {
            ...entry,
            people: [...entry.people, newPerson],
          };
          const props2 = { entry: entryWithDifferentPeople, onBurn };

          // Should return false because people array is different
          expect(areEntryCardPropsEqual(props1, props2)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Test that comparison returns false when triggers array differs
   */
  it("should return false when triggers array differs", () => {
    fc.assert(
      fc.property(
        moodEntryArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        (entry, newTrigger) => {
          // Ensure newTrigger is not already in the array
          fc.pre(!entry.triggers.includes(newTrigger));

          const onBurn = jest.fn();
          const props1 = { entry, onBurn };

          // Create entry with different triggers array
          const entryWithDifferentTriggers = {
            ...entry,
            triggers: [...entry.triggers, newTrigger],
          };
          const props2 = { entry: entryWithDifferentTriggers, onBurn };

          // Should return false because triggers array is different
          expect(areEntryCardPropsEqual(props1, props2)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Test that comparison handles empty arrays correctly
   */
  it("should handle empty arrays correctly", () => {
    fc.assert(
      fc.property(moodEntryArbitrary, (entry) => {
        const onBurn = jest.fn();

        // Ensure arrays are empty
        const entryWithEmptyArrays = {
          ...entry,
          people: [],
          triggers: [],
        };
        const props1 = { entry: entryWithEmptyArrays, onBurn };

        // Create another copy with different empty array references
        const entryWithNewEmptyArrays = {
          ...entryWithEmptyArrays,
          people: [],
          triggers: [],
        };
        const props2 = { entry: entryWithNewEmptyArrays, onBurn };

        // Should return true because both have empty arrays
        expect(areEntryCardPropsEqual(props1, props2)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Test that comparison returns false when other props differ
   */
  it("should return false when other props differ", () => {
    fc.assert(
      fc.property(moodEntryArbitrary, (entry) => {
        const onBurn = jest.fn();
        const props1 = { entry, onBurn };

        // Change a scalar prop
        const entryWithDiffStatus = {
          ...entry,
          status:
            entry.status === Status.ACTIVE ? Status.RESOLVED : Status.ACTIVE,
        };
        const props2 = { entry: entryWithDiffStatus, onBurn };

        expect(areEntryCardPropsEqual(props1, props2)).toBe(false);

        // Change onBurn handler
        const props3 = { entry, onBurn: jest.fn() };
        expect(areEntryCardPropsEqual(props1, props3)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
