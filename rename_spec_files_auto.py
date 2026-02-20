#!/usr/bin/env python3
import os
import re
import json
import shutil
from pathlib import Path

def rename_spec_files():
    """Rename all .spec files to .spec.md following naming conventions."""
    root = Path('.')
    specs_dir = root / 'specs'
    
    # Find all .spec files (not .spec.md or .spec.yaml)
    spec_files = []
    for filepath in specs_dir.rglob('*.spec'):
        if filepath.suffix == '.spec' and not str(filepath).endswith('.spec.md') and not str(filepath).endswith('.spec.yaml'):
            spec_files.append(filepath)
    
    print(f"Found {len(spec_files)} .spec files to rename")
    
    # Create mapping of old to new names
    rename_map = {}
    for old_path in spec_files:
        new_path = old_path.with_suffix('.spec.md')
        rename_map[str(old_path)] = str(new_path)
        print(f"  {old_path} -> {new_path}")
    
    # Backup original files
    backup_dir = root / '.backup_spec_files'
    backup_dir.mkdir(exist_ok=True)
    for old_path in spec_files:
        shutil.copy2(old_path, backup_dir / old_path.name)
    print(f"\nBackups created in {backup_dir}")
    
    # Rename files
    for old_path, new_path_str in rename_map.items():
        new_path = Path(new_path_str)
        old_path_obj = Path(old_path)
        old_path_obj.rename(new_path)
        print(f"Renamed: {old_path_obj.name} -> {new_path.name}")
    
    return rename_map

def update_project_scl(rename_map):
    """Update file references in project.scl."""
    project_scl = Path('specs/project.scl')
    if not project_scl.exists():
        print("project.scl not found")
        return
    
    content = project_scl.read_text()
    
    # Update markdown table entries
    for old_name, new_name in rename_map.items():
        old_basename = Path(old_name).name
        new_basename = Path(new_name).name
        
        # Update in markdown table: | old_basename | description |
        pattern = rf'(\|.*){re.escape(old_basename)}(.*\|)'
        replacement = rf'\1{new_basename}\2'
        content = re.sub(pattern, replacement, content)
        
        # Also update without .spec extension in prose
        old_stem = old_basename.replace('.spec', '')
        new_stem = new_basename.replace('.spec.md', '')
        pattern2 = rf'(\s){re.escape(old_stem)}(\.spec|\s|$)'
        replacement2 = rf'\1{new_stem}\2'
        content = re.sub(pattern2, replacement2, content)
    
    # Backup and write
    backup = project_scl.with_suffix('.scl.backup')
    shutil.copy2(project_scl, backup)
    project_scl.write_text(content)
    print(f"Updated {project_scl} (backup at {backup})")

def update_readme(rename_map):
    """Update file references in README.md."""
    readme = Path('README.md')
    if not readme.exists():
        print("README.md not found")
        return
    
    content = readme.read_text()
    
    for old_name, new_name in rename_map.items():
        old_basename = Path(old_name).name
        new_basename = Path(new_name).name
        
        # Update in markdown table
        pattern = rf'(\|.*){re.escape(old_basename)}(.*\|)'
        replacement = rf'\1{new_basename}\2'
        content = re.sub(pattern, replacement, content)
    
    # Backup and write
    backup = readme.with_suffix('.md.backup')
    shutil.copy2(readme, backup)
    readme.write_text(content)
    print(f"Updated {readme} (backup at {backup})")

def regenerate_index():
    """Regenerate _index.json with new file names."""
    print("\nRegenerating _index.json...")
    os.system('python3 generate_index.py')

def main():
    print("=== Renaming Spec Files to Follow Naming Conventions ===")
    print("According to specs/file-naming.spec:")
    print("  - .spec.md for markdown specs (human-edited with diagrams)")
    print("  - .spec.yaml for YAML specs (machine-first)")
    print("  - .{ext}.spec for direct code mapping")
    print()
    print("Current .spec files should be .spec.md")
    
    rename_map = rename_spec_files()
    if not rename_map:
        return
    
    print("\n=== Updating References ===")
    update_project_scl(rename_map)
    update_readme(rename_map)
    
    print("\n=== Regenerating Index ===")
    regenerate_index()
    
    print("\n=== Done ===")
    print(f"Renamed {len(rename_map)} files")
    print("Backups saved in .backup_spec_files/")

if __name__ == '__main__':
    main()