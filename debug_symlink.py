#!/usr/bin/env python3
from pathlib import Path

target_path = Path('specs/maturity.spec.dir/src/levels/production-transitions.ts')
print(f'target_path: {target_path}')
great_grandparent = target_path.parent.parent  # specs/maturity.spec.dir
print(f'great_grandparent: {great_grandparent}')
print(f'great_grandparent.name: {great_grandparent.name}')
candidate_specs = []
if great_grandparent.name.endswith('.spec.dir'):
    base_name = great_grandparent.name.replace('.spec.dir', '')
    candidate_specs.append(great_grandparent.parent / (base_name + '.spec.md'))
    if base_name.endswith('.ts'):
        alt_name = base_name.replace('.ts', '')
        candidate_specs.append(great_grandparent.parent / (alt_name + '.spec.md'))
print('candidate_specs:', candidate_specs)
for spec in candidate_specs:
    print(f'  {spec} exists: {spec.exists()}')
    if spec.exists():
        content = spec.read_text()
        if '# speclang-header lines:' in content:
            print('    -> has header')
        else:
            print('    -> NO header')
# Also check SPECLANG-GENERATED in target content
content = target_path.read_text()
if 'SPECLANG-GENERATED' in content:
    print('Target has SPECLANG-GENERATED')
else:
    print('Target does NOT have SPECLANG-GENERATED')