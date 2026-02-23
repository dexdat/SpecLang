#!/usr/bin/env python3
import os
import json
import re
import sys
from pathlib import Path
from datetime import datetime

def check_prompt_files(prompts_dir):
    """Check prompt files are non-empty and have content."""
    issues = []
    for prompt_file in prompts_dir.glob("*.md"):
        size = prompt_file.stat().st_size
        if size == 0:
            issues.append(f"Empty prompt file: {prompt_file.name}")
        else:
            # Check if it's just a placeholder
            content = prompt_file.read_text()
            if len(content.strip()) < 50:
                issues.append(f"Very small prompt file: {prompt_file.name} ({size} bytes)")
    return issues

def check_sip_files(sips_dir):
    """Check SIP files have content and maybe header."""
    issues = []
    for sip_file in sips_dir.glob("sip-*.md"):
        size = sip_file.stat().st_size
        if size == 0:
            issues.append(f"Empty SIP file: {sip_file.name}")
        else:
            content = sip_file.read_text()
            # Check for SIP header pattern (accepts "# SIP 44" or "# SIP-44")
            if not re.search(r'^#\s+SIP[-\s]\d+', content, re.MULTILINE):
                issues.append(f"SIP file missing header: {sip_file.name}")
            elif len(content.strip()) < 100:
                issues.append(f"Very small SIP file: {sip_file.name} ({size} bytes)")
    return issues

def check_prd_stories(prd_path, base_dir):
    """Check PRD stories for validity."""
    with open(prd_path) as f:
        prd = json.load(f)
    
    stories = []
    for phase in prd["phases"]:
        stories.extend(phase["stories"])
    
    issues = []
    story_ids = set()
    for story in stories:
        # Check unique ID
        sid = story["id"]
        if sid in story_ids:
            issues.append(f"Duplicate story ID: {sid}")
        story_ids.add(sid)
        
        # Check spec file exists
        spec = story.get("spec")
        if spec:
            spec_path = base_dir / spec
            if not spec_path.exists():
                issues.append(f"Missing spec file for story {sid}: {spec}")
        else:
            issues.append(f"Story missing spec field: {sid}")
        
        # Check prompt file exists (already done but double-check)
        prompt = story.get("prompt")
        if not prompt:
            issues.append(f"Story missing prompt field: {sid}")
        else:
            prompt_path = base_dir / prompt
            if not prompt_path.exists():
                issues.append(f"Missing prompt file for story {sid}: {prompt}")
        
        # Check outputs list
        outputs = story.get("outputs", [])
        if not outputs:
            issues.append(f"Story missing outputs: {sid}")
        
        # Check passes field is boolean
        if "passes" not in story:
            issues.append(f"Story missing passes field: {sid}")
    
    return issues, len(stories)

def main():
    base = Path("/Users/lexykwaii/Code/SpecLang")
    
    print("=== Deep Validation ===\n")
    
    # 1. Prompt files
    prompts_dir = base / "docs" / "prompts"
    prompt_issues = check_prompt_files(prompts_dir)
    print(f"Prompt files check: {len(prompt_issues)} issues")
    for issue in prompt_issues[:5]:  # limit output
        print(f"  - {issue}")
    if len(prompt_issues) > 5:
        print(f"  ... and {len(prompt_issues) - 5} more")
    
    # 2. SIP files
    sips_dir = base / ".opencode" / "skills"
    sip_issues = check_sip_files(sips_dir)
    print(f"\nSIP files check: {len(sip_issues)} issues")
    for issue in sip_issues[:5]:
        print(f"  - {issue}")
    if len(sip_issues) > 5:
        print(f"  ... and {len(sip_issues) - 5} more")
    
    # 3. PRD stories
    prd_path = base / ".ralph" / "prd.json"
    prd_issues, story_count = check_prd_stories(prd_path, base)
    print(f"\nPRD stories check: {len(prd_issues)} issues")
    for issue in prd_issues[:10]:
        print(f"  - {issue}")
    if len(prd_issues) > 10:
        print(f"  ... and {len(prd_issues) - 10} more")
    
    # 4. Spec files existence (all spec files in specs/)
    spec_files = list(base.glob("specs/**/*.spec.md"))
    print(f"\nTotal spec files: {len(spec_files)}")
    
    # 5. Check for spec files referenced in PRD but missing
    with open(prd_path) as f:
        prd = json.load(f)
    referenced_specs = set()
    for phase in prd["phases"]:
        for story in phase["stories"]:
            spec = story.get("spec")
            if spec:
                referenced_specs.add(spec)
    missing_specs = []
    for spec in referenced_specs:
        if not (base / spec).exists():
            missing_specs.append(spec)
    print(f"Missing spec files referenced in PRD: {len(missing_specs)}")
    for spec in missing_specs[:5]:
        print(f"  - {spec}")
    if len(missing_specs) > 5:
        print(f"  ... and {len(missing_specs) - 5} more")
    
    # 6. Check for spec files not referenced in PRD (optional)
    all_spec_paths = {str(p.relative_to(base)) for p in spec_files}
    unreferenced_specs = all_spec_paths - referenced_specs
    print(f"Unreferenced spec files: {len(unreferenced_specs)}")
    # Not necessarily a problem, but note
    
    # Overall status
    total_issues = len(prompt_issues) + len(sip_issues) + len(prd_issues) + len(missing_specs)
    print(f"\nTotal issues found: {total_issues}")
    
    # Write detailed report
    report_path = base / "adversarial_deep_validation_report.md"
    with open(report_path, "w") as f:
        f.write("# SpecLang Deep Validation Report\n\n")
        f.write(f"**Date**: {datetime.now().isoformat()}\n")
        f.write(f"**Total Issues**: {total_issues}\n\n")
        
        f.write("## Prompt Files Issues\n\n")
        if prompt_issues:
            for issue in prompt_issues:
                f.write(f"- {issue}\n")
        else:
            f.write("No issues.\n")
        
        f.write("\n## SIP Files Issues\n\n")
        if sip_issues:
            for issue in sip_issues:
                f.write(f"- {issue}\n")
        else:
            f.write("No issues.\n")
        
        f.write("\n## PRD Stories Issues\n\n")
        if prd_issues:
            for issue in prd_issues:
                f.write(f"- {issue}\n")
        else:
            f.write("No issues.\n")
        
        f.write("\n## Missing Spec Files\n\n")
        if missing_specs:
            for spec in missing_specs:
                f.write(f"- {spec}\n")
        else:
            f.write("No missing spec files.\n")
        
        f.write("\n## Statistics\n\n")
        f.write(f"- Prompt files: {len(list(prompts_dir.glob('*.md')))}\n")
        f.write(f"- SIP files: {len(list(sips_dir.glob('sip-*.md')))}\n")
        f.write(f"- PRD stories: {story_count}\n")
        f.write(f"- Spec files: {len(spec_files)}\n")
        f.write(f"- Referenced specs: {len(referenced_specs)}\n")
        f.write(f"- Unreferenced specs: {len(unreferenced_specs)}\n")
        
        f.write("\n---\n")
        f.write("*Generated by SpecLang Adversary*")
    
    print(f"\nDetailed report written to {report_path}")
    
    # Final verdict
    if total_issues == 0:
        print("\n✅ All deep validation checks passed!")
        return 0
    else:
        print("\n⚠️  Some issues found. Review report.")
        return 1

if __name__ == "__main__":
    sys.exit(main())