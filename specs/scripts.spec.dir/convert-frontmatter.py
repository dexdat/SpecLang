#!/usr/bin/env python3
"""Convert spec files from old # speclang-header format to standard --- front matter.

Old format:
  # speclang-header lines:15
  id: ...
  short: ...
  ---
  (body)

New format:
  ---
  id: ...
  short: ...
  ---
  (body)
"""

import os, re, sys

SPECS_DIR = os.path.expanduser("~/SpecLang/specs")
COUNT = 0

def convert_file(filepath):
    global COUNT
    with open(filepath, 'r') as f:
        content = f.read()

    # Check if it starts with the old format
    m = re.match(r'^# speclang-header lines:\d+\n(.*?)\n---\n', content, re.DOTALL)
    if not m:
        return False
    
    yaml_body = m.group(1).rstrip()
    rest = content[m.end():]

    new_content = f"---\n{yaml_body}\n---\n{rest}"
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    COUNT += 1
    print(f"  Converted: {os.path.relpath(filepath, SPECS_DIR)}")
    return True

def main():
    global COUNT
    for root, dirs, files in os.walk(SPECS_DIR):
        for fname in files:
            if fname.endswith('.spec.md') or fname.endswith('.scl') or fname.endswith('.spec.yaml'):
                fpath = os.path.join(root, fname)
                if fname == '.spec.md':  # skip weird edge cases
                    continue
                try:
                    convert_file(fpath)
                except Exception as e:
                    print(f"  ERROR {fpath}: {e}")
    
    print(f"\nConverted {COUNT} files")

if __name__ == '__main__':
    main()
