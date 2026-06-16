# Bootstrap Phase 4.4: Git History Integration

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.4 of the bootstrap process.

**Prerequisites**: 
- Phase 0-3 complete
- Phase 4.1-4.3 (Pipeline, Guard, Recovery) complete

## Your Task
Implement per-file git commits for perfect traceability. Every agent write creates one commit, enabling cherry-pick, blame, and rollback capabilities.

## Read These Specs First
1. `specs/git-history.spec.md` - Git integration specification
2. `specs/agent-protocol.spec.md` - Agent context
3. `specs/recovery.spec.md` - Rollback integration

## What to Build

### Files to Create
```
src/git/
├── index.ts              # Main exports
├── committer.ts          # Per-file commit logic
├── history.ts            # History tool implementation
├── blame.ts              # Blame functionality
├── cherry-pick.ts        # Cherry-pick operations
├── rollback.ts           # Rollback helpers
└── audit.ts              # Audit trail export

tests/
└── git-history.test.ts
```

### Requirements

#### 1. Per-File Commits (committer.ts)

```typescript
interface CommitOptions {
  file: string;
  message: string;
  agentName: string;
}

interface CommitResult {
  hash: string;
  file: string;
  timestamp: number;
}

export class PerFileCommitter {
  async commit(options: CommitOptions): Promise<CommitResult> {
    const { file, message, agentName } = options;
    
    // Format: speclang: {summary}
    const formattedMessage = `speclang: ${message}`;
    
    // Use --only flag for single file commits
    await exec(`git add "${file}"`);
    await exec(`git commit --only "${file}" -m "${formattedMessage}"`);
    
    const hash = await this.getLatestHash();
    
    return {
      hash,
      file,
      timestamp: Date.now()
    };
  }
  
  async commitBatch(files: string[], message: string, agentName: string): Promise<CommitResult[]> {
    const results: CommitResult[] = [];
    
    for (const file of files) {
      const result = await this.commit({
        file,
        message: `${message} (${file})`,
        agentName
      });
      results.push(result);
    }
    
    return results;
  }
}
```

#### 2. History Tool (history.ts)

```typescript
interface CommitInfo {
  hash: string;
  message: string;
  author: string;      // Agent name
  timestamp: number;
  diff_summary: string;
}

export class GitHistory {
  async getFileHistory(path: string, limit: number = 20): Promise<CommitInfo[]> {
    const output = await exec(
      `git log --follow --pretty=format:"%H|%an|%s|%ct" -n ${limit} -- "${path}"`
    );
    
    const commits: CommitInfo[] = [];
    
    for (const line of output.trim().split('\n')) {
      if (!line) continue;
      
      const [hash, author, message, timestamp] = line.split('|');
      const diffSummary = await this.getDiffSummary(hash, path);
      
      commits.push({
        hash: hash.substring(0, 7),
        message,
        author,
        timestamp: parseInt(timestamp) * 1000,
        diff_summary: diffSummary
      });
    }
    
    return commits;
  }
  
  private async getDiffSummary(hash: string, path: string): Promise<string> {
    const output = await exec(
      `git show --stat --format="" ${hash} -- "${path}"`
    );
    
    // Parse: "+15 lines, -3 lines" or "+42 lines, new file"
    const insertions = (output.match(/(\d+) insertion/g) || [])[1] || '0';
    const deletions = (output.match(/(\d+) deletion/g) || [])[1] || '0';
    
    if (output.includes('new file')) {
      return `+${insertions} lines, new file`;
    }
    
    return `+${insertions} lines, -${deletions} lines`;
  }
}

// Tool API for agents
export function speclang_git_history(path: string, limit: number = 20): Promise<CommitInfo[]> {
  const history = new GitHistory();
  return history.getFileHistory(path, limit);
}
```

#### 3. Blame Tool (blame.ts)

```typescript
interface BlameLine {
  line: number;
  content: string;
  commit: string;
  author: string;
  timestamp: number;
}

export class GitBlame {
  async getBlame(path: string, lineRange?: [number, number]): Promise<BlameLine[]> {
    let cmd = `git blame --line-porcelain "${path}"`;
    
    if (lineRange) {
      cmd += ` -L ${lineRange[0]},${lineRange[1]}`;
    }
    
    const output = await exec(cmd);
    return this.parseBlameOutput(output);
  }
  
  private parseBlameOutput(output: string): BlameLine[] {
    const lines: BlameLine[] = [];
    const blocks = output.split('\t');
    
    // Parse porcelain format
    // Implementation details for parsing git blame --line-porcelain
    
    return lines;
  }
  
  async findAuthor(path: string, lineNumber: number): Promise<string> {
    const blame = await this.getBlame(path, [lineNumber, lineNumber]);
    return blame[0]?.author || 'unknown';
  }
}

// Tool API for agents
export function speclang_blame(path: string, lineRange?: [number, number]): Promise<BlameLine[]> {
  const blame = new GitBlame();
  return blame.getBlame(path, lineRange);
}
```

#### 4. Cherry-Pick (cherry-pick.ts)

```typescript
export class CherryPicker {
  async cherryPick(commitHash: string, targetBranch: string): Promise<void> {
    // 1. Save current branch
    const currentBranch = await this.getCurrentBranch();
    
    // 2. Checkout target branch
    await exec(`git checkout ${targetBranch}`);
    
    // 3. Cherry-pick the commit
    await exec(`git cherry-pick ${commitHash}`);
    
    // 4. Return to original branch
    await exec(`git checkout ${currentBranch}`);
  }
  
  async cherryPickMultiple(commits: string[], targetBranch: string): Promise<void> {
    for (const commit of commits) {
      await this.cherryPick(commit, targetBranch);
    }
  }
  
  private async getCurrentBranch(): Promise<string> {
    return (await exec('git branch --show-current')).trim();
  }
}
```

