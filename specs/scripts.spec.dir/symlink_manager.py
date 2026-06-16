#!/usr/bin/env python3
# speclang-header lines:14
# target: scripts/symlink_manager.py
# id: @speclang/scripts/symlink-manager
# version: 0.1.0
# layer: 2
# tags: [symlinks, management, rebuild, cross-platform]
# short: Symlink creation and management for dual-view system
# depends_on: ["@speclang/symlinks"]
# project_level: Alpha
# agent_support: agent_assisted
# ---
"""
Symlink Manager for SpecLang dual-view system.

Reads `target:` field from spec headers and creates symlinks
from target paths to spec file locations.

Usage:
    python3 symlink_manager.py              # Create symlinks
    python3 symlink_manager.py --rebuild    # Full rebuild
    python3 symlink_manager.py --clean      # Remove all symlinks
    python3 symlink_manager.py --verify     # Verify symlinks
"""

import os
import sys
import re
import json
import platform
import argparse
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Set
from datetime import datetime

# ============================================================================
# HEADER PARSING
# ============================================================================

def parse_header(filepath: str) -> Tuple[int, dict]:
    """Parse speclang header from file, extracting metadata including target."""
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    
    header_lines = 0
    metadata = {}
    
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            match = re.search(r'lines:\s*(\d+)', line)
            if match:
                header_lines = int(match.group(1))
            
            yaml_lines = []
            j = i + 1
            end_idx = min(j + header_lines - 1, len(lines)) if header_lines else len(lines)
            
            for k in range(j, end_idx):
                line_text = lines[k].rstrip('\n')
                if line_text.strip() == '---':
                    break
                yaml_lines.append(line_text)
            
            if yaml_lines:
                yaml_text = '\n'.join(yaml_lines)
                try:
                    # Simple YAML parsing for common fields
                    metadata = parse_simple_yaml(yaml_text)
                except Exception:
                    metadata = {}
            
            break
    
    return header_lines, metadata


def parse_simple_yaml(yaml_text: str) -> dict:
    """Simple YAML parser for spec headers."""
    metadata = {}
    lines = yaml_text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Handle Python comment-style headers: # key: value
        if line.startswith('#'):
            line = line[1:].strip()
        
        if not line:
            continue
        
        # Handle key: value
        if ':' in line:
            key, _, value = line.partition(':')
            key = key.strip()
            value = value.strip()
            
            # Remove quotes if present
            if value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1]
            
            # Handle arrays [a, b, c]
            if value.startswith('[') and value.endswith(']'):
                inner = value[1:-1]
                items = [item.strip().strip('"\'') for item in inner.split(',')]
                metadata[key] = items
            else:
                metadata[key] = value
    
    return metadata


# ============================================================================
# SYMLINK OPERATIONS
# ============================================================================

def get_symlink_type() -> str:
    """Determine symlink type based on platform."""
    system = platform.system().lower()
    if system == 'windows':
        # Check if we can create symlinks (requires admin or developer mode)
        try:
            test_file = Path('_test_symlink')
            test_file.touch()
            test_link = Path('_test_link')
            test_link.symlink_to(test_file)
            test_link.unlink()
            test_file.unlink()
            return 'symlink'
        except:
            return 'junction'
    return 'symlink'


