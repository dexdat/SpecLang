#!/usr/bin/env python3
"""
Fix reference format in specs:
- @ref:@speclang/... → @ref:speclang/...
- @ref:@specs/... → @ref:specs/...
- Remove trailing backticks, quotes, periods, asterisks
"""

import re
from pathlib import Path

def fix_refs_in_file(filepath):
    """Fix reference formats in a single spec file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Pattern 1: @ref:@speclang → @ref:speclang
        content = re.sub(r'@ref:@speclang', '@ref:speclang', content)
        
        # Pattern 2: @ref:@specs → @ref:specs
        content = re.sub(r'@ref:@specs', '@ref:specs', content)
        
        # Pattern 3: Remove trailing backticks, quotes, periods, asterisks from refs
        # Match @ref:anything followed by unwanted characters
        content = re.sub(r'(@ref:[a-zA-Z0-9_/\-.]+)[`"\'\*\.]+', r'\1', content)
        
        # Pattern 4: Remove double asterisks at end of refs
        content = re.sub(r'(@ref:[a-zA-Z0-9_/\-.]+)\*+', r'\1', content)
        
        # Pattern 5: Clean up any remaining weird characters
        content = re.sub(r'(@ref:[^\s\,\]\)]+)[^\s\,\]\)]', r'\1', content)
        
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
    
    print("🔧 Fixing reference formats in specs...")
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
            if fix_refs_in_file(spec_file):
                fixed_count += 1
        except Exception as e:
            print(f"  ✗ Error: {spec_file}: {e}")
    
    print("\n" + "=" * 60)
    print(f"✓ Fixed references in {fixed_count} files")
    print("\nNext: Run validation to verify")
    print("  ./bin/speclang validate")

if __name__ == '__main__':
    main()