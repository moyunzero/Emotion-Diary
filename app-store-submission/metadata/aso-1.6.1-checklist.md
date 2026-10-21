# ASO 执行清单 · 心晴MO（1.6.1 历史 · 已完成）

> **状态（2026-10-21）**：商店现网已为 **1.7.0**。本文件保留为 1.6.1 ASO / 截图执行档案，勿再按此升版。  
> **当前元数据**：`app-description-*.md` · `whats-new-1.7.0-*.md` · `product-narrative-1.7.0.md`  
> **现网**：https://apps.apple.com/cn/app/心晴mo/id6759703686  
> **Bundle**：`com.moyunzero.emotiondiary` · 当时代码版本 `1.6.1`（功能基线 1.6.0）

---

## 总览：两阶段

| 阶段 | 做什么 | 要不要新包 | 要不要审核 | 预计耗时 |
| --- | --- | --- | --- | --- |
| **A · 今天** | 只改正文上方的「推广文本」 | 否 | 否 | 5 分钟 |
| **B · 本周** | 新截图 + `1.6.1` 元数据发版 | 要（同代码只升版本号） | 要 | 0.5–1 天准备 + 审核 |

---

## 阶段 A：立刻改「推广文本」（无需新包）

### 步骤

1. 打开 [App Store Connect](https://appstoreconnect.apple.com) → **我的 App** → **心晴MO**
2. 左侧 **分发** → **App Store** → 选中**当前已上架版本**（1.6.0）或 **App 信息**里各本地化
3. 找到本地化：**简体中文** / **English (U.S.)**
4. 编辑 **推广文本（Promotional Text）** → 粘贴下方文案 → **存储**
5. 几小时内商店页描述顶部会更新（无需点「提交以供审核」）

### 可复制 · 推广文本（简体中文 · ≤170 字）

```
本地优先的情绪日记：用天气读懂心情，用花园看见关系。关系时间线·往年今日·主屏小组件——温柔记录，隐私安心。
```

### 可复制 · 推广文本（English · ≤170）

```
Offline-first mood journal: weather for feelings, a garden for relationships. Timeline, On This Day, home widget—private by default.
```

---

## 阶段 B：`1.6.1` 商店页更新（同代码，只升版本）

### B0b · 预览视频（可选 · 模拟器自动录）

```bash
# 一次性：sudo xcodebuild -license accept
# 必须先能进 App 首页：yarn start && yarn ios（需本机有 Simulator.app）

yarn aso:preview:ensure   # 装包 + 嵌入框架 + UI 自检
yarn aso:preview          # 录屏 + Maestro + 压成 20s

# 或一步：ENSURE_APP=1 yarn aso:preview
# 产出：app-store-submission/previews/moodmo-preview-20s.mp4
```

流程：`.maestro/flows/aso-preview.yaml` · 脚本会拒绝「录到桌面」的空 UI。

### B0 · 准备截图（先做再开版本）

**设备**：iPhone 6.7"（1290×2796）必传；有 iPad 再补 12.9"。

**建议顺序（与商店第一屏转化直接相关）**：

| # | 画面 | 截图上叠加大字（可直接用） |
| --- | --- | --- |
| 1 | 心灵花园总览 | 把情绪，种成一座花园 |
| 2 | 记一笔 | 几秒，记下此刻心情 |
| 3 | 关系时间线（花盆详情） | 点开花盆，回看与 TA |
| 4 | 往年今日 | 同一天，不同年的自己 |
| 5 | Soft Stack 小组件 | 主屏一眼看见心晴（不含日记正文） |

**拍摄注意**：

- 用演示数据，勿露真实隐私；人物可用「朋友」「同事」
- 小组件截图勿显示日记正文
- 可用 Figma / 截图工具加标题；第一张决定搜索结果点击

**模拟器快捷方式**（可选）：

```bash
# 启动模拟器后
xcrun simctl io booted screenshot ~/Desktop/moodmo-shot.png
```

### B1 · 升版本号并出包（功能零改动）

仓库当前 `app.json` → `"version": "1.6.0"`。改为 `1.6.1` 后按你们惯用方式出生产包，例如：

```bash
# 1) 改 app.json version → 1.6.1（ios.buildNumber 若手动维护则 +1；EAS production 为 autoIncrement）
# 2) 出 iOS 商店包
yarn eas build --platform ios --profile production
# 3) 提交到 App Store Connect（或在网页选刚上传的 build）
yarn eas submit --platform ios --latest
```

> 若你本地用 Xcode Archive：同样只改 Marketing Version = 1.6.1，Build 递增，**不要改业务代码**。

### B2 · App Store Connect 填元数据

1. **我的 App** → 心晴MO → 左上 **iOS App** 旁 **+ 版本** → 输入 `1.6.1`
2. **构建版本**：选刚上传的 `1.6.1` build（处理完再选，通常要等几十分钟）
3. 打开 **简体中文** 本地化，逐项粘贴下方文案
4. 打开 **English (U.S.)**，粘贴英文文案
5. **预览与截图**：删除旧图，按上表 1→5 上传新图（6.7" 优先）
6. （可选）上传 15–30 秒预览视频：记一笔 → 花园 → 小组件
7. **此版本的新增内容**：粘贴下方 What’s New
8. 检查 **支持 URL / 隐私政策 URL**
9. 右上 **添加以供审核** → 提交

### B3 · 审核通过后

- 版本发布方式选 **手动发布** 或自动均可；建议先自己点开商店页核对截图顺序
- 回去再看 **App 分析 → 用户获取**：关注「展示→产品页→下载」转化是否回升

---

## 可复制文案 · 简体中文（1.6.1）

### 名称（勿改）

```
心晴MO
```

### 副标题（≤30 字）· 替换现网泛副标题

```
情绪日记与心灵花园
```

### 关键词（≤100 **字节**；逗号后无空格）

```
情绪,日记,心情,心理健康,情绪记录,治愈,自我关怀,正念,关系,往年今日
```

> 已接近 100 字节上限，勿再堆词。勿重复 App 名「心晴MO」。

### 描述

```
心晴MO 把情绪变成一座可照料的心灵花园：用天气读懂感受，用花盆看见关系，用回看留下成长轨迹。

几分钟记下一刻；按周或按月回顾；点开花盆，遇见与 TA 的点滴——以及往年同一天写下的自己。

【你会用到】
• 情绪气象站与温暖记录：强度、人物/触发标签、语音、草稿自动保存
• 心灵花园：本周天气、治愈进度、关系花盆、触发洞察与园艺建议
• 关系时间线与往年今日：按人回看；同一天、不同年温柔相遇
• 周/月回顾图：保存到系统相册（应用内不内置第三方分享）
• 气话焚烧：释放动画 + 释放档案
• Soft Stack 主屏小组件：脱敏展示花园天气（不含日记正文）；登出/删号后清空
• 可选 AI（自备 Groq Key）：预测、播客、处方与回顾结语；无 Key 时本地兜底
• 本地优先，可按需云同步；中英文界面

心晴MO 仅辅助自我观察，不构成医疗建议，也不能替代专业咨询。如有严重困扰，请寻求专业帮助。
```

### 此版本的新增内容（1.6.1 · 商店页优化，勿虚构功能）

```
本次更新优化了 App Store 展示与说明，帮助你更快了解心晴MO：

• 更新截图与介绍，突出心灵花园、关系回看与隐私本地优先
• 体验与稳定性持续打磨

感谢陪伴。愿你的心灵花园继续生长。
```

### 支持 URL（建议后续换成独立支持页；暂可沿用）

```
https://github.com/moyunzero/Emotion-Diary/issues
```

### 隐私政策 URL

```
https://github.com/moyunzero/Emotion-Diary/blob/master/PRIVACY.md
```

---

## 可复制文案 · English (U.S.)

### Subtitle

```
Mood journal & mind garden
```

### Keywords

```
mood,diary,journal,emotion,mental health,wellness,self care,mindfulness,relationships,memories
```

### Description

```
MoodMO (心晴MO) turns feelings into a Mind Garden you can tend: weather to read emotion, pots to see relationships, and reviews to keep your growth in view.

Log a moment in minutes. Look back by week or month. Open a pot to revisit someone—and meet yourself on this day in years past.

WHAT YOU GET
• Emotion Weather Station & warm logging: intensity, people/trigger tags, voice notes, auto-saved drafts
• Mind Garden: weekly weather, healing progress, relationship pots, trigger insights & gardening tips
• Relationship Timeline & On This Day: revisit by person; same day, different years
• Weekly/monthly review images saved to Photos (no built-in third-party sharing)
• Vent & Release: calming burn + release archive
• Soft Stack home widget: garden weather at a glance (no diary body); clears on sign-out or account deletion
• Optional AI (your own Groq key): forecasts, podcasts, prescriptions, review closing line—with on-device fallbacks
• Offline-first, optional cloud sync; English & Simplified Chinese

MoodMO supports self-observation only. It is not medical advice and does not replace professional care. If you are in crisis, please seek qualified help.
```

### What’s New (1.6.1)

```
This update refreshes the App Store presentation so it’s easier to see what MoodMO offers:

• Updated screenshots and copy highlighting Mind Garden, relationship recall, and privacy-first design
• Ongoing polish and stability improvements

Thank you for growing with us.
```

---

## 提交前自检

- [ ] 推广文本已先改上（阶段 A）
- [ ] 副标题已改为「情绪日记与心灵花园」（非泛「心情记录-情绪管理」）
- [ ] 6.7" 截图 ≥5 张，**第 1 张是花园卖点**
- [ ] 截图无真实隐私、无未上线功能
- [ ] 中英关键词未超 100 字节、未含竞品名
- [ ] What’s New 未声称未做功能
- [ ] 构建版本号与 `1.6.1` 一致且处理完成可选
- [ ] 审核备注可写：`Metadata/screenshots only; no functional changes.`

---

## 审核通过后的评分冷启动（合规）

- 勿买量刷评；可请真实使用过的朋友在 App 内「写下评价」
- 目标先到 **10–20 条真实评分**，对转化帮助通常大于再改一版文案
