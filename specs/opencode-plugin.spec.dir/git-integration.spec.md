# speclang-header lines:9
id: "@speclang/opencode-plugin.spec.dir/git-integration"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.spec.dir/architecture"]
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

async function commitFile(
  filePath: string, 
  message: string,
  changeId?: string,
  parentChangeId?: string
): Promise<void> {
  // Stage the file
  await execAsync(`git add "${filePath}"`);
  
  // Build commit message with UUID metadata
  let commitMessage = `speclang: ${message}`;
  if (changeId || parentChangeId) {
    const metadata = [];
    if (changeId) metadata.push(`change_id:${changeId}`);
    if (parentChangeId) metadata.push(`parent:${parentChangeId}`);
    commitMessage += ` [${metadata.join(' ')}]`;
  }
  
  // Commit only this file
  await execAsync(`git commit --only "${filePath}" -m "${commitMessage}"`);
}
```
```

## Commit Message Generation

Generate commit messages based on role and file type with UUID metadata:

- Format: `speclang: {action} {target} [change_id:{uuid} parent:{parent_uuid}]`
- Examples:
  - Spec-Writer: "speclang: added auth entities [change_id:a1b2c3d parent:e4f5g6h]"
  - Code-Gen: "speclang: generated auth handler [change_id:b2c3d4e parent:a1b2c3d]"
  - Test-Writer: "speclang: added login tests [change_id:c3d4e5f parent:b2c3d4e]"
  - North-Star: "speclang: updated project references [change_id:d4e5f6g parent:c3d4e5f]"

UUID Generation:
- Generate UUID v4 for each agent action
- Pass parent UUID from trigger context
- Store in agent session for child agents to use

## Git Safety

- Ensure we are in a git repository
- Handle file paths with spaces
- Avoid committing binary files
- Rollback on failure

## References

- "@ref:speclang/git-history (for git conventions and UUID causality chains)"
- @ref:speclang/agent-protocol (for commit protocol requirements)
- @ref:speclang/headers (for causality header fields: caused_by, change_id, part_of)