#!/usr/bin/env python3
"""Fix common spec header validation issues across all spec files."""

import re
import os
import glob

SPEC_FILES = glob.glob('specs/**/*.spec.md', recursive=True) + glob.glob('specs/**/*.scl', recursive=True)

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    lines = content.split('\n')
    
    # Case 1: No speclang-header line at all
    # These files often start with "---" directly
    has_header = any(line.strip().startswith('# speclang-header') for line in lines)
    
    if not has_header:
        return add_missing_header(filepath, content, lines)
    
    # Case 2: Has header but has issues
    # Find the header line index
    header_idx = None
    for i, line in enumerate(lines):
        if line.strip().startswith('# speclang-header'):
            header_idx = i
            break
    
    if header_idx is None:
        return False  # shouldn't happen
    
    # Find the --- separator
    sep_idx = None
    for i in range(header_idx + 1, len(lines)):
        if lines[i].strip() == '---':
            sep_idx = i
            break
    
    if sep_idx is None:
        return False  # no separator found
    
    # Work on the header section (between header line and ---)
    header_lines = lines[header_idx:sep_idx + 1]
    changed = False
    
    # Fix pattern A: parent: ""@ref:X"extra: value
    new_header = []
    for line in header_lines:
        m = re.match(r'^(\s*)parent:\s*""@ref:([^"]+)"(.+)$', line)
        if m:
            indent = m.group(1)
            ref = m.group(2)
            rest = m.group(3).strip()
            new_header.append(f'{indent}parent: "@ref:{ref}"')
            new_header.append(f'{indent}{rest}')
            changed = True
        else:
            new_header.append(line)
    
    # Fix pattern B: children with multiple items on one line
    # Pattern:   - "item1"  - "item2"  - "item3"
    new_header2 = []
    for line in new_header:
        stripped = line.strip()
        if stripped.startswith('- "') and stripped.count('"  - "') > 0:
            # Multiple items on one line
            # Split by '  - "'
            items = re.split(r'"\s{2,}-\s+"', stripped)
            # Clean up
            items_clean = []
            for item in items:
                item = item.strip().strip('"').strip()
                if item:
                    # Fix @ref:@ref: prefix duplication
                    item = item.replace('@ref:@ref:', '@ref:')
                    if not item.startswith('@ref:'):
                        item = f'@ref:{item}' if not item.startswith('@') else item
                    items_clean.append(item)
            
            indent = re.match(r'^(\s*)', line).group(1)
            new_header2.extend([f'{indent}- "@ref:{item}"' if not item.startswith('@ref:') else f'{indent}- "{item}"' for item in items_clean])
            changed = True
        else:
            new_header2.append(line)
    
    # Fix pattern C: unquoted @ref in parent
    new_header3 = []
    for line in new_header2:
        m = re.match(r'^(\s*parent:\s*)@ref:([^\s"\'#,]+)', line)
        if m and '"' not in line:
            indent = m.group(1)
            ref = m.group(2)
            new_header3.append(f'{indent}"@ref:{ref}"')
            changed = True
        else:
            new_header3.append(line)
    
    # Fix @ref:@ref: in any line (duplicate prefix)
    new_header4 = []
    for line in new_header3:
        if '@ref:@ref:' in line:
            line = line.replace('@ref:@ref:', '@ref:')
            changed = True
        new_header4.append(line)
    
    # Fix pattern G: layer as string
    new_header5 = []
    for line in new_header4:
        m = re.match(r'^(\s*layer:\s*)"(\d+)"$', line)
        if m:
            new_header5.append(f'{m.group(1)}{m.group(2)}')
            changed = True
        else:
            new_header5.append(line)
    
    # Unknown fields to remove: imports, siblings, target_lang
    unknown_fields = ['imports', 'siblings', 'target_lang', 'refs']
    new_header6 = []
    for line in new_header5:
        stripped = line.strip()
        field_name = stripped.split(':')[0].strip() if ':' in stripped else ''
        if field_name in unknown_fields or field_name.startswith('refs:'):
            # Only remove if it's in the YAML header section (between header line and ---)
            changed = True
            continue  # skip this line
        new_header6.append(line)
    
    # Now update the header section
    before_header = lines[:header_idx]
    after_sep = lines[sep_idx + 1:]
    
    new_lines = before_header + new_header6 + after_sep
    new_content = '\n'.join(new_lines)
    
    # Recalculate lines:N if needed
    new_content = update_lines_count(new_content)
    
    if new_content != original:
        with open(filepath, 'w') as f:
            f.write(new_content)
        return True
    
    return changed


