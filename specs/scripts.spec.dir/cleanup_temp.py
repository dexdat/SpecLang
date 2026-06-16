#!/usr/bin/env python3
"""
Clean up temporary files and directories.

This script removes temporary files, directories, and cache files that
accumulate during SpecLang development and validation runs.
"""

import os
import shutil
import sys
import argparse
from pathlib import Path

# Default directories to clean (relative to project root)
DEFAULT_CLEAN_DIRS = [
    "scripts/temp",
    "__pycache__",
    ".cache",
    "*.pyc",
    "*.pyo",
    "*.pyd",
    ".coverage",
    ".pytest_cache",
    "dist",
    "build",
    "*.egg-info",
    ".mypy_cache",
    ".ruff_cache"
]

# Directories to NEVER delete
PROTECTED_DIRS = [
    "specs",
    "src",
    ".git",
    ".github",
    ".vscode",
    ".cursor",
    ".opencode",
    ".ralph",
    "docs",
    "tests",
    "node_modules",
    "package-lock.json",
    "yarn.lock"
]

def find_files_to_clean(root: Path, patterns: list) -> list:
    """Find files and directories matching patterns."""
    files = []
    for pattern in patterns:
        if pattern.endswith("__"):
            # Directory pattern
            for dirpath in root.rglob(pattern):
                if dirpath.is_dir():
                    files.append(dirpath)
        elif "*" in pattern:
            for filepath in root.glob(pattern):
                files.append(filepath)
        else:
            dirpath = root / pattern
            if dirpath.exists():
                files.append(dirpath)
    return files

def is_protected(path: Path, root: Path) -> bool:
    """Check if path is in protected directory."""
    for protected in PROTECTED_DIRS:
        protected_path = root / protected
        if protected_path in path.parents or protected_path == path:
            return True
    return False

def format_size(bytes: int) -> str:
    """Format file size in human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes < 1024.0:
            return f"{bytes:.1f}{unit}"
        bytes /= 1024.0
    return f"{bytes:.1f}TB"

def main() -> int:
    parser = argparse.ArgumentParser(description="Clean up temporary files")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be deleted without deleting")
    parser.add_argument("--force", action="store_true",
                        help="Skip confirmation prompt")
    parser.add_argument("--dir", action="append",
                        help="Additional directories to clean")
    args = parser.parse_args()

    root = Path.cwd()
    clean_dirs = DEFAULT_CLEAN_DIRS.copy()
    if args.dir:
        clean_dirs.extend(args.dir)

    # Find files
    files = find_files_to_clean(root, clean_dirs)
    # Filter out protected files
    files = [f for f in files if not is_protected(f, root)]
    # Remove duplicates (some may be matched by multiple patterns)
    files = list(set(files))

    if not files:
        print("No temporary files found to clean.")
        return 0

    # Calculate total size
    total_size = 0
    for f in files:
        if f.is_file():
            total_size += f.stat().st_size
        elif f.is_dir():
            for dirpath, _, filenames in os.walk(f):
                for filename in filenames:
                    fp = Path(dirpath) / filename
                    if fp.is_file():
                        total_size += fp.stat().st_size

    print(f"Found {len(files)} temporary files/directories to clean.")
    print(f"Total size: {format_size(total_size)}")
    print("\nFiles/directories:")
    for f in sorted(files):
        if f.is_dir():
            print(f"  [DIR]  {f.relative_to(root)}")
        else:
            print(f"  [FILE] {f.relative_to(root)}")

    if args.dry_run:
        print("\nDry run complete. No files were deleted.")
        return 0

    if not args.force:
        response = input("\nProceed with deletion? (y/N): ").strip().lower()
        if response != 'y':
            print("Cancelled.")
            return 0

    # Delete files and directories
    deleted_count = 0
    deleted_size = 0
    for f in files:
        try:
            if f.is_file():
                size = f.stat().st_size
                f.unlink()
                deleted_size += size
            elif f.is_dir():
                # Calculate directory size before deletion
                dir_size = 0
                for dirpath, _, filenames in os.walk(f):
                    for filename in filenames:
                        fp = Path(dirpath) / filename
                        if fp.is_file():
                            dir_size += fp.stat().st_size
                shutil.rmtree(f)
                deleted_size += dir_size
            deleted_count += 1
        except Exception as e:
            print(f"Error deleting {f}: {e}", file=sys.stderr)

    print(f"\nDeleted {deleted_count} files/directories.")
    print(f"Freed {format_size(deleted_size)} disk space.")
    return 0

if __name__ == "__main__":
    sys.exit(main())