---
name: sip-082-cli-history-speclang-v0
title: "SIP 82: CLI History Command"
version: 0.1.0
description: Git integration and change tracking with speclang history
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 82: CLI History Command

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the `speclang history` command for spec change tracking.

### Quick Start

```bash
# Show spec history
speclang history specs/auth.spec.md

# Show all changes
speclang history --all

# Compare versions
speclang history --compare v1.0.0..v1.1.0
```

### Key Features

| Feature | Description |
|---------|-------------|
| Git Log | Integration with git history |
| Blame | Line-level change tracking |
| Diff | Version comparison |
| Timeline | Visual change timeline |

### When to Read This

- **Auditing:** Change history
- **Debugging:** When did this change?
- **Reviews:** Understanding evolution

### Related SIPs

- SIP 37: CLI
- SIP 30: Git History
- SIP 64: CLI Commands

## Abstract

This SIP defines the `speclang history` command that provides git-integrated change tracking for specification files.

## Motivation

Users need:
- Change audit trail
- Line-level attribution
- Version comparison
- Evolution understanding

## Rationale

**Git Integration:**
- Leverages existing history
- No duplicate storage
- Familiar workflows

**Spec-Focused:**
- Filter by spec changes
- Block-level tracking
- Semantic diffs

## Specification

### Command Signature

**@cli/history:**

```bash
speclang history [spec] [options]

Arguments:
  spec         Specific spec file (default: all)

Options:
  --all        Show all changes, not just specs
  --block      Filter by block ID
  --author     Filter by author
  --since      Changes since date/commit
  --until      Changes until date/commit
  --compare    Compare two versions (v1..v2)
  --format     Output format: text, json, timeline
  --follow     Follow renames
  --stat       Show diff statistics

Aliases:
  speclang log
  speclang changes
```

### History Output

**@history/output:**

#### Text Format

```
speclang history specs/auth.spec.md

History for specs/auth.spec.md:

v1.2.0  2024-01-15  Add OAuth2 support
        Author: Alice <alice@example.com>
        Blocks changed: @auth/oauth2, @auth/refresh

a1b2c3d 2024-01-10  Refactor auth entities
        Author: Bob <bob@example.com>
        Blocks changed: @auth/user, @auth/session

v1.1.0  2024-01-05  Initial auth spec
        Author: Alice <alice@example.com>
        Blocks changed: (new file)
```

#### JSON Format

```json
{
  "file": "specs/auth.spec.md",
  "commits": [
    {
      "hash": "v1.2.0",
      "date": "2024-01-15T10:30:00Z",
      "author": {
        "name": "Alice",
        "email": "alice@example.com"
      },
      "message": "Add OAuth2 support",
      "blocks": ["@auth/oauth2", "@auth/refresh"],
      "stats": {
        "additions": 45,
        "deletions": 12,
        "files": 1
      }
    }
  ]
}
```

### Block History

**@history/block:**

```bash
# History for specific block
speclang history --block=@auth/login

Block @auth/login history:

v1.2.0  Added OAuth2 integration
v1.1.0  Added 2FA support
v1.0.0  Initial implementation
```

### Comparison

**@history/compare:**

```bash
# Compare versions
speclang history --compare v1.0.0..v1.1.0

Comparing v1.0.0 to v1.1.0:

specs/auth.spec.md
  + @auth/oauth2 (new)
  ~ @auth/login (modified)
  ~ @auth/user (modified)

specs/features.spec.md
  + @features/social-login (new)

Summary:
  3 files changed
  12 blocks added
  5 blocks modified
  0 blocks removed
```

### Blame

**@history/blame:**

```bash
# Show line-level attribution
speclang history specs/auth.spec.md --blame

v1.2.0 Alice     1 | # Auth Specification
v1.2.0 Alice     2 | 
v1.1.0 Bob       3 | ## @auth/login
v1.1.0 Bob       4 | Login functionality.
v1.2.0 Alice     5 | Supports OAuth2.
v1.0.0 Alice     6 | 
v1.0.0 Alice     7 | ## @auth/user
```

