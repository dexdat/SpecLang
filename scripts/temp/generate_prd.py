#!/usr/bin/env python3
import re
import json
import os

def extract_stories(todo_path):
    with open(todo_path, 'r') as f:
        content = f.read()
    
    # Pattern for story headings: ### P0-025: Implement Project Maturity Levels
    pattern = r'^### (P\d+-\d+):'
    matches = re.findall(pattern, content, re.MULTILINE)
    stories = []
    for match in matches:
        stories.append(match)
    
    # Also handle ranges like P0-029 to P0-032
    range_pattern = r'^### (P\d+-\d+) to (P\d+-\d+):'
    range_matches = re.findall(range_pattern, content, re.MULTILINE)
    for start, end in range_matches:
        # parse numbers
        prefix = start.split('-')[0]
        start_num = int(start.split('-')[1])
        end_num = int(end.split('-')[1])
        for num in range(start_num, end_num + 1):
            stories.append(f"{prefix}-{num:03d}")
    
    # Also handle lines like "P0-037 to P0-041: Maturity Levels (5 stories)"
    # but those are subheadings under ###
    # We'll ignore for now.
    
    # Deduplicate and sort
    stories = sorted(set(stories))
    return stories

def group_by_phase(stories):
    phases = {}
    for story in stories:
        # P0-025 -> phase "P0"
        phase = story.split('-')[0]
        phases.setdefault(phase, []).append(story)
    return phases

def create_prd(phases):
    prd = {
        "phases": []
    }
    for phase_id, story_ids in sorted(phases.items()):
        phase = {
            "id": phase_id,
            "name": f"Phase {phase_id}",
            "stories": []
        }
        for story_id in story_ids:
            story = {
                "id": story_id,
                "title": story_id,  # placeholder
                "spec": f"specs/{story_id.lower().replace('-', '/')}.spec.md",
                "prompt": f"docs/prompts/{story_id.lower().replace('-', '_')}.md",
                "outputs": [],
                "priority": int(story_id.split('-')[1]),
                "passes": True
            }
            phase["stories"].append(story)
        prd["phases"].append(phase)
    return prd

def main():
    todo_path = "TODO.md"
    if not os.path.exists(todo_path):
        print("TODO.md not found")
        return
    
    stories = extract_stories(todo_path)
    print(f"Found {len(stories)} stories")
    
    phases = group_by_phase(stories)
    for phase, stories in phases.items():
        print(f"{phase}: {len(stories)} stories")
    
    prd = create_prd(phases)
    
    output_path = ".ralph/prd.json"
    with open(output_path, 'w') as f:
        json.dump(prd, f, indent=2)
    
    print(f"Generated PRD at {output_path}")

if __name__ == "__main__":
    main()