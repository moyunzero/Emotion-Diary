/**
 * Weather module — score thresholds, soft-delete / inactive exclusion, no description.
 */

jest.mock("@/services/widgetSnapshot", () => ({
  publishWidgetSnapshot: jest.fn(() => Promise.resolve()),
  clearWidgetSnapshot: jest.fn(() => Promise.resolve()),
}));

import { createWeatherModule } from "@/store/modules/weather";
import type { AppState, WeatherModule } from "@/store/modules/types";
import { MoodLevel, Status, type MoodEntry, type User } from "@/types";
import {
  clearWidgetSnapshot,
  publishWidgetSnapshot,
} from "@/services/widgetSnapshot";

function entry(partial: Partial<MoodEntry> & Pick<MoodEntry, "id" | "moodLevel">): MoodEntry {
  return {
    timestamp: Date.now(),
    content: "",
    deadline: "self",
    people: [],
    triggers: [],
    status: Status.ACTIVE,
    updatedAt: Date.now(),
    ...partial,
  };
}

function createWeatherSlice(
  entries: MoodEntry[],
  user: User | null = { id: "u1", name: "t" },
): WeatherModule & { getWeather: () => WeatherModule["weather"] } {
  let weather: WeatherModule["weather"] = { score: 0, condition: "sunny" };
  const get = () =>
    ({
      entries,
      weather,
      user,
    }) as AppState;
  const set = (
    partial:
      | Partial<AppState>
      | ((s: AppState) => Partial<AppState>),
  ) => {
    const patch = typeof partial === "function" ? partial(get()) : partial;
    if (patch.weather) weather = patch.weather;
  };
  const slice = createWeatherModule(set, get);
  return {
    ...slice,
    getWeather: () => weather,
  };
}

describe("createWeatherModule._calculateWeather", () => {
  beforeEach(() => {
    jest.mocked(publishWidgetSnapshot).mockClear();
    jest.mocked(clearWidgetSnapshot).mockClear();
  });

  it("maps score thresholds: sunny ≤10, cloudy ≤20, rainy ≤30, stormy >30", () => {
    // moodLevel * 2 per entry
    const sunny = createWeatherSlice([
      entry({ id: "1", moodLevel: MoodLevel.ANNOYED }), // 2
    ]);
    sunny._calculateWeather();
    expect(sunny.getWeather()).toEqual({ score: 2, condition: "sunny" });

    const cloudy = createWeatherSlice([
      entry({ id: "1", moodLevel: MoodLevel.ANGRY }), // 6
      entry({ id: "2", moodLevel: MoodLevel.ANGRY }), // 6 → 12
    ]);
    cloudy._calculateWeather();
    expect(cloudy.getWeather()).toEqual({ score: 12, condition: "cloudy" });

    const rainy = createWeatherSlice([
      entry({ id: "1", moodLevel: MoodLevel.EXPLOSIVE }), // 10
      entry({ id: "2", moodLevel: MoodLevel.EXPLOSIVE }), // 10 → 20 — boundary: >20 rainy
      entry({ id: "3", moodLevel: MoodLevel.ANNOYED }), // +2 → 22
    ]);
    rainy._calculateWeather();
    expect(rainy.getWeather()).toEqual({ score: 22, condition: "rainy" });

    const stormy = createWeatherSlice([
      entry({ id: "1", moodLevel: MoodLevel.EXPLOSIVE }),
      entry({ id: "2", moodLevel: MoodLevel.EXPLOSIVE }),
      entry({ id: "3", moodLevel: MoodLevel.EXPLOSIVE }),
      entry({ id: "4", moodLevel: MoodLevel.ANNOYED }), // 32
    ]);
    stormy._calculateWeather();
    expect(stormy.getWeather()).toEqual({ score: 32, condition: "stormy" });
  });

  it("excludes RESOLVED and soft-deleted entries from score", () => {
    const slice = createWeatherSlice([
      entry({ id: "active", moodLevel: MoodLevel.EXPLOSIVE }), // 10
      entry({
        id: "resolved",
        moodLevel: MoodLevel.EXPLOSIVE,
        status: Status.RESOLVED,
      }),
      entry({
        id: "deleted",
        moodLevel: MoodLevel.EXPLOSIVE,
        deletedAt: Date.now(),
      }),
    ]);
    slice._calculateWeather();
    expect(slice.getWeather()).toEqual({ score: 10, condition: "sunny" });
  });

  it("persists weather without description field", () => {
    const slice = createWeatherSlice([
      entry({ id: "1", moodLevel: MoodLevel.UPSET }),
    ]);
    slice._calculateWeather();
    const w = slice.getWeather();
    expect(w).toEqual({ score: 4, condition: "sunny" });
    expect(Object.keys(w).sort()).toEqual(["condition", "score"]);
    expect("description" in w).toBe(false);
  });

  it("publishes widget snapshot when signed in", () => {
    const slice = createWeatherSlice([
      entry({ id: "1", moodLevel: MoodLevel.ANNOYED }),
    ]);
    slice._calculateWeather();
    expect(publishWidgetSnapshot).toHaveBeenCalled();
    expect(clearWidgetSnapshot).not.toHaveBeenCalled();
  });

  it("clears widget snapshot when logged out (D-10 — no Soft Stack republish)", () => {
    const slice = createWeatherSlice(
      [entry({ id: "1", moodLevel: MoodLevel.ANNOYED })],
      null,
    );
    slice._calculateWeather();
    expect(clearWidgetSnapshot).toHaveBeenCalled();
    expect(publishWidgetSnapshot).not.toHaveBeenCalled();
  });
});
