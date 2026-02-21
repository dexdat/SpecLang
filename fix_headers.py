#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path

def quote_at_values(line):
    """Quote @-prefixed values in YAML lines."""
    # Pattern for key: @value
    line = re.sub(r'^(\s*[a-zA-Z_-]+:\s*)(@[^\s]+)(\s*)$', r'\1"\2"\3', line, flags=re.MULTILINE)
    # Pattern for [@value, ...] or {@value: ...}
    line = re.sub(r'([\{\[ ])(@[^\s,\]\}]+)([,\]\}])', r'\1"\2"\3', line)
    line = re.sub(r'([\{\[ ])(@[^\s,\]\}]+)(\s*)$', r'\1"\2"\3', line)
    return line

def compute_header_lines(content):
    """Return (header_start, line_count) for speclang header."""
    lines = content.splitlines()
    header_start = -1
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            header_start = i
            break
    if header_start == -1:
        return None, None
    
    # Find terminator '---' after header_start
    terminator = -1
    for i in range(header_start, len(lines)):
        if lines[i].strip() == '---':
            terminator = i
            break
    if terminator == -1:
        return None, None
    
    line_count = terminator - header_start + 1
    return header_start, line_count

def fix_header(content):
    """Fix speclang header in file content."""
    lines = content.splitlines(keepends=True)
    header_start = -1
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            header_start = i
            break
    if header_start == -1:
        return content  # No header
    
    # Find YAML lines until ---
    yaml_lines = []
    i = header_start + 1
    while i < len(lines) and not lines[i].strip() == '---':
        yaml_lines.append(lines[i])
        i += 1
    
    if not yaml_lines:
        return content
    
    # Fix each YAML line, preserving newlines
    for idx, line in enumerate(yaml_lines):
        # Remove trailing newline for processing
        newline = line[-1] if line.endswith('\n') else ''
        line_text = line.rstrip('\n')
        
        # Quote @ values
        line_text = quote_at_values(line_text)
        # Convert layer: meta to layer: 0
        if re.match(r'^\s*layer:\s*meta\s*$', line_text):
            line_text = 'layer: 0'
        
        # Re-add newline
        new_line = line_text + newline
        if new_line != line:
            lines[header_start + 1 + idx] = new_line
    
    # Add lines:N to speclang-header line if missing
    header_line = lines[header_start]
    if 'lines:' not in header_line:
        # Compute line count using original content (line count unchanged)
        _, line_count = compute_header_lines(content)
        if line_count:
            # Replace header line with lines:N using regex to preserve formatting
            # Pattern: speclang-header (maybe with leading # or ---)
            # Replace with speclang-header lines:N
            # Match 'speclang-header' and replace with 'speclang-header lines:N'
            new_header_line = re.sub(r'(speclang-header)', rf'\1 lines:{line_count}', header_line)
            lines[header_start] = new_header_line
    
    return ''.join(lines)

def main():
    dry_run = '--dry-run' in sys.argv
    spec_dir = Path('specs')
    spec_files = list(spec_dir.glob('**/*.spec.md')) + list(spec_dir.glob('**/*.scl'))
    
    for spec_file in spec_files:
        print(f"Processing {spec_file}...")
        with open(spec_file, 'r') as f:
            content = f.read()
        
        fixed = fix_header(content)
        if fixed != content:
            if dry_run:
                print(f"  Would update header")
                # Show diff
                old_lines = content.splitlines()
                new_lines = fixed.splitlines()
                for i, (old, new) in enumerate(zip(old_lines, new_lines)):
                    if old != new:
                        print(f"    Line {i+1}: - {old}")
                        print(f"              + {new}")
            else:
                with open(spec_file, 'w') as f:
                    f.write(fixed)
                print(f"  Updated header")
        else:
            print(f"  Already correct")
    
    print("Done.")

if __name__ == '__main__':
    main()