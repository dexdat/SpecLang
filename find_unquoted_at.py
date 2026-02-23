#!/usr/bin/env python3
"""
Find unquoted @ values in spec headers.
"""

import re
import sys
from pathlib import Path

def find_unquoted_at(filepath):
    """Find lines with unquoted @ values."""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    header_start = -1
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            header_start = i
            break
    
    if header_start == -1:
        return []
    
    # Find header end (--- line)
    header_end = -1
    for i in range(header_start, len(lines)):
        if lines[i].strip() == '---':
            header_end = i
            break
    
    if header_end == -1:
        return []
    
    issues = []
    for i in range(header_start + 1, header_end):
        line = lines[i].rstrip('\n')
        # Skip comment lines
        if line.strip().startswith('#'):
            continue
        
        # Check for unquoted @ in key: @value pattern
        if re.match(r'^\s*[a-zA-Z_-]+:\s*@[^\s"\'\]\},]', line):
            issues.append((i+1, line, "Unquoted @ value in key:value"))
        
        # Check for unquoted @ in array items
        if re.match(r'^\s*-\s*@[^\s"\'\]\},]', line):
            issues.append((i+1, line, "Unquoted @ in array item"))
        
        # Check for unquoted @ in flow sequences [@value, ...]
        if '[' in line and '@' in line:
            # Simple check: @ not preceded by quote
            if re.search(r'[\[,\s]@[^\s"\'\]\},]', line):
                issues.append((i+1, line, "Unquoted @ in flow sequence"))
    
    return issues

def main():
    root = Path("specs")
    spec_files = list(root.glob("**/*.spec.md")) + list(root.glob("**/*.spec.yaml")) + list(root.glob("**/*.scl"))
    
    print(f"Checking {len(spec_files)} spec files for unquoted @ values...")
    print()
    
    total_issues = 0
    for filepath in spec_files:
        issues = find_unquoted_at(filepath)
        if issues:
            rel_path = filepath.relative_to(root.parent)
            print(f"{rel_path}:")
            for line_num, line, msg in issues:
                print(f"  Line {line_num}: {msg}")
                print(f"    {line}")
            total_issues += len(issues)
            print()
    
    print(f"Found {total_issues} unquoted @ issues in total.")
    return 0 if total_issues == 0 else 1

if __name__ == "__main__":
    sys.exit(main())