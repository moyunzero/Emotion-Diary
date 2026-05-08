import { execSync } from 'child_process';
import inquirer from 'inquirer';

/**
 * RevertManager - 负责处理清理失败时的回滚操作
 * 
 * Requirements: 6.3, 6.4
 */
export class RevertManager {
  /**
   * 回滚指定的 commit（不自动提交）
   * 
   * @param commitHash - 要回滚的 commit hash
   * @returns 回滚状态和冲突文件列表
   * @throws Error 如果 git revert 命令失败
   * 
   * Requirement 6.3: Execute git revert --no-commit when CI fails
   */
  async revertCommit(commitHash: string): Promise<{
    success: boolean;
    revertedCommit: string;
    conflicts: string[];
  }> {
    try {
      // 执行 git revert --no-commit
      try {
        execSync(`git revert --no-commit ${commitHash}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });

        // 如果没有抛出异常，说明 revert 成功且无冲突
        return {
          success: true,
          revertedCommit: commitHash,
          conflicts: [],
        };
      } catch (error: any) {
        // 检查是否是合并冲突
        if (error.message.includes('conflict') || error.status === 1) {
          // 获取冲突文件列表
          const conflicts = this.getConflictFiles();

          if (conflicts.length > 0) {
            // 有冲突，但 revert 已经开始
            return {
              success: false,
              revertedCommit: commitHash,
              conflicts,
            };
          }

          // 没有冲突文件，可能是其他错误
          throw error;
        }

        // 其他错误，向上抛出
        throw error;
      }
    } catch (error: any) {
      throw new Error(`Failed to revert commit "${commitHash}": ${error.message}`);
    }
  }

  /**
   * 获取当前的冲突文件列表
   * 
   * @returns 冲突文件路径数组
   */
  private getConflictFiles(): string[] {
    try {
      // 使用 git diff --name-only --diff-filter=U 获取冲突文件
      const output = execSync('git diff --name-only --diff-filter=U', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const outputStr = output.trim();
      if (!outputStr) {
        return [];
      }

      return outputStr.split('\n').filter((line) => line.trim() !== '');
    } catch (error) {
      // 如果命令失败，返回空数组
      return [];
    }
  }

  /**
   * 请求用户手动确认是否提交回滚
   * 
   * @returns 用户确认结果（true = 确认提交，false = 取消）
   * 
   * Requirement 6.4: Pause for manual confirmation before committing revert
   */
  async requestManualConfirmation(): Promise<boolean> {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmRevert',
          message:
            'CI checks failed. A revert has been prepared. Do you want to commit this revert?',
          default: false,
        },
      ]);

      return answers.confirmRevert;
    } catch (error: any) {
      // 如果 inquirer 失败（例如非交互式环境），默认返回 false
      console.error(`Failed to get user confirmation: ${error.message}`);
      return false;
    }
  }

  /**
   * 提交回滚操作
   * 
   * @param commitMessage - 回滚的 commit message
   * @throws Error 如果 git commit 命令失败
   * 
   * Requirement 6.4: Commit revert after manual confirmation
   */
  async commitRevert(commitMessage: string): Promise<void> {
    try {
      execSync(`git commit -m "${commitMessage}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    } catch (error: any) {
      throw new Error(`Failed to commit revert: ${error.message}`);
    }
  }

  /**
   * 中止正在进行的 revert 操作
   * 
   * @throws Error 如果 git revert --abort 命令失败
   */
  async abortRevert(): Promise<void> {
    try {
      execSync('git revert --abort', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    } catch (error: any) {
      // 如果没有正在进行的 revert，git 会报错，这是正常的
      if (error.message.includes('no revert in progress')) {
        return;
      }
      throw new Error(`Failed to abort revert: ${error.message}`);
    }
  }
}
