# App Store 1.8.0 提审清单

> 与 `app.json` / `package.json` = **1.8.0** 对齐。构建号由 EAS production `autoIncrement` 管理。

## 1. 版本与构建

- [ ] `app.json` · `package.json` 为 `1.8.0`
- [ ] EAS production 构建成功；TestFlight / 提交用构建号已写入 ASC
- [ ] 真机冒烟：粉纸日间、粉墨深色、「听这一刻」、分段切换、合并确认（若登录）

## 2. App Store Connect 文案

| 字段 | 来源 |
| --- | --- |
| 此版本的新增内容（中） | [`whats-new-1.8.0-zh.md`](./whats-new-1.8.0-zh.md) |
| What’s New（英） | [`whats-new-1.8.0-en.md`](./whats-new-1.8.0-en.md) |
| 描述 / 推广 / 关键词 | [`app-description-zh.md`](./app-description-zh.md) · [`app-description-en.md`](./app-description-en.md) |
| 叙事备稿 | [`product-narrative-1.8.0.md`](./product-narrative-1.8.0.md) |

- [ ] 中英文「此版本的新增内容」已粘贴  
- [ ] 推广文本已更新（可随时改，不必随构建）  
- [ ] 描述已含粉纸 / 粉墨 / 听这一刻 / 可信文案要点  

## 3. 截图与预览（建议）

1. 首页粉纸 +「听这一刻」  
2. 心灵花园  
3. 关系时间线或往年今日  
4. Soft Stack 小组件  
5. （可选）粉墨深色一帧  

预览视频：`yarn aso:preview`（见既有 ASO 流程）。

## 4. 审核备注（可选）

见 `app-description-en.md` → App Review notes（含外观 / 麦克风 / 通知 / AI）。

## 5. 提交后

- [ ] ASC 状态跟踪；通过后更新 README 版本历史「待提审」→ 上架日期  
- [ ] 可选打 Git tag `v1.8.0`（若与商店构建一致且尚未打）  
