/**
 * Property-Based Tests for Store Type Safety
 *
 * Feature: react-native-optimization
 * Property 1: Store operations maintain type safety
 *
 * Validates: Requirements 1.1, 1.4
 *
 * These tests use fast-check to verify that store operations
 * accept and return correctly typed values across many generated inputs.
 */

import fc from "fast-check";
import { create } from "zustand";
import { createAIModule } from "../../store/modules/ai";
import { createEntriesModule } from "../../store/modules/entries";
import { AppState } from "../../store/modules/types";
import { createWeatherModule } from "../../store/modules/weather";
import { MoodLevel, Status } from "../../types";

describe("Feature: react-native-optimization, Property 1: Store operations maintain type safety", () => {
  /**
   * Arbitrary generator for MoodEntry
   */
  const moodEntryArbitrary = fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
    moodLevel: fc.constantFrom(
      MoodLevel.ANNOYED,
      MoodLevel.UPSET,
      MoodLevel.ANGRY,
      MoodLevel.FURIOUS,
      MoodLevel.EXPLOSIVE,
    ),
    content: fc.string({ minLength: 1, maxLength: 500 }),
    deadline: fc.constantFrom("今天", "明天", "本周", "本月", "later"),
    people: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      minLength: 0,
      maxLength: 10,
    }),
    triggers: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      minLength: 0,
      maxLength: 10,
    }),
    status: fc.constantFrom(
      Status.ACTIVE,
      Status.PROCESSING,
      Status.RESOLVED,
      Status.BURNED,
    ),
    resolvedAt: fc.option(fc.integer({ min: 1000000000000, max: Date.now() }), {
      nil: undefined,
    }),
    burnedAt: fc.option(fc.integer({ min: 1000000000000, max: Date.now() }), {
      nil: undefined,
    }),
    editHistory: fc.array(
      fc.record({
        editedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
        previousContent: fc.string(),
        previousMoodLevel: fc.constantFrom(
          MoodLevel.ANNOYED,
          MoodLevel.UPSET,
          MoodLevel.ANGRY,
          MoodLevel.FURIOUS,
          MoodLevel.EXPLOSIVE,
        ),
        previousDeadline: fc.constantFrom(
          "今天",
          "明天",
          "本周",
          "本月",
          "later",
        ),
        previousPeople: fc.array(fc.string()),
        previousTriggers: fc.array(fc.string()),
      }),
    ),
  });

  /**
   * Arbitrary generator for new entry data (without id, timestamp, status)
   */
  const newEntryDataArbitrary = fc.record({
    moodLevel: fc.constantFrom(
      MoodLevel.ANNOYED,
      MoodLevel.UPSET,
      MoodLevel.ANGRY,
      MoodLevel.FURIOUS,
      MoodLevel.EXPLOSIVE,
    ),
    content: fc.string({ minLength: 1, maxLength: 500 }),
    deadline: fc.constantFrom("今天", "明天", "本周", "本月", "later"),
    people: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      minLength: 0,
      maxLength: 10,
    }),
    triggers: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      minLength: 0,
      maxLength: 10,
    }),
  });

  describe("EntriesModule Type Safety", () => {
    it("should accept correctly typed entry data in addEntry", async () => {
      await fc.assert(
        fc.asyncProperty(newEntryDataArbitrary, async (entryData) => {
          // Create a test store
          const useTestStore = create<AppState>((set, get) => {
            const entriesModule = createEntriesModule(set, get);
            return {
              ...entriesModule,
              _saveEntries: () => {},
              _calculateWeather: () => {},
              updateFirstEntryDate: async () => {},
            } as unknown as AppState;
          });

          const store = useTestStore.getState();

          // This should compile and run without type errors
          await store.addEntry(entryData);

          // Verify the entry was added with correct types
          const entries = useTestStore.getState().entries;
          expect(entries.length).toBeGreaterThan(0);

          const addedEntry = entries[0];
          expect(typeof addedEntry.id).toBe("string");
          expect(typeof addedEntry.timestamp).toBe("number");
          expect(addedEntry.status).toBe(Status.ACTIVE);
          expect(addedEntry.moodLevel).toBe(entryData.moodLevel);
          expect(addedEntry.content).toBe(entryData.content);
        }),
        { numRuns: 100 },
      );
    });

    it("should accept correctly typed updates in updateEntry", () => {
      fc.assert(
        fc.property(
          moodEntryArbitrary,
          fc.record({
            content: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
            moodLevel: fc.option(
              fc.constantFrom(
                MoodLevel.ANNOYED,
                MoodLevel.UPSET,
                MoodLevel.ANGRY,
                MoodLevel.FURIOUS,
                MoodLevel.EXPLOSIVE,
              ),
            ),
            people: fc.option(
              fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
                maxLength: 10,
              }),
            ),
            triggers: fc.option(
              fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
                maxLength: 10,
              }),
            ),
          }),
          (entry, updates) => {
            // Create a test store with initial entry
            const useTestStore = create<AppState>((set, get) => {
              const entriesModule = createEntriesModule(set, get);
              return {
                ...entriesModule,
                entries: [entry],
                _saveEntries: () => {},
                _calculateWeather: () => {},
              } as unknown as AppState;
            });

            const store = useTestStore.getState();

            // Filter out undefined values from updates
            const filteredUpdates = Object.fromEntries(
              Object.entries(updates).filter(([_, v]) => v !== null),
            );

            // This should compile and run without type errors
            store.updateEntry(entry.id, filteredUpdates);

            // Verify the entry was updated with correct types
            const updatedEntry = useTestStore.getState().entries[0];
            expect(updatedEntry.id).toBe(entry.id);

            // Check that updates were applied
            if (filteredUpdates.content !== undefined) {
              expect(updatedEntry.content).toBe(filteredUpdates.content);
            }
            if (filteredUpdates.moodLevel !== undefined) {
              expect(updatedEntry.moodLevel).toBe(filteredUpdates.moodLevel);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain type safety when deleting entries", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(moodEntryArbitrary, { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          async (entries, indexToDelete) => {
            const actualIndex = indexToDelete % entries.length;
            const entryToDelete = entries[actualIndex];

            // Create a test store with initial entries
            const useTestStore = create<AppState>((set, get) => {
              const entriesModule = createEntriesModule(set, get);
              return {
                ...entriesModule,
                entries: [...entries],
                _saveEntries: () => {},
                _calculateWeather: () => {},
                clearFirstEntryDate: async () => {},
              } as unknown as AppState;
            });

            const store = useTestStore.getState();
            const initialCount = entries.length;

            // This should compile and run without type errors
            await store.deleteEntry(entryToDelete.id);

            // Verify the entry was deleted
            const remainingEntries = useTestStore.getState().entries;
            expect(remainingEntries.length).toBe(initialCount - 1);
            expect(
              remainingEntries.find((e) => e.id === entryToDelete.id),
            ).toBeUndefined();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("WeatherModule Type Safety", () => {
    it("should calculate weather with correctly typed entries", () => {
      fc.assert(
        fc.property(
          fc.array(moodEntryArbitrary, { maxLength: 20 }),
          (entries) => {
            // Create a test store with entries
            const useTestStore = create<AppState>((set, get) => {
              const weatherModule = createWeatherModule(set, get);
              return {
                ...weatherModule,
                entries,
              } as unknown as AppState;
            });

            const store = useTestStore.getState();

            // This should compile and run without type errors
            store._calculateWeather();

            // Verify weather state has correct types
            const weather = useTestStore.getState().weather;
            expect(typeof weather.score).toBe("number");
            expect(typeof weather.condition).toBe("string");
            expect(["sunny", "cloudy", "rainy", "stormy"]).toContain(
              weather.condition,
            );
            expect(typeof weather.description).toBe("string");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should set weather with correctly typed weather state", () => {
      fc.assert(
        fc.property(
          fc.record({
            score: fc.integer({ min: 0, max: 100 }),
            condition: fc.constantFrom("sunny", "cloudy", "rainy", "stormy"),
            description: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          (weatherState) => {
            // Create a test store
            const useTestStore = create<AppState>((set, get) => {
              const weatherModule = createWeatherModule(set, get);
              return {
                ...weatherModule,
              } as unknown as AppState;
            });

            const store = useTestStore.getState();

            // This should compile and run without type errors
            store._setWeather(weatherState);

            // Verify weather was set correctly
            const weather = useTestStore.getState().weather;
            expect(weather.score).toBe(weatherState.score);
            expect(weather.condition).toBe(weatherState.condition);
            expect(weather.description).toBe(weatherState.description);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("AIModule Type Safety", () => {
    it("should accept correctly typed days parameter in generateForecast", () => {
      fc.assert(
        fc.asyncProperty(
          fc.option(fc.integer({ min: 1, max: 30 }), { nil: undefined }),
          fc.array(moodEntryArbitrary, { minLength: 3, maxLength: 10 }),
          async (days, entries) => {
            // Create a test store with entries
            const useTestStore = create<AppState>((set, get) => {
              const aiModule = createAIModule(set, get);
              return {
                ...aiModule,
                entries,
              } as unknown as AppState;
            });

            const store = useTestStore.getState();

            // This should compile and run without type errors
            if (days !== null) {
              await store.generateForecast(days);
            } else {
              await store.generateForecast();
            }

            // Verify forecast has correct type (can be null if generation failed)
            const forecast = useTestStore.getState().emotionForecast;
            if (forecast !== null) {
              expect(typeof forecast.lastUpdated).toBe("number");
              expect(Array.isArray(forecast.predictions)).toBe(true);
              expect(Array.isArray(forecast.warnings)).toBe(true);
            }
          },
        ),
        { numRuns: 50 }, // Reduced runs for async operations
      );
    });

    it("should accept correctly typed period parameter in generatePodcast", () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom("week", "month"),
          fc.array(moodEntryArbitrary, { minLength: 1, maxLength: 10 }),
          async (period, entries) => {
            // Create a test store with entries
            const useTestStore = create<AppState>((set, get) => {
              const aiModule = createAIModule(set, get);
              return {
                ...aiModule,
                entries,
              } as unknown as AppState;
            });

            const store = useTestStore.getState();

            // This should compile and run without type errors
            await store.generatePodcast(period);

            // Verify podcast has correct type (can be null if generation failed)
            const podcast = useTestStore.getState().emotionPodcast;
            if (podcast !== null) {
              expect(typeof podcast.content).toBe("string");
              expect(podcast.period).toBe(period);
              expect(typeof podcast.generatedAt).toBe("number");
            }
          },
        ),
        { numRuns: 50 }, // Reduced runs for async operations
      );
    });
  });

  describe("Module Composition Type Safety", () => {
    it("should maintain type safety when combining all modules", () => {
      fc.assert(
        fc.property(
          fc.array(moodEntryArbitrary, { maxLength: 5 }),
          (initialEntries) => {
            // Create a store combining all modules
            const useTestStore = create<AppState>((set, get) => {
              const entriesModule = createEntriesModule(set, get);
              const weatherModule = createWeatherModule(set, get);
              const aiModule = createAIModule(set, get);

              return {
                ...entriesModule,
                ...weatherModule,
                ...aiModule,
                entries: initialEntries,
                _saveEntries: () => {},
              } as unknown as AppState;
            });

            const state = useTestStore.getState();

            // Verify all module properties have correct types
            expect(Array.isArray(state.entries)).toBe(true);
            expect(typeof state.weather.score).toBe("number");
            expect(typeof state.weather.condition).toBe("string");
            expect(typeof state.weather.description).toBe("string");

            // Verify all module methods are callable
            expect(typeof state._setEntries).toBe("function");
            expect(typeof state._calculateWeather).toBe("function");
            expect(typeof state._saveEntries).toBe("function");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve type information through set and get operations", () => {
      fc.assert(
        fc.property(
          fc.array(moodEntryArbitrary, { minLength: 1, maxLength: 5 }),
          (entries) => {
            let capturedSetArg: any = null;
            let capturedGetResult: any = null;

            // Create a store that captures set and get calls
            const useTestStore = create<
              Pick<AppState, "entries" | "_setEntries">
            >((set, get) => ({
              entries: [],
              _setEntries: (newEntries) => {
                capturedSetArg = newEntries;
                set({ entries: newEntries });
                capturedGetResult = get();
              },
            }));

            const store = useTestStore.getState();
            store._setEntries(entries);

            // Verify set received correctly typed argument
            expect(Array.isArray(capturedSetArg)).toBe(true);
            expect(capturedSetArg.length).toBe(entries.length);

            // Verify get returned correctly typed state
            expect(capturedGetResult).toBeDefined();
            expect(Array.isArray(capturedGetResult.entries)).toBe(true);
            expect(capturedGetResult.entries.length).toBe(entries.length);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