#### 5. Rollback (rollback.ts)

```typescript
export class GitRollback {
  async rollbackFile(file: string, commits: number = 1): Promise<string> {
    // Revert single file to previous version
    await exec(`git checkout HEAD~${commits} -- "${file}"`);
    return `Rolled back ${file} by ${commits} commit(s)`;
  }
  
  async rollbackCommit(commitHash: string): Promise<string> {
    // Revert all files from that commit
    await exec(`git revert ${commitHash} --no-edit`);
    return `Reverted commit ${commitHash}`;
  }
  
  async cascadeRollback(commitHash: string): Promise<string> {
    // Revert entire cascade
    await exec(`git reset --hard ${commitHash}`);
    return `Hard reset to ${commitHash}`;
  }
}

// Tool API
export function speclang_rollback(options: { file?: string; commit_hash?: string }): Promise<{ reverted: string[]; current_hash: string }> {
  const rollback = new GitRollback();
  // Implementation
}
```

#### 6. Branch Strategy

```typescript
interface BranchConfig {
  main: {
    description: 'converged, tested specs and code';
    always_deployable: true;
  };
  feature: {
    pattern: 'feature/*';
    description: 'active development, cascade in progress';
  };
  worktree: {
    pattern: 'worktree/*';
    description: 'isolated test versions, parallel testing';
  };
}

export class BranchManager {
  async createFeatureBranch(name: string): Promise<string> {
    const branchName = `feature/${name}`;
    await exec(`git checkout -b ${branchName}`);
    return branchName;
  }
  
  async mergeToMain(featureBranch: string): Promise<void> {
    // Only converged branches to main
    await exec(`git checkout main`);
    await exec(`git merge ${featureBranch} --no-ff -m "speclang: merge ${featureBranch}"`);
  }
}
```

#### 7. Audit Trail (audit.ts)

```typescript
interface AuditEntry {
  timestamp: number;
  action: string;
  agent: string;
  file: string;
  commit: string;
}

export class AuditTrail {
  async export(options: {
    start_date: Date;
    end_date: Date;
    format: 'json' | 'csv' | 'pdf';
  }): Promise<string> {
    const { start_date, end_date, format } = options;
    
    const entries = await this.getEntries(start_date, end_date);
    
    switch (format) {
      case 'json':
        return JSON.stringify(entries, null, 2);
      case 'csv':
        return this.toCSV(entries);
      case 'pdf':
        return this.toPDF(entries);
    }
  }
  
  private async getEntries(start: Date, end: Date): Promise<AuditEntry[]> {
    const output = await exec(
      `git log --since="${start.toISOString()}" --until="${end.toISOString()"} ` +
      `--pretty=format:"%ct|%an|%s|%H" --name-only`
    );
    
    return this.parseLogOutput(output);
  }
}

// Tool API
export function speclang_audit_export(
  start_date: Date, 
  end_date: Date, 
  format: 'json' | 'csv' | 'pdf'
): Promise<string> {
  const audit = new AuditTrail();
  return audit.export({ start_date, end_date, format });
}
```

#### 8. Bisect Tool

```typescript
interface BisectResult {
  culprit_commit: string;
  file: string;
  agent: string;
}

export class GitBisect {
  async findBug(options: {
    good_commit: string;
    bad_commit: string;
    test_command: string;
  }): Promise<BisectResult> {
    const { good_commit, bad_commit, test_command } = options;
    
    // Start bisect
    await exec(`git bisect start`);
    await exec(`git bisect bad ${bad_commit}`);
    await exec(`git bisect good ${good_commit}`);
    
    // Run bisect with test command
    let result = '';
    try {
      result = await exec(`git bisect run ${test_command}`);
    } finally {
      await exec(`git bisect reset`);
    }
    
    // Parse culprit from output
    const culpritMatch = result.match(/([a-f0-9]+) is the first bad commit/);
    const culprit = culpritMatch ? culpritMatch[1] : '';
    
    // Get file and agent info
    const file = await this.getChangedFile(culprit);
    const agent = await this.getAuthor(culprit);
    
    return { culprit_commit: culprit, file, agent };
  }
}
```

### Integration with Agent System

```typescript
// Hook into agent completion
agentManager.on('agent-complete', async (agent, files) => {
  const committer = new PerFileCommitter();
  
  for (const file of files) {
    await committer.commit({
      file,
      message: agent.getSummary(),
      agentName: agent.name
    });
  }
});
```

## Test Cases
1. Per-file commit creates single commit
2. History tool returns commits in order
3. Blame shows agent name correctly
4. Cherry-pick applies commit to branch
5. Rollback reverts file to previous version
6. Audit export produces valid output
7. Bisect finds culprit commit
8. Branch strategy enforced

## Validation
```bash
bun test tests/git-history.test.ts

# Manual tests
speclang git-history specs/auth.spec.md
speclang git-blame specs/auth.spec.md --line 10-20
speclang git-rollback --file specs/auth.spec.md
```

## Output Format
After completing, output:
1. Files created
2. Git tools implemented
3. Integration with agents
4. Test results
