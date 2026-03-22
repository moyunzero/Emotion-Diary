# Quick 260322-kqp — Summary

## 做了什么

1. **分析 `temp-ag-skills`**：Antigravity Awesome Skills 仓库结构为 `skills/<name>/SKILL.md`（约 1297 个技能包），与官方 `npx antigravity-awesome-skills --cursor` 目标布局一致（`~/.cursor/skills/<name>/`）。
2. **冲突检查**：`temp-ag-skills/skills` 与当时 `~/.cursor/skills` 下已有目录名 **无交集**，可安全合并，不会覆盖现有 `gsd-*`、`nuxt`、`vue` 等。
3. **同步命令**：
   - `rsync -a temp-ag-skills/skills/ ~/.cursor/skills/`
   - `rsync -a temp-ag-skills/docs/ ~/.cursor/skills/docs/`
4. **结果**：`~/.cursor/skills` 下列表约 **1361** 项（含 `docs/` 等）；抽样 `gsd-quick`、`bug-hunter`、`docs/users` 均存在。

## GSD 与其它项目如何「调用」

- **Cursor**：用户级技能目录为 `~/.cursor/skills`，所有打开的工作区都会看到这些 skills（与是否在本仓库无关）。
- **GSD**：编排文档里写的「读 `.cursor/skills`」指**当前仓库**下的项目技能；**用户全局** `~/.cursor/skills` 由 Cursor 在会话中注入（与你在本对话里看到的 `agent_skill` 列表一致），GSD 规划/执行类子代理在同一 IDE 会话内同样可用。
- **后续更新本地副本**：在 `temp-ag-skills` 更新后重复上述 rsync，或继续用官方 `npx antigravity-awesome-skills --cursor`（会从 GitHub 克隆再写入；若要以本地 fork 为准，请用 rsync 或 `--path` 指向自定义目录）。

## 未纳入版本库

`~/.cursor/skills` 位于用户主目录，**未**提交进 Emotion-Diary；本 quick 仅提交 `.planning` 内记录。
