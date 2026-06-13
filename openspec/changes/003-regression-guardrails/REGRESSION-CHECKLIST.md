# 手工回归清单（003 · 脆弱区）

> **用途**：无第三方监控阶段，004–009 及任何触及同步/音频/store 的 PR 合并前，优先执行与本 diff 相关的条目。  
> **记录方式**：在任务 `VERIFICATION.md` 中写「已测 / 未测 + 原因」。

## 同步与数据（`useAppStore` · `syncFromCloud` / `syncToCloud`）

| # | 场景 | 步骤 | 预期 |
|---|------|------|------|
| S1 | 本地独有 id | 仅本地有条目 A；云端无 A；拉云 | A 仍在本地 |
| S2 | 同 id 云覆盖 | 本地软删条 B（`deletedAt`）；云端 B 无软删；拉云 | B 恢复为云端形态（无软删） |
| S3 | 同 id 云覆盖内容 | 同 id 本地与云端 `content` 不同；拉云 | 以云端为准 |
| S4 | 墓碑 | 条目在 `entry_tombstones`；拉云 | 该 id 不出现在合并结果 |
| S5 | 推云软删列 | 软删条 syncToCloud | 云端 `deletedat` 有值；墓碑表 **无** 新行 |
| S6 | 登出再登录 | 游客记 2 条 → 登录合并 | 游客数据并入用户键；无丢条 |
| S7 | recover ≡ sync | 设置内「从云端恢复」与拉云 | 与 S2/S3 语义一致（同实现） |

## 软删与可见性

| # | 场景 | 步骤 | 预期 | 自动化 |
|---|------|------|------|--------|
| V1 | 主列表 | 删除一条 | 主列表不显示；`entries` 内仍有 id | Maestro `recycle-bin-restore` / `recycle-bin-purge`（`.maestro/flows/`） |
| V2 | 天气/洞察 | 软删后 | 不计入默认统计（与 V1 一致） | 单测 `visibility` / `dashboardFilter` |

## 录音协调（`recordingCoordinator` · §2.3）

| # | 场景 | 步骤 | 预期 |
|---|------|------|------|
| R1 | 编辑后记一笔 | 打开编辑弹层录音 → 关闭编辑 → 记一笔 Tab 长按录音 | 片段写入当前表单 |
| R2 | Tab 失焦 | 记一笔录音中切 Tab | 录音取消或按产品设计停止（不卡 `preparing`） |
| R3 | 双挂载 | 编辑可见时记一笔 Tab 未聚焦 | 仅 active 方接收 clip（`clipBinding`） |

## 音频同步（`audioSync` · 006 前基线）

| # | 场景 | 步骤 | 预期 |
|---|------|------|------|
| A1 | pending 上传 | 联网 syncToCloud | pending 音频有 remoteUrl 回写或可见失败 |
| A2 | 跨设备 | 另一设备拉云 | 无 localUri 时可降级 remoteUrl 播放 |

## 平台

- **必测**：S1–S3、R1 — iOS 或 Android 真机/模拟器至少一端。  
- **Web**：S 系列若 Supabase 已配置可测；R 系列以 App 为主。