### Timeline

**@history/timeline:**

```bash
speclang history --format=timeline

2024-01
  ├─ 15 v1.2.0 - OAuth2 support
  │    auth.spec.md (+45, -12)
  ├─ 10 a1b2c3d - Refactor auth
  │    auth.spec.md (+23, -8)
  └─ 05 v1.1.0 - Initial auth
       auth.spec.md (new, +120)
```

### Filters

**@history/filters:**

```bash
# By author
speclang history --author=alice

# By date range
speclang history --since=2024-01-01 --until=2024-01-31

# By tag
speclang history --since=v1.0.0

# Combined
speclang history --author=bob --since=v1.0.0 --block=@auth
```

### Statistics

**@history/stat:**

```bash
speclang history --stat

Overall Statistics:
  Commits: 156
  Authors: 5
  Files changed: 23
  Blocks added: 89
  Blocks modified: 134
  Blocks removed: 12

Top Authors:
  Alice    78 commits (50%)
  Bob      45 commits (29%)
  Carol    23 commits (15%)
  Dave     10 commits (6%)

Most Changed Files:
  specs/auth.spec.md      34 changes
  specs/features.spec.md  28 changes
  specs/entities.spec.md  21 changes
```

## Implementation

### Command Handler

```typescript
import simpleGit from 'simple-git';

interface HistoryOptions {
  all: boolean;
  block?: string;
  author?: string;
  since?: string;
  until?: string;
  compare?: string;
  format: 'text' | 'json' | 'timeline';
  follow: boolean;
  stat: boolean;
}

export async function historyCommand(
  spec: string | undefined,
  options: HistoryOptions
) {
  const git = simpleGit();

  if (options.compare) {
    return compareVersions(git, options.compare, options);
  }

  const log = await git.log({
    file: spec,
    '--follow': options.follow ? null : undefined,
    '--author': options.author,
    '--since': options.since,
    '--until': options.until,
  });

  if (options.stat) {
    return showStatistics(log, options);
  }

  const history = await processHistory(log, options);

  switch (options.format) {
    case 'json':
      console.log(JSON.stringify(history, null, 2));
      break;
    case 'timeline':
      printTimeline(history);
      break;
    default:
      printText(history);
  }
}
```

### History Processing

```typescript
interface SpecHistory {
  file: string;
  commits: CommitInfo[];
}

interface CommitInfo {
  hash: string;
  date: string;
  author: AuthorInfo;
  message: string;
  blocks: string[];
  stats: DiffStats;
}

async function processHistory(
  log: LogResult,
  options: HistoryOptions
): Promise<SpecHistory[]> {
  const git = simpleGit();
  const results: Map<string, SpecHistory> = new Map();

  for (const commit of log.all) {
    const diff = await git.diff([commit.hash + '^', commit.hash]);
    const specFiles = extractSpecFiles(diff);

    for (const file of specFiles) {
      if (!results.has(file)) {
        results.set(file, { file, commits: [] });
      }

      const blocks = extractChangedBlocks(diff, file);
      
      if (options.block && !blocks.includes(options.block)) {
        continue;
      }

      results.get(file)!.commits.push({
        hash: commit.hash,
        date: commit.date,
        author: {
          name: commit.author_name,
          email: commit.author_email,
        },
        message: commit.message,
        blocks,
        stats: parseDiffStats(diff),
      });
    }
  }

  return Array.from(results.values());
}
```

### Block Extraction

```typescript
function extractChangedBlocks(diff: string, file: string): string[] {
  const blocks: string[] = [];
  const blockPattern = /##\s+(@[\w/-]+)/g;
  
  const fileDiff = extractFileDiff(diff, file);
  const changes = fileDiff.split('\n').filter(l => l.startsWith('+') || l.startsWith('-'));
  
  for (const line of changes) {
    const match = blockPattern.exec(line);
    if (match) {
      blocks.push(match[1]);
    }
  }

  return [...new Set(blocks)];
}
```

### Comparison

