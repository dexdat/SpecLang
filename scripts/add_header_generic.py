import sys
from datetime import datetime

if len(sys.argv) != 3:
    print('Usage: python add_header_generic.py <file_path> <source_spec>')
    sys.exit(1)

file_path = sys.argv[1]
source_spec = sys.argv[2]

with open(file_path, 'r') as f:
    content = f.read()

header = f"""/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: {source_spec}
 * Generated: {datetime.now().isoformat()}
 * 
 * Edit the spec, not this file.
 */
"""

new_content = header + content
with open(file_path, 'w') as f:
    f.write(new_content)

print(f'Added header to {file_path}')