# speclang-header lines:3
# target: scripts/add_missing_fields.py
#!/usr/bin/env python3
"""
Add missing metadata fields to spec headers.
Simple line-based approach to preserve formatting.
"""

import os
import re
import sys
import yaml
from pathlib import Path
from typing import Dict, List, Tuple, Optional

def parse_header(filepath: str) -> Tuple[int, Dict]:
    """Parse speclang header from file. Returns (header_line_count, metadata)."""
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

def determine_defaults(spec_id: str, metadata: Dict) -> Dict:
    """Determine default values for missing fields."""
    defaults = {}
    
    # version: 0.1.0
    if 'version' not in metadata:
        defaults['version'] = '0.1.0'
    
    # layer: default based on spec category
    if 'layer' not in metadata:
        if 'ui.components' in spec_id or 'ui.dir' in spec_id:
            defaults['layer'] = 3
        elif spec_id.startswith('@implementation/') or spec_id.startswith('@codegen/') or spec_id.startswith('@tests/'):
            defaults['layer'] = 3
        elif spec_id.startswith('@speclang/'):
            # Core language specs: layer 0
            defaults['layer'] = 0
        elif 'mcp.dir' in spec_id:
            defaults['layer'] = 0
        else:
            defaults['layer'] = 0
    
    # project_level: Alpha
    if 'project_level' not in metadata:
        defaults['project_level'] = 'Alpha'
    
    # agent_support: based on spec category
    if 'agent_support' not in metadata:
        if spec_id.startswith('@speclang/'):
            core_autonomous = [
                '@speclang/core',
                '@speclang/headers',
                '@speclang/spec-format',
                '@speclang/validation',
                '@speclang/autonomous-validation',
                '@speclang/semantic-definitions',
                '@speclang/agent-support-levels',
                '@speclang/project-maturity-levels',
                '@speclang/layer-definitions',
                '@speclang/agent-behavior-matrix',
                '@speclang/transition-workflows',
                '@speclang/safety-nets',
                '@speclang/agent-protocol',
            ]
            if spec_id in core_autonomous:
                defaults['agent_support'] = 'agent_autonomous'
            else:
                defaults['agent_support'] = 'agent_assisted'
        elif spec_id.startswith('@implementation/') or spec_id.startswith('@codegen/') or spec_id.startswith('@tests/'):
            defaults['agent_support'] = 'agent_assisted'
        else:
            defaults['agent_support'] = 'agent_assisted'
    
    # short: placeholder, will be replaced with title
    if 'short' not in metadata:
        defaults['short'] = None  # placeholder
    
    # tags: ensure non-empty list
    if 'tags' not in metadata or not metadata['tags']:
        defaults['tags'] = ['speclang']
    
    return defaults

def extract_title(content_lines: List[str], header_end: int) -> str:
    """Extract title from spec content (first line after header)."""
    for i in range(header_end, len(content_lines)):
        line = content_lines[i].strip()
        if line.startswith('# ') and not line.startswith('# @block'):
            # Markdown title: remove leading '# '
            title = line[2:].strip()
            if title:
                return title
    return ""

def generate_short(spec_id: str, title: str) -> str:
    """Generate a short description."""
    if title:
        # Limit length
        if len(title) > 80:
            title = title[:77] + '...'
        return title
    # Fallback based on spec_id
    if spec_id.startswith('@speclang/'):
        name = spec_id.split('/')[-1]
        return f"{name.replace('-', ' ')} specification"
    elif spec_id.startswith('@implementation/'):
        return f"Implementation spec for {spec_id.split('/')[-1]}"
    elif spec_id.startswith('@codegen/'):
        return f"Code generation templates for {spec_id.split('/')[-1]}"
    elif spec_id.startswith('@tests/'):
        return f"Test specifications for {spec_id.split('/')[-1]}"
    else:
        return f"Specification for {spec_id}"

def format_yaml_value(value) -> str:
    """Format a YAML value as string for output."""
    if isinstance(value, str):
        if value.startswith('@'):
            return f'"{value}"'
        else:
            return value
    elif isinstance(value, list):
        items = []
        for item in value:
            if isinstance(item, str) and item.startswith('@'):
                items.append(f'"{item}"')
            else:
                items.append(str(item))
        return f'[{", ".join(items)}]'
    else:
        return str(value)

