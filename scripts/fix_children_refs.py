#!/usr/bin/env python3
"""
Fix children field in spec headers:
Add @ref: prefix to children array values (both JSON and YAML formats)
"""

import re
from pathlib import Path

def fix_children_in_file(filepath):
    """Fix children field in a spec file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Pattern 1: children: ["@speclang/..., @speclang/...] - JSON array
        def fix_json_array(match):
            array_content = match.group(1)
            items = []
            for item in array_content.split(','):
                item = item.strip().strip('"').strip("'")
                if not item.startswith('@ref:'):
                    if item.startswith('@'):
                        item = '@ref:' + item[1:]
                items.append('"' + item + '"')
            return 'children: [' + ', '.join(items) + ']'
        
        content = re.sub(
            r'children:\s*\[([^\]]+)\]',
            fix_json_array,
            content
        )
        
        # Pattern 2: children:\n  - "@speclang/..." - YAML list
        def fix_yaml_list(match):
            children_lines = match.group(0)
            new_lines = []
            for line in children_lines.split('\n'):
                # Match lines like:   - "@speclang/..."
                yaml_item = re.match(r'^(\s*-\s*)"(@[^"]+)"', line)
                if yaml_item:
                    indent = yaml_item.group(1)
                    value = yaml_item.group(2)
                    if not value.startswith('@ref:'):
                        if value.startswith('@'):
                            value = '@ref:' + value[1:]
                    new_lines.append(f'{indent}"{value}"')
                else:
                    new_lines.append(line)
            return '\n'.join(new_lines)
        
        content = re.sub(
            r'children:\n((?:\s*-\s*"@[^"]+"\n?)+)',
            fix_yaml_list,
            content
        )
        
        # Pattern 3: children: "@speclang/..." - single value
        def fix_single_child(match):
            value = match.group(1).strip().strip('"').strip("'")
            if not value.startswith('@ref:'):
                if value.startswith('@'):
                    value = '@ref:' + value[1:]
            return 'children: "' + value + '"'
        
        content = re.sub(
            r'children:\s*"(@[^"]+)"',
            fix_single_child,
            content
        )
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    project_root = Path(__file__).parent.parent
    specs_dir = project_root / 'specs'
    
    print("🔧 Adding @ref: prefix to children values (all formats)...")
    print("=" * 60)
    
    fixed_count = 0
    
    # Find all spec files
    spec_files = list(specs_dir.rglob('*.spec.md'))
    spec_files.extend(specs_dir.rglob('*.scl'))
    spec_files.extend(specs_dir.rglob('*.spec.yaml'))
    
    print(f"Found {len(spec_files)} spec files to process\n")
    
    for i, spec_file in enumerate(spec_files, 1):
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(spec_files)} files...")
        
        try:
            if fix_children_in_file(spec_file):
                fixed_count += 1
        except Exception as e:
            print(f"  ✗ Error: {spec_file}: {e}")
    
    print("\n" + "=" * 60)
    print(f"✓ Fixed children in {fixed_count} files")
    print("\nNext: Run validation")
    print("  ./bin/speclang validate")

if __name__ == '__main__':
    main()