def create_symlink(source: Path, target: Path, dry_run: bool = False) -> Tuple[bool, str]:
    """
    Create symlink from target to source.
    Returns (success, message).
    """
    # Ensure source exists
    if not source.exists():
        return False, f"Source does not exist: {source}"
    
    # Ensure target parent directory exists
    target.parent.mkdir(parents=True, exist_ok=True)
    
    # Check if target already exists
    if target.exists() or target.is_symlink():
        if target.is_symlink():
            # Check if it points to the right place
            try:
                existing_target = os.readlink(target)
                if Path(existing_target).resolve() == source.resolve():
                    return True, f"Symlink already correct: {target}"
            except:
                pass
            # Remove old symlink
            if not dry_run:
                target.unlink()
        elif target.is_file():
            return False, f"Target is a real file (not overwriting): {target}"
        elif target.is_dir():
            return False, f"Target is a real directory (not overwriting): {target}"
    
    if dry_run:
        return True, f"Would create: {target} -> {source}"
    
    # Create symlink
    try:
        symlink_type = get_symlink_type()
        if symlink_type == 'junction' and platform.system().lower() == 'windows':
            # Use junction on Windows
            subprocess.run(['mklink', '/J', str(target), str(source)], 
                         shell=True, check=True, capture_output=True)
        else:
            # Use Python's symlink
            target.symlink_to(source)
        return True, f"Created: {target} -> {source}"
    except Exception as e:
        return False, f"Failed to create symlink: {e}"


def remove_symlink(path: Path) -> Tuple[bool, str]:
    """Remove a symlink if it exists."""
    if not path.exists() and not path.is_symlink():
        return True, f"Not found: {path}"
    
    if not path.is_symlink():
        return False, f"Not a symlink: {path}"
    
    try:
        path.unlink()
        return True, f"Removed: {path}"
    except Exception as e:
        return False, f"Failed to remove: {e}"


# ============================================================================
# SCANNING AND MANAGEMENT
# ============================================================================

def scan_specs(specs_dir: Path) -> List[Tuple[Path, str]]:
    """
    Scan specs directory for files with target headers.
    Returns list of (spec_path, target_path) tuples.
    """
    results = []
    
    for root, dirs, files in os.walk(specs_dir):
        for filename in files:
            filepath = Path(root) / filename
            
            # Skip non-spec files
            if not any(str(filepath).endswith(ext) for ext in ['.spec', '.spec.md', '.spec.yaml', '.py', '.go', '.ts', '.rs']):
                continue
            
            try:
                _, metadata = parse_header(str(filepath))
                target = metadata.get('target')
                if target:
                    results.append((filepath, target))
            except Exception as e:
                print(f"Warning: Failed to parse {filepath}: {e}", file=sys.stderr)
    
    return results


def find_managed_symlinks(project_root: Path, tracker_file: Path) -> Set[Path]:
    """Find all symlinks managed by this tool (from tracker file)."""
    if not tracker_file.exists():
        return set()
    
    try:
        with open(tracker_file, 'r') as f:
            data = json.load(f)
        return {Path(p) for p in data.get('symlinks', [])}
    except:
        return set()


def update_tracker(tracker_file: Path, symlinks: List[Path]):
    """Update the tracker file with current symlinks."""
    data = {
        'updated': datetime.now().isoformat(),
        'count': len(symlinks),
        'symlinks': [str(p) for p in symlinks]
    }
    tracker_file.parent.mkdir(parents=True, exist_ok=True)
    with open(tracker_file, 'w') as f:
        json.dump(data, f, indent=2)


# ============================================================================
# CLI COMMANDS
# ============================================================================

def cmd_create(args):
    """Create symlinks for all specs with target headers."""
    project_root = Path(args.project_root or '.')
    specs_dir = project_root / 'specs'
    tracker_file = project_root / '.speclang' / 'symlinks.json'
    
    if not specs_dir.exists():
        print(f"Error: specs directory not found: {specs_dir}", file=sys.stderr)
        return 1
    
    print("Scanning specs for target headers...")
    targets = scan_specs(specs_dir)
    
    if not targets:
        print("No specs with target headers found.")
        return 0
    
    print(f"Found {len(targets)} specs with target headers.")
    
    created = []
    skipped = []
    errors = []
    
    for spec_path, target_path in targets:
        target = project_root / target_path
        success, message = create_symlink(spec_path, target, dry_run=args.dry_run)
        
        if success:
            if 'already' in message:
                skipped.append((spec_path, target_path))
            else:
                created.append((spec_path, target_path))
            print(f"  [OK] {message}")
        else:
            errors.append((spec_path, target_path, message))
            print(f"  [ERR] {message}", file=sys.stderr)
        
        if success and not args.dry_run:
            created.append(target)
    
    # Update tracker
    if not args.dry_run and created:
        update_tracker(tracker_file, [project_root / t for _, t in targets])
    
    print(f"\nSummary:")
    print(f"  Created: {len(created)}")
    print(f"  Skipped: {len(skipped)}")
    print(f"  Errors:  {len(errors)}")
    
    return 0 if not errors else 1


