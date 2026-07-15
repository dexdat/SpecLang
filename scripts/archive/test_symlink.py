#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Add the directory containing check_compliance.py to path
sys.path.insert(0, 'specs/scripts.spec.dir')
from check_compliance import check_symlink_target_valid

file_path = Path('src/maturity/levels/production-transitions.ts')
expected_spec_path = 'specs/'
print(f'File: {file_path}')
print(f'Is symlink: {file_path.is_symlink()}')
if file_path.is_symlink():
    target = os.readlink(file_path)
    print(f'Target: {target}')
    result = check_symlink_target_valid(file_path, expected_spec_path)
    print(f'Result: {result}')
else:
    print('Not symlink')