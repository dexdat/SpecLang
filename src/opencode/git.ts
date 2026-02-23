import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface CommitOptions {
  changeId?: string;
  parentChangeId?: string;
}

export class GitIntegration {
  private projectDir: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --is-inside-work-tree', { cwd: this.projectDir });
      return true;
    } catch {
      return false;
    }
  }

  async commitFile(filePath: string, message: string, options: CommitOptions = {}): Promise<void> {
    const { changeId, parentChangeId } = options;
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(this.projectDir, filePath);

    let commitMessage = `speclang: ${message}`;
    if (changeId || parentChangeId) {
      const metadata: string[] = [];
      if (changeId) metadata.push(`change_id:${changeId}`);
      if (parentChangeId) metadata.push(`parent:${parentChangeId}`);
      commitMessage += ` [${metadata.join(' ')}]`;
    }

    try {
      await execAsync(`git add "${absPath}"`, { cwd: this.projectDir });
      await execAsync(`git commit --only "${absPath}" -m "${commitMessage}"`, { cwd: this.projectDir });
      console.log(`[Speclang] Committed: ${filePath}`);
    } catch (error) {
      console.error(`[Speclang] Failed to commit ${filePath}:`, error);
      throw error;
    }
  }

  async commitFiles(files: Array<{ path: string; message: string }>, options: CommitOptions = {}): Promise<void> {
    for (const file of files) {
      await this.commitFile(file.path, file.message, options);
    }
  }

  async getLastCommitMessage(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('git log -1 --pretty=%B', { cwd: this.projectDir });
      return stdout.trim();
    } catch {
      return null;
    }
  }

  async getFileLastModified(filePath: string): Promise<Date | null> {
    try {
      const { stdout } = await execAsync(
        `git log -1 --format=%cd --date=iso "${filePath}"`,
        { cwd: this.projectDir }
      );
      return new Date(stdout.trim());
    } catch {
      return null;
    }
  }

  async hasUncommittedChanges(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectDir });
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  async getChangedFiles(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectDir });
      return stdout
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.substring(3).trim());
    } catch {
      return [];
    }
  }
}