def cmd_rebuild(args):
    """Full rebuild - remove old symlinks and recreate."""
    project_root = Path(args.project_root or '.')
    tracker_file = project_root / '.speclang' / 'symlinks.json'
    
    # Clean existing
    print("Cleaning existing symlinks...")
    managed = find_managed_symlinks(project_root, tracker_file)
    for symlink_path in managed:
        success, message = remove_symlink(symlink_path)
        print(f"  {message}")
    
    # Recreate
    print("\nRebuilding symlinks...")
    return cmd_create(args)


def cmd_clean(args):
    """Remove all managed symlinks."""
    project_root = Path(args.project_root or '.')
    tracker_file = project_root / '.speclang' / 'symlinks.json'
    
    managed = find_managed_symlinks(project_root, tracker_file)
    
    if not managed:
        print("No managed symlinks found.")
        return 0
    
    print(f"Removing {len(managed)} symlinks...")
    for symlink_path in managed:
        success, message = remove_symlink(symlink_path)
        print(f"  {message}")
    
    # Clear tracker
    update_tracker(tracker_file, [])
    print("Done.")
    return 0


def cmd_verify(args):
    """Verify all symlinks are valid."""
    project_root = Path(args.project_root or '.')
    tracker_file = project_root / '.speclang' / 'symlinks.json'
    
    managed = find_managed_symlinks(project_root, tracker_file)
    
    if not managed:
        print("No managed symlinks found.")
        return 0
    
    print(f"Verifying {len(managed)} symlinks...")
    valid = 0
    broken = 0
    
    for symlink_path in managed:
        if not symlink_path.is_symlink():
            print(f"  [BROKEN] Not a symlink: {symlink_path}")
            broken += 1
            continue
        
        try:
            target = Path(os.readlink(symlink_path))
            if not target.exists():
                print(f"  [BROKEN] Target missing: {symlink_path} -> {target}")
                broken += 1
            else:
                valid += 1
                if args.verbose:
                    print(f"  [OK] {symlink_path} -> {target}")
        except Exception as e:
            print(f"  [ERR] {symlink_path}: {e}")
            broken += 1
    
    print(f"\nSummary:")
    print(f"  Valid:  {valid}")
    print(f"  Broken: {broken}")
    
    return 0 if broken == 0 else 1


def main():
    parser = argparse.ArgumentParser(
        description='Symlink Manager for SpecLang dual-view system'
    )
    parser.add_argument('--project-root', '-r', help='Project root directory')
    parser.add_argument('--dry-run', '-n', action='store_true', help='Show what would be done')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # create
    create_parser = subparsers.add_parser('create', help='Create symlinks')
    create_parser.set_defaults(func=cmd_create)
    
    # rebuild
    rebuild_parser = subparsers.add_parser('rebuild', help='Full rebuild')
    rebuild_parser.set_defaults(func=cmd_rebuild)
    
    # clean
    clean_parser = subparsers.add_parser('clean', help='Remove symlinks')
    clean_parser.set_defaults(func=cmd_clean)
    
    # verify
    verify_parser = subparsers.add_parser('verify', help='Verify symlinks')
    verify_parser.add_argument('--verbose', '-v', action='store_true', help='Show all symlinks')
    verify_parser.set_defaults(func=cmd_verify)
    
    args = parser.parse_args()
    
    if not args.command:
        # Default: create
        args.func = cmd_create
        args.dry_run = False
    
    return args.func(args)


if __name__ == '__main__':
    sys.exit(main())
