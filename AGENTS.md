# AGENTS.md — 心晴MO

面向编码 Agent 的仓库指令（人类说明见 `README.md`）。与 [`.cursor/rules/karpathy-guidelines.mdc`](./.cursor/rules/karpathy-guidelines.mdc)（alwaysApply）叠加；冲突时取**更严**或**更贴近用户当次需求**者。

本地规划根：[`.planning/README.md`](./.planning/README.md)（**gitignore，不上传 GitHub**）。

---

## 必做 / 禁止

**必做**

1. 改代码前：澄清假设；有歧义先问；能简单则简单。
2. 功能 / 里程碑 / phase / 调试：先读并执行对应 **`gsd-*` skill**（`~/.claude/skills/gsd-*/SKILL.md`），勿手写平行流程。
3. 包管理只用 **Yarn**（`yarn.lock`）；对齐 CI 用 `yarn install --frozen-lockfile`。
4. 合并前验证：`yarn typecheck && yarn lint && yarn test`（触及 E2E 路径再跑对应 e2e）。
5. 本次改动产生的未使用 import / 死代码，同一 diff 删掉。
6. 最终回复写明：依据（GSD skill / 文档）、验证命令与结果、未验证项或剩余风险。

**禁止**

- 在 `master` 上直接开发或提交；未经用户明确要求不要 `git commit` / `push` / `--force`。
- 使用 npm / pnpm 安装依赖；提交 `.env`、真实密钥、`SUPABASE_SERVICE_ROLE_KEY` 进客户端。
- 新建仓库根 `openspec/` 或依赖已删除的 `docs/`；把规划正文提交进 GitHub（`.planning/` 本地）。
- 扩大范围「顺便重构」无关文件；为未要求的场景加抽象 / 配置 / 错误处理。
- 向 store 增加「只改 `isPlaying`、不驱动原生」的半截音频 API。
- 在 `services` 中 import `components` / `store`；在 `utils` 塞副作用业务（见 ESLint `boundaries`）。

---

## 命令（复制即用）

```bash
yarn install                 # 安装
yarn start                   # Metro / Expo
yarn ios | yarn android | yarn web

yarn typecheck               # tsc --noEmit
yarn lint                    # ESLint（含 boundaries）
yarn test                    # Jest 单测（排除 e2e/）
yarn verify:governance       # 治理；CI 仅 push master 必跑

yarn test:e2e                # Playwright · Expo Web（本地）
yarn test:maestro:preflight  # Maestro 环境诊断
yarn test:maestro            # 原生 E2E（需 CLI + 模拟器 + dev build）
```

**CI（Node 22）**：PR / push `master` → `typecheck` → `lint` → `test`；仅 push `master` 另跑 `verify:governance` + smoke。E2E **不进 CI**。

---

## GSD 流程

| 意图 | Skill |
| --- | --- |
| 进度 / 下一步 | `gsd-progress` |
| 新里程碑 | `gsd-new-milestone`（无规划时：`gsd-map-codebase` → `gsd-new-project`） |
| Phase | `gsd-discuss-phase` → `gsd-plan-phase` → `gsd-execute-phase` → `gsd-verify-work` → `gsd-ship` |
| 小改 / 极小改 | `gsd-quick` / `gsd-fast` |
| Bug | `gsd-debug` |
| 帮助 | `gsd-help` |

闭环：`/gsd-progress` → discuss → plan → execute → verify → ship。

工程事实（对照代码，优先读这些，勿在 AGENTS 双写长文）：

- `.planning/codebase/STACK.md` · `ARCHITECTURE.md` · `STRUCTURE.md` · `INTEGRATIONS.md`
- `.planning/codebase/CONVENTIONS.md` · `TESTING.md` · `CONCERNS.md`
- 领域补充：`.planning/domain/`（`data-models` / `state-management` / `services` / `ui-components`）
- 状态：`.planning/STATE.md` · `PROJECT.md` · `ROADMAP.md`

---

## 架构要点（易踩坑）

```text
app/           Expo Router 路由
components/    UI
features/      垂直功能（profile、recycleBin…）
store/         Zustand；modules/* 切片；入口 useAppStore.ts
services/      副作用编排（禁引 components/store）
shared/        纯领域逻辑（sync、audio、weather…）
utils/         纯工具（logger、aiService、errorHandler…）
lib/           supabase 客户端
types.ts       领域模型（MoodEntry 等）
```

- **数据**：离线优先；软删设 `deletedAt`；上云列 `deletedat`；拉云同 id **云端优先**。详见 `domain/state-management.md`。
- **音频**：播放单一实例 → `shared/audio/coordinator.ts` + store `pauseAudio` / `stopAudio`；录音片段 → `shared/audio/recordingCoordinator.ts`（`clipBinding` + `releaseRecordingClipHandler`）。见 `CONCERNS.md`。
- **日志**：新代码用 `utils/logger`；生产勿刷信息级日志。
- **分支**：`YYMMDD-(feat|fix|chore|refactor)-描述`；默认分支 `master`。

### 脆弱区（改前必读 CONCERNS + 相关单测）

- `store/useAppStore.ts` 同步与初始化
- `shared/audio/recordingCoordinator.ts` · `services/audioSync.ts`
- `utils/aiService.ts` · `lib/supabase.ts`

---

## 安全

- 密钥只放 `.env`（参考 `.env.example`）；客户端仅 `EXPO_PUBLIC_*`。
- 不上报日记正文 / 标签 / 音频内容；本仓库不接 Sentry。
- 分享卡默认不暴露日记全文；改分享路径时保持脱敏。
- 永久产品政策（无 Sentry / E2E 不进 CI / 云端优先合并 / 无根 `openspec/`）见 `.planning/codebase/CONCERNS.md` → Accepted Product Risks。

---

## 变更收尾

1. 跑通与改动匹配的验证命令；失败先修再结束。
2. 行为 / 公共 API 变更：同步更新本地 `.planning/codebase/` 或 `domain/`（及当前 phase VERIFICATION）。
3. Phase 收尾：对应 `gsd-verify-work` / `gsd-ship` / `gsd-complete-milestone`，并更新本地 `STATE.md`。
