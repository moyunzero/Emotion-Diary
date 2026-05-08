import { BackupManager } from '@/scripts/cleanup/components/BackupManager';
import { execSync } from 'child_process';

// Mock child_process
jest.mock('child_process');
const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('BackupManager', () => {
  let backupManager: BackupManager;

  beforeEach(() => {
    backupManager = new BackupManager();
    jest.clearAllMocks();
  });

  describe('createTag', () => {
    it('should create a git tag successfully', async () => {
      // Mock: tag doesn't exist (rev-parse throws error)
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error('fatal: ambiguous argument');
        })
        .mockReturnValueOnce('' as any) // git tag command
        .mockReturnValueOnce('abc123def456\n' as any); // git rev-parse for SHA

      const result = await backupManager.createTag('pre-cleanup-v1.0.0');

      expect(result.success).toBe(true);
      expect(result.sha).toBe('abc123def456');
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git rev-parse pre-cleanup-v1.0.0',
        expect.any(Object)
      );
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git tag pre-cleanup-v1.0.0',
        expect.any(Object)
      );
    });

    it('should throw error if tag already exists', async () => {
      // Mock: tag exists (rev-parse succeeds)
      mockedExecSync.mockReturnValueOnce('abc123def456\n' as any);

      await expect(
        backupManager.createTag('pre-cleanup-v1.0.0')
      ).rejects.toThrow('Tag "pre-cleanup-v1.0.0" already exists');
    });

    it('should throw error if git tag command fails', async () => {
      // Mock: tag doesn't exist, but git tag command fails
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error('fatal: ambiguous argument');
        })
        .mockImplementationOnce(() => {
          throw new Error('fatal: not a git repository');
        });

      await expect(
        backupManager.createTag('pre-cleanup-v1.0.0')
      ).rejects.toThrow('Failed to create tag');
    });

    it('should handle tag names with special characters', async () => {
      // Mock: tag doesn't exist
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error('fatal: ambiguous argument');
        })
        .mockReturnValueOnce('' as any)
        .mockReturnValueOnce('xyz789abc\n' as any);

      const result = await backupManager.createTag('pre-cleanup-v2.0.0-beta');

      expect(result.success).toBe(true);
      expect(result.sha).toBe('xyz789abc');
    });
  });

  describe('createBranch', () => {
    it('should create a git branch successfully', async () => {
      // Mock: branch doesn't exist (rev-parse throws error)
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error('fatal: ambiguous argument');
        })
        .mockReturnValueOnce('' as any); // git checkout -b command

      const result = await backupManager.createBranch('cleanup/post-launch-2026');

      expect(result.success).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git rev-parse --verify cleanup/post-launch-2026',
        expect.any(Object)
      );
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git checkout -b cleanup/post-launch-2026',
        expect.any(Object)
      );
    });

    it('should throw error if branch already exists', async () => {
      // Mock: branch exists (rev-parse succeeds)
      mockedExecSync.mockReturnValueOnce('abc123def456\n' as any);

      await expect(
        backupManager.createBranch('cleanup/post-launch-2026')
      ).rejects.toThrow('Branch "cleanup/post-launch-2026" already exists');
    });

    it('should throw error if git checkout command fails', async () => {
      // Mock: branch doesn't exist, but git checkout command fails
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error('fatal: ambiguous argument');
        })
        .mockImplementationOnce(() => {
          throw new Error('fatal: not a git repository');
        });

      await expect(
        backupManager.createBranch('cleanup/post-launch-2026')
      ).rejects.toThrow('Failed to create branch');
    });

    it('should handle branch names with slashes', async () => {
      // Mock: branch doesn't exist
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error('fatal: ambiguous argument');
        })
        .mockReturnValueOnce('' as any);

      const result = await backupManager.createBranch('feature/cleanup/docs');

      expect(result.success).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git checkout -b feature/cleanup/docs',
        expect.any(Object)
      );
    });
  });

  describe('verifyCleanWorkingTree', () => {
    it('should return clean status when working tree is clean', async () => {
      // Mock: git status returns empty
      mockedExecSync.mockReturnValueOnce('' as any);

      const result = await backupManager.verifyCleanWorkingTree();

      expect(result.isClean).toBe(true);
      expect(result.uncommittedFiles).toEqual([]);
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git status --porcelain',
        expect.any(Object)
      );
    });

    it('should return uncommitted files excluding .env files', async () => {
      // Mock: git status returns modified files including .env
      const gitStatusOutput = ` M src/utils.ts
 M components/Button.tsx
 M .env
 M .env.local
?? newfile.ts`;

      // When encoding is specified, execSync returns a string, not a Buffer
      mockedExecSync.mockReturnValueOnce(gitStatusOutput as any);

      const result = await backupManager.verifyCleanWorkingTree();

      expect(result.isClean).toBe(false);
      expect(result.uncommittedFiles).toEqual([
        'src/utils.ts',
        'components/Button.tsx',
        'newfile.ts',
      ]);
      // .env and .env.local should be excluded (Requirement 1.4)
      expect(result.uncommittedFiles).not.toContain('.env');
      expect(result.uncommittedFiles).not.toContain('.env.local');
    });

    it('should return clean status when only .env files are modified', async () => {
      // Mock: git status returns only .env files
      const gitStatusOutput = ` M .env
 M .env.local`;

      mockedExecSync.mockReturnValueOnce(gitStatusOutput as any);

      const result = await backupManager.verifyCleanWorkingTree();

      expect(result.isClean).toBe(true);
      expect(result.uncommittedFiles).toEqual([]);
    });

    it('should handle various git status formats', async () => {
      // Mock: git status with different status codes
      const gitStatusOutput = `M  staged.ts
 M modified.ts
A  added.ts
D  deleted.ts
?? untracked.ts
 M .env`;

      mockedExecSync.mockReturnValueOnce(gitStatusOutput as any);

      const result = await backupManager.verifyCleanWorkingTree();

      expect(result.isClean).toBe(false);
      expect(result.uncommittedFiles).toEqual([
        'staged.ts',
        'modified.ts',
        'added.ts',
        'deleted.ts',
        'untracked.ts',
      ]);
    });

    it('should exclude .env files in subdirectories', async () => {
      // Mock: git status with .env in subdirectory
      const gitStatusOutput = ` M src/config/.env
 M src/utils.ts
 M config/.env.local`;

      mockedExecSync.mockReturnValueOnce(gitStatusOutput as any);

      const result = await backupManager.verifyCleanWorkingTree();

      expect(result.isClean).toBe(false);
      expect(result.uncommittedFiles).toEqual(['src/utils.ts']);
      // .env files in subdirectories should also be excluded
      expect(result.uncommittedFiles).not.toContain('src/config/.env');
      expect(result.uncommittedFiles).not.toContain('config/.env.local');
    });

    it('should throw error if git status command fails', async () => {
      // Mock: git status fails
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('fatal: not a git repository');
      });

      await expect(backupManager.verifyCleanWorkingTree()).rejects.toThrow(
        'Failed to verify working tree'
      );
    });

    it('should handle empty lines in git status output', async () => {
      // Mock: git status with empty lines
      const gitStatusOutput = ` M src/utils.ts

 M components/Button.tsx

`;

      mockedExecSync.mockReturnValueOnce(gitStatusOutput as any);

      const result = await backupManager.verifyCleanWorkingTree();

      expect(result.isClean).toBe(false);
      expect(result.uncommittedFiles).toEqual([
        'src/utils.ts',
        'components/Button.tsx',
      ]);
    });
  });
});
