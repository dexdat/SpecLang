#!/usr/bin/env python3
"""
Quick check of spec headers for format compliance.
"""

import os
import re
import yaml
import sys
from pathlib import Path

def check_header(filepath):
    """Check a single spec file header."""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    if not lines:
        return False, "Empty file"
    
    # Look for speclang-header line
    header_line = None
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            header_line = i
            break
    
    if header_line is None:
        return False, "No speclang-header found"
    
    # Extract line count
    match = re.search(r'lines:\s*(\d+)', lines[header_line])
    if not match:
        return False, "No lines count in speclang-header"
    
    expected_lines = int(match.group(1))
    
    # Extract YAML
    yaml_lines = []
    for j in range(header_line + 1, min(header_line + expected_lines, len(lines))):
        line_text = lines[j].rstrip('\n')
        if line_text.strip() == '---':
            break
        yaml_lines.append(line_text)
    
    if not yaml_lines:
        return False, "No YAML content in header"
    
    yaml_text = '\n'.join(yaml_lines)
    
    try:
        metadata = yaml.safe_load(yaml_text) or {}
    except yaml.YAMLError as e:
        return False, f"YAML parse error: {e}"
    
    # Check required fields
    required = ['id', 'version', 'layer', 'project_level', 'agent_support', 'short']
    missing = []
    for field in required:
        if field not in metadata:
            missing.append(field)
    
    if missing:
        return False, f"Missing required fields: {missing}"
    
    # Check id format
    spec_id = metadata.get('id', '')
    if not spec_id.startswith('@'):
        return False, f"ID should start with @: {spec_id}"
    
    # Check layer is 0-10
    layer = metadata.get('layer')
    if isinstance(layer, str):
        if layer.isdigit():
            layer = int(layer)
        else:
            return False, f"Layer should be integer: {layer}"
    
    if layer is not None and (layer < 0 or layer > 10):
        return False, f"Layer should be 0-10: {layer}"
    
    return True, "OK"

def main():
    root = Path("specs")
    spec_files = list(root.glob("**/*.spec.md")) + list(root.glob("**/*.spec.yaml")) + list(root.glob("**/*.scl"))
    
    print(f"Checking {len(spec_files)} spec files...")
    print()
    
    errors = []
    for filepath in spec_files:
        ok, msg = check_header(filepath)
        if not ok:
            rel_path = filepath.relative_to(root.parent)
            errors.append((rel_path, msg))
    
    if errors:
        print(f"Found {len(errors)} header issues:")
        for path, msg in errors[:20]:  # Show first 20
            print(f"  {path}: {msg}")
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more")
        return 1
    else:
        print("All headers OK!")
        return 0

if __name__ == "__main__":
    sys.exit(main())