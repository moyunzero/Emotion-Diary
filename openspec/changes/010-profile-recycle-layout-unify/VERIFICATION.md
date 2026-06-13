# VERIFICATION：010-profile-recycle-layout-unify

## 自动检查

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | 通过 |
| ESLint | `yarn lint` | 通过 |
| 单元测试 | `yarn test` | 通过（169 tests，2026-06 复验） |
| Playwright E2E | `yarn test:e2e` | 通过（回收站 Web 主路径） |
| Maestro E2E | `yarn test:maestro` | 通过（restore + purge） |

## Profile

- [x] 「数据与安全」「留存与提醒」分组圆角、阴影、水平边距一致
- [x] 「最后同步」与 menu 同宽，位于白卡片内首行
- [x] section 说明为 xs footnote，非分组上方大段正文

## 回收站

- [x] 标题下 footnote，列表在其下
- [x] 卡片为 shadow 白卡（非细边框 pill 按钮样式）
- [x] 「恢复」品牌色；「永久删除」destructive 红字
- [x] 空状态正常

## 手工

- [x] Profile → 回收站 → 恢复 → 主列表可见 — Playwright + Maestro `recycle-bin-restore`
- [x] Profile → 回收站 → 永久删除 → 条目消失 — Playwright + Maestro `recycle-bin-purge`
- [ ] 模拟器视觉与 Profile 分组无割裂感 — 未正式走查
