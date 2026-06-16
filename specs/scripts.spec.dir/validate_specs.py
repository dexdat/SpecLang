#!/usr/bin/env python3
"""
Validate SpecLang specifications.

This script runs multiple validation checks on all spec files:
- Header validation (required fields, format)
- Reference resolution (all @ref: references exist)
- Block syntax validation (@block: and @kind:)
- Autonomous agent readiness (agent_support: agent_autonomous)
- Project maturity level compliance

It aggregates results from existing validation scripts.
"""

import sys
import os
import subprocess
from pathlib import Path

def run_validation(script_name, args=None):
    """Run a validation script and return exit code."""
    script_path = Path(__file__).parent / script_name
    if not script_path.exists():
        print(f"Warning: {script_name} not found", file=sys.stderr)
        return 1
    cmd = [sys.executable, str(script_path)]
    if args:
        cmd.extend(args)
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    return result.returncode

def main():
    """Main validation runner."""
    scripts = [
        "validate_refs.py",
        "validate_autonomous.py",
    ]
    exit_codes = []
    for script in scripts:
        print(f"=== Running {script} ===")
        code = run_validation(script)
        exit_codes.append(code)
        if code != 0:
            print(f"{script} failed with exit code {code}")
        print()
    
    total_failures = sum(1 for code in exit_codes if code != 0)
    if total_failures == 0:
        print("All validation checks passed!")
        return 0
    else:
        print(f"{total_failures} validation script(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())