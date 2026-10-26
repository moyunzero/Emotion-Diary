import {
  getAsoScrollStepsForTests,
  registerAsoDashboardScroller,
  requestAsoDashboardScroll,
  resetAsoDashboardScrollForTests,
} from "@/services/asoPreviewScroll";

describe("asoPreviewScroll", () => {
  beforeEach(() => {
    resetAsoDashboardScrollForTests();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("drives registered scroller through animated offset steps", () => {
    const seen: Array<{ offset: number; animated: boolean }> = [];
    registerAsoDashboardScroller((offset, animated) => {
      seen.push({ offset, animated });
    });

    requestAsoDashboardScroll();
    jest.runAllTimers();

    expect(seen).toEqual(
      getAsoScrollStepsForTests().map((s) => ({
        offset: s.offset,
        animated: s.animated,
      })),
    );
  });

  it("runs after late register when request came first", () => {
    const seen: number[] = [];
    requestAsoDashboardScroll();
    registerAsoDashboardScroller((offset) => {
      seen.push(offset);
    });
    jest.runAllTimers();
    expect(seen.length).toBe(getAsoScrollStepsForTests().length);
  });
});
