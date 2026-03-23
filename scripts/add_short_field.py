#!/usr/bin/env python3
"""
Add missing 'short' field to spec headers.
Uses the ID to generate a short description.
"""

import re
from pathlib import Path

def add_short_field(filepath):
    """Add short field to spec header if missing."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Check if short field already exists
        if re.search(r'^short:', content, re.MULTILINE):
            return False
        
        # Find the ID field
        id_match = re.search(r'^id:\s*"?(@[^"]+)"?', content, re.MULTILINE)
        if not id_match:
            return False
        
        spec_id = id_match.group(1)
        
        # Generate short description from ID
        # @speclang/folder-name -> Folder Name
        short_desc = spec_id.replace('@speclang/', '').replace('@specs/', '').replace('/', ' / ').replace('-', ' ').replace('_', ' ')
        # Capitalize first letter of each word
        short_desc = ' '.join(word.capitalize() for word in short_desc.split())
        
        # Find the line with --- (end of header) and add short before it
        # Or add it after the last header field
        
        # Try to find a good place - after tags or status or agent_support
        # Find the last field before ---
        header_end_match = re.search(r'^---\s*$', content, re.MULTILINE)
        if not header_end_match:
            return False
        
        # Find position of header end
        header_end_pos = header_end_match.start()
        
        # Find a good insertion point - after agent_support or status or tags
        for field in ['agent_support', 'status', 'tags', 'layer', 'version']:
            field_match = re.search(f'^{field}:', content, re.MULTILINE)
            if field_match and field_match.start() < header_end_pos:
                # Find end of this field's line
                line_end = content.find('\n', field_match.end())
                if line_end != -1 and line_end < header_end_pos:
                    # Insert short field after this line
                    insert_pos = line_end + 1
                    # Don't add if short already exists
                    if 'short:' not in content[insert_pos:header_end_pos]:
                        new_content = content[:insert_pos] + f'short: {short_desc}\n' + content[insert_pos:]
                        content = new_content
                        break
        
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
    
    print("🔧 Adding missing 'short' fields to specs...")
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
            if add_short_field(spec_file):
                fixed_count += 1
        except Exception as e:
            print(f"  ✗ Error: {spec_file}: {e}")
    
    print("\n" + "=" * 60)
    print(f"✓ Added short field to {fixed_count} files")
    print("\nNext: Run validation")
    print("  ./bin/speclang validate")

if __name__ == '__main__':
    main()