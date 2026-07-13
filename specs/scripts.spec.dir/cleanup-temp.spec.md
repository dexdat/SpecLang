# speclang-header lines:12
id: "@speclang/scripts-cleanup-temp"
version: 0.1.0
layer: 2
tags: [scripts, utility, cleanup]
parent: "@ref:speclang/scripts
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Clean up temporary files and directories
target: scripts/cleanup_temp.py
---

# Cleanup Temp Script

Script that cleans up temporary files and directories created during SpecLang operations.

## Overview

```speclang
# @block:overview @kind:note
The cleanup-temp script removes temporary files, directories, and cache files that accumulate during development and validation runs. This helps keep the project directory clean and reduces disk usage.
```

## Purpose

```speclang
# @block:purpose @kind:note
Temporary files are created by various scripts (e.g., validation, indexing) and can accumulate over time. This script provides a safe way to remove them while preserving important artifacts.
```

## Usage

```speclang
# @block:usage @kind:code
```bash
# Dry run: show what would be deleted
python3 scripts/cleanup_temp.py --dry-run

# Actually delete files
python3 scripts/cleanup_temp.py

# Clean specific directories
python3 scripts/cleanup_temp.py --dir scripts/temp --dir .cache
```
```

## Implementation

```speclang
# @block:implementation @kind:note
The script will:
1. Identify temporary directories (scripts/temp, .cache, __pycache__, etc.)
2. List files to be deleted (with size information)
3. Prompt for confirmation (unless --force)
4. Delete files and directories
5. Report cleanup statistics
```

## Safety

```speclang
# @block:safety @kind:note
Safety features:
- Dry-run mode by default
- Confirmation prompt for deletion
- Exclusion of important files (specs/, src/, .git/)
- Size limits to prevent accidental large deletions
```