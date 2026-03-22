# speclang-header lines:12
id: "@speclang/scripts.verify-system.py"
version: 0.1.0
layer: 5
target: python
output_path: scripts/verify_system.py
parent: "@ref:specs/scripts.verify-system"
status: draft
project_level: Alpha
agent_support: agent_assisted
tags: [scripts, verification, testing]
short: System Verification Python Code
---

# System Verification Python Code

Code spec for generating `verify_system.py`.

## Purpose

This script runs end-to-end verification tests.

## Implementation

### @block:scripts/verify-system/main @kind:code
```python
#!/usr/bin/env python3
"""
SpecLang System Verification Script
Tests if the SpecLang system actually works end-to-end.
"""

import subprocess
import sys
import os
from pathlib import Path

# Colors
GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
NC = '\033[0m'

def run_test(name, command, cwd=None):
    """Run a test command and report results."""
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print('='*60)
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=cwd or Path(__file__).parent.parent
        )
        
        if result.returncode == 0:
            print(f"{GREEN}✓ PASSED{NC}")
            return True
        else:
            print(f"{RED}✗ FAILED{NC}")
            if result.stderr:
                print(f"Error: {result.stderr[:200]}")
            return False
    except Exception as e:
        print(f"{RED}✗ ERROR: {e}{NC}")
        return False

def main():
    print("SpecLang System Verification")
    print("=" * 60)
    
    tests = [
        ("TypeScript Build", "npm run build"),
        ("Test Suite", "npm test"),
        ("CLI Help", "./bin/speclang --help"),
        ("Reference Validation", "python3 scripts/validate_refs.py"),
        ("Spec Index Generation", "python3 generate_index.py"),
        ("Database Check", "test -f .speclang/speclang.db"),
    ]
    
    results = []
    for name, command in tests:
        results.append((name, run_test(name, command)))
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print('='*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{GREEN}✓{NC}" if result else f"{RED}✗{NC}"
        print(f"{status} {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print(f"\n{GREEN}✓ ALL TESTS PASSED - System is working!{NC}")
        return 0
    else:
        print(f"\n{YELLOW}⚠ Some tests failed - see details above{NC}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
```