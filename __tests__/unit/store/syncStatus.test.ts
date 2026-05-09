/**
 * syncStatus.test.ts
 * 验证同步状态（syncStatus）的状态机行为：
 * - idle → syncing → idle（成功路径）
 * - idle → syncing → error（失败路径）
 * - 并发请求时标记为 pending
 *
 * 使用轻量状态机模拟，不依赖 Supabase 或 React Native。
 */

type SyncStatus = 'idle' | 'syncing' | 'pending' | 'error';

// ── 轻量同步状态机（与 useAppStore 中的逻辑等价） ──────────────────────────────
class SyncStateMachine {
  status: SyncStatus = 'idle';
  private isSyncing = false;
  private hasPending = false;

  async sync(
    work: () => Promise<boolean>,
  ): Promise<boolean> {
    if (this.isSyncing) {
      this.hasPending = true;
      this.status = 'pending';
      return false;
    }

    this.isSyncing = true;
    this.status = 'syncing';

    try {
      const ok = await work();
      this.status = 'idle';
      return ok;
    } catch {
      this.status = 'error';
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  get pendingFlagSet(): boolean {
    return this.hasPending;
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('SyncStatus state machine', () => {
  let machine: SyncStateMachine;

  beforeEach(() => {
    machine = new SyncStateMachine();
  });

  it('starts in idle state', () => {
    expect(machine.status).toBe('idle');
  });

  it('transitions idle → syncing → idle on success', async () => {
    const statuses: SyncStatus[] = [];

    const promise = machine.sync(async () => {
      statuses.push(machine.status); // captured while syncing
      return true;
    });

    await promise;
    statuses.push(machine.status); // captured after completion

    expect(statuses).toEqual(['syncing', 'idle']);
  });

  it('transitions idle → syncing → error on failure', async () => {
    await machine.sync(async () => {
      throw new Error('network error');
    });

    expect(machine.status).toBe('error');
  });

  it('marks status as pending when a second sync is requested while one is in progress', async () => {
    let resolveFirst!: (v: boolean) => void;
    const firstWork = new Promise<boolean>((res) => {
      resolveFirst = res;
    });

    // Start first sync (does not await yet)
    const first = machine.sync(() => firstWork);

    // Second sync arrives while first is in progress
    const second = machine.sync(async () => true);

    expect(machine.status).toBe('pending');
    expect(machine.pendingFlagSet).toBe(true);

    // Resolve first sync
    resolveFirst(true);
    await first;
    await second;
  });

  it('returns false immediately for the concurrent request', async () => {
    let resolveFirst!: (v: boolean) => void;
    const firstWork = new Promise<boolean>((res) => {
      resolveFirst = res;
    });

    const first = machine.sync(() => firstWork);
    const secondResult = await machine.sync(async () => true);

    expect(secondResult).toBe(false);

    resolveFirst(true);
    await first;
  });

  it('returns true when sync work resolves to true', async () => {
    const result = await machine.sync(async () => true);
    expect(result).toBe(true);
  });

  it('returns false when sync work throws', async () => {
    const result = await machine.sync(async () => {
      throw new Error('fail');
    });
    expect(result).toBe(false);
  });
});
