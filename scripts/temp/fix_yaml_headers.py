#!/usr/bin/env python3
"""
Fix YAML headers in spec files by quoting @ values and adding missing fields.
"""

import os
import re
import sys
import yaml
from pathlib import Path
from typing import List, Tuple, Optional

def quote_at_values(line: str) -> str:
    """Quote @-prefixed values in YAML lines."""
    # Skip comment lines
    if line.strip().startswith('#'):
        return line
    
    # Pattern for key: @value (simple case)
    # Match: key: @value
    pattern1 = r'^(\s*[a-zA-Z_-]+:\s*)(@[^\s\]\},]+)(\s*)$'
    if re.match(pattern1, line):
        line = re.sub(pattern1, r'\1"\2"\3', line)
    
    # Pattern for - @value (array items)
    pattern2 = r'^(\s*-\s*)(@[^\s,\]]+)(\s*)$'
    if re.match(pattern2, line):
        line = re.sub(pattern2, r'\1"\2"\3', line)
    
    # Pattern for [@value, ...] (flow sequence start)
    if '[' in line and '@' in line:
        # Simple regex for flow sequences
        # Replace @value with "@value" when inside brackets
        def replace_flow(match):
            return match.group(1) + '"' + match.group(2) + '"' + match.group(3)
        
        line = re.sub(r'(\[|\s|,)(@[^\s,\]]+)(,|\]|\s|$)', replace_flow, line)
    
    return line

def parse_header(content: str) -> Tuple[Optional[int], dict]:
    """Parse speclang header from file content."""
    lines = content.splitlines()
    
    header_start = -1
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            header_start = i
            break
    
    if header_start == -1:
        return None, {}
    
    # Extract line count
    match = re.search(r'lines:\s*(\d+)', lines[header_start])
    if match:
        header_lines = int(match.group(1))
        use_line_count = True
    else:
        use_line_count = False
        header_lines = 0
    
    # Extract YAML lines
    yaml_lines = []
    if use_line_count:
        end_idx = min(header_start + header_lines, len(lines))
        for j in range(header_start + 1, end_idx):
            line_text = lines[j].rstrip('\n')
            if line_text.strip() == '---':
                break
            yaml_lines.append(line_text)
    else:
        for j in range(header_start + 1, len(lines)):
            line_text = lines[j].rstrip('\n')
            if line_text.strip() == '---':
                header_lines = j - header_start + 1
                break
            yaml_lines.append(line_text)
    
    if not yaml_lines:
        return header_start, {}
    
    yaml_text = '\n'.join(yaml_lines)
    
    # Fix YAML issues
    fixed_yaml_lines = [quote_at_values(line) for line in yaml_lines]
    fixed_yaml_text = '\n'.join(fixed_yaml_lines)
    
    try:
        metadata = yaml.safe_load(fixed_yaml_text) or {}
    except yaml.YAMLError:
        # If still fails, try to extract basic fields
        metadata = {}
        # Simple regex extraction
        id_match = re.search(r'id:\s*"(@[^"]+)"', fixed_yaml_text) or re.search(r'id:\s*@(\S+)', fixed_yaml_text)
        if id_match:
            metadata['id'] = id_match.group(1) if id_match.group(1).startswith('@') else f'@{id_match.group(1)}'
    
    return header_start, metadata

def fix_header(content: str) -> str:
    """Fix header in file content."""
    lines = content.splitlines(keepends=True)
    
    header_start, metadata = parse_header(content)
    if header_start is None:
        return content  # No header
    
    # Find header end (--- line)
    header_end = header_start
    for i in range(header_start, len(lines)):
        if lines[i].strip() == '---':
            header_end = i
            break
    
    if header_end == header_start:
        return content  # No terminator
    
    # Rebuild YAML with fixes
    yaml_lines = []
    for i in range(header_start + 1, header_end):
        line = lines[i].rstrip('\n')
        yaml_lines.append(quote_at_values(line))
    
    # Ensure required fields
    yaml_text = '\n'.join(yaml_lines)
    try:
        current_meta = yaml.safe_load(yaml_text) or {}
    except yaml.YAMLError:
        current_meta = {}
    
    # Add missing short field if needed
    if 'short' not in current_meta:
        # Try to extract from filename or content
        current_meta['short'] = "Spec description"
    
    # Rebuild YAML
    new_yaml_lines = []
    for key, value in current_meta.items():
        if isinstance(value, list):
            if value and isinstance(value[0], str) and value[0].startswith('@'):
                # Quote array elements
                value_str = ', '.join([f'"{v}"' if v.startswith('@') else str(v) for v in value])
                new_yaml_lines.append(f'{key}: [{value_str}]')
            else:
                new_yaml_lines.append(f'{key}: {value}')
        elif isinstance(value, str) and value.startswith('@'):
            new_yaml_lines.append(f'{key}: "{value}"')
        else:
            new_yaml_lines.append(f'{key}: {value}')
    
    # Rebuild content
    new_lines = lines[:header_start + 1]  # Keep header line
    new_lines.extend([line + '\n' for line in new_yaml_lines])
    new_lines.append('---\n')
    new_lines.extend(lines[header_end + 1:])  # Keep rest of content
    
    # Update lines count in header line
    header_line = new_lines[header_start]
    total_header_lines = len(new_yaml_lines) + 2  # +1 for header line, +1 for ---
    if 'lines:' in header_line:
        new_lines[header_start] = re.sub(r'lines:\s*\d+', f'lines:{total_header_lines}', header_line)
    else:
        # Insert lines count
        new_lines[header_start] = re.sub(r'(speclang-header)', rf'\1 lines:{total_header_lines}', header_line)
    
    return ''.join(new_lines)

def main():
    dry_run = '--dry-run' in sys.argv or '--check' in sys.argv
    fix_all = '--all' in sys.argv
    
    root = Path("specs")
    spec_files = list(root.glob("**/*.spec.md")) + list(root.glob("**/*.spec.yaml")) + list(root.glob("**/*.scl"))
    
    print(f"Found {len(spec_files)} spec files")
    
    fixed_count = 0
    for filepath in spec_files:
        with open(filepath, 'r') as f:
            content = f.read()
        
        fixed = fix_header(content)
        if fixed != content:
            print(f"Fixing {filepath.relative_to(root.parent)}")
            if not dry_run:
                with open(filepath, 'w') as f:
                    f.write(fixed)
                fixed_count += 1
            else:
                # Show what would change
                old_lines = content.splitlines()
                new_lines = fixed.splitlines()
                diff = False
                for i in range(min(len(old_lines), len(new_lines))):
                    if old_lines[i] != new_lines[i]:
                        if not diff:
                            print(f"  Changes in {filepath.relative_to(root.parent)}:")
                            diff = True
                        print(f"    Line {i+1}: - {old_lines[i]}")
                        print(f"            + {new_lines[i]}")
                if diff:
                    fixed_count += 1
    
    print(f"\n{'Would fix' if dry_run else 'Fixed'} {fixed_count} files")
    return 0 if fixed_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())