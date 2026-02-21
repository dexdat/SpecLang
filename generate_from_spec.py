#!/usr/bin/env python3
"""
Generate code from a spec file.
"""
import sys
import os
import re
import yaml

def parse_header(filepath):
    """Parse speclang header from file."""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    header_lines = 0
    metadata = {}
    
    # Look for speclang-header line
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            match = re.search(r'lines:\s*(\d+)', line)
            if match:
                header_lines = int(match.group(1))
                use_line_count = True
            else:
                use_line_count = False
                header_lines = 0
            
            yaml_lines = []
            j = i + 1
            
            if use_line_count:
                end_idx = min(j + header_lines - 1, len(lines))
                for k in range(j, end_idx):
                    line_text = lines[k].rstrip('\n')
                    if line_text.strip() == '---':
                        break
                    yaml_lines.append(line_text)
            else:
                for k in range(j, len(lines)):
                    line_text = lines[k].rstrip('\n')
                    if line_text.strip() == '---':
                        header_lines = k - i + 1
                        break
                    yaml_lines.append(line_text)
            
            if yaml_lines:
                yaml_text = '\n'.join(yaml_lines)
                # Fix @-prefixed scalars
                fixed_yaml = re.sub(r'([\{\[ ])(@[^\s,\]\}]+)([,\]\}])', r'\1"\2"\3', yaml_text)
                fixed_yaml = re.sub(r'([\{\[ ])(@[^\s,\]\}]+)(\s*)$', r'\1"\2"\3', fixed_yaml)
                fixed_yaml = re.sub(r'^(\s*[a-zA-Z_-]+:\s*)(@[^\s]+)(\s*)$', r'\1"\2"\3', fixed_yaml, flags=re.MULTILINE)
                
                try:
                    metadata = yaml.safe_load(fixed_yaml) or {}
                except yaml.YAMLError:
                    # fallback
                    pass
            
            if not header_lines:
                header_lines = len(yaml_lines) + 2
            break
    
    return header_lines, metadata

def extract_code_blocks(content):
    """Extract code blocks from spec content."""
    # Find all ```language ... ``` blocks, handling nested blocks poorly
    pattern = r'```([a-z]*)\n(.*?)\n```'
    matches = re.findall(pattern, content, re.DOTALL)
    blocks = []
    for lang, code in matches:
        blocks.append((lang, code))
    return blocks

def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_from_spec.py <spec-file>")
        sys.exit(1)
    
    spec_file = sys.argv[1]
    if not os.path.exists(spec_file):
        print(f"File not found: {spec_file}")
        sys.exit(1)
    
    with open(spec_file, 'r') as f:
        content = f.read()
    
    header_lines, metadata = parse_header(spec_file)
    if not metadata:
        print("Failed to parse header")
        sys.exit(1)
    
    target = metadata.get('target')
    produces = metadata.get('produces')
    if not target or not produces:
        print("Missing target or produces in header")
        sys.exit(1)
    
    print(f"Generating {target} code to {produces}")
    
    # Extract code blocks
    blocks = extract_code_blocks(content)
    # Filter for code blocks with language matching target (typescript)
    code_blocks = []
    for lang, code in blocks:
        if lang == target:
            code_blocks.append(code)
        elif lang == 'speclang':
            # Inside speclang blocks, there may be nested code blocks.
            # Extract nested ```typescript blocks
            nested = re.findall(r'```typescript\n(.*?)\n```', code, re.DOTALL)
            code_blocks.extend(nested)
    
    if not code_blocks:
        print("No code blocks found")
        sys.exit(1)
    
    # Combine blocks
    generated = '\n\n'.join(code_blocks)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(produces), exist_ok=True)
    with open(produces, 'w') as f:
        f.write(generated)
    
    print(f"Generated {produces}")

if __name__ == '__main__':
    main()