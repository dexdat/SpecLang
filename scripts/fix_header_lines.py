#!/usr/bin/env python3
"""
Fix speclang-header lines count in spec files.
Automatically calculates and updates the correct line count.
"""

import re
from pathlib import Path

def fix_header_lines(filepath):
    """Fix the speclang-header lines count."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Find the header section (between speclang-header and ---)
        header_match = re.search(
            r'^(# speclang-header lines:\d+\n)(.*?)^---',
            content,
            re.MULTILINE | re.DOTALL
        )
        
        if not header_match:
            return False
        
        header_start = header_match.group(1)
        header_body = header_match.group(2)
        
        # Count actual header lines (excluding the speclang-header line itself)
        header_lines = header_body.count('\n')
        
        # The lines count should include the speclang-header line itself
        # So if there are N lines of content, lines should be N+1
        new_lines = header_lines + 1
        
        # Replace the lines count
        new_header_start = f"# speclang-header lines:{new_lines}\n"
        
        if header_start != new_header_start:
            content = content.replace(header_start, new_header_start)
        
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
    
    print("🔧 Fixing speclang-header lines counts...")
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
            if fix_header_lines(spec_file):
                fixed_count += 1
        except Exception as e:
            print(f"  ✗ Error: {spec_file}: {e}")
    
    print("\n" + "=" * 60)
    print(f"✓ Fixed header lines in {fixed_count} files")
    print("\nNext: Run validation")
    print("  ./bin/speclang validate")

if __name__ == '__main__':
    main()