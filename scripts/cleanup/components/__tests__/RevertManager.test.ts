/**
 * Unit tests for RevertManager
 * 
 * Tests the revert functionality including:
 * - Commit reversion without auto-commit
 * - Manual confirmation prompts
 * - Revert commit creation
 * - Merge conflict handling
 * - Revert abort functionality
 */

import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { RevertManager } from '../RevertManager';

// Mock child_process
jest.mock('child_process');
const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

// Mock inquirer
jest.mock('inquirer');
const mockedInquirer = inquirer as jest.Mocked<typeof inquirer>;

describe('RevertManager', () => {
  let revertManager: RevertManager;

  beforeEach(() => {
    revertManager = new RevertManager();
    jest.clearAllMocks();
  });

  describe('revertCommit', () => {
    it('should successfully revert a commit without conflicts', async () => {
      // Mock successful git revert
      mockedExecSync.mockReturnValueOnce('');

      const result = await revertManager.revertCommit('abc123');

      expect(result).toEqual({
        success: true,
        revertedCommit: 'abc123',
        conflicts: [],
      });

      expect(mockedExecSync).toHaveBeenCalledWith(
        'git revert --no-commit abc123',
        expect.objectContaining({
          encoding: 'utf-8',
          stdio: 'pipe',
        })
      );
    });

    it('should handle merge conflicts during revert', async () => {
      // Mock git revert with conflict
      mockedExecSync
        .mockImplementationOnce(() => {
          const error: any = new Error('CONFLICT (content): Merge conflict in file.ts');
          error.status = 1;
          throw error;
        })
        .mockReturnValueOnce('file1.ts\nfile2.ts'); // Mock conflict files

      const result = await revertManager.revertCommit('abc123');

      expect(result).toEqual({
        success: false,
        revertedCommit: 'abc123',
        conflicts: ['file1.ts', 'file2.ts'],
      });

      // Verify git diff was called to get conflict files
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git diff --name-only --diff-filter=U',
        expect.objectContaining({
          encoding: 'utf-8',
          stdio: 'pipe',
        })
      );
    });

    it('should throw error for invalid commit hash', async () => {
      // Mock git revert failure
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('fatal: bad revision \'invalid123\'');
      });

      await expect(revertManager.revertCommit('invalid123')).rejects.toThrow(
        'Failed to revert commit "invalid123"'
      );
    });

    it('should handle empty conflict list', async () => {
      // Mock git revert with conflict error but no actual conflicts
      mockedExecSync
        .mockImplementationOnce(() => {
          const error: any = new Error('conflict');
          error.status = 1;
          throw error;
        })
        .mockReturnValueOnce(''); // No conflict files

      // Should throw because there's an error but no conflicts
      await expect(revertManager.revertCommit('abc123')).rejects.toThrow();
    });

    it('should handle git command execution errors', async () => {
      // Mock git revert with generic error
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('git command not found');
      });

      await expect(revertManager.revertCommit('abc123')).rejects.toThrow(
        'Failed to revert commit "abc123"'
      );
    });

    it('should use --no-commit flag to prevent auto-commit', async () => {
      mockedExecSync.mockReturnValueOnce('');

      await revertManager.revertCommit('abc123');

      const callArgs = mockedExecSync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--no-commit');
    });
  });

  describe('requestManualConfirmation', () => {
    it('should return true when user confirms', async () => {
      // Mock user confirmation
      mockedInquirer.prompt.mockResolvedValueOnce({ confirmRevert: true });

      const result = await revertManager.requestManualConfirmation();

      expect(result).toBe(true);
      expect(mockedInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'confirm',
          name: 'confirmRevert',
          message: expect.stringContaining('CI checks failed'),
          default: false,
        }),
      ]);
    });

    it('should return false when user declines', async () => {
      // Mock user decline
      mockedInquirer.prompt.mockResolvedValueOnce({ confirmRevert: false });

      const result = await revertManager.requestManualConfirmation();

      expect(result).toBe(false);
    });

    it('should default to false in prompt', async () => {
      mockedInquirer.prompt.mockResolvedValueOnce({ confirmRevert: false });

      await revertManager.requestManualConfirmation();

      expect(mockedInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          default: false,
        }),
      ]);
    });

    it('should handle inquirer errors gracefully', async () => {
      // Mock inquirer failure (e.g., non-interactive environment)
      mockedInquirer.prompt.mockRejectedValueOnce(new Error('Not a TTY'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await revertManager.requestManualConfirmation();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get user confirmation')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should use confirm type for prompt', async () => {
      mockedInquirer.prompt.mockResolvedValueOnce({ confirmRevert: true });

      await revertManager.requestManualConfirmation();

      expect(mockedInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'confirm',
        }),
      ]);
    });
  });

  describe('commitRevert', () => {
    it('should successfully commit revert with message', async () => {
      mockedExecSync.mockReturnValueOnce('');

      await revertManager.commitRevert('Revert: cleanup phase 1');

      expect(mockedExecSync).toHaveBeenCalledWith(
        'git commit -m "Revert: cleanup phase 1"',
        expect.objectContaining({
          encoding: 'utf-8',
          stdio: 'pipe',
        })
      );
    });

    it('should throw error when commit fails', async () => {
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('nothing to commit');
      });

      await expect(
        revertManager.commitRevert('Revert: cleanup phase 1')
      ).rejects.toThrow('Failed to commit revert');
    });

    it('should handle commit message with special characters', async () => {
      mockedExecSync.mockReturnValueOnce('');

      const message = 'Revert: fix "bug" in cleanup';
      await revertManager.commitRevert(message);

      expect(mockedExecSync).toHaveBeenCalledWith(
        `git commit -m "${message}"`,
        expect.any(Object)
      );
    });

    it('should handle empty commit message', async () => {
      mockedExecSync.mockReturnValueOnce('');

      await revertManager.commitRevert('');

      expect(mockedExecSync).toHaveBeenCalledWith(
        'git commit -m ""',
        expect.any(Object)
      );
    });
  });

  describe('abortRevert', () => {
    it('should successfully abort revert in progress', async () => {
      mockedExecSync.mockReturnValueOnce('');

      await revertManager.abortRevert();

      expect(mockedExecSync).toHaveBeenCalledWith(
        'git revert --abort',
        expect.objectContaining({
          encoding: 'utf-8',
          stdio: 'pipe',
        })
      );
    });

    it('should handle no revert in progress gracefully', async () => {
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('fatal: no revert in progress');
      });

      // Should not throw
      await expect(revertManager.abortRevert()).resolves.toBeUndefined();
    });

    it('should throw error for other abort failures', async () => {
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('git command failed');
      });

      await expect(revertManager.abortRevert()).rejects.toThrow(
        'Failed to abort revert'
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete revert workflow', async () => {
      // Step 1: Revert commit
      mockedExecSync.mockReturnValueOnce('');
      const revertResult = await revertManager.revertCommit('abc123');
      expect(revertResult.success).toBe(true);

      // Step 2: Request confirmation
      mockedInquirer.prompt.mockResolvedValueOnce({ confirmRevert: true });
      const confirmed = await revertManager.requestManualConfirmation();
      expect(confirmed).toBe(true);

      // Step 3: Commit revert
      mockedExecSync.mockReturnValueOnce('');
      await revertManager.commitRevert('Revert: cleanup phase 1');

      expect(mockedExecSync).toHaveBeenCalledTimes(2);
    });

    it('should handle revert with conflicts and abort', async () => {
      // Step 1: Revert with conflicts
      mockedExecSync
        .mockImplementationOnce(() => {
          const error: any = new Error('conflict');
          error.status = 1;
          throw error;
        })
        .mockReturnValueOnce('file.ts'); // Conflict files

      const revertResult = await revertManager.revertCommit('abc123');
      expect(revertResult.success).toBe(false);
      expect(revertResult.conflicts).toEqual(['file.ts']);

      // Step 2: User declines to commit
      mockedInquirer.prompt.mockResolvedValueOnce({ confirmRevert: false });
      const confirmed = await revertManager.requestManualConfirmation();
      expect(confirmed).toBe(false);

      // Step 3: Abort revert
      mockedExecSync.mockReturnValueOnce('');
      await revertManager.abortRevert();

      expect(mockedExecSync).toHaveBeenCalledWith(
        'git revert --abort',
        expect.any(Object)
      );
    });

    it('should handle multiple conflict files', async () => {
      mockedExecSync
        .mockImplementationOnce(() => {
          const error: any = new Error('conflict');
          error.status = 1;
          throw error;
        })
        .mockReturnValueOnce('file1.ts\nfile2.ts\nfile3.ts');

      const result = await revertManager.revertCommit('abc123');

      expect(result.conflicts).toEqual(['file1.ts', 'file2.ts', 'file3.ts']);
      expect(result.conflicts.length).toBe(3);
    });
  });

  describe('error messages', () => {
    it('should provide clear error message for revert failure', async () => {
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('bad revision');
      });

      await expect(revertManager.revertCommit('invalid')).rejects.toThrow(
        'Failed to revert commit "invalid": bad revision'
      );
    });

    it('should provide clear error message for commit failure', async () => {
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('nothing to commit');
      });

      await expect(revertManager.commitRevert('message')).rejects.toThrow(
        'Failed to commit revert: nothing to commit'
      );
    });

    it('should provide clear error message for abort failure', async () => {
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('unknown error');
      });

      await expect(revertManager.abortRevert()).rejects.toThrow(
        'Failed to abort revert: unknown error'
      );
    });
  });
});
