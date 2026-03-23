#!/usr/bin/env python3
"""
Fix children YAML list corruption in spec headers.
"""

import re
import sys
from pathlib import Path

def fix_children(content):
    """Fix corrupted children lists in content."""
    # Pattern for children block with concatenated items
    # Match from 'children:' up to next field or terminator
    # Use multiline mode
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
        if lines[i].strip() == '---':
            terminator = i
            break
    
    if terminator == -1:
        # No terminator, maybe attached to children line
        # We'll handle later
        pass
    
    # Process lines between header_start+1 and terminator (or end)
    start = header_start + 1
    end = terminator if terminator != -1 else len(lines)
    
    # Look for children line
    for i in range(start, end):
        if lines[i].strip().startswith('children:'):
            # Found children line
            # The next line(s) are list items
            j = i + 1
            while j < end and lines[j].strip().startswith('-'):
                line = lines[j]
                # Check if line contains multiple items separated by '  - '
                if '  - ' in line:
                    # Split by '  - ' but preserve indentation
                    indent = line[:len(line) - len(line.lstrip())]
                    # Use regex to split by '  - ' (two spaces dash space)
                    parts = re.split(r'\s{2,}-\s+', line.strip())
                    # Build new lines
                    new_lines = []
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
                        new_lines.append(indent + '- ' + part + '\n')
                    # Replace original line with new lines
                    lines[j:j+1] = new_lines
                    j += len(new_lines) - 1  # adjust index
                else:
                    # Single item, ensure proper quoting
                    line_stripped = line.strip()
                    if line_stripped.startswith('- ""'):
                        # Fix extra quote
                        new_line = line.replace('- ""', '- "', 1)
                        if new_line.endswith('"---\n'):
                            new_line = new_line.replace('"---\n', '"\n')
                        lines[j] = new_line
                j += 1
            break  # assume only one children field per spec
    
    # Ensure terminator line exists and is separate
    # Re-find terminator after modifications
    terminator = -1
    for i in range(header_start, len(lines)):
        if lines[i].strip() == '---':
            terminator = i
            break
    
    if terminator == -1:
        # Add terminator after YAML lines (find first non-YAML line after header)
        for i in range(header_start + 1, len(lines)):
            if not lines[i].strip() or lines[i].startswith('#'):
                # Insert '---' before this line
                lines.insert(i, '---\n')
                terminator = i
                break
        else:
            # Append at end
            lines.append('---\n')
            terminator = len(lines) - 1
    
    # Update header line count
    header_line = lines[header_start]
    line_count = terminator - header_start + 1
    if 'lines:' in header_line:
        lines[header_start] = re.sub(r'lines:\s*\d+', f'lines:{line_count}', header_line)
    else:
        lines[header_start] = re.sub(r'speclang-header', f'speclang-header lines:{line_count}', header_line)
    
    return ''.join(lines)

def main():
    dry_run = '--dry-run' in sys.argv
    spec_dir = Path('specs')
    spec_files = list(spec_dir.glob('**/*.spec.md')) + list(spec_dir.glob('**/*.scl'))
    
    print("🔧 Fixing children YAML corruption...")
    print("=" * 60)
    
    fixed_count = 0
    for i, spec_file in enumerate(spec_files, 1):
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(spec_files)} files...")
        try:
            with open(spec_file, 'r', encoding='utf-8') as f:
                content = f.read()
            fixed = fix_children(content)
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