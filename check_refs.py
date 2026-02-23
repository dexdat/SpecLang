#!/usr/bin/env python3
import os
import re
import sys

specs_dir = 'specs'

# collect all spec files
spec_files = []
for root, dirs, files in os.walk(specs_dir):
    for f in files:
        if f.endswith('.spec.md'):
            spec_files.append(os.path.join(root, f))

print(f"Total spec files: {len(spec_files)}")

# map spec IDs to paths (from index if available, else infer)
spec_id_to_path = {}
# try to load index
index_path = '_index.json'
if os.path.exists(index_path):
    import json
    with open(index_path) as fp:
        index = json.load(fp)
    for spec_id, data in index.get('specs', {}).items():
        spec_id_to_path[spec_id] = data.get('path')
else:
    # infer from path: specs/foo.spec.md -> @specs/foo
    for path in spec_files:
        rel = os.path.relpath(path, specs_dir)
        # remove .spec.md
        base = rel[:-9]  # strip .spec.md
        # convert to ID: @specs/{base}
        spec_id = f"@specs/{base}"
        spec_id_to_path[spec_id] = path

# also map block IDs within files? We'll just check file existence for now.
# For block references (#block-name), we need to check within file.

broken_refs = []

for spec_file in spec_files:
    with open(spec_file, 'r') as f:
        content = f.read()
    # find all @ref: patterns
    matches = re.findall(r'@ref:([^\s]+)', content)
    for ref in matches:
        # ref could be:
        # 1. spec ID only: @specs/foo
        # 2. spec ID with block: @specs/foo#block
        # 3. relative path: specs/foo.spec.md
        # 4. block only: #block (implies same file)
        if ref.startswith('#'):
            # block reference within same file, skip for now
            continue
        if ref.startswith('specs/'):
            # path reference
            if not os.path.exists(ref):
                broken_refs.append((spec_file, ref))
            continue
        # assume spec ID
        # check if spec ID exists in mapping
        if ref not in spec_id_to_path:
            broken_refs.append((spec_file, ref))
        else:
            # check path exists
            path = spec_id_to_path[ref]
            if not path or not os.path.exists(path):
                broken_refs.append((spec_file, ref))

if broken_refs:
    print("Broken spec references:")
    for file, ref in broken_refs:
        print(f"  {file}: {ref}")
    sys.exit(1)
else:
    print("All spec references are valid.")
    sys.exit(0)