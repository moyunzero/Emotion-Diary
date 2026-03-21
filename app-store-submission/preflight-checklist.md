# 焚语提审前预检清单（Apple Submission Readiness）

> 适用范围：仅用于 Apple 提审准备，不包含新功能开发、PDF 导出或跨商店事项。

## 1) 元数据一致性（Metadata Consistency）

- [ ] **主叙事一致：记录情绪 + 回顾导出**
  - 核对方式：逐行对照 `metadata/app-description-zh.md` 与 `metadata/app-description-en.md` 首段与 Core Value，确认都以情绪记录和回顾导出为第一卖点。
- [ ] **导出边界说明一致：保存到相册、应用内不内置第三方分享**
  - 核对方式：检查 `metadata/app-description-zh.md` 与 `metadata/app-description-en.md` 的隐私/边界段落，确认包含相同边界表述。
- [ ] **AI 弱化且有失败兜底，不含医疗承诺**
  - 核对方式：检查中英文描述中的 AI 段仅为次级描述；确认无 medical/therapy/diagnosis、治疗、诊断等承诺表述。
- [ ] **品牌统一为 焚语 / Fenyu**
  - 核对方式：检查描述文案、截图标题建议、审核回复模板中的品牌命名是否统一，无其他临时名或泛化名称。
- [ ] **截图真实性与顺序可追溯**
  - 核对方式：根据 `metadata/screenshot-guide.md`，确认 1→5 顺序为“记录 -> 回顾 -> 导出到相册 -> 隐私提醒 -> 差异化闭环”，且禁止项含 placeholder/测试数据。

## 2) 功能演示路径（Core Flow Demonstrability）

- [ ] **“气话焚烧 -> 情绪释放档案”可完整演示**
  - 核对方式：按 `review-response-4.3a.md` 的 Verification paths 第 1 条逐步走通，确保路径文案与实际页面一致。
- [ ] **“触发器洞察 -> 行动闭环”可完整演示**
  - 核对方式：按 `review-response-4.3a.md` 的 Verification paths 第 2 条逐步走通，确保可复现且命名一致。
- [ ] **导出相关表述与截图可互证**
  - 核对方式：从 `metadata/app-description-zh.md`/`en.md` 中定位“review/export/save to Photos（相册）”语句，并在截图指南第 3、4 张找到对应视觉证据点。

## 3) 审核沟通准备（Review Communication Readiness）

- [ ] **4.3(a) 回复模板已更新到当前版本改动**
  - 核对方式：检查 `review-response-4.3a.md` 的 Changes in this build 是否覆盖品牌统一、模板痕迹清理、核心差异化流程。
- [ ] **回复模板包含可复现实测路径**
  - 核对方式：检查 `review-response-4.3a.md` 是否存在 Verification paths，且与本清单“功能演示路径”两项一致。
- [ ] **审核回复语气保守、无夸大**
  - 核对方式：通读模板，确认使用事实描述，不出现营销夸张词、不出现医疗承诺或 AI 过度承诺。

## 最小可过审包（Final Gate）

- [ ] **中英文描述、截图指南、4.3(a) 模板三者完成交叉核对**
  - 核对方式：以本清单为唯一入口逐项勾选；若任一项无法在对应文件中定位证据，则本轮不提审。