def add_missing_header(filepath, content, lines):
    """Add a proper header to files missing speclang-header."""
    # These files typically start with "---"
    # Find the id and other fields
    metadata = {}
    in_header = False
    header_end = -1
    
    for i, line in enumerate(lines):
        if line.strip() == '---' and i == 0:
            in_header = True
            continue
        if in_header:
            if line.strip() == '---':
                header_end = i + 1  # include this ---
                break
            if ':' in line:
                key, _, value = line.partition(':')
                metadata[key.strip()] = value.strip()
    
    if header_end == -1:
        return False  # no header section found
    
    # Build proper header
    # Derive id from filepath
    relpath = os.path.relpath(filepath, 'specs')
    relpath = re.sub(r'\.spec\.md$', '', relpath)
    relpath = re.sub(r'\.scl$', '', relpath)
    spec_id = f'@specs/{relpath}'
    
    header_parts = []
    header_parts.append(f'# speclang-header')
    
    # Add id
    header_parts.append(f'id: "{spec_id}"')
    
    # Add version if exists
    version = metadata.get('version', '0.1.0')
    header_parts.append(f'version: {version}')
    
    # Add layer
    layer = metadata.get('layer', '5')
    header_parts.append(f'layer: {layer}')
    
    # Add project_level if exists
    if 'project_level' in metadata:
        header_parts.append(f'project_level: {metadata["project_level"]}')
    else:
        header_parts.append('project_level: Alpha')
    
    # Add agent_support if exists
    if 'agent_support' in metadata:
        header_parts.append(f'agent_support: {metadata["agent_support"]}')
    else:
        header_parts.append('agent_support: agent_assisted')
    
    # Add tags if exists
    if 'tags' in metadata:
        header_parts.append(f'tags: {metadata["tags"]}')
    
    # Add short if exists
    if 'short' in metadata:
        header_parts.append(f'short: {metadata["short"]}')
    else:
        header_parts.append(f'short: "{spec_id.split("/")[-1]} spec"')
    
    # Add status if exists
    if 'status' in metadata:
        header_parts.append(f'status: {metadata["status"]}')
    
    # Add target if exists
    if 'target' in metadata:
        header_parts.append(f'target: {metadata["target"]}')
    
    # Add part if exists
    if 'part' in metadata:
        header_parts.append(f'part: {metadata["part"]}')
    
    # Build new header
    header_line = f'# speclang-header lines:{len(header_parts) + 1}'
    header_parts[0] = header_line  # replace the placeholder
    
    new_header = '\n'.join(header_parts) + '\n---'
    
    # Replace the old header section
    new_content = new_header + '\n' + '\n'.join(lines[header_end:])
    
    # Recalculate lines:N
    new_content = update_lines_count(new_content)
    
    # Remove target_lang and refs fields
    lines_final = new_content.split('\n')
    lines_filtered = []
    for line in lines_final:
        field_name = line.split(':')[0].strip() if ':' in line else ''
        if field_name in ['target_lang']:
            continue
        lines_filtered.append(line)
    new_content = '\n'.join(lines_filtered)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    return True


def update_lines_count(content):
    """Update the lines:N declaration to match actual header line count."""
    lines = content.split('\n')
    for i, line in enumerate(lines):
        m = re.match(r'^# speclang-header(?: lines:(\d+))?', line)
        if m:
            # Count actual lines until ---
            header_count = 0
            for j in range(i, len(lines)):
                header_count += 1
                if lines[j].strip() == '---':
                    break
            if header_count > 0:
                new_line = f'# speclang-header lines:{header_count}'
                lines[i] = new_line
            break
    return '\n'.join(lines)


# Fix depends_on with non-array values
def fix_depends_on(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    lines = content.split('\n')
    
    # Find header section
    header_start = -1
    sep_idx = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('# speclang-header'):
            header_start = i
        if header_start >= 0 and line.strip() == '---':
            sep_idx = i
            break
    
    if header_start < 0 or sep_idx < 0:
        return False
    
    changed = False
    new_lines = list(lines)
    
    # Check depends_on lines - if they start with items that don't have @ref: prefix
    for i in range(header_start + 1, sep_idx):
        line = lines[i]
        stripped = line.strip()
        if stripped.startswith('- "') and 'depends_on' not in stripped:
            # This is inside a list under depends_on or children
            # Check if parent line is depends_on
            parent_line = lines[i-1].strip() if i > 0 else ''
            is_depends_on = parent_line == 'depends_on:' or (parent_line.startswith('-') and i > 1 and lines[i-2].strip() == 'depends_on:')
        
        # Check for depends_on as inline array (non-standard)
        m = re.match(r'^(\s*)depends_on:\s*\[(.+)\]', line)
        if m:
            indent = m.group(1)
            items_str = m.group(2)
            items = re.findall(r'"([^"]+)"', items_str)
            if items:
                new_lines[i] = f'{indent}depends_on:'
                for item in items:
                    item = item.strip()
                    if not item.startswith('@ref:'):
                        item = f'@ref:{item}'
                    new_lines.insert(i + 1, f'{indent}  - "{item}"')
                    i += 1  # Will be updated in loop
                changed = True
            break
    
    if changed:
        with open(filepath, 'w') as f:
            f.write('\n'.join(new_lines))
    
    return changed


def main():
    total = len(SPEC_FILES)
    fixed = 0
    failed = 0
    
    for filepath in SPEC_FILES:
        try:
            result = fix_file(filepath)
            if result:
                print(f"FIXED: {filepath}")
                fixed += 1
        except Exception as e:
            print(f"ERROR: {filepath}: {e}")
            failed += 1
    
    # Second pass: fix depends_on patterns
    for filepath in SPEC_FILES:
        try:
            result = fix_depends_on(filepath)
            if result:
                print(f"FIXED (depends_on): {filepath}")
                fixed += 1
        except Exception as e:
            print(f"ERROR: {filepath}: {e}")
            failed += 1
    
    print(f"\nDone. Total: {total}, Fixed: {fixed}, Failed: {failed}")

if __name__ == '__main__':
    main()
