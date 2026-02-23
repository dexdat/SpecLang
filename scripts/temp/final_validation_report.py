#!/usr/bin/env python3
"""
Generate comprehensive final validation report for SpecLang.
"""
import os
import json
import re
from pathlib import Path
from datetime import datetime

def main():
    base = Path("/Users/lexykwaii/Code/SpecLang")
    
    # Collect data
    data = {
        "timestamp": datetime.now().isoformat(),
        "checks": {}
    }
    
    # 1. Prompt files
    prompts_dir = base / "docs" / "prompts"
    prompt_files = list(prompts_dir.glob("*.md"))
    data["prompts"] = {
        "count": len(prompt_files),
        "empty": [],
        "small": []
    }
    for pf in prompt_files:
        size = pf.stat().st_size
        if size == 0:
            data["prompts"]["empty"].append(pf.name)
        elif size < 100:
            data["prompts"]["small"].append(pf.name)
    
    # 2. SIP files
    sips_dir = base / ".opencode" / "skills"
    sip_files = list(sips_dir.glob("sip-*.md"))
    data["sips"] = {
        "count": len(sip_files),
        "empty": [],
        "missing_header": [],
        "numbers": []
    }
    for sf in sip_files:
        size = sf.stat().st_size
        if size == 0:
            data["sips"]["empty"].append(sf.name)
        else:
            content = sf.read_text()
            if not re.search(r'^#\s+SIP[-\s]\d+', content, re.MULTILINE):
                data["sips"]["missing_header"].append(sf.name)
        # Extract number
        match = re.search(r'sip-(\d+)-', sf.name)
        if match:
            data["sips"]["numbers"].append(int(match.group(1)))
    
    data["sips"]["numbers"].sort()
    # Check gaps and duplicates
    if data["sips"]["numbers"]:
        min_num = min(data["sips"]["numbers"])
        max_num = max(data["sips"]["numbers"])
        expected = set(range(min_num, max_num + 1))
        missing = expected - set(data["sips"]["numbers"])
        data["sips"]["gaps"] = sorted(missing)
        from collections import Counter
        dup = [k for k, v in Counter(data["sips"]["numbers"]).items() if v > 1]
        data["sips"]["duplicates"] = dup
    else:
        data["sips"]["gaps"] = []
        data["sips"]["duplicates"] = []
    
    # 3. PRD stories
    prd_path = base / ".ralph" / "prd.json"
    with open(prd_path) as f:
        prd = json.load(f)
    
    stories = []
    for phase in prd["phases"]:
        stories.extend(phase["stories"])
    
    data["stories"] = {
        "count": len(stories),
        "missing_spec": [],
        "missing_prompt": [],
        "duplicate_ids": [],
        "missing_outputs": [],
        "missing_passes": []
    }
    
    story_ids = set()
    for story in stories:
        sid = story["id"]
        if sid in story_ids:
            data["stories"]["duplicate_ids"].append(sid)
        story_ids.add(sid)
        
        if not story.get("spec"):
            data["stories"]["missing_spec"].append(sid)
        else:
            spec_path = base / story["spec"]
            if not spec_path.exists():
                data["stories"]["missing_spec"].append(sid)
        
        if not story.get("prompt"):
            data["stories"]["missing_prompt"].append(sid)
        else:
            prompt_path = base / story["prompt"]
            if not prompt_path.exists():
                data["stories"]["missing_prompt"].append(sid)
        
        if not story.get("outputs"):
            data["stories"]["missing_outputs"].append(sid)
        
        if "passes" not in story:
            data["stories"]["missing_passes"].append(sid)
    
    # 4. Prompt-to-story coverage
    referenced_prompts = set()
    for story in stories:
        prompt = story.get("prompt")
        if prompt:
            referenced_prompts.add(os.path.basename(prompt))
    
    all_prompt_names = {p.name for p in prompt_files}
    data["coverage"] = {
        "referenced": len(referenced_prompts),
        "total": len(all_prompt_names),
        "unreferenced": sorted(all_prompt_names - referenced_prompts),
        "missing": sorted(referenced_prompts - all_prompt_names)
    }
    data["coverage"]["percentage"] = (len(referenced_prompts) / len(all_prompt_names) * 100) if all_prompt_names else 0
    
    # 5. Spec files
    spec_files = list(base.glob("specs/**/*.spec.md"))
    data["specs"] = {
        "count": len(spec_files),
        "referenced": set(),
        "missing_referenced": []
    }
    referenced_specs = set()
    for story in stories:
        spec = story.get("spec")
        if spec:
            referenced_specs.add(spec)
    data["specs"]["referenced"] = len(referenced_specs)
    
    for spec in referenced_specs:
        if not (base / spec).exists():
            data["specs"]["missing_referenced"].append(spec)
    
    # 6. Quality score calculation
    quality = 0
    max_score = 100
    # Each component contributes
    
    # Prompt files (10 points)
    if not data["prompts"]["empty"]:
        quality += 10
    else:
        quality += 5
    
    # SIP files (20 points)
    if not data["sips"]["empty"] and not data["sips"]["missing_header"]:
        quality += 10
    if not data["sips"]["gaps"]:
        quality += 5
    if not data["sips"]["duplicates"]:
        quality += 5
    
    # PRD stories (20 points)
    if not data["stories"]["missing_spec"]:
        quality += 5
    if not data["stories"]["missing_prompt"]:
        quality += 5
    if not data["stories"]["duplicate_ids"]:
        quality += 5
    if not data["stories"]["missing_outputs"]:
        quality += 5
    
    # Coverage (30 points)
    if data["coverage"]["percentage"] == 100:
        quality += 30
    else:
        quality += (data["coverage"]["percentage"] / 100) * 30
    
    # Specs referenced exist (10 points)
    if not data["specs"]["missing_referenced"]:
        quality += 10
    
    # Overall structure (10 points)
    quality += 10
    
    data["quality_score"] = quality
    
    # Pass/fail status for each check
    checks = {}
    checks["Prompts non-empty"] = len(data["prompts"]["empty"]) == 0
    checks["SIPs non-empty"] = len(data["sips"]["empty"]) == 0
    checks["SIPs have headers"] = len(data["sips"]["missing_header"]) == 0
    checks["SIP numbering gaps"] = len(data["sips"]["gaps"]) == 0
    checks["SIP numbering duplicates"] = len(data["sips"]["duplicates"]) == 0
    checks["PRD stories have spec"] = len(data["stories"]["missing_spec"]) == 0
    checks["PRD stories have prompt"] = len(data["stories"]["missing_prompt"]) == 0
    checks["PRD stories unique IDs"] = len(data["stories"]["duplicate_ids"]) == 0
    checks["PRD stories have outputs"] = len(data["stories"]["missing_outputs"]) == 0
    checks["PRD stories have passes field"] = len(data["stories"]["missing_passes"]) == 0
    checks["Prompt coverage 100%"] = data["coverage"]["percentage"] == 100
    checks["All referenced prompts exist"] = len(data["coverage"]["missing"]) == 0
    checks["All referenced specs exist"] = len(data["specs"]["missing_referenced"]) == 0
    
    data["checks"] = checks
    
    # Generate report
    report_path = base / "FINAL_VALIDATION_REPORT.md"
    with open(report_path, "w") as f:
        f.write("# SpecLang Final Validation Report\n\n")
        f.write(f"**Date**: {data['timestamp']}\n")
        f.write(f"**Overall Quality Score**: {data['quality_score']:.1f}/100\n\n")
        
        f.write("## Counts\n\n")
        f.write(f"- Prompt files: {data['prompts']['count']}\n")
        f.write(f"- SIP files: {data['sips']['count']}\n")
        f.write(f"- PRD stories: {data['stories']['count']}\n")
        f.write(f"- Spec files: {data['specs']['count']}\n")
        f.write(f"- Referenced specs: {data['specs']['referenced']}\n")
        f.write(f"- Prompt coverage: {data['coverage']['percentage']:.1f}%\n")
        f.write(f"- SIP numbering range: {min(data['sips']['numbers'])}–{max(data['sips']['numbers'])}\n\n")
        
        f.write("## Pass/Fail Status\n\n")
        for check_name, passed in checks.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            f.write(f"- {check_name}: {status}\n")
        
        f.write("\n## Detailed Findings\n\n")
        
        # Prompts
        if data["prompts"]["empty"]:
            f.write("### Empty Prompt Files\n\n")
            for name in data["prompts"]["empty"]:
                f.write(f"- `{name}`\n")
            f.write("\n")
        
        if data["prompts"]["small"]:
            f.write("### Very Small Prompt Files (<100 bytes)\n\n")
            for name in data["prompts"]["small"]:
                f.write(f"- `{name}`\n")
            f.write("\n")
        
        # SIPs
        if data["sips"]["empty"]:
            f.write("### Empty SIP Files\n\n")
            for name in data["sips"]["empty"]:
                f.write(f"- `{name}`\n")
            f.write("\n")
        
        if data["sips"]["missing_header"]:
            f.write("### SIP Files Missing Header\n\n")
            for name in data["sips"]["missing_header"]:
                f.write(f"- `{name}`\n")
            f.write("\n")
        
        if data["sips"]["gaps"]:
            f.write(f"### SIP Numbering Gaps ({len(data['sips']['gaps'])})\n\n")
            f.write(f"Missing numbers: {', '.join(map(str, data['sips']['gaps']))}\n\n")
        
        if data["sips"]["duplicates"]:
            f.write(f"### SIP Numbering Duplicates ({len(data['sips']['duplicates'])})\n\n")
            f.write(f"Duplicate numbers: {', '.join(map(str, data['sips']['duplicates']))}\n\n")
        
        # PRD stories
        if data["stories"]["missing_spec"]:
            f.write(f"### Stories Missing Spec ({len(data['stories']['missing_spec'])})\n\n")
            for sid in data["stories"]["missing_spec"][:10]:
                f.write(f"- `{sid}`\n")
            if len(data["stories"]["missing_spec"]) > 10:
                f.write(f"... and {len(data['stories']['missing_spec']) - 10} more\n")
            f.write("\n")
        
        if data["stories"]["missing_prompt"]:
            f.write(f"### Stories Missing Prompt ({len(data['stories']['missing_prompt'])})\n\n")
            for sid in data["stories"]["missing_prompt"][:10]:
                f.write(f"- `{sid}`\n")
            if len(data["stories"]["missing_prompt"]) > 10:
                f.write(f"... and {len(data['stories']['missing_prompt']) - 10} more\n")
            f.write("\n")
        
        if data["stories"]["duplicate_ids"]:
            f.write(f"### Duplicate Story IDs ({len(data['stories']['duplicate_ids'])})\n\n")
            for sid in data["stories"]["duplicate_ids"]:
                f.write(f"- `{sid}`\n")
            f.write("\n")
        
        if data["stories"]["missing_outputs"]:
            f.write(f"### Stories Missing Outputs ({len(data['stories']['missing_outputs'])})\n\n")
            for sid in data["stories"]["missing_outputs"][:10]:
                f.write(f"- `{sid}`\n")
            if len(data["stories"]["missing_outputs"]) > 10:
                f.write(f"... and {len(data['stories']['missing_outputs']) - 10} more\n")
            f.write("\n")
        
        if data["stories"]["missing_passes"]:
            f.write(f"### Stories Missing Passes Field ({len(data['stories']['missing_passes'])})\n\n")
            for sid in data["stories"]["missing_passes"][:10]:
                f.write(f"- `{sid}`\n")
            if len(data["stories"]["missing_passes"]) > 10:
                f.write(f"... and {len(data['stories']['missing_passes']) - 10} more\n")
            f.write("\n")
        
        # Coverage
        if data["coverage"]["unreferenced"]:
            f.write(f"### Unreferenced Prompt Files ({len(data['coverage']['unreferenced'])})\n\n")
            for name in data["coverage"]["unreferenced"][:20]:
                f.write(f"- `{name}`\n")
            if len(data["coverage"]["unreferenced"]) > 20:
                f.write(f"... and {len(data['coverage']['unreferenced']) - 20} more\n")
            f.write("\n")
        
        if data["coverage"]["missing"]:
            f.write(f"### Missing Referenced Prompt Files ({len(data['coverage']['missing'])})\n\n")
            for name in data["coverage"]["missing"]:
                f.write(f"- `{name}`\n")
            f.write("\n")
        
        # Specs
        if data["specs"]["missing_referenced"]:
            f.write(f"### Missing Referenced Spec Files ({len(data['specs']['missing_referenced'])})\n\n")
            for spec in data["specs"]["missing_referenced"][:10]:
                f.write(f"- `{spec}`\n")
            if len(data["specs"]["missing_referenced"]) > 10:
                f.write(f"... and {len(data['specs']['missing_referenced']) - 10} more\n")
            f.write("\n")
        
        f.write("\n## Recommendations\n\n")
        recommendations = []
        if data["prompts"]["empty"]:
            recommendations.append("Fill empty prompt files.")
        if data["sips"]["gaps"]:
            recommendations.append("Create SIP files for missing numbers.")
        if data["sips"]["duplicates"]:
            recommendations.append("Resolve duplicate SIP numbers.")
        if data["stories"]["missing_spec"]:
            recommendations.append("Ensure all stories have valid spec references.")
        if data["stories"]["missing_prompt"]:
            recommendations.append("Ensure all stories have valid prompt references.")
        if data["coverage"]["unreferenced"]:
            recommendations.append("Either create PRD stories for unreferenced prompts or remove unused prompts.")
        if data["coverage"]["missing"]:
            recommendations.append("Create missing prompt files referenced in PRD.")
        if data["specs"]["missing_referenced"]:
            recommendations.append("Create missing spec files referenced in PRD.")
        
        if recommendations:
            for rec in recommendations:
                f.write(f"- {rec}\n")
        else:
            f.write("All systems go! No recommendations.\n")
        
        f.write("\n---\n")
        f.write("*Generated by SpecLang Adversary*")
    
    print(f"Report written to {report_path}")
    
    # Print summary
    print("\n=== SpecLang Final Validation ===\n")
    print(f"Quality Score: {data['quality_score']:.1f}/100")
    print(f"Passed Checks: {sum(checks.values())}/{len(checks)}")
    print("\nCounts:")
    print(f"  Prompts: {data['prompts']['count']}")
    print(f"  SIPs: {data['sips']['count']}")
    print(f"  Stories: {data['stories']['count']}")
    print(f"  Specs: {data['specs']['count']}")
    print(f"  Coverage: {data['coverage']['percentage']:.1f}%")
    
    # Determine overall status
    critical_failures = any([
        data["prompts"]["empty"],
        data["sips"]["empty"],
        data["sips"]["gaps"],
        data["sips"]["duplicates"],
        data["stories"]["missing_spec"],
        data["stories"]["missing_prompt"],
        data["coverage"]["missing"],
        data["specs"]["missing_referenced"]
    ])
    
    if not critical_failures and data["coverage"]["percentage"] == 100:
        print("\n✅ SYSTEM READY FOR AUTONOMOUS BOOTSTRAP")
    else:
        print("\n⚠️  SYSTEM NOT READY - CRITICAL ISSUES DETECTED")
    
    return 0 if not critical_failures else 1

if __name__ == "__main__":
    exit(main())