# speclang-header lines:3
# target: scripts/analyze_validation.py
#!/usr/bin/env python3
import json
import sys

with open('validation_results.json', 'r') as f:
    data = json.load(f)

failed = []
for item in data:
    if not item['valid']:
        failed.append(item)

print(f"Total specs: {len(data)}")
print(f"Failed validation: {len(failed)}")
for item in failed:
    print(f"\n{item['spec']}")
    print(f"  agent_support: {item['agent_support']}")
    checks = item['checks']
    if not checks['step_by_step']['passed']:
        print(f"  Step-by-step: {checks['step_by_step']['coverage']:.0%} coverage")
        for msg in checks['step_by_step']['missing']:
            print(f"    - {msg}")
    if not checks['references']['passed']:
        print(f"  References: {checks['references']['resolved']}/{checks['references']['total']} resolved")
        for ref in checks['references']['unresolved']:
            print(f"    - {ref}")
    if not checks['ambiguity']['passed']:
        print(f"  Ambiguity: {checks['ambiguity']['count']} terms")
        for term in checks['ambiguity']['ambiguous_terms']:
            print(f"    - {term}")
    if not checks['metadata']['passed']:
        print(f"  Metadata missing: {checks['metadata']['missing_fields']}")

# Also list autonomous specs that failed
autonomous_failed = [item for item in failed if item['agent_support'] == 'agent_autonomous']
print(f"\nAutonomous specs failed: {len(autonomous_failed)}")
for item in autonomous_failed:
    print(f"  {item['spec']}")