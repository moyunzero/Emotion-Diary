# 🧹 代码清理执行 PR

## 📋 清理概述

本 PR 执行了自动化代码清理，移除了未使用的代码、依赖和资源文件。

**清理工具版本**: `scripts/cleanup/index.ts`  
**执行时间**: [填写执行时间]  
**清理范围**: [简要描述清理的内容，如：移除未使用的组件、清理废弃依赖等]

---

## ✅ 执行前检查清单

在执行清理之前，请确认以下事项：

- [ ] 已阅读清理工具使用文档 ([docs/cleanup-tool-usage.md](../../docs/cleanup-tool-usage.md))
- [ ] 已执行 dry-run 模式预览清理内容
- [ ] 已备份当前代码（或确认 Git 历史可回滚）
- [ ] 已通知团队成员即将执行清理
- [ ] 当前分支基于最新的 master 分支

---

## 🔍 执行检查清单

清理执行过程中需要验证的事项：

- [ ] Dry-run 报告已生成并审查
- [ ] 手动审查报告已完成 ([docs/cleanup-manual-review.md](../../docs/cleanup-manual-review.md))
- [ ] 清理摘要已生成 ([docs/cleanup-summary-2026.md](../../docs/cleanup-summary-2026.md))
- [ ] 所有清理操作已记录在日志中
- [ ] 没有误删关键文件或依赖

---

## ✨ 执行后验证清单

清理完成后，请验证以下内容：

- [ ] CI 流程全部通过 (`typecheck` + `lint` + `test:ci`)
- [ ] CI 日志已保存 ([docs/cleanup-ci-log.txt](../../docs/cleanup-ci-log.txt))
- [ ] 测试覆盖率仍然 ≥ 80%
- [ ] Bundle 大小已验证（未显著增加）
- [ ] 应用在 iOS 模拟器上正常运行
- [ ] 应用在 Android 模拟器上正常运行
- [ ] 核心功能手动测试通过：
  - [ ] 创建情绪日记
  - [ ] 查看日记列表
  - [ ] AI 分析功能
  - [ ] 数据导出功能
  - [ ] 云端同步功能

---

## 📊 清理报告

### 清理统计

| 类型 | 数量 |
|------|------|
| 移除的文件 | [数量] |
| 移除的依赖 | [数量] |
| 清理的代码行数 | [数量] |
| Bundle 大小变化 | [变化量] |

### 详细报告链接

- 📄 [清理摘要报告](../../docs/cleanup-summary-2026.md)
- 📝 [手动审查报告](../../docs/cleanup-manual-review.md)
- 🔧 [CI 执行日志](../../docs/cleanup-ci-log.txt)
- 📖 [清理工具使用文档](../../docs/cleanup-tool-usage.md)

---

## 🔄 回滚指南

如果清理后发现问题，可以按以下步骤回滚：

### 方法 1: Git 回滚（推荐）

```bash
# 回滚到清理前的提交
git revert <this-pr-merge-commit>

# 或者硬回滚（谨慎使用）
git reset --hard <commit-before-cleanup>
git push --force-with-lease
```

### 方法 2: 从备份恢复

如果执行前创建了备份：

```bash
# 恢复特定文件
git checkout <backup-branch> -- <file-path>

# 或恢复整个目录
git checkout <backup-branch> -- <directory-path>
```

### 方法 3: 手动恢复

1. 查看本 PR 的 "Files changed" 标签
2. 找到被误删的文件
3. 从 Git 历史中恢复：`git checkout HEAD~1 -- <file-path>`

---

## 📝 额外说明

### 已知影响

[描述清理可能带来的已知影响，如：某些未使用的工具函数被移除，如需使用请重新添加]

### 需要关注的变更

[列出需要特别关注的变更，如：移除了某个依赖，如果其他分支使用了该依赖需要注意]

### 后续工作

[如果有后续需要跟进的工作，在此列出]

---

## 🎯 审查要点

请审查者重点关注：

1. **误删检查**: 确认没有误删正在使用的代码
2. **依赖完整性**: 确认移除的依赖确实未被使用
3. **测试覆盖**: 确认测试仍然充分覆盖核心功能
4. **性能影响**: 确认 Bundle 大小和运行性能未受负面影响

---

**温馨提示**: 本次清理旨在保持代码库的整洁和可维护性，让心晴MO更好地陪伴用户记录情绪、管理心情 💙
