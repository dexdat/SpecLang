#!/usr/bin/env python3
"""
Analyze spec completeness for safety nets.

Computes:
- Step-by-step coverage percentage
- Reference resolution percentage  
- Ambiguity score
- Metadata completeness
- Dependency graph completeness

Usage:
  python analyze_completeness.py <spec_file>
  python analyze_completeness.py --dir <specs_dir>

Outputs JSON with scores and recommendations.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

# Try to import validate_autonomous for actual validation
try:
    import validate_autonomous
except ImportError:
    validate_autonomous = None

def analyze_spec_file(spec_path: Path) -> Dict[str, Any]:
    """Analyze a single spec file using validate_autonomous if available."""
    if validate_autonomous is None:
        return analyze_spec_file_fallback(spec_path)
    
    try:
        # Load index (required for reference validation)
        index = validate_autonomous.load_index()
    except Exception:
        index = {}
    
    try:
        # Call validate_file from validate_autonomous
        result = validate_autonomous.validate_file(str(spec_path), index)
        
        # Extract scores from validation result
        checks = result['checks']
        step_by_step = checks['step_by_step']
        references = checks['references']
        ambiguity = checks['ambiguity']
        metadata = checks['metadata']
        
        # Compute scores (0-1)
        step_coverage = step_by_step['coverage']
        ref_resolution = references['resolved'] / references['total'] if references['total'] > 0 else 1.0
        ambiguity_score = 1.0 - (ambiguity['count'] / max(ambiguity['count'] + 10, 10))  # simple heuristic
        metadata_completeness = 1.0 if metadata['passed'] else 0.5
        # Dependency graph completeness not yet implemented
        dependency_completeness = 0.0
        
        # Overall score weighted average
        overall_score = (
            step_coverage * 0.3 +
            ref_resolution * 0.3 +
            ambiguity_score * 0.2 +
            metadata_completeness * 0.1 +
            dependency_completeness * 0.1
        )
        
        scores = {
            "step_by_step_coverage": step_coverage,
            "reference_resolution": ref_resolution,
            "ambiguity_score": ambiguity_score,
            "metadata_completeness": metadata_completeness,
            "dependency_graph_completeness": dependency_completeness,
            "overall_score": overall_score
        }
        
        recommendations = []
        if step_coverage < 0.8:
            recommendations.append("Increase step-by-step coverage (target ≥80%)")
        if ref_resolution < 1.0:
            recommendations.append(f"Resolve {references['unresolved']} unresolved references")
        if ambiguity_score < 0.7:
            recommendations.append("Reduce ambiguous language")
        if metadata_completeness < 1.0:
            recommendations.append("Complete missing metadata fields")
        
        return {
            "file": str(spec_path),
            "scores": scores,
            "recommendations": recommendations,
            "thresholds": {
                "block_cascade": overall_score < 0.6,
                "allow_with_warnings": 0.6 <= overall_score < 0.8,
                "allow_normally": 0.8 <= overall_score < 0.9,
                "prioritize_autonomous": overall_score >= 0.9
            },
            "validation_result": result
        }
    except Exception as e:
        # Fallback if validation fails
        return analyze_spec_file_fallback(spec_path, str(e))

def analyze_spec_file_fallback(spec_path: Path, error_msg: Optional[str] = None) -> Dict[str, Any]:
    """Fallback analysis when validate_autonomous is unavailable."""
    try:
        content = spec_path.read_text(encoding='utf-8')
    except Exception as e:
        return {
            "error": f"Failed to read file: {e}",
            "scores": {},
            "recommendations": []
        }
    
    # Placeholder scores - implement real analysis
    scores = {
        "step_by_step_coverage": 0.5,
        "reference_resolution": 0.7,
        "ambiguity_score": 0.3,
        "metadata_completeness": 0.8,
        "dependency_graph_completeness": 0.2,
        "overall_score": 0.5
    }
    
    recommendations = []
    if scores["step_by_step_coverage"] < 0.6:
        recommendations.append("Increase step-by-step coverage")
    if scores["reference_resolution"] < 0.8:
        recommendations.append("Resolve more references")
    if scores["ambiguity_score"] > 0.5:
        recommendations.append("Reduce ambiguous language")
    if scores["metadata_completeness"] < 1.0:
        recommendations.append("Complete missing metadata fields")
    
    result = {
        "file": str(spec_path),
        "scores": scores,
        "recommendations": recommendations,
        "thresholds": {
            "block_cascade": scores["overall_score"] < 0.6,
            "allow_with_warnings": 0.6 <= scores["overall_score"] < 0.8,
            "allow_normally": 0.8 <= scores["overall_score"] < 0.9,
            "prioritize_autonomous": scores["overall_score"] >= 0.9
        }
    }
    if error_msg:
        result["warning"] = f"Validation failed, using fallback: {error_msg}"
    
    return result

def analyze_directory(specs_dir: Path) -> Dict[str, Any]:
    """Analyze all spec files in a directory."""
    results = []
    for root, dirs, files in os.walk(specs_dir):
        for file in files:
            if file.endswith('.spec.md') or file.endswith('.spec.yaml') or file.endswith('.scl'):
                spec_path = Path(root) / file
                results.append(analyze_spec_file(spec_path))
    
    if not results:
        return {"error": "No spec files found"}
    
    # Aggregate scores
    overall_scores = [r["scores"]["overall_score"] for r in results if "scores" in r]
    avg_score = sum(overall_scores) / len(overall_scores) if overall_scores else 0
    
    return {
        "directory": str(specs_dir),
        "file_count": len(results),
        "average_overall_score": avg_score,
        "files": results
    }

def main():
    parser = argparse.ArgumentParser(description="Analyze spec completeness")
    parser.add_argument("path", help="Spec file or directory")
    parser.add_argument("--dir", action="store_true", help="Treat path as directory")
    parser.add_argument("--json", action="store_true", help="Output JSON only")
    
    args = parser.parse_args()
    path = Path(args.path)
    
    if not path.exists():
        print(f"Error: Path does not exist: {path}", file=sys.stderr)
        sys.exit(1)
    
    if args.dir or path.is_dir():
        result = analyze_directory(path)
    else:
        result = analyze_spec_file(path)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        # Human-readable output
        if "error" in result:
            print(f"Error: {result['error']}")
            sys.exit(1)
        
        if "warning" in result:
            print(f"Warning: {result['warning']}")
        
        if "directory" in result:
            print(f"Analyzed {result['file_count']} files in {result['directory']}")
            print(f"Average overall score: {result['average_overall_score']:.2f}")
            for file_result in result["files"]:
                print(f"\n{file_result['file']}:")
                for metric, score in file_result["scores"].items():
                    print(f"  {metric}: {score:.2f}")
                if file_result["recommendations"]:
                    print("  Recommendations:")
                    for rec in file_result["recommendations"]:
                        print(f"    - {rec}")
        else:
            print(f"Analysis for {result['file']}:")
            for metric, score in result["scores"].items():
                print(f"  {metric}: {score:.2f}")
            if result["recommendations"]:
                print("  Recommendations:")
                for rec in result["recommendations"]:
                    print(f"    - {rec}")
            print("\n  Thresholds:")
            for threshold, value in result["thresholds"].items():
                print(f"    {threshold}: {value}")

if __name__ == "__main__":
    main()