```typescript
async function compareVersions(
  git: SimpleGit,
  range: string,
  options: HistoryOptions
): Promise<void> {
  const [from, to] = range.split('..');
  
  const diff = await git.diff([from, to, '--', 'specs/']);
  const changes = parseSpecDiff(diff);

  console.log(`Comparing ${from} to ${to}:\n`);

  for (const [file, change] of Object.entries(changes)) {
    console.log(`${file}`);
    for (const block of change.added) {
      console.log(`  + ${block} (new)`);
    }
    for (const block of change.modified) {
      console.log(`  ~ ${block} (modified)`);
    }
    for (const block of change.removed) {
      console.log(`  - ${block} (removed)`);
    }
    console.log();
  }

  const summary = calculateSummary(changes);
  console.log('Summary:');
  console.log(`  ${summary.files} files changed`);
  console.log(`  ${summary.added} blocks added`);
  console.log(`  ${summary.modified} blocks modified`);
  console.log(`  ${summary.removed} blocks removed`);
}
```

### Timeline Formatter

```typescript
function printTimeline(history: SpecHistory[]): void {
  const byMonth = groupByMonth(history);
  const months = Object.keys(byMonth).sort().reverse();

  for (const month of months) {
    console.log(month);
    const commits = byMonth[month];
    
    commits.forEach((commit, i) => {
      const prefix = i === commits.length - 1 ? '└─' : '├─';
      const shortHash = commit.hash.slice(0, 7);
      const stats = `(+${commit.stats.additions}, -${commit.stats.deletions})`;
      
      console.log(`  ${prefix} ${commit.date.slice(8, 10)} ${shortHash} - ${commit.message}`);
      for (const file of commit.files) {
        console.log(`  │    ${file} ${stats}`);
      }
    });
  }
}
```

### Statistics

```typescript
interface HistoryStats {
  commits: number;
  authors: Map<string, number>;
  files: Map<string, number>;
  blocksAdded: number;
  blocksModified: number;
  blocksRemoved: number;
}

async function showStatistics(
  log: LogResult,
  options: HistoryOptions
): Promise<void> {
  const stats: HistoryStats = {
    commits: log.all.length,
    authors: new Map(),
    files: new Map(),
    blocksAdded: 0,
    blocksModified: 0,
    blocksRemoved: 0,
  };

  for (const commit of log.all) {
    const author = commit.author_name;
    stats.authors.set(author, (stats.authors.get(author) || 0) + 1);

    const files = await getChangedFiles(commit.hash);
    for (const file of files) {
      stats.files.set(file, (stats.files.get(file) || 0) + 1);
    }
  }

  console.log('Overall Statistics:');
  console.log(`  Commits: ${stats.commits}`);
  console.log(`  Authors: ${stats.authors.size}`);
  console.log(`  Files changed: ${stats.files.size}`);

  console.log('\nTop Authors:');
  const sortedAuthors = [...stats.authors.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  for (const [author, count] of sortedAuthors) {
    const percent = Math.round((count / stats.commits) * 100);
    console.log(`  ${author.padEnd(20)} ${count} commits (${percent}%)`);
  }

  console.log('\nMost Changed Files:');
  const sortedFiles = [...stats.files.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  for (const [file, count] of sortedFiles) {
    console.log(`  ${file.padEnd(30)} ${count} changes`);
  }
}
```

## Git Integration

### Required Git Config

```bash
# Enable blame annotations
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Record spec metadata
speclang history --stat > .speclang/history-stats.txt
git add .speclang/history-stats.txt
```

### CI Integration

```yaml
history-report:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    - run: npm install -g speclang
    - run: speclang history --format=json --since=${{ github.event.before }} > changes.json
    - uses: actions/upload-artifact@v3
      with:
        name: history-report
        path: changes.json
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Not a git repository |
| 2 | Invalid commit range |
| 3 | File not found |

## References

- @ref:sip-037-cli
- @ref:sip-030-git-history
- @ref:sip-064-cli-commands

## Copyright

This document is in the public domain.
