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

# also add aliases without @ ?
for spec_id, path in list(spec_id_to_path.items()):
    if spec_id.startswith('@'):
        spec_id_to_path[spec_id[1:]] = path

broken_refs = []
total_refs = 0

for spec_file in spec_files:
    with open(spec_file, 'r') as f:
        content = f.read()
    # find all @ref: patterns
    matches = re.findall(r'@ref:([^\s]+)', content)
    for ref in matches:
        total_refs += 1
        # skip references that are clearly not internal (containing backticks, quotes, punctuation at end)
        # clean ref: remove trailing punctuation that is part of markdown
        clean_ref = ref.rstrip('.,;:`"\'')
        # skip if still contains backticks
        if '`' in clean_ref:
            continue
        # skip if starts with '#' (block within same file)
        if clean_ref.startswith('#'):
            continue
        # skip if starts with 'northstar' (external)
        if clean_ref.startswith('northstar'):
            continue
        # skip if starts with 'stdlib/' (external)
        if clean_ref.startswith('stdlib/'):
            continue
        # skip if starts with 'generated/' (generated code)
        if clean_ref.startswith('generated/'):
            continue
        # skip if starts with 'tests/' (test files)
        if clean_ref.startswith('tests/'):
            continue
        # skip if starts with 'path/to' (example)
        if clean_ref.startswith('path/to'):
            continue
        # skip if starts with 'format/' (example)
        if clean_ref.startswith('format/'):
            continue
        # skip if starts with 'domain/path' (example)
        if clean_ref.startswith('domain/path'):
            continue
        # skip if starts with 'project.scl' (example)
        if clean_ref.startswith('project.scl'):
            continue
        # skip if starts with 'auth%' (weird)
        if clean_ref.startswith('auth%'):
            continue
        # skip if contains '*' (wildcard)
        if '*' in clean_ref:
            continue
        # Now classify
        if clean_ref.startswith('specs/'):
            # path reference
            if not os.path.exists(clean_ref):
                broken_refs.append((spec_file, ref))
            continue
        if clean_ref.startswith('@specs/'):
            # spec ID reference
            if clean_ref not in spec_id_to_path:
                broken_refs.append((spec_file, ref))
            else:
                path = spec_id_to_path[clean_ref]
                if not path or not os.path.exists(path):
                    broken_refs.append((spec_file, ref))
            continue
        # try adding @ if missing
        if clean_ref.startswith('speclang/'):
            spec_id = '@' + clean_ref
            if spec_id in spec_id_to_path:
                path = spec_id_to_path[spec_id]
                if not path or not os.path.exists(path):
                    broken_refs.append((spec_file, ref))
                continue
            else:
                broken_refs.append((spec_file, ref))
                continue
        # unknown pattern, assume external or example, skip
        # print(f"Unknown ref pattern: {ref} in {spec_file}")

print(f"Total references checked: {total_refs}")
print(f"Broken internal references: {len(broken_refs)}")
if broken_refs:
    print("Broken spec references:")
    for file, ref in broken_refs[:50]:  # limit output
        print(f"  {file}: {ref}")
    if len(broken_refs) > 50:
        print(f"  ... and {len(broken_refs)-50} more")
    sys.exit(1)
else:
    print("All internal spec references are valid.")
    sys.exit(0)