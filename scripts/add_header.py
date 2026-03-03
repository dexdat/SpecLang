import sys
from datetime import datetime

file_path = 'specs/parser.spec.dir/src/block-parser.ts'
with open(file_path, 'r') as f:
    content = f.read()

header = f"""/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/roadmap.spec.dir/poc.spec.dir/block-parser.spec.md
 * Generated: {datetime.now().isoformat()}
 * 
 * Edit the spec, not this file.
 */
"""

new_content = header + content
with open(file_path, 'w') as f:
    f.write(new_content)

print(f'Added header to {file_path}')