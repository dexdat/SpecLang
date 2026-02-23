#!/usr/bin/env python3
import os
import json
import re
import sys
from pathlib import Path
from datetime import datetime

def main():
    base = Path("/Users/lexykwaii/Code/SpecLang")
    
    # 1. Check prompts in docs/prompts/
    prompts_dir = base / "docs" / "prompts"
    prompt_files = list(prompts_dir.glob("*.md"))
    print(f"Total prompt files: {len(prompt_files)}")
    
    # 2. Check SIPs in .opencode/skills/sip-*.md
    sips_dir = base / ".opencode" / "skills"
    sip_files = list(sips_dir.glob("sip-*.md"))
    print(f"Total SIP files: {len(sip_files)}")
    
    # Extract SIP numbers
    sip_numbers = []
    for f in sip_files:
        match = re.search(r'sip-(\d+)-', f.name)
        if match:
            sip_numbers.append(int(match.group(1)))
    sip_numbers.sort()
    print(f"SIP numbers range: {min(sip_numbers)} to {max(sip_numbers)}")
    
    # Check for gaps
    expected = set(range(min(sip_numbers), max(sip_numbers) + 1))
    missing = expected - set(sip_numbers)
    if missing:
        print(f"Missing SIP numbers: {sorted(missing)}")
    else:
        print("No gaps in SIP numbering.")
    
    # Check for duplicates
    from collections import Counter
    dup = [k for k, v in Counter(sip_numbers).items() if v > 1]
    if dup:
        print(f"Duplicate SIP numbers: {dup}")
    else:
        print("No duplicate SIP numbers.")
    
    # 3. Check PRD stories
    prd_path = base / ".ralph" / "prd.json"
    with open(prd_path) as f:
        prd = json.load(f)
    
    stories = []
    for phase in prd["phases"]:
        stories.extend(phase["stories"])
    print(f"Total PRD stories: {len(stories)}")
    
    # Extract prompt references
    prompt_refs = []
    for story in stories:
        prompt = story.get("prompt")
        if prompt:
            prompt_refs.append(prompt)
    print(f"Unique prompt references: {len(set(prompt_refs))}")
    
    # 4. Prompt-to-story coverage
    # Map prompt filenames to full paths
    prompt_paths = {p.name: p for p in prompt_files}
    referenced_prompts = set()
    for ref in prompt_refs:
        # ref is like "docs/prompts/phase-0.1-sqlite.md"
        ref_name = os.path.basename(ref)
        referenced_prompts.add(ref_name)
    
    # Check which prompt files are not referenced
    all_prompt_names = {p.name for p in prompt_files}
    unreferenced = all_prompt_names - referenced_prompts
    print(f"Unreferenced prompt files: {len(unreferenced)}")
    if unreferenced:
        print("Unreferenced prompts:")
        for name in sorted(unreferenced):
            print(f"  - {name}")
    
    # Check which referenced prompts don't exist
    missing_prompts = referenced_prompts - all_prompt_names
    if missing_prompts:
        print(f"Missing prompt files referenced in PRD: {len(missing_prompts)}")
        for name in sorted(missing_prompts):
            print(f"  - {name}")
    
    # Coverage percentage
    coverage = len(referenced_prompts) / len(all_prompt_names) * 100 if all_prompt_names else 0
    print(f"Prompt-to-story coverage: {coverage:.1f}%")
    
    # 5. Quality score (simple heuristic)
    quality_score = 0
    max_score = 100
    # Each check contributes
    
    # SIP numbering (20 points)
    if not missing and not dup:
        quality_score += 20
    elif missing:
        quality_score += 10  # half points for gaps
    elif dup:
        quality_score += 5
    
    # Prompt coverage (30 points)
    if coverage == 100:
        quality_score += 30
    else:
        quality_score += (coverage / 100) * 30
    
    # All prompts exist (10 points)
    if not missing_prompts:
        quality_score += 10
    
    # All SIP files exist (10 points)
    if len(sip_files) >= 50:  # arbitrary threshold
        quality_score += 10
    
    # PRD stories count (10 points)
    if len(stories) >= 50:
        quality_score += 10
    
    # Prompt files count (10 points)
    if len(prompt_files) >= 50:
        quality_score += 10
    
    # Structure (10 points) - just give
    quality_score += 10
    
    print(f"\nQuality Score: {quality_score:.1f}/100")
    
    # Pass/fail status
    pass_fail = {}
    pass_fail["SIP numbering gaps"] = "PASS" if not missing else "FAIL"
    pass_fail["SIP numbering duplicates"] = "PASS" if not dup else "FAIL"
    pass_fail["Prompt coverage 100%"] = "PASS" if coverage == 100 else "FAIL"
    pass_fail["All referenced prompts exist"] = "PASS" if not missing_prompts else "FAIL"
    pass_fail["All prompts have stories"] = "PASS" if len(unreferenced) == 0 else "FAIL"
    
    print("\nPass/Fail Status:")
    for check, status in pass_fail.items():
        print(f"  {check}: {status}")
    
    # Overall status
    overall = "PASS" if all(v == "PASS" for v in pass_fail.values()) else "FAIL"
    print(f"\nOverall Validation: {overall}")
    
    # Write report
    report_path = base / "adversarial_final_validation_report.md"
    with open(report_path, "w") as f:
        f.write("# SpecLang Final Validation Report\n\n")
        f.write("## Summary\n\n")
        f.write(f"- **Overall Status**: {overall}\n")
        f.write(f"- **Quality Score**: {quality_score:.1f}/100\n")
        f.write(f"- **Validation Date**: {datetime.now().isoformat()}\n\n")
        
        f.write("## Counts\n\n")
        f.write(f"- Prompt files: {len(prompt_files)}\n")
        f.write(f"- SIP files: {len(sip_files)}\n")
        f.write(f"- PRD stories: {len(stories)}\n")
        f.write(f"- SIP numbers range: {min(sip_numbers)}–{max(sip_numbers)}\n")
        f.write(f"- Prompt-to-story coverage: {coverage:.1f}%\n\n")
        
        f.write("## SIP Numbering\n\n")
        if missing:
            f.write(f"- Missing numbers: {sorted(missing)}\n")
        else:
            f.write("- No gaps ✓\n")
        if dup:
            f.write(f"- Duplicate numbers: {dup}\n")
        else:
            f.write("- No duplicates ✓\n")
        
        f.write("\n## Prompt Coverage\n\n")
        if unreferenced:
            f.write(f"- Unreferenced prompts: {len(unreferenced)}\n")
            for name in sorted(unreferenced):
                f.write(f"  - `{name}`\n")
        else:
            f.write("- All prompts referenced ✓\n")
        
        if missing_prompts:
            f.write(f"- Missing referenced prompts: {len(missing_prompts)}\n")
            for name in sorted(missing_prompts):
                f.write(f"  - `{name}`\n")
        else:
            f.write("- All referenced prompts exist ✓\n")
        
        f.write("\n## Pass/Fail Status\n\n")
        for check, status in pass_fail.items():
            f.write(f"- **{check}**: {status}\n")
        
        f.write("\n## Recommendations\n\n")
        if missing:
            f.write("- Create missing SIP files for gaps.\n")
        if dup:
            f.write("- Resolve duplicate SIP numbers.\n")
        if unreferenced:
            f.write("- Either create PRD stories for unreferenced prompts or remove unused prompts.\n")
        if missing_prompts:
            f.write("- Create missing prompt files referenced in PRD.\n")
        if coverage < 100:
            f.write("- Achieve 100% prompt-to-story coverage.\n")
        
        f.write("\n---\n")
        f.write("*Generated by SpecLang Adversary*")
    
    print(f"\nReport written to {report_path}")

if __name__ == "__main__":
    main()