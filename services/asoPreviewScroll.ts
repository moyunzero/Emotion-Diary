/**
 * App Store Preview：隐形按钮触发程序化下滑。
 * simctl recordVideo 在画面静止时几乎不写帧；必须用 animated 滚动才能录到下滑过程。
 */

type ScrollToOffset = (offset: number, animated: boolean) => void;

let scroller: ScrollToOffset | null = null;
let pendingRequest = false;
const pendingTimers: ReturnType<typeof setTimeout>[] = [];

/**
 * 多段 animated 下滑（约 3.5s）：回顶 → 中段 → 底部 → 略回。
 * 每段留足动画时间，让录屏编码器吃到中间帧。
 */
const ASO_SCROLL_STEPS: ReadonlyArray<{
  atMs: number;
  offset: number;
  animated: boolean;
}> = [
  { atMs: 50, offset: 0, animated: false },
  { atMs: 200, offset: 480, animated: true },
  { atMs: 1100, offset: 960, animated: true },
  { atMs: 2100, offset: 1400, animated: true },
  { atMs: 3100, offset: 880, animated: true },
];

function runScrollSequence(): void {
  pendingTimers.splice(0).forEach(clearTimeout);
  for (const step of ASO_SCROLL_STEPS) {
    pendingTimers.push(
      setTimeout(() => {
        scroller?.(step.offset, step.animated);
      }, step.atMs),
    );
  }
}

export function registerAsoDashboardScroller(fn: ScrollToOffset | null): void {
  scroller = fn;
  if (fn && pendingRequest) {
    pendingRequest = false;
    runScrollSequence();
  }
}

export function requestAsoDashboardScroll(): void {
  if (scroller) {
    pendingRequest = false;
    runScrollSequence();
    return;
  }
  pendingRequest = true;
}

export function resetAsoDashboardScrollForTests(): void {
  pendingTimers.splice(0).forEach(clearTimeout);
  scroller = null;
  pendingRequest = false;
}

export function getAsoScrollStepsForTests(): typeof ASO_SCROLL_STEPS {
  return ASO_SCROLL_STEPS;
}
