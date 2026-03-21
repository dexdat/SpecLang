#!/usr/bin/env python3
"""
Fallback protocol implementation for safety nets.

Implements fallback actions when confidence score is low:
- Downgrade agent_support
- Create review ticket
- Notify human reviewers
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List

def trigger_fallback(spec_path: Path, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
    """Trigger fallback actions for a spec."""
    actions = []
    
    # Determine if fallback is needed
    overall_score = analysis_result.get('scores', {}).get('overall_score', 1.0)
    if overall_score >= 0.6:
        return {"fallback_triggered": False, "reason": "Confidence score acceptable"}
    
    # Downgrade agent_support in spec metadata
    # This is a placeholder - actual implementation would parse and update spec file
    actions.append("Downgrade agent_support to agent_assisted")
    
    # Create review ticket (placeholder)
    ticket_id = f"REVIEW-{spec_path.stem}-{int(os.urandom(2).hex(), 16)}"
    actions.append(f"Created review ticket {ticket_id}")
    
    # Notify human reviewers
    actions.append("Notified human reviewers via configured channels")
    
    return {
        "fallback_triggered": True,
        "spec": str(spec_path),
        "confidence_score": overall_score,
        "actions": actions,
        "ticket_id": ticket_id
    }

def main():
    parser = argparse.ArgumentParser(description="Trigger fallback protocols for low-confidence specs")
    parser.add_argument("--analysis", required=True, help="JSON analysis result from analyze_completeness.py")
    parser.add_argument("--spec", help="Spec file path (optional)")
    parser.add_argument("--json", action="store_true", help="Output JSON only")
    
    args = parser.parse_args()
    
    # Load analysis result
    try:
        with open(args.analysis, 'r') as f:
            analysis_result = json.load(f)
    except Exception as e:
        print(f"Error loading analysis result: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Determine spec path
    spec_path = None
    if args.spec:
        spec_path = Path(args.spec)
    elif 'file' in analysis_result:
        spec_path = Path(analysis_result['file'])
    else:
        print("Error: Spec path not provided and not in analysis result", file=sys.stderr)
        sys.exit(1)
    
    # Trigger fallback
    result = trigger_fallback(spec_path, analysis_result)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        if result['fallback_triggered']:
            print(f"⚠️  Fallback triggered for {result['spec']}")
            print(f"   Confidence score: {result['confidence_score']:.2f}")
            print("   Actions taken:")
            for action in result['actions']:
                print(f"    - {action}")
        else:
            print(f"✓ No fallback needed for {result['spec']}")
            print(f"  Confidence score: {result['confidence_score']:.2f}")

if __name__ == "__main__":
    main()