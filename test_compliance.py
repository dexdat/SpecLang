#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Copy the check_symlink_target_valid function from check_compliance.py
# Let's import it directly
sys.path.insert(0, '.')
from specs.scripts.spec.dir.check_compliance import check_symlink_target_valid

# Test file
file_path = Path('src/maturity/levels/production-transitions.ts')
expected_spec_path = 'specs/implementation.spec.dir/src/'
print(f'Testing {file_path}')
print(f'Is symlink? {file_path.is_symlink()}')
if file_path.is_symlink():
    target = os.readlink(file_path)
    print(f'Target: {target}')
    result = check_symlink_target_valid(file_path, expected_spec_path)
    print(f'Result: {result}')
else:
    print('Not a symlink')