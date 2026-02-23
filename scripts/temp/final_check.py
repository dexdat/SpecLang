#!/usr/bin/env python3
"""
Final validation check for SpecLang autonomous bootstrap readiness.
"""
import json
import os
import re
from collections import Counter
from pathlib import Path

def main():
    base = Path("/Users/lexykwaii/Code/SpecLang")
    
    # Load PRD
    with open(base / ".ralph" / "prd.json") as f:
        prd = json.load(f)
    
    # Collect stories
    stories = []
    for phase in prd["phases"]:
        stories.extend(phase["stories"])
    
    # Collect prompts
    prompt_files = list((base / "docs" / "prompts").glob("*.md"))
    prompt_names = {p.name for p in prompt_files}
    
    # Collect SIPs
    sip_files = list((base / ".opencode" / "skills").glob("sip-*.md"))
    sip_numbers = []
    for sf in sip_files:
        m = re.search(r'sip-(\d+)-', sf.name)
        if m:
            sip_numbers.append(int(m.group(1)))
    sip_numbers.sort()
    
    # Collect specs
    spec_files = list(base.glob("specs/**/*.spec.md"))
    
    # Analysis
    results = {
        "counts": {
            "prompts": len(prompt_files),
            "sips": len(sip_files),
            "stories": len(stories),
            "specs": len(spec_files),
        },
        "coverage": {},
        "issues": {
            "missing_prompts": [],
            "missing_specs": [],
            "sip_gaps": [],
            "sip_duplicates": [],
            "story_duplicate_ids": [],
            "story_missing_prompt": [],
            "story_missing_spec": [],
            "prompt_unreferenced": [],
            "prompt_multiple_references": [],
        },
        "checks": {}
    }
    
    # SIP numbering gaps and duplicates
    if sip_numbers:
        min_num, max_num = min(sip_numbers), max(sip_numbers)
        expected = set(range(min_num, max_num + 1))
        missing = expected - set(sip_numbers)
        results["issues"]["sip_gaps"] = sorted(missing)
        counts = Counter(sip_numbers)
        results["issues"]["sip_duplicates"] = [k for k, v in counts.items() if v > 1]
        results["sip_range"] = f"{min_num}–{max_num}"
    
    # Story analysis
    story_ids = set()
    prompt_refs = []
    spec_refs = set()
    for story in stories:
        sid = story["id"]
        if sid in story_ids:
            results["issues"]["story_duplicate_ids"].append(sid)
        story_ids.add(sid)
        
        # Prompt
        prompt = story.get("prompt")
        if not prompt:
            results["issues"]["story_missing_prompt"].append(sid)
        else:
            prompt_name = os.path.basename(prompt)
            prompt_refs.append(prompt_name)
            if not (base / prompt).exists():
                results["issues"]["missing_prompts"].append(prompt)
        
        # Spec
        spec = story.get("spec")
        if not spec:
            results["issues"]["story_missing_spec"].append(sid)
        else:
            spec_refs.add(spec)
            if not (base / spec).exists():
                results["issues"]["missing_specs"].append(spec)
    
    # Prompt coverage
    referenced_prompts = set(prompt_refs)
    results["coverage"]["referenced_prompts"] = len(referenced_prompts)
    results["coverage"]["existing_prompts"] = len(prompt_names)
    # Prompts referenced but missing
    missing_prompts = [p for p in referenced_prompts if p not in prompt_names]
    results["coverage"]["missing_prompts"] = len(missing_prompts)
    # Prompts existing but unreferenced
    unreferenced_prompts = prompt_names - referenced_prompts
    results["coverage"]["unreferenced_prompts"] = len(unreferenced_prompts)
    # Coverage percentage: existing prompts that are referenced
    if prompt_names:
        results["coverage"]["percentage"] = (len(referenced_prompts & prompt_names) / len(prompt_names)) * 100
    else:
        results["coverage"]["percentage"] = 0
    
    # Prompt multiple references
    prompt_ref_counts = Counter(prompt_refs)
    results["issues"]["prompt_multiple_references"] = [p for p, c in prompt_ref_counts.items() if c > 1]
    
    # Spec coverage
    referenced_specs = spec_refs
    results["coverage"]["referenced_specs"] = len(referenced_specs)
    results["coverage"]["missing_specs"] = len(results["issues"]["missing_specs"])
    
    # Determine pass/fail checks
    checks = {}
    checks["All prompts exist"] = len(results["issues"]["missing_prompts"]) == 0
    checks["All specs exist"] = len(results["issues"]["missing_specs"]) == 0
    checks["SIP numbering no gaps"] = len(results["issues"]["sip_gaps"]) == 0
    checks["SIP numbering no duplicates"] = len(results["issues"]["sip_duplicates"]) == 0
    checks["Story IDs unique"] = len(results["issues"]["story_duplicate_ids"]) == 0
    checks["All stories have prompt"] = len(results["issues"]["story_missing_prompt"]) == 0
    checks["All stories have spec"] = len(results["issues"]["story_missing_spec"]) == 0
    checks["Prompt coverage 100%"] = results["coverage"]["unreferenced_prompts"] == 0
    checks["No prompt multiple references"] = len(results["issues"]["prompt_multiple_references"]) == 0
    checks["All referenced prompts exist"] = len(missing_prompts) == 0
    
    results["checks"] = checks
    
    # Quality score (0-100)
    quality = 0
    max_score = 100
    # Each check worth 10 points
    for passed in checks.values():
        if passed:
            quality += 10
    results["quality_score"] = quality
    
    # Generate report
    report = []
    report.append("# SpecLang Final Validation Report")
    report.append("")
    report.append(f"**Date**: {datetime.now().isoformat()}")
    report.append(f"**Overall Quality Score**: {quality}/100")
    report.append("")
    
    # Counts
    report.append("## Counts")
    report.append("")
    report.append(f"- Prompt files: {results['counts']['prompts']}")
    report.append(f"- SIP files: {results['counts']['sips']}")
    report.append(f"- PRD stories: {results['counts']['stories']}")
    report.append(f"- Spec files: {results['counts']['specs']}")
    report.append(f"- SIP numbering range: {results.get('sip_range', 'N/A')}")
    report.append("")
    
    # Coverage percentages
    report.append("## Coverage Percentages")
    report.append("")
    report.append(f"- Prompt-to-story coverage: {results['coverage']['percentage']:.1f}%")
    report.append(f"- Spec coverage: {results['coverage']['referenced_specs']} referenced, {results['coverage']['missing_specs']} missing")
    report.append("")
    
    # Pass/fail status
    report.append("## Pass/Fail Status")
    report.append("")
    for check_name, passed in checks.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        report.append(f"- {check_name}: {status}")
    report.append("")
    
    # Issues details
    report.append("## Issues Details")
    report.append("")
    
    if results["issues"]["missing_prompts"]:
        report.append("### Missing Prompt Files")
        report.append("")
        for p in results["issues"]["missing_prompts"]:
            report.append(f"- `{p}`")
        report.append("")
    
    if results["issues"]["missing_specs"]:
        report.append("### Missing Spec Files")
        report.append("")
        for s in results["issues"]["missing_specs"]:
            report.append(f"- `{s}`")
        report.append("")
    
    if results["issues"]["sip_gaps"]:
        report.append(f"### SIP Numbering Gaps ({len(results['issues']['sip_gaps'])})")
        report.append("")
        report.append(f"Missing numbers: {', '.join(map(str, results['issues']['sip_gaps']))}")
        report.append("")
    
    if results["issues"]["sip_duplicates"]:
        report.append(f"### SIP Numbering Duplicates ({len(results['issues']['sip_duplicates'])})")
        report.append("")
        report.append(f"Duplicate numbers: {', '.join(map(str, results['issues']['sip_duplicates']))}")
        report.append("")
    
    if results["issues"]["story_duplicate_ids"]:
        report.append(f"### Duplicate Story IDs ({len(results['issues']['story_duplicate_ids'])})")
        report.append("")
        for sid in results["issues"]["story_duplicate_ids"]:
            report.append(f"- `{sid}`")
        report.append("")
    
    if results["issues"]["story_missing_prompt"]:
        report.append(f"### Stories Missing Prompt ({len(results['issues']['story_missing_prompt'])})")
        report.append("")
        for sid in results["issues"]["story_missing_prompt"]:
            report.append(f"- `{sid}`")
        report.append("")
    
    if results["issues"]["story_missing_spec"]:
        report.append(f"### Stories Missing Spec ({len(results['issues']['story_missing_spec'])})")
        report.append("")
        for sid in results["issues"]["story_missing_spec"]:
            report.append(f"- `{sid}`")
        report.append("")
    
    if results["coverage"]["unreferenced_prompts"]:
        report.append(f"### Unreferenced Prompt Files ({results['coverage']['unreferenced_prompts']})")
        report.append("")
        for p in sorted(unreferenced_prompts)[:20]:
            report.append(f"- `{p}`")
        if len(unreferenced_prompts) > 20:
            report.append(f"... and {len(unreferenced_prompts) - 20} more")
        report.append("")
    
    if results["issues"]["prompt_multiple_references"]:
        report.append(f"### Prompts Referenced by Multiple Stories ({len(results['issues']['prompt_multiple_references'])})")
        report.append("")
        for p in results["issues"]["prompt_multiple_references"]:
            report.append(f"- `{p}` referenced {prompt_ref_counts[p]} times")
        report.append("")
    
    # Recommendations
    report.append("## Recommendations")
    report.append("")
    recs = []
    if results["issues"]["missing_prompts"]:
        recs.append("Create missing prompt files referenced in PRD.")
    if results["issues"]["missing_specs"]:
        recs.append("Create missing spec files referenced in PRD.")
    if results["issues"]["sip_gaps"]:
        recs.append("Create SIP files for missing numbers.")
    if results["issues"]["sip_duplicates"]:
        recs.append("Resolve duplicate SIP numbers.")
    if results["issues"]["story_missing_prompt"]:
        recs.append("Add prompt references to stories.")
    if results["issues"]["story_missing_spec"]:
        recs.append("Add spec references to stories.")
    if results["coverage"]["unreferenced_prompts"]:
        recs.append("Either create PRD stories for unreferenced prompts or remove unused prompts.")
    if results["issues"]["prompt_multiple_references"]:
        recs.append("Ensure each prompt is referenced by at most one story.")
    
    if recs:
        for r in recs:
            report.append(f"- {r}")
    else:
        report.append("All checks passed. System ready for autonomous bootstrap.")
    report.append("")
    
    report.append("---")
    report.append("*Generated by SpecLang Adversary*")
    
    report_text = "\n".join(report)
    
    # Write to file
    output_path = base / "FINAL_VALIDATION_REPORT_FINAL.md"
    with open(output_path, "w") as f:
        f.write(report_text)
    
    # Print summary
    print(report_text)
    
    # Determine overall readiness
    critical_issues = any([
        results["issues"]["missing_prompts"],
        results["issues"]["missing_specs"],
        results["issues"]["sip_gaps"],
        results["issues"]["sip_duplicates"],
        results["issues"]["story_missing_prompt"],
        results["issues"]["story_missing_spec"],
    ])
    
    if not critical_issues and results["coverage"]["unreferenced_prompts"] == 0:
        print("\n✅ SYSTEM READY FOR AUTONOMOUS BOOTSTRAP")
        return 0
    else:
        print("\n⚠️  SYSTEM NOT READY - CRITICAL ISSUES DETECTED")
        return 1

if __name__ == "__main__":
    from datetime import datetime
    exit(main())