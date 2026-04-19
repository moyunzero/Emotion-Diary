# 音频同步修复实施计划

## 问题描述

当用户记录包含录音并同步到云端后，再同步到本地时，录音数据丢失。

**根本原因**：`entriesToSync` 构建时没有包含 `audios` 字段，导致云端 `entries` 表中未存储音频元数据。

## 任务列表

- [ ] 1. 修复 `entriesToSync` 构建，添加 `audios` 字段
  - 在 `entriesToSync` 的 map 中添加 `audios: entry.audios || []`
  - 引用：design.md §5.2 云端同步

- [ ] 2. 修复回退逻辑中的 update 操作，添加 `audios` 字段
  - 第 326-347 行的 update 调用需要包含 `audios` 字段
  - 引用：design.md §5.2 上传流程

- [ ] 3. 确保从云端同步时正确恢复 audios 数据
  - 检查 `syncFromCloud` 中的数据转换逻辑是否正确处理 `audios` 字段
  - 引用：design.md §5.2 下载流程

- [ ] 4. 检查点 - 验证代码逻辑完整性
  - 确保所有涉及 entries 同步的地方都正确处理 audios

- [ ]* 5. 编写集成测试验证修复
  - 验证音频数据能正确同步到云端并恢复
