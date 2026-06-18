#!/usr/bin/env python3
"""
Fix corrupted children lists in spec headers.
Pattern:
  children:
    - ""@ref:specs/xxx"  - ""@ref:specs/yyy"---
Should become:
  children:
    - "@ref:specs/xxx"
    - "@ref:specs/yyy"
"""

import re
import sys
from pathlib import Path

def fix_children(content):
    """Fix corrupted children field in content."""
    lines = content.splitlines(keepends=True)
    in_header = False
    header_end = -1
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            in_header = True
        if in_header and line.strip() == '---':
            header_end = i
            break
    
    if header_end == -1:
        return content  # No header found
    
    # Find children line
    for i in range(header_end):
        if lines[i].strip().startswith('children:'):
            # Found children line
            # The next line(s) contain the list items
            j = i + 1
            while j < header_end and lines[j].strip().startswith('-'):
                # Fix this line
                line = lines[j]
                # Pattern: - ""@ref:...  - ""@ref:...---
                # Split by '  - ' (two spaces dash space)
                # But careful with quotes
                # Simple approach: replace '  - ""' with '\n  - "' and separate
                # Actually, we can split by '  - ' and reconstruct
                line_stripped = line.strip()
                if line_stripped.count('"') > 2:
                    # Split by '  - ' but preserve indentation
                    indent = line[:len(line) - len(line.lstrip())]
                    parts = re.split(r'\s{2,}-\s+', line_stripped)
                    # Each part should be a quoted ref
                    new_parts = []
                    for part in parts:
                        part = part.strip()
                        if part.startswith('""'):
                            part = part[1:]  # Remove extra quote
                        if part.endswith('---'):
                            part = part[:-3]
                        new_parts.append(f'{indent}- "{part}"')
                    # Replace line with multiple lines
                    # We need to insert new lines and remove old line
                    # Let's do a simpler approach: regex replace within the line
                    pass
                break
    # For now, use regex substitution across whole content
    # Pattern: children:\s*\n\s*-\s+""(@ref:[^"]+)"\s+-\s+""(@ref:[^"]+)"\s*---?
    # Actually, we can match the whole children block up to ---
    # Use multiline regex
    pattern = r'(children:\s*\n\s*-\s+)""(@ref:[^"]+)"\s+-\s+""(@ref:[^"]+)"(\s*---)'
    def replace(m):
        indent = m.group(1)
        ref1 = m.group(2)
        ref2 = m.group(3)
        suffix = m.group(4)
        return f'children:\n  - "{ref1}"\n  - "{ref2}"{suffix}'
    
    new_content = re.sub(pattern, replace, content, flags=re.MULTILINE)
    # Also handle case with more than two refs
    # Generic pattern: children:\s*\n\s*-\s+""(@ref:[^"]+)"(?:\s+-\s+""(@ref:[^"]+)")*\s*---?
    # We'll do a more robust approach: find children block and parse line by line
    return new_content

def fix_file(filepath):
    """Fix a single spec file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find children field using regex
    # Pattern: children:\s*\n\s*-\s+""@ref:[^"]+"(?:\s+-\s+""@ref:[^"]+")*\s*---?
    # This matches the whole children line until ---
    pattern = re.compile(
        r'(children:\s*\n\s*-\s+)(""@ref:[^"]+")(?:\s+-\s+""@ref:[^"]+")*\s*(---)',
        re.MULTILINE
    )
    
    def replace(m):
        # Extract all refs
        line = m.group(0)
        # Find all @ref:... strings
        refs = re.findall(r'""(@ref:[^"]+)"', line)
        if not refs:
            return line
        # Build new children block
        new_block = 'children:\n'
        for ref in refs:
            new_block += f'  - "{ref}"\n'
        # Add the --- terminator
        new_block += '---'
        return new_block
    
    new_content = pattern.sub(replace, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    project_root = Path(__file__).parent.parent
    specs_dir = project_root / 'specs'
    
    print("🔧 Fixing children lists in spec headers...")
    print("=" * 60)
    
    spec_files = list(specs_dir.rglob('*.spec.md'))
    spec_files.extend(specs_dir.rglob('*.scl'))
    
    print(f"Found {len(spec_files)} spec files to process\n")
    
    fixed_count = 0
    for i, spec_file in enumerate(spec_files, 1):
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(spec_files)} files...")
        try:
            if fix_file(spec_file):
                fixed_count += 1
        except Exception as e:
            print(f"  ✗ Error: {spec_file}: {e}")
    
    print("\n" + "=" * 60)
    print(f"✓ Fixed children in {fixed_count} files")
    print("\nNext: Run validation to verify fixes")
    print("  ./bin/speclang validate")

if __name__ == '__main__':
    main()