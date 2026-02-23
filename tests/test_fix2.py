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
    
    for idx, line in enumerate(yaml_lines):
        newline = line[-1] if line.endswith('\n') else ''
        line_text = line.rstrip('\n')
        
        line_text = quote_at_values(line_text)
        if re.match(r'^\s*layer:\s*meta\s*$', line_text):
            line_text = 'layer: 0'
        
        new_line = line_text + newline
        if new_line != line:
            lines[header_start + 1 + idx] = new_line
    
    return ''.join(lines)

with open('specs/speclang.spec.md', 'r') as f:
    content = f.read()

fixed = fix_header(content)
print("First 15 lines of fixed:")
for i, line in enumerate(fixed.splitlines()[:15]):
    print(f"{i+1}: {line}")
print("\nChanges:")
old_lines = content.splitlines()
new_lines = fixed.splitlines()
for i, (old, new) in enumerate(zip(old_lines, new_lines)):
    if old != new:
        print(f"Line {i+1}: - {old}")
        print(f"         + {new}")