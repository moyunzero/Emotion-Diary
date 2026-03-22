# Quick 260322-kqp: 同步 temp-ag-skills → 全局 Cursor skills

## Tasks

### Task 1 — rsync 技能目录到 `~/.cursor/skills`

- **files:** `~/.cursor/skills/*`（合并写入）
- **action:** 将 `temp-ag-skills/skills/` 下各 skill 目录同步到用户全局 `~/.cursor/skills/`，与现有 `gsd-*` / `nuxt` 等并存；已校验与当前全局目录名 **0 冲突**。
- **verify:** `ls ~/.cursor/skills | wc -l` 显著增加；随机 `test -f ~/.cursor/skills/<name>/SKILL.md`。
- **done:** [x]

### Task 2 — 同步 `docs` 子目录（可选但推荐）

- **files:** `~/.cursor/skills/docs/`
- **action:** rsync `temp-ag-skills/docs/` → `~/.cursor/skills/docs/` 便于本地查阅 bundles / usage。
- **verify:** `test -d ~/.cursor/skills/docs/users`
- **done:** [x]

### Task 3 — GSD 可调用性说明（无代码变更）

- **files:** 本 SUMMARY
- **action:** 记录：Cursor 会从 `~/.cursor/skills` 加载用户级 skills；GSD 子流程文档中的「读 `.cursor/skills`」指**仓库内**路径，全局 skills 仍由 Cursor 注入 `agent_skills`，与本项目并行可用。
- **verify:** 文档自洽
- **done:** [x]
