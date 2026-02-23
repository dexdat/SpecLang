#!/usr/bin/env python3
import os
import json
import re
import sys

def check_spec_exists(spec_path):
    if '*' in spec_path:
        # wildcard - check if any file matches
        import glob
        matches = glob.glob(spec_path)
        return len(matches) > 0
    return os.path.exists(spec_path)

def validate_prompts():
    print("=== Validating Prompts ===")
    prompts_dir = 'docs/prompts'
    all_prompts = []
    for filename in os.listdir(prompts_dir):
        if filename.endswith('.md'):
            all_prompts.append(filename)
    print(f"Total prompts: {len(all_prompts)}")
    
    # Check naming pattern
    pattern = re.compile(r'phase-\d+\.\d+-[a-z\-]+\.md')
    non_conforming = [p for p in all_prompts if not pattern.match(p)]
    if non_conforming:
        print("Non-conforming prompt names:")
        for p in non_conforming:
            print(f"  {p}")
    
    # Check spec references
    missing_refs = []
    for filename in all_prompts:
        path = os.path.join(prompts_dir, filename)
        with open(path, 'r') as f:
            content = f.read()
            matches = re.findall(r'`([^`]+)`', content)
            for match in matches:
                if match.startswith('specs/') and match.endswith('.spec.md'):
                    if not check_spec_exists(match):
                        missing_refs.append((filename, match))
    if missing_refs:
        print("Missing spec references:")
        for filename, ref in missing_refs:
            print(f"  {filename}: {ref}")
    else:
        print("All spec references exist.")
    return missing_refs

def validate_sips():
    print("\n=== Validating SIPs ===")
    sips_dir = '.opencode/skills'
    sip_files = [f for f in os.listdir(sips_dir) if f.startswith('sip-') and f.endswith('.md')]
    print(f"Total SIPs: {len(sip_files)}")
    
    # Check naming pattern
    pattern = re.compile(r'sip-\d{3}-[a-z\-]+-speclang-v\d\.md')
    non_conforming = [f for f in sip_files if not pattern.match(f)]
    if non_conforming:
        print("Non-conforming SIP names:")
        for f in non_conforming:
            print(f"  {f}")
    
    # Check duplicate numbers
    numbers = []
    for f in sip_files:
        match = re.search(r'sip-(\d{3})', f)
        if match:
            numbers.append(int(match.group(1)))
    duplicates = [n for n in numbers if numbers.count(n) > 1]
    if duplicates:
        print("Duplicate SIP numbers:")
        for d in set(duplicates):
            print(f"  {d:03d}")
    else:
        print("No duplicate SIP numbers.")
    
    # Check sequential numbers
    numbers_sorted = sorted(set(numbers))
    expected = list(range(numbers_sorted[0], numbers_sorted[-1] + 1))
    missing = [n for n in expected if n not in numbers_sorted]
    if missing:
        print("Missing SIP numbers:")
        for m in missing:
            print(f"  {m:03d}")
    else:
        print("SIP numbers are sequential.")
    
    return sip_files

def validate_prd():
    print("\n=== Validating PRD ===")
    with open('.ralph/prd.json', 'r') as f:
        prd = json.load(f)
    
    # Collect all prompts referenced
    prd_prompts = []
    story_specs = []
    for phase in prd['phases']:
        for story in phase['stories']:
            prompt_path = story['prompt']
            filename = os.path.basename(prompt_path)
            prd_prompts.append(filename)
            story_specs.append((story['id'], story['spec']))
    
    # Check spec existence
    missing_specs = []
    for story_id, spec_path in story_specs:
        if not check_spec_exists(spec_path):
            missing_specs.append((story_id, spec_path))
    
    if missing_specs:
        print("Missing spec references in PRD stories:")
        for story_id, spec_path in missing_specs:
            print(f"  {story_id}: {spec_path}")
    else:
        print("All PRD spec references exist.")
    
    # Compare with prompts directory
    prompts_dir = 'docs/prompts'
    all_prompts = [f for f in os.listdir(prompts_dir) if f.endswith('.md')]
    missing_in_prd = [p for p in all_prompts if p not in prd_prompts]
    extra_in_prd = [p for p in prd_prompts if p not in all_prompts]
    
    if missing_in_prd:
        print("Prompts missing in PRD:")
        for p in missing_in_prd:
            print(f"  {p}")
    if extra_in_prd:
        print("Prompts referenced in PRD but not found:")
        for p in extra_in_prd:
            print(f"  {p}")
    
    # Check duplicate story IDs
    story_ids = []
    for phase in prd['phases']:
        for story in phase['stories']:
            story_ids.append(story['id'])
    duplicates = [id for id in story_ids if story_ids.count(id) > 1]
    if duplicates:
        print("Duplicate story IDs:")
        for d in set(duplicates):
            print(f"  {d}")
    
    return missing_specs, missing_in_prd

def main():
    print("SpecLang Adversary Quality Check")
    print("=" * 40)
    
    prompt_issues = validate_prompts()
    sip_files = validate_sips()
    prd_spec_issues, prd_prompt_issues = validate_prd()
    
    # Summary
    print("\n" + "=" * 40)
    print("SUMMARY")
    print("=" * 40)
    issues = []
    if prompt_issues:
        issues.append(f"{len(prompt_issues)} missing spec references in prompts")
    if prd_spec_issues:
        issues.append(f"{len(prd_spec_issues)} missing spec references in PRD")
    if prd_prompt_issues:
        issues.append(f"{len(prd_prompt_issues)} prompts missing in PRD")
    
    if issues:
        print("ISSUES FOUND:")
        for issue in issues:
            print(f"  - {issue}")
        sys.exit(1)
    else:
        print("All checks passed.")
        sys.exit(0)

if __name__ == '__main__':
    main()