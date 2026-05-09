/**
 * pendingSyncQueue.test.ts
 * 验证待处理同步队列（pending sync queue）的防抖与合并行为：
 * - 多次快速触发只执行一次同步
 * - 防抖延迟期间的新请求被合并
 * - 队列在执行后被清空
 */

// ── 轻量防抖同步队列（与 useAppStore 中的 processPendingSync 逻辑等价） ─────────
class PendingSyncQueue {
  private pending = false;
  private syncing = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  readonly executionLog: string[] = [];

  /** 标记有待处理的同步请求 */
  enqueue(): void {
    this.pending = true;
  }

  /** 处理待处理请求（带防抖，delay ms） */
  processPending(delay: number, onSync: () => Promise<void>): void {
    if (!this.pending || this.syncing) return;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(async () => {
      if (this.pending && !this.syncing) {
        this.pending = false;
        this.syncing = true;
        try {
          await onSync();
          this.executionLog.push('sync-executed');
        } finally {
          this.syncing = false;
          this.timer = null;
        }
      }
    }, delay);
  }

  get hasPending(): boolean {
    return this.pending;
  }

  get isSyncing(): boolean {
    return this.syncing;
  }

  /** 清理定时器（测试用） */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('PendingSyncQueue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with no pending requests', () => {
    const q = new PendingSyncQueue();
    expect(q.hasPending).toBe(false);
  });

  it('marks pending after enqueue', () => {
    const q = new PendingSyncQueue();
    q.enqueue();
    expect(q.hasPending).toBe(true);
  });

  it('executes sync once after debounce delay', async () => {
    const q = new PendingSyncQueue();
    const syncFn = jest.fn(async () => {});

    q.enqueue();
    q.processPending(300, syncFn);

    expect(syncFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    // Allow microtasks to flush
    await Promise.resolve();

    expect(syncFn).toHaveBeenCalledTimes(1);
    expect(q.executionLog).toContain('sync-executed');
  });

  it('debounces multiple rapid enqueues into a single execution', async () => {
    const q = new PendingSyncQueue();
    const syncFn = jest.fn(async () => {});

    // Rapid-fire three enqueues
    q.enqueue();
    q.processPending(300, syncFn);
    jest.advanceTimersByTime(100);

    q.enqueue();
    q.processPending(300, syncFn);
    jest.advanceTimersByTime(100);

    q.enqueue();
    q.processPending(300, syncFn);

    // Advance past the final debounce window
    jest.advanceTimersByTime(300);
    await Promise.resolve();

    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('clears pending flag after execution', async () => {
    const q = new PendingSyncQueue();
    q.enqueue();
    q.processPending(100, async () => {});

    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(q.hasPending).toBe(false);
  });

  it('does not execute when there is no pending request', async () => {
    const q = new PendingSyncQueue();
    const syncFn = jest.fn(async () => {});

    // processPending without enqueue
    q.processPending(100, syncFn);
    jest.advanceTimersByTime(200);
    await Promise.resolve();

    expect(syncFn).not.toHaveBeenCalled();
  });

  it('does not execute when already syncing', async () => {
    const q = new PendingSyncQueue();
    // Manually set syncing state via a long-running sync
    let resolveSync!: () => void;
    const longSync = new Promise<void>((res) => {
      resolveSync = res;
    });

    q.enqueue();
    // Start first processPending
    q.processPending(0, async () => {
      await longSync;
    });
    jest.advanceTimersByTime(0);
    await Promise.resolve(); // let the timer fire and set syncing=true

    // Enqueue again while syncing
    q.enqueue();
    const syncFn2 = jest.fn(async () => {});
    q.processPending(0, syncFn2);
    jest.advanceTimersByTime(0);
    await Promise.resolve();

    // syncFn2 should not have been called because isSyncing is true
    expect(syncFn2).not.toHaveBeenCalled();

    resolveSync();
  });
});
