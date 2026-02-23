#!/usr/bin/env python3
import os
import json
import yaml
import re
from datetime import datetime

def parse_header(filepath):
    """Parse speclang header from file."""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    header_lines = 0
    metadata = {}
    
    # Look for speclang-header line
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            # Extract line count: '# speclang-header lines:N'
            match = re.search(r'lines:\s*(\d+)', line)
            if match:
                header_lines = int(match.group(1))
                use_line_count = True
            else:
                # No line count specified, parse until we find ---
                use_line_count = False
                header_lines = 0  # We'll determine dynamically
            
            # Collect YAML content
            yaml_lines = []
            j = i + 1  # Start after speclang-header line
            
            if use_line_count:
                # Use specified line count (excluding speclang-header line itself)
                end_idx = min(j + header_lines - 1, len(lines))
                for k in range(j, end_idx):
                    line_text = lines[k].rstrip('\n')
                    if line_text.strip() == '---':
                        break
                    yaml_lines.append(line_text)
            else:
                # Parse until we find --- line
                for k in range(j, len(lines)):
                    line_text = lines[k].rstrip('\n')
                    if line_text.strip() == '---':
                        header_lines = k - i + 1  # Calculate actual header lines
                        break
                    yaml_lines.append(line_text)
            
            # Try to parse YAML
            if yaml_lines:
                yaml_text = '\n'.join(yaml_lines)
                
                # Try to parse as-is first
                try:
                    metadata = yaml.safe_load(yaml_text) or {}
                except yaml.YAMLError:
                    # Try to fix common YAML issues
                    # Quote @-prefixed scalars
                    fixed_yaml = re.sub(r'([\{\[ ])(@[^\s,\]\}]+)([,\]\}])', r'\1"\2"\3', yaml_text)
                    fixed_yaml = re.sub(r'([\{\[ ])(@[^\s,\]\}]+)(\s*)$', r'\1"\2"\3', fixed_yaml)
                    fixed_yaml = re.sub(r'^(\s*[a-zA-Z_-]+:\s*)(@[^\s]+)(\s*)$', r'\1"\2"\3', fixed_yaml, flags=re.MULTILINE)
                    
                    try:
                        metadata = yaml.safe_load(fixed_yaml) or {}
                    except yaml.YAMLError as e:
                        # Last resort: try to extract basic fields with regex
                        id_match = re.search(r'id:\s*(@[^\s]+)', yaml_text)
                        if id_match:
                            metadata['id'] = id_match.group(1)
                        
                        version_match = re.search(r'version:\s*([0-9.]+)', yaml_text)
                        if version_match:
                            metadata['version'] = version_match.group(1)
                        
                        # Try to extract tags
                        tags_match = re.search(r'tags:\s*\[([^\]]+)\]', yaml_text)
                        if tags_match:
                            tags_str = tags_match.group(1)
                            tags = [tag.strip() for tag in tags_str.split(',')]
                            metadata['tags'] = tags

            
            # If we didn't determine header_lines dynamically (no --- found), estimate
            if not header_lines:
                header_lines = len(yaml_lines) + 2  # +1 for speclang-header, +1 for ---
            
            break
    
    return header_lines, metadata

def get_spec_files(root_dir):
    """Find all spec files."""
    spec_extensions = ['.scl', '.spec.md', '.spec.yaml', '.spec']
    code_spec_pattern = re.compile(r'\.[a-z]+\.spec$')
    
    files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Skip .git and backup directories
        dirnames[:] = [d for d in dirnames if d != '.git' and d != '.opencode' and d != '.backup_spec_files']
        
        # Skip backup directory entirely
        if '.backup_spec_files' in dirpath:
            continue
            
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            relpath = os.path.relpath(filepath, root_dir)
            
            # Skip backup files
            if '.backup_spec_files' in relpath:
                continue
            
            # Check if it's a spec file
            is_spec = False
            for ext in spec_extensions:
                if filename.endswith(ext):
                    is_spec = True
                    break
            
            if not is_spec and code_spec_pattern.search(filename):
                is_spec = True
            
            if is_spec:
                files.append((relpath, filepath))
    
    print(f"Found {len(files)} spec files")
    for f in files[:10]:
        print(f"  {f[0]}")
    return files

def main():
    root_dir = '.'
    spec_files = get_spec_files(root_dir)
    
    entries = []
    for relpath, filepath in spec_files:
        try:
            stat = os.stat(filepath)
            
            # Count lines
            with open(filepath, 'r') as f:
                lines = sum(1 for _ in f)
            
            # Parse header
            header_lines, metadata = parse_header(filepath)
            
            # Handle layer conversion (must be integer 0-10)
            layer_raw = metadata.get('layer', 0)
            if isinstance(layer_raw, str):
                if layer_raw.isdigit():
                    layer = int(layer_raw)
                elif layer_raw == 'meta':
                    layer = 0  # Convert 'meta' to 0
                else:
                    layer = 0  # Default for unknown strings
            elif isinstance(layer_raw, int):
                layer = layer_raw
            else:
                layer = 0
            
            # Ensure layer is within 0-10 range
            layer = max(0, min(layer, 10))
            
            # Build entry
            entry = {
                'path': relpath,
                'id': metadata.get('id', f'@unknown/{os.path.basename(relpath)}'),
                'version': metadata.get('version', '0.0.0'),
                'layer': layer,
                'project_level': metadata.get('project_level'),
                'agent_support': metadata.get('agent_support'),
                'tags': metadata.get('tags', []),
                'imports': metadata.get('imports', []),
                'short': metadata.get('short', os.path.basename(relpath)),
                'refs': metadata.get('refs', []),
                'lines': lines,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat() + 'Z',
                'header_lines': header_lines,
                'status': metadata.get('status', 'draft'),
                'target': metadata.get('target'),
                'depends_on': metadata.get('depends_on', []),
                'children': metadata.get('children', [])
            }
            
            entries.append(entry)
        except Exception as e:
            print(f"Error processing {relpath}: {e}")
    
    # Sort by path
    entries.sort(key=lambda x: x['path'])
    
    # Write JSONL
    with open('_index.json', 'w') as f:
        for entry in entries:
            f.write(json.dumps(entry) + '\n')
    
    print(f"Created _index.json with {len(entries)} entries")

if __name__ == '__main__':
    main()