#!/usr/bin/env python3
"""
Run all validation checks and report summary.

This script runs all validation and compliance checks in the SpecLang project
and aggregates results into a single report.
"""

import subprocess
import sys
import json
import argparse
from typing import Dict, List, Any

# List of checks to run with their command and description
CHECKS = [
    {
        "name": "validate_specs",
        "cmd": ["python3", "scripts/validate_specs.py"],
        "description": "Validate spec syntax and headers"
    },
    {
        "name": "validate_autonomous",
        "cmd": ["python3", "scripts/validate_autonomous.py"],
        "description": "Validate autonomous agent support"
    },
    {
        "name": "validate_refs",
        "cmd": ["python3", "scripts/validate_refs.py"],
        "description": "Validate reference resolution"
    },
    {
        "name": "check_compliance",
        "cmd": ["python3", "scripts/check_compliance.py", "--report"],
        "description": "Check dual-view compliance"
    },
    {
        "name": "hard_checks",
        "cmd": ["python3", "scripts/hard_checks.py"],
        "description": "Run hard checks (critical validation)"
    }
]

def run_check(cmd: List[str]) -> Dict[str, Any]:
    """Run a single check and return result."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes per check
        )
        return {
            "success": result.returncode == 0,
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "returncode": -1,
            "stdout": "",
            "stderr": "Check timed out after 5 minutes"
        }
    except Exception as e:
        return {
            "success": False,
            "returncode": -1,
            "stdout": "",
            "stderr": f"Error running check: {str(e)}"
        }

def main() -> int:
    parser = argparse.ArgumentParser(description="Run all validation checks")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--category", choices=["validation", "compliance", "all"],
                        default="all", help="Category of checks to run")
    args = parser.parse_args()

    # Filter checks by category
    if args.category == "validation":
        checks = [c for c in CHECKS if c["name"].startswith("validate")]
    elif args.category == "compliance":
        checks = [c for c in CHECKS if c["name"].startswith("check")]
    else:
        checks = CHECKS

    results = []
    all_success = True

    for check in checks:
        print(f"Running {check['name']}...", file=sys.stderr)
        result = run_check(check["cmd"])
        result["name"] = check["name"]
        result["description"] = check["description"]
        results.append(result)
        if not result["success"]:
            all_success = False
        if args.json:
            # In JSON mode, only print final JSON
            pass
        else:
            status = "✓" if result["success"] else "✗"
            print(f"  {status} {check['name']}: {check['description']}")
            if not result["success"]:
                if result["stderr"]:
                    print(f"    Error: {result['stderr'][:200]}")

    if args.json:
        output = {
            "success": all_success,
            "results": results
        }
        print(json.dumps(output, indent=2))
    else:
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        for result in results:
            status = "PASS" if result["success"] else "FAIL"
            print(f"{result['name']:30} {status}")
        print(f"\nTotal: {len(results)} checks, {sum(1 for r in results if r['success'])} passed")

    return 0 if all_success else 1

if __name__ == "__main__":
    sys.exit(main())