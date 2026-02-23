# speclang-header lines:3
# target: scripts/compute_header_lines.py
#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path

def compute_header_lines(content):
    """Return number of lines in header (including speclang-header line and terminator)."""
    lines = content.splitlines()
    header_start = -1
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            header_start = i
            break
    if header_start == -1:
        return None
    
    # Find terminator '---' after header_start
    terminator = -1
    for i in range(header_start, len(lines)):
        if lines[i].strip() == '---':
            terminator = i
            break
    if terminator == -1:
        return None
    
    # lines:N counts from header_start to terminator inclusive
    line_count = terminator - header_start + 1
    return line_count

def main():
    spec_dir = Path('specs')
    spec_files = list(spec_dir.glob('**/*.spec.md')) + list(spec_dir.glob('**/*.scl'))
    
    for spec_file in spec_files:
        with open(spec_file, 'r') as f:
            content = f.read()
        
        line_count = compute_header_lines(content)
        if line_count is None:
            print(f"{spec_file}: No header found")
            continue
        
        # Check if header already has lines:N
        lines = content.splitlines()
        header_line = None
        for i, line in enumerate(lines):
            if 'speclang-header' in line:
                header_line = line
                break
        
        if header_line and 'lines:' in header_line:
            print(f"{spec_file}: Already has lines:N")
        else:
            print(f"{spec_file}: Missing lines:N, should be {line_count}")

if __name__ == '__main__':
    main()