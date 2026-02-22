# speclang-header lines:12
id: "@speclang/opencode-plugin.dir/git-integration"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.dir/architecture"]
tags: [opencode, plugin, git, version-control]
short: Git integration for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Git Integration

## Purpose

Commits each spec file change with `speclang:` prefix messages. Uses `git commit --only`.

## Commit Per File

```speclang
# @block:opencode-plugin/git-integration/commit @kind:code
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function commitFile(filePath: string, message: string): Promise<void> {
  // Stage the file
  await execAsync(`git add "${filePath}"`);
  
  // Commit only this file
  await execAsync(`git commit --only "${filePath}" -m "speclang: ${message}"`);
}
```
```

## Commit Message Generation

Generate commit messages based on role and file type:

- Spec-Writer: "spec-writer: add/update spec for X"
- Code-Gen: "code-gen: generate Y implementation"
- Test-Writer: "test-writer: add tests for Z"
- North-Star: "north-star: update project references"

## Git Safety

- Ensure we are in a git repository
- Handle file paths with spaces
- Avoid committing binary files
- Rollback on failure

## References

- @ref:speclang/git-history (for git conventions)