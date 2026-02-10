#!/bin/bash

# Git历史清理脚本
# 
# 警告：此脚本会重写Git历史，这是一个破坏性操作！
# 
# 使用前请确保：
# 1. 已备份重要数据
# 2. 已通知所有团队成员
# 3. 准备好强制推送到远程仓库
#
# 此脚本将从Git历史中移除.env文件

set -e

echo "⚠️  警告：此操作将重写Git历史！"
echo ""
echo "此脚本将："
echo "1. 从Git历史中移除.env文件"
echo "2. 保留当前工作目录中的.env文件"
echo "3. 需要强制推送到远程仓库"
echo ""
read -p "是否继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo "开始清理Git历史..."
echo ""

# 检查是否安装了git-filter-repo
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ 未找到 git-filter-repo"
    echo ""
    echo "请先安装 git-filter-repo："
    echo ""
    echo "macOS:"
    echo "  brew install git-filter-repo"
    echo ""
    echo "或使用pip:"
    echo "  pip3 install git-filter-repo"
    echo ""
    exit 1
fi

# 备份当前的.env文件
echo "1. 备份当前的.env文件..."
cp .env .env.backup
echo "   ✅ 已备份到 .env.backup"
echo ""

# 使用git-filter-repo移除.env文件
echo "2. 从Git历史中移除.env文件..."
git-filter-repo --path .env --invert-paths --force
echo "   ✅ 已从Git历史中移除.env"
echo ""

# 恢复.env文件到工作目录
echo "3. 恢复.env文件到工作目录..."
mv .env.backup .env
git add .env
git commit -m "chore: update .env with placeholder values (secrets moved to EAS)"
echo "   ✅ 已恢复.env文件"
echo ""

echo "✅ Git历史清理完成！"
echo ""
echo "下一步："
echo "1. 检查Git历史：git log --all --oneline"
echo "2. 强制推送到远程仓库："
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "⚠️  重要提示："
echo "- 强制推送会覆盖远程仓库的历史"
echo "- 请通知所有团队成员重新克隆仓库"
echo "- 团队成员需要运行：git pull --rebase"
echo ""
