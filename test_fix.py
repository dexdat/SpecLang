#!/usr/bin/env python3
import re

def quote_at_values(line):
    """Quote @-prefixed values in YAML lines."""
    line = re.sub(r'^(\s*[a-zA-Z_-]+:\s*)(@[^\s]+)(\s*)$', r'\1"\2"\3', line, flags=re.MULTILINE)
    line = re.sub(r'([\{\[ ])(@[^\s,\]\}]+)([,\]\}])', r'\1"\2"\3', line)
    line = re.sub(r'([\{\[ ])(@[^\s,\]\}]+)(\s*)$', r'\1"\2"\3', line)
    return line

def fix_header(content):
    """Fix speclang header in file content."""
    lines = content.splitlines(keepends=True)
    header_start = -1
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            header_start = i
            break
    if header_start == -1:
        return content
    
    yaml_lines = []
    i = header_start + 1
    while i < len(lines) and not lines[i].strip() == '---':
        yaml_lines.append(lines[i])
        i += 1
    
    if not yaml_lines:
        return content
    
    fixed_yaml = []
    for line in yaml_lines:
        line = quote_at_values(line)
        if re.match(r'^\s*layer:\s*meta\s*$', line):
            line = re.sub(r'^\s*layer:\s*meta\s*$', 'layer: 0', line)
        fixed_yaml.append(line)
    
    header_line_count = len(yaml_lines) + 2
    header_line = lines[header_start]
    if 'lines:' not in header_line:
        if header_line.strip().startswith('#'):
            lines[header_start] = re.sub(r'^(#\s*speclang-header)(\s*)$', 
                                         r'\1 lines:' + str(header_line_count), 
                                         header_line)
        else:
            lines[header_start] = header_line.rstrip('\n') + f' lines:{header_line_count}\n'
    
    for idx, (old, new) in enumerate(zip(yaml_lines, fixed_yaml)):
        if old != new:
            lines[header_start + 1 + idx] = new
    
    return ''.join(lines)

with open('specs/directory-structure.spec.md', 'r') as f:
    content = f.read()

fixed = fix_header(content)
print("Fixed first 20 lines:")
for i, line in enumerate(fixed.splitlines()[:20]):
    print(f"{i+1}: {line}")
print("\nDiff:")
old_lines = content.splitlines()
new_lines = fixed.splitlines()
for i, (old, new) in enumerate(zip(old_lines, new_lines)):
    if old != new:
        print(f"Line {i+1}: - {old}")
        print(f"         + {new}")