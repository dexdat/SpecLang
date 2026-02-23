#!/usr/bin/env python3
import os
import json
import sys

def load_prd(prd_path):
    with open(prd_path, 'r') as f:
        return json.load(f)

def get_prompts_list(prompts_dir):
    prompts = []
    for filename in os.listdir(prompts_dir):
        if filename.endswith('.md'):
            prompts.append(filename)
    return prompts

def get_prd_prompts(prd):
    prd_prompts = []
    for phase in prd['phases']:
        for story in phase['stories']:
            prompt_path = story['prompt']
            # extract filename
            filename = os.path.basename(prompt_path)
            prd_prompts.append(filename)
    return prd_prompts

def main():
    prd_path = '.ralph/prd.json'
    prompts_dir = 'docs/prompts'
    
    prd = load_prd(prd_path)
    all_prompts = get_prompts_list(prompts_dir)
    prd_prompts = get_prd_prompts(prd)
    
    print(f"Total prompts in directory: {len(all_prompts)}")
    print(f"Total prompts referenced in PRD: {len(prd_prompts)}")
    
    missing_in_prd = [p for p in all_prompts if p not in prd_prompts]
    extra_in_prd = [p for p in prd_prompts if p not in all_prompts]
    
    if missing_in_prd:
        print("\nPrompts missing in PRD:")
        for p in missing_in_prd:
            print(f"  {p}")
    
    if extra_in_prd:
        print("\nPrompts referenced in PRD but not found in directory:")
        for p in extra_in_prd:
            print(f"  {p}")
    
    # Check for duplicate story IDs
    story_ids = []
    for phase in prd['phases']:
        for story in phase['stories']:
            story_ids.append(story['id'])
    duplicates = [id for id in story_ids if story_ids.count(id) > 1]
    if duplicates:
        print("\nDuplicate story IDs in PRD:")
        for d in set(duplicates):
            print(f"  {d}")
    
    if not missing_in_prd and not extra_in_prd and not duplicates:
        print("\n✓ PRD covers all prompts correctly.")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()