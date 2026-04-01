# 贡献指南 (Contributing Guide)

感谢你对 **心晴MO**（仓库名 Emotion-Diary）项目感兴趣！我们非常欢迎各种形式的贡献，包括但不限于提交代码、报告 Bug、完善文档、提出新功能建议等。

## 🤝 如何参与贡献

### 1. 报告 Bug 或提出新功能

如果你发现了 Bug 或者有新的想法，请在 GitHub Issues 中提出：

- **Bug 报告**：请详细描述 Bug 的复现步骤、预期行为和实际行为，并提供相关的截图或日志。
- **功能建议**：请描述你想要的功能，以及它能解决什么问题。

### 2. 提交代码 (Pull Requests)

我们遵循标准的 GitHub Fork & Pull Request 流程：

1. **Fork** 本仓库到你的 GitHub 账号。
2. **Clone** 你的 Fork 到本地：
   ```bash
   git clone https://github.com/your-username/Emotion-Diary.git
   cd Emotion-Diary
   ```
3. **创建新分支**：
   ```bash
   git checkout -b feature/my-new-feature
   # 或者
   git checkout -b fix/bug-fix
   ```
4. **进行开发**：
   - 请确保代码风格与现有代码保持一致。
   - 遵循项目的 OpenSpec 规范（详见 `openspec/` 目录）。
   - 提交前请依次运行（与 CI 一致）：
     ```bash
     yarn typecheck
     yarn lint
     yarn test:ci
     ```
   - 本地安装请使用 **Yarn** 与仓库中的 `yarn.lock`；CI 使用 `yarn install --frozen-lockfile`。

## 测试布局与 CI

- CI 与本地推荐使用 `` `yarn test:ci` ``（与 `jest.ci.config.js` 一致的最小集）。
- 单测目录结构、与源码目录的责任边界详见 [__tests__/README.md](./__tests__/README.md)。
5. **提交更改**：
   ```bash
   git commit -m "feat: 添加了XXX功能"
   # 或者
   git commit -m "fix: 修复了XXX问题"
   ```
   推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。
6. **推送到远程仓库**：
   ```bash
   git push origin feature/my-new-feature
   ```
7. **提交 Pull Request**：
   - 在 GitHub 上提交 PR 到 **`master` 分支**。
   - 详细描述你的更改内容。
   - 如果修复了 Issue，请在描述中关联（如 `Closes #123`）。

## 🛠 开发环境搭建

请参考 [README.md](./README.md) 开头的「开发者快速上手」与「快速开始」章节。

## 路由与 app 目录（Expo Router）

文件式路由、`(tabs)` 分组及与 `components` / `features` 的分工说明见：[.planning/codebase/EXPO-ROUTER.md](./.planning/codebase/EXPO-ROUTER.md)。

## UI 与设计原则

全产品界面气质、隐喻、反模式与抽检约定（非「通用 AI 应用」模版感）见：[.planning/phases/14-ui/14-UI-SPEC.md](./.planning/phases/14-ui/14-UI-SPEC.md)。

## 页面壳与滚动（Phase 15）

- **栈式二级页**（返回 + 标题）：优先使用 `AppScreenShell` + `StackScreenHeader`（见 `components/AppScreenShell.tsx`、`components/StackScreenHeader.tsx`）。顶栏尺寸与默认色来自 `styles/screenHeaderTokens.ts`，经 `useThemeStyles().screenHeader` 读取；各屏仍可用 props 覆盖（如洞察/回顾图主题色）。
- **Tab 根页**（气象站、心灵花园等）：使用 `AppScreenShell` 且 **`showHeader={false}`**，在子树内保留自定义头部（花园头图、气象站标题区等），与栈式顶栏区分。
- **全屏 Modal**（如编辑记录）：可直接使用 `StackScreenHeader`，`leading="close"` + `headerCenter` 组合中间区（图标+标题），不必包一层 `AppScreenShell`（避免与 Modal 内安全区重复）。
- **滚动策略（避免双滚动）**：下列二选一，不要叠用——  
  1. `AppScreenShell` / `ScreenContainer` 设 `scrollable`，由壳内 `ScrollView` 承载整页内容；  
  2. 壳不滚动，在**单一**内层 `ScrollView`（或 `FlashList`）中滚动。  
  禁止：`scrollable` 为 true 时再包一层全屏 `ScrollView` 滚动同一主轴内容。

## 📝 代码规范

- **TypeScript**：本项目完全使用 TypeScript，请确保没有类型错误。
- **ESLint**：提交前请确保通过 ESLint 检查。
- **组件风格**：请参考 `components/` 目录下的现有组件结构。
- **状态管理**：使用 Zustand 进行状态管理，遵循 `store/` 目录的结构。

## 📄 许可证

参与贡献即表示你同意你的代码遵循本项目的 [MIT 许可证](./LICENSE)。

感谢你的支持！让我们一起打造更好的情绪日记应用！🌱
