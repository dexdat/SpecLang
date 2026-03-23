#!/usr/bin/env python3
import re
from pathlib import Path

spec_file = Path('specs/stdlib.spec.md')
with open(spec_file, 'r') as f:
    content = f.read()

lines = content.splitlines(keepends=True)
header_start = -1
for i, line in enumerate(lines):
    if 'speclang-header' in line:
        header_start = i
        break

yaml_lines = []
i = header_start + 1
while i < len(lines) and not lines[i].strip() == '---':
    yaml_lines.append(lines[i])
    i += 1

print("YAML lines:")
for idx, line in enumerate(yaml_lines):
    print(f"{idx}: {repr(line)}")

# Check children
for idx, line in enumerate(yaml_lines):
    if line.strip().startswith('children:'):
        print(f"Found children at line {idx}")
        # Print next lines
        for j in range(idx+1, len(yaml_lines)):
            print(f"  {j}: {repr(yaml_lines[j])}")