def update_file(filepath: str, dry_run: bool) -> bool:
    """Update a single spec file. Returns True if changed."""
    with open(filepath, 'r') as f:
        lines = [line.rstrip('\n') for line in f]
    
    # Find header start
    header_start = -1
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            header_start = i
            break
    if header_start == -1:
        print(f"  Warning: No speclang-header found")
        return False
    
    # Find terminator line after header_start
    terminator = -1
    for i in range(header_start + 1, len(lines)):
        if lines[i].strip() == '---':
            terminator = i
            break
    if terminator == -1:
        print(f"  Warning: No terminator --- found after header")
        return False
    
    # Parse YAML lines
    yaml_lines = lines[header_start + 1:terminator]
    yaml_text = '\n'.join(yaml_lines)
    try:
        metadata = yaml.safe_load(yaml_text) or {}
    except yaml.YAMLError:
        print(f"  Warning: Failed to parse YAML, skipping")
        return False
    
    spec_id = metadata.get('id', '')
    if not spec_id:
        print(f"  Warning: No id in metadata")
        return False
    
    # Determine missing fields
    defaults = determine_defaults(spec_id, metadata)
    # Remove short placeholder if None
    need_short = False
    if 'short' in defaults and defaults['short'] is None:
        del defaults['short']
        need_short = True
    
    # If no missing fields, skip
    if not defaults and not need_short:
        return False
    
    # Extract title for short description
    title = extract_title(lines, terminator + 1)
    if need_short:
        short = generate_short(spec_id, title)
        defaults['short'] = short
    
    # Ensure tags non-empty
    if 'tags' in defaults:
        metadata['tags'] = defaults['tags']
    else:
        if 'tags' not in metadata or not metadata['tags']:
            defaults['tags'] = ['speclang']
            metadata['tags'] = defaults['tags']
    
    # Merge defaults into metadata (only for missing fields)
    for key, value in defaults.items():
        if key not in metadata:
            metadata[key] = value
    
    # Build new YAML lines preserving original order
    # We'll keep original lines for existing fields, append new fields at end
    existing_fields = set()
    new_yaml_lines = []
    for line in yaml_lines:
        # Extract field name from line (before colon)
        colon = line.find(':')
        if colon > 0:
            field = line[:colon].strip()
            existing_fields.add(field)
            new_yaml_lines.append(line)
        else:
            new_yaml_lines.append(line)
    
    # Append missing fields
    for field, value in defaults.items():
        if field not in existing_fields:
            new_yaml_lines.append(f'{field}: {format_yaml_value(value)}')
    
    # Compute new header line count
    new_header_lines = 1 + len(new_yaml_lines) + 1  # speclang-header line + YAML lines + terminator line
    
    # Update speclang-header line with lines:N
    header_line = lines[header_start]
    # Remove existing lines:N if present
    header_line = re.sub(r'\s+lines:\d+', '', header_line)
    # Add lines:N
    header_line = re.sub(r'(speclang-header)', rf'\1 lines:{new_header_lines}', header_line)
    
    # Build new lines
    new_lines = lines[:header_start] + [header_line] + new_yaml_lines + ['---'] + lines[terminator+1:]
    
    # Check if changed
    changed = new_lines != lines
    if changed:
        if dry_run:
            print(f"  Would update header (add {list(defaults.keys())})")
            # Show diff of header region
            for i in range(min(len(lines), len(new_lines))):
                if i < header_start or i > terminator + 2:
                    continue
                if lines[i] != new_lines[i]:
                    print(f"    Line {i+1}: - {lines[i]}")
                    print(f"              + {new_lines[i]}")
        else:
            with open(filepath, 'w') as f:
                f.write('\n'.join(new_lines) + '\n')
            print(f"  Updated header (added {list(defaults.keys())})")
    return changed

def main():
    dry_run = '--dry-run' in sys.argv
    spec_dir = Path('specs')
    spec_files = list(spec_dir.glob('**/*.spec.md')) + list(spec_dir.glob('**/*.spec.yaml')) + list(spec_dir.glob('**/*.scl'))
    
    updated_count = 0
    for spec_file in spec_files:
        print(f"Processing {spec_file}...")
        changed = update_file(str(spec_file), dry_run)
        if changed:
            updated_count += 1
    
    print(f"\nTotal updated: {updated_count}")
    if dry_run:
        print("Dry run completed. Run without --dry-run to apply changes.")

if __name__ == '__main__':
    main()