# 贡献指南 (Contributing Guide)

感谢你对 Emotion Diary 项目感兴趣！我们非常欢迎各种形式的贡献，包括但不限于提交代码、报告 Bug、完善文档、提出新功能建议等。

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
   - 运行 `yarn lint` 检查代码规范。
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
   - 在 GitHub 上提交 PR 到 `main` 分支。
   - 详细描述你的更改内容。
   - 如果修复了 Issue，请在描述中关联（如 `Closes #123`）。

## 🛠 开发环境搭建

请参考 [README.md](./README.md#快速开始) 中的开发环境设置指南。

## 📝 代码规范

- **TypeScript**：本项目完全使用 TypeScript，请确保没有类型错误。
- **ESLint**：提交前请确保通过 ESLint 检查。
- **组件风格**：请参考 `components/` 目录下的现有组件结构。
- **状态管理**：使用 Zustand 进行状态管理，遵循 `store/` 目录的结构。

## 📄 许可证

参与贡献即表示你同意你的代码遵循本项目的 [MIT 许可证](./LICENSE)。

感谢你的支持！让我们一起打造更好的情绪日记应用！🌱
