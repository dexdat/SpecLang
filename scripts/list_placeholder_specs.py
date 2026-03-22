#!/usr/bin/env python3
"""
List placeholder specs (spec files with <20 lines).
These are candidates for expansion.
"""

import os
import glob
import sys

def find_placeholder_specs(directory='specs', max_lines=20):
    """Find all spec files with less than max_lines."""
    patterns = [
        os.path.join(directory, '**', '*.spec.md'),
        os.path.join(directory, '**', '*.spec.yaml'),
        os.path.join(directory, '**', '*.scl'),
    ]
    
    small_specs = []
    
    for pattern in patterns:
        for filepath in glob.glob(pattern, recursive=True):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = len(f.readlines())
                    if lines < max_lines:
                        # Calculate relative path from project root
                        rel_path = os.path.relpath(filepath, os.path.dirname(os.path.dirname(__file__)))
                        small_specs.append((rel_path, lines))
            except Exception as e:
                print(f"Error reading {filepath}: {e}", file=sys.stderr)
    
    # Sort by line count (smallest first)
    small_specs.sort(key=lambda x: x[1])
    
    return small_specs

if __name__ == '__main__':
    max_lines = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    specs = find_placeholder_specs(max_lines=max_lines)
    
    print(f"Found {len(specs)} placeholder specs (<{max_lines} lines):\n")
    
    # Group by line count
    by_count = {}
    for path, lines in specs:
        if lines not in by_count:
            by_count[lines] = []
        by_count[lines].append(path)
    
    for count in sorted(by_count.keys()):
        print(f"\n=== {count} lines ({len(by_count[count])} files) ===")
        for path in by_count[count]:
            print(f"  {path}")
    
    print(f"\nTotal: {len(specs)} placeholder specs")
