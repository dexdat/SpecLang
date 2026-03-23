#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')
from fix_all_children import fix_spec

spec_file = 'specs/sqlite.spec.md'
with open(spec_file, 'r', encoding='utf-8') as f:
    content = f.read()

fixed = fix_spec(content)

# Show diff
old_lines = content.splitlines()
new_lines = fixed.splitlines()
for i, (old, new) in enumerate(zip(old_lines, new_lines)):
    if old != new:
        print(f'Line {i+1}:')
        print(f'  - {old}')
        print(f'  + {new}')
        print()

# Write fixed version
with open(spec_file + '.fixed', 'w', encoding='utf-8') as f:
    f.write(fixed)
print('Fixed file saved.')