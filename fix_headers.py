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
    
    # Optionally add lines:N to speclang-header line (skip for now)
    # header_line = lines[header_start]
    # if 'lines:' not in header_line:
    #     # Keep simple - don't add lines:N to avoid formatting issues
    #     pass
    
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