#!/bin/bash

# Git历史清理验证脚本
# 
# 此脚本检查Git历史中是否还存在敏感信息

set -e

echo "🔍 验证Git历史清理"
echo ""

# 定义要搜索的敏感信息模式
SENSITIVE_PATTERNS=(
    "gsk_"           # Groq API Key前缀
    "hf_"            # Hugging Face Token前缀
    "sb_publishable" # Supabase Publishable Key前缀
)

echo "1. 检查.env文件是否在Git历史中..."
echo ""

# 检查.env文件的历史
ENV_HISTORY=$(git log --all --full-history -- .env 2>&1 || echo "")

if [ -z "$ENV_HISTORY" ]; then
    echo "   ✅ .env文件不在Git历史中"
else
    echo "   ⚠️  .env文件仍在Git历史中"
    echo ""
    echo "   最近的提交："
    git log --all --oneline --full-history -- .env | head -5
fi

echo ""
echo "2. 搜索敏感信息模式..."
echo ""

FOUND_SENSITIVE=false

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    echo "   搜索模式: $pattern"
    
    # 搜索Git历史中的敏感信息
    RESULTS=$(git log --all --full-history --source --all -S "$pattern" --oneline 2>&1 || echo "")
    
    if [ -n "$RESULTS" ]; then
        echo "   ⚠️  发现匹配："
        echo "$RESULTS" | head -3
        FOUND_SENSITIVE=true
    else
        echo "   ✅ 未发现"
    fi
    echo ""
done

echo "3. 检查当前.env文件..."
echo ""

if [ -f .env ]; then
    echo "   ✅ .env文件存在"
    
    # 检查是否包含真实密钥
    if grep -q "gsk_" .env || grep -q "hf_" .env; then
        echo "   ⚠️  .env文件包含真实密钥"
        echo "   请确保只使用占位符或测试密钥"
    else
        echo "   ✅ .env文件不包含真实密钥"
    fi
else
    echo "   ❌ .env文件不存在"
fi

echo ""
echo "4. 验证EAS Secrets..."
echo ""

# 检查EAS Secrets
if command -v eas &> /dev/null; then
    echo "   检查EAS Secrets配置..."
    eas secret:list --scope project 2>&1 | grep -E "Name|EXPO_PUBLIC" || echo "   ⚠️  无法获取EAS Secrets列表"
else
    echo "   ⚠️  未安装EAS CLI"
fi

echo ""
echo "=" | tr -d '\n' | xargs printf '%.0s=' {1..50}
echo ""

if [ "$FOUND_SENSITIVE" = true ]; then
    echo "⚠️  发现敏感信息！"
    echo ""
    echo "建议："
    echo "1. 运行清理脚本：./scripts/clean-git-history.sh"
    echo "2. 轮换所有暴露的密钥"
    echo "3. 参考：docs/GIT_HISTORY_CLEANUP_GUIDE.md"
    exit 1
else
    echo "✅ 验证通过！"
    echo ""
    echo "Git历史中未发现敏感信息"
    echo ""
    echo "下一步："
    echo "1. 确保EAS Secrets已配置"
    echo "2. 轮换所有密钥（建议）"
    echo "3. 继续发布流程"
    exit 0
fi
