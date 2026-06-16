#!/usr/bin/env python3
"""
Fix all children list corruptions in spec headers.
"""

import re
import sys
from pathlib import Path

def fix_spec(content):
    lines = content.splitlines(keepends=True)
    
    # Find header start
    header_start = -1
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            header_start = i
            break
    if header_start == -1:
        return content
    
    # Find terminator line (---)
    terminator = -1
    for i in range(header_start, len(lines)):
        stripped = lines[i].strip()
        if stripped == '---':
            terminator = i
            break
        # Check if --- attached to line
        if '---' in stripped and stripped != '---':
            # Split line at ---
            before, after = stripped.split('---', 1)
            # Replace line with before and add new line '---'
            lines[i] = before.rstrip() + '\n'
            # Insert '---' line after
            lines.insert(i + 1, '---\n')
            terminator = i + 1
            break
    
    if terminator == -1:
        # No terminator found, add after YAML lines (assume YAML ends at first non-YAML line after header)
        for i in range(header_start + 1, len(lines)):
            stripped = lines[i].strip()
            if stripped.startswith('#') or stripped == '':
                # Insert terminator before this line
                lines.insert(i, '---\n')
                terminator = i
                break
        else:
            # Append at end
            lines.append('---\n')
            terminator = len(lines) - 1
    
    # Extract YAML lines (between header_start+1 and terminator-1)
    yaml_start = header_start + 1
    yaml_end = terminator
    yaml_lines = lines[yaml_start:yaml_end]
    
    # Process children field
    new_yaml_lines = []
    i = 0
    while i < len(yaml_lines):
        line = yaml_lines[i]
        stripped = line.strip()
        if stripped.startswith('children:'):
            new_yaml_lines.append(line)
            # Look at next line(s) that are list items
            j = i + 1
            while j < len(yaml_lines) and yaml_lines[j].strip().startswith('-'):
                item_line = yaml_lines[j]
                # Check if line contains multiple items separated by '  - '
                if '  - ' in item_line:
                    # Split by '  - ' but preserve indentation
                    indent = item_line[:len(item_line) - len(item_line.lstrip())]
                    # Use regex to split by '  - ' (two spaces dash space)
                    parts = re.split(r'\s{2,}-\s+', item_line.strip())
                    for part in parts:
                        part = part.strip()
                        # Remove extra quotes
                        if part.startswith('""'):
                            part = part[1:]
                        if part.endswith('---'):
                            part = part[:-3]
                        # Ensure part is quoted
                        if not part.startswith('"'):
                            part = '"' + part
                        if not part.endswith('"'):
                            part = part + '"'
                        new_yaml_lines.append(indent + '- ' + part + '\n')
                else:
                    # Single item, ensure proper quoting
                    line_stripped = item_line.strip()
                    if line_stripped.startswith('- ""'):
                        # Fix extra quote
                        new_line = item_line.replace('- ""', '- "', 1)
                        if new_line.endswith('"---\n'):
                            new_line = new_line.replace('"---\n', '"\n')
                        new_yaml_lines.append(new_line)
                    else:
                        new_yaml_lines.append(item_line)
                j += 1
            i = j
        else:
            new_yaml_lines.append(line)
            i += 1
    
    # Replace YAML lines
    lines[yaml_start:yaml_end] = new_yaml_lines
    
    # Recompute terminator position
    new_terminator = yaml_start + len(new_yaml_lines)
    # Ensure terminator line is '---'
    if lines[new_terminator].strip() != '---':
        lines.insert(new_terminator, '---\n')
        new_terminator += 1
    
    # Update header line count
    header_line = lines[header_start]
    line_count = new_terminator - header_start + 1
    if 'lines:' in header_line:
        lines[header_start] = re.sub(r'lines:\s*\d+', f'lines:{line_count}', header_line)
    else:
        lines[header_start] = re.sub(r'speclang-header', f'speclang-header lines:{line_count}', header_line)
    
    return ''.join(lines)

def main():
    dry_run = '--dry-run' in sys.argv
    spec_dir = Path('specs')
    spec_files = list(spec_dir.glob('**/*.spec.md')) + list(spec_dir.glob('**/*.scl'))
    
    print("🔧 Fixing children lists in spec headers...")
    print("=" * 60)
    
    fixed_count = 0
    for i, spec_file in enumerate(spec_files, 1):
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(spec_files)} files...")
        try:
            with open(spec_file, 'r', encoding='utf-8') as f:
                content = f.read()
            fixed = fix_spec(content)
            if fixed != content:
                if dry_run:
                    print(f"  Would update {spec_file}")
                else:
                    with open(spec_file, 'w', encoding='utf-8') as f:
                        f.write(fixed)
                    fixed_count += 1
        except Exception as e:
            print(f"  ✗ Error: {spec_file}: {e}")
    
    print("\n" + "=" * 60)
    print(f"✓ Fixed {fixed_count} files")
    print("\nNext: Run validation to verify fixes")
    print("  ./bin/speclang validate")

if __name__ == '__main__':
    main()