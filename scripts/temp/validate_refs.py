#!/usr/bin/env python3
import os
import re
import sys

def extract_refs_from_prompts(prompts_dir):
    refs = []
    for filename in os.listdir(prompts_dir):
        if filename.endswith('.md'):
            path = os.path.join(prompts_dir, filename)
            with open(path, 'r') as f:
                content = f.read()
                # find backtick-enclosed references
                matches = re.findall(r'`([^`]+)`', content)
                for match in matches:
                    if match.startswith('specs/') and match.endswith('.spec.md'):
                        refs.append((filename, match))
    return refs

def check_existence(refs, base_dir):
    missing = []
    for filename, ref in refs:
        # handle wildcards
        if '*' in ref:
            # skip wildcard references for now
            continue
        # normalize path
        full_path = os.path.join(base_dir, ref)
        if not os.path.exists(full_path):
            missing.append((filename, ref))
    return missing

def main():
    prompts_dir = 'docs/prompts'
    base_dir = '.'
    refs = extract_refs_from_prompts(prompts_dir)
    print(f"Total references: {len(refs)}")
    missing = check_existence(refs, base_dir)
    if missing:
        print("Missing spec references:")
        for filename, ref in missing:
            print(f"  {filename}: {ref}")
        sys.exit(1)
    else:
        print("All spec references exist.")
        sys.exit(0)

if __name__ == '__main__':
    main()