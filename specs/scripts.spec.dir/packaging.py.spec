# speclang-header lines:12
id: "@speclang/scripts.packaging.py"
version: 0.1.0
layer: 5
target: python
produces: scripts/packaging.py
parent: "@ref:specs/scripts.packaging"
status: draft
project_level: Alpha
agent_support: agent_assisted
tags: [scripts, packaging, release, npm]
short: Packaging Script Python Code
---

# Packaging Script Python Code

Code spec for generating `packaging.py`.

## Purpose

This script automates the packaging and release process for SpecLang.

## Implementation

### @block:scripts/packaging/main @kind:code
```python
#!/usr/bin/env python3
"""
SpecLang Packaging Script
Automates packaging and release process.
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a shell command and return output."""
    print(f"$ {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False, result.stdout
    return True, result.stdout

def check_hard_checks():
    """Run hard checks."""
    print("Running hard checks...")
    success, output = run_command("python3 scripts/hard-checks.py")
    if not success:
        print("Hard checks failed. Aborting packaging.")
        return False
    return True

def build_typescript():
    """Build TypeScript."""
    print("Building TypeScript...")
    success, output = run_command("npm run build")
    if not success:
        print("TypeScript build failed.")
        return False
    return True

def create_package():
    """Create npm package tarball."""
    print("Creating npm package...")
    success, output = run_command("npm pack")
    if not success:
        print("npm pack failed.")
        return False
    # Extract tarball name from output
    lines = output.strip().split('\n')
    for line in lines:
        if line.endswith('.tgz'):
            tarball = line.strip()
            print(f"Created tarball: {tarball}")
            return True, tarball
    return False, None

def publish_package(dry_run=True):
    """Publish package to NPM."""
    if dry_run:
        print("Dry-run publishing...")
        success, output = run_command("npm publish --dry-run")
        if not success:
            print("Dry-run publish failed.")
            return False
        print("Dry-run successful.")
        return True
    else:
        print("Publishing to NPM...")
        success, output = run_command("npm publish")
        if not success:
            print("Publish failed.")
            return False
        print("Published successfully.")
        return True

def tag_git_release():
    """Tag git release."""
    # Read version from package.json
    with open('package.json', 'r') as f:
        pkg = json.load(f)
    version = pkg['version']
    tag = f"v{version}"
    print(f"Creating git tag {tag}...")
    success, output = run_command(f"git tag {tag}")
    if not success:
        print("Git tag failed.")
        return False
    success, output = run_command(f"git push origin {tag}")
    if not success:
        print("Git push tag failed.")
        return False
    print("Git tag created and pushed.")
    return True

def create_github_release():
    """Create GitHub release."""
    # Read version from package.json
    with open('package.json', 'r') as f:
        pkg = json.load(f)
    version = pkg['version']
    tag = f"v{version}"
    print(f"Creating GitHub release {tag}...")
    # Check if gh is authenticated
    success, output = run_command("gh auth status")
    if not success:
        print("GitHub CLI not authenticated. Run 'gh auth login' first.")
        print("Skipping GitHub release creation.")
        return False
    # Create release with notes from CHANGELOG.md
    success, output = run_command(
        f"gh release create {tag} "
        f"--notes-file CHANGELOG.md "
        f"--title \"SpecLang {tag}\""
    )
    if not success:
        print("GitHub release creation failed.")
        return False
    print("GitHub release created successfully.")
    return True

def main():
    parser = argparse.ArgumentParser(description='SpecLang Packaging Script')
    parser.add_argument('--dry-run', action='store_true', help='Dry run only')
    parser.add_argument('--publish', action='store_true', help='Publish to NPM')
    parser.add_argument('--tag', action='store_true', help='Tag git release')
    parser.add_argument('--github', action='store_true', help='Create GitHub release')
    args = parser.parse_args()

    # Step 1: Hard checks
    if not check_hard_checks():
        sys.exit(1)

    # Step 2: Build
    if not build_typescript():
        sys.exit(1)

    # Step 3: Create package
    success, tarball = create_package()
    if not success:
        sys.exit(1)

    # Step 4: Publish (if requested)
    if args.publish:
        if not publish_package(dry_run=args.dry_run):
            sys.exit(1)

    # Step 5: Tag (if requested)
    if args.tag:
        if not tag_git_release():
            sys.exit(1)

    # Step 6: GitHub release (if requested)
    if args.github:
        if not create_github_release():
            sys.exit(1)

    print("Packaging process completed successfully.")

if __name__ == "__main__":
    main()
```