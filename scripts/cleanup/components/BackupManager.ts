import { execSync } from 'child_process';

/**
 * BackupManager - 负责创建 Git 备份（tag 和 branch）以及验证工作树状态
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export class BackupManager {
  /**
   * 创建 Git tag 用于清理前的备份点
   * 
   * @param tagName - Tag 名称（例如 "pre-cleanup-v1.0.0"）
   * @returns 成功状态和 tag SHA
   * @throws Error 如果 tag 已存在或 git 命令失败
   * 
   * Requirement 1.1: Create git tag before any deletion
   */
  async createTag(tagName: string): Promise<{ success: boolean; sha: string }> {
    try {
      // 检查 tag 是否已存在
      try {
        execSync(`git rev-parse ${tagName}`, { encoding: 'utf-8', stdio: 'pipe' });
        // 如果 rev-parse 成功，说明 tag 已存在
        throw new Error(`Tag "${tagName}" already exists. Please use a different tag name or delete the existing tag.`);
      } catch (error: any) {
        // 如果是我们抛出的 "already exists" 错误，直接向上抛出
        if (error.message.includes('already exists')) {
          throw error;
        }
        // 如果是 git 命令失败（tag 不存在），继续创建 tag
      }

      // 创建 tag
      execSync(`git tag ${tagName}`, { encoding: 'utf-8', stdio: 'pipe' });

      // 获取 tag 的 SHA
      const shaOutput = execSync(`git rev-parse ${tagName}`, { encoding: 'utf-8', stdio: 'pipe' });
      const sha = shaOutput.trim();

      return { success: true, sha };
    } catch (error: any) {
      // 如果错误已经包含 "already exists"，直接抛出
      if (error.message.includes('already exists')) {
        throw error;
      }
      throw new Error(`Failed to create tag "${tagName}": ${error.message}`);
    }
  }

  /**
   * 创建清理分支
   * 
   * @param branchName - 分支名称（例如 "cleanup/post-launch-2026"）
   * @returns 成功状态
   * @throws Error 如果分支已存在或 git 命令失败
   * 
   * Requirement 1.2: Create cleanup branch
   */
  async createBranch(branchName: string): Promise<{ success: boolean }> {
    try {
      // 检查分支是否已存在
      try {
        execSync(`git rev-parse --verify ${branchName}`, { encoding: 'utf-8', stdio: 'pipe' });
        // 如果 rev-parse 成功，说明分支已存在
        throw new Error(`Branch "${branchName}" already exists. Please use a different branch name or delete the existing branch.`);
      } catch (error: any) {
        // 如果 rev-parse 失败且不是我们抛出的错误，说明分支不存在，继续创建
        if (error.message.includes('already exists')) {
          throw error;
        }
        // 分支不存在，继续创建
      }

      // 创建并切换到新分支
      execSync(`git checkout -b ${branchName}`, { encoding: 'utf-8', stdio: 'pipe' });

      return { success: true };
    } catch (error: any) {
      // 如果错误已经包含 "already exists"，直接抛出
      if (error.message.includes('already exists')) {
        throw error;
      }
      throw new Error(`Failed to create branch "${branchName}": ${error.message}`);
    }
  }

  /**
   * 验证工作树是否干净（排除 .env 和 .env.local 文件）
   * 
   * @returns 工作树状态和未提交文件列表
   * 
   * Requirements 1.3, 1.4, 1.5:
   * - Run yarn install and ensure clean working tree
   * - Allow .env, .env.local files to have local modifications
   * - Verify no uncommitted changes exist in tracked files (excluding environment configs)
   */
  async verifyCleanWorkingTree(): Promise<{
    isClean: boolean;
    uncommittedFiles: string[];
  }> {
    try {
      // 使用 git status --porcelain 获取未提交的文件
      const output = execSync('git status --porcelain', { encoding: 'utf-8', stdio: 'pipe' });
      const outputStr = output.trim();

      if (!outputStr) {
        // 工作树完全干净
        return { isClean: true, uncommittedFiles: [] };
      }

      // 解析输出，排除 .env 和 .env.local 文件
      const lines = outputStr.split('\n');
      const uncommittedFiles = lines
        .filter((line: string) => line.trim() !== '') // Filter out empty lines
        .map((line: string) => {
          // git status --porcelain 格式: XY filename
          // X 表示 index 状态，Y 表示 working tree 状态
          // 格式示例: " M file.ts" 或 "M  file.ts" 或 "?? file.ts"
          // 前两个字符是状态码，之后是空格和文件名
          // 使用 slice(2) 跳过状态码，然后 trim 去除前导空格
          return line.length > 2 ? line.slice(2).trim() : '';
        })
        .filter((file: string) => file !== '')
        .filter((file: string) => {
          // 排除 .env 和 .env.local 文件（Requirement 1.4）
          const fileName = file.split('/').pop() || '';
          return fileName !== '.env' && fileName !== '.env.local';
        });

      return {
        isClean: uncommittedFiles.length === 0,
        uncommittedFiles,
      };
    } catch (error: any) {
      throw new Error(`Failed to verify working tree: ${error.message}`);
    }
  }
}
