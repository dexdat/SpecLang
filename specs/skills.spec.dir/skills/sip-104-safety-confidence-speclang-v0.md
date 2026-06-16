---
name: sip-104-safety-confidence-speclang-v0
title: "SIP 104: Safety Confidence Scoring"
version: 0.1.0
description: Confidence scoring system for safety validation decisions
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 104: Safety Confidence Scoring

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Confidence Scoring System for safety validation decisions in SpecLang autonomous operations.

### Quick Start

Confidence scoring components:
1. **Signal Analysis**: Weight multiple safety signals
2. **Threshold Matrix**: Project level based thresholds
3. **Confidence Levels**: high, medium, low, none
4. **Decision Rules**: When to proceed, fallback, or abort

### When to Read This

- **Safety validation**: Building validation systems
- **Agent configuration**: Setting confidence thresholds
- **Fallback logic**: Deciding when to use human review

### Related SIPs

- SIP 23: Safety Nets
- SIP 78: Security Model
- SIP 16: Autonomous Validation

## Abstract

This SIP defines a confidence scoring system for safety validation decisions. The system assigns confidence scores to safety signals, aggregates them based on project maturity, and determines appropriate actions—proceed autonomously, use human fallback, or abort.

## Motivation

Autonomous agents need:
- **Quantified safety**: Numerical confidence scores
- **Tiered responses**: Match response to confidence
- **Transparent decisions**: Auditable confidence reasoning
- **Maturity-aware**: Different thresholds per project level

## Rationale

**Weighted Signal Approach:**

1. Multiple independent signals increase confidence
2. Signal sources have different reliability weights
3. Project maturity affects acceptable risk
4. Confidence affects available actions

## Specification

### Confidence Signal Types

```yaml
ConfidenceSignals:
  sources:
    spec_completeness:
      weight: 0.3
      signals:
        - has_header: 0.2
        - valid_yaml: 0.2
        - all_refs_resolved: 0.3
        - no_todos: 0.15
        - has_examples: 0.15
    
    validation_results:
      weight: 0.25
      signals:
        - syntax_valid: 0.3
        - references_valid: 0.3
        - semantic_valid: 0.25
        - security_passed: 0.15
    
    code_quality:
      weight: 0.2
      signals:
        - has_tests: 0.25
        - linting_passed: 0.25
        - typing_valid: 0.25
        - docs_complete: 0.25
    
    external_verification:
      weight: 0.15
      signals:
        - human_approved: 0.4
        - automated_tests_pass: 0.3
        - peer_reviewed: 0.3
    
    historical_data:
      weight: 0.1
      signals:
        - similar_changes_approved: 0.4
        - author_trust_score: 0.3
        - change_size_risk: 0.3
```

### Confidence Thresholds by Project Level

```yaml
ConfidenceThresholds:
  POC:
    proceed: 0.9
    fallback: 0.6
    abort: 0.3
  
  MVP:
    proceed: 0.85
    fallback: 0.65
    abort: 0.35
  
  Alpha:
    proceed: 0.8
    fallback: 0.7
    abort: 0.4
  
  Beta:
    proceed: 0.75
    fallback: 0.75
    abort: 0.45
  
  Production:
    proceed: 0.7
    fallback: 0.8
    abort: 0.5
  
  Startup:
    proceed: 0.85
    fallback: 0.6
    abort: 0.35
  
  SMB:
    proceed: 0.8
    fallback: 0.7
    abort: 0.4
  
  MSB:
    proceed: 0.75
    fallback: 0.75
    abort: 0.45
  
  Enterprise:
    proceed: 0.7
    fallback: 0.8
    abort: 0.5
```

### Confidence Calculation

```python
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum

class ConfidenceLevel(Enum):
    HIGH = "high"      # >= proceed threshold
    MEDIUM = "medium"  # >= fallback threshold
    LOW = "low"        # >= abort threshold
    NONE = "none"     # < abort threshold

@dataclass
class SignalScore:
    signal_name: str
    value: float  # 0.0 to 1.0
    weight: float

class ConfidenceScorer:
    """Calculate confidence scores for safety decisions."""
    
    def __init__(self, project_level: str):
        self.project_level = project_level
        self.thresholds = self._load_thresholds(project_level)
        self.signal_weights = self._load_weights()
    
    def calculate_confidence(
        self,
        signals: List[SignalScore]
    ) -> tuple[float, ConfidenceLevel]:
        """Calculate aggregate confidence from signals."""
        
        weighted_sum = 0.0
        total_weight = 0.0
        
        for signal in signals:
            weight = self.signal_weights.get(
                signal.signal_name,
                self.signal_weights.get("default", 0.1)
            )
            weighted_sum += signal.value * weight
            total_weight += weight
        
        confidence = weighted_sum / total_weight if total_weight > 0 else 0.0
        
        level = self._determine_level(confidence)
        
        return confidence, level
    
    def _determine_level(self, confidence: float) -> ConfidenceLevel:
        """Determine confidence level from score."""
        
        if confidence >= self.thresholds["proceed"]:
            return ConfidenceLevel.HIGH
        elif confidence >= self.thresholds["fallback"]:
            return ConfidenceLevel.MEDIUM
        elif confidence >= self.thresholds["abort"]:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.NONE
    
    def decide_action(
        self,
        confidence: float,
        has_human_approval: bool
    ) -> str:
        """Determine action based on confidence."""
        
        level = self._determine_level(confidence)
        
        if level == ConfidenceLevel.HIGH:
            return "proceed_autonomous"
        elif level == ConfidenceLevel.MEDIUM:
            if has_human_approval:
                return "proceed_with_approval"
            return "require_human_review"
        elif level == ConfidenceLevel.LOW:
            return "require_human_review"
        else:
            return "abort"
    
    def _load_thresholds(self, project_level: str) -> Dict[str, float]:
        """Load thresholds for project level."""
        
        thresholds = {
            "POC": {"proceed": 0.9, "fallback": 0.6, "abort": 0.3},
            "MVP": {"proceed": 0.85, "fallback": 0.65, "abort": 0.35},
            "Alpha": {"proceed": 0.8, "fallback": 0.7, "abort": 0.4},
            "Beta": {"proceed": 0.75, "fallback": 0.75, "abort": 0.45},
            "Production": {"proceed": 0.7, "fallback": 0.8, "abort": 0.5},
            "Startup": {"proceed": 0.85, "fallback": 0.6, "abort": 0.35},
            "SMB": {"proceed": 0.8, "fallback": 0.7, "abort": 0.4},
            "MSB": {"proceed": 0.75, "fallback": 0.75, "abort": 0.45},
            "Enterprise": {"proceed": 0.7, "fallback": 0.8, "abort": 0.5},
        }
        
        return thresholds.get(project_level, thresholds["MVP"])
    
    def _load_weights(self) -> Dict[str, float]:
        """Load signal source weights."""
        
        return {
            "spec_completeness": 0.3,
            "validation_results": 0.25,
            "code_quality": 0.2,
            "external_verification": 0.15,
            "historical_data": 0.1,
        }
```

### Confidence Report

```yaml
ConfidenceReport:
  fields:
    - timestamp: ISO8601
    - project_id: string
    - project_level: string
    - confidence_score: float 0.0-1.0
    - confidence_level: enum
    - decision: string
    - signals:
        - name: string
          value: float
          weight: float
          contributing_score: float
    
    reasoning:
      - step: string
        result: string
      
    alternatives_considered:
      - option: string
        score: float
        rejected_reason: string
```

### Decision Matrix

```yaml
DecisionMatrix:
  dimensions:
    - confidence_level: [high, medium, low, none]
    - has_human_approval: [true, false]
    - is_critical_change: [true, false]
  
  outcomes:
    high + any_approval + any_critical:
      action: proceed_autonomous
      logging: minimal
      
    medium + human_approval + not_critical:
      action: proceed_with_approval
      logging: standard
      
    medium + no_approval + not_critical:
      action: require_human_review
      logging: standard
      
    medium + critical:
      action: require_human_review
      logging: enhanced
      
    low + any_approval:
      action: require_human_review
      logging: enhanced
      
    low + no_approval:
      action: abort
      logging: enhanced
      
    none + any:
      action: abort
      logging: maximum
```

## Examples

### Example 1: High Confidence Scenario

```python
# Project: Production level
# Signals collected
signals = [
    SignalScore("has_header", 1.0, 0.2),
    SignalScore("valid_yaml", 1.0, 0.2),
    SignalScore("all_refs_resolved", 1.0, 0.3),
    SignalScore("no_todos", 1.0, 0.15),
    SignalScore("has_examples", 0.8, 0.15),
    SignalScore("syntax_valid", 1.0, 0.3),
    SignalScore("references_valid", 1.0, 0.3),
    SignalScore("semantic_valid", 1.0, 0.25),
    SignalScore("security_passed", 1.0, 0.15),
    SignalScore("has_tests", 0.9, 0.25),
    SignalScore("linting_passed", 1.0, 0.25),
]

scorer = ConfidenceScorer("Production")
confidence, level = scorer.calculate_confidence(signals)

# confidence: 0.97, level: HIGH
# decision: proceed_autonomous
```

### Example 2: Medium Confidence Scenario

```python
# Project: Beta level
# Some signals missing
signals = [
    SignalScore("has_header", 1.0, 0.2),
    SignalScore("valid_yaml", 1.0, 0.2),
    SignalScore("all_refs_resolved", 0.7, 0.3),  # Some refs missing
    SignalScore("no_todos", 0.5, 0.15),  # TODOs present
    SignalScore("has_examples", 0.0, 0.15),  # No examples
    SignalScore("syntax_valid", 1.0, 0.3),
    SignalScore("references_valid", 0.8, 0.3),
    SignalScore("semantic_valid", 0.9, 0.25),
    SignalScore("security_passed", 1.0, 0.15),
]

scorer = ConfidenceScorer("Beta")
confidence, level = scorer.calculate_confidence(signals)

# confidence: 0.76, level: MEDIUM
# decision: require_human_review (no approval)
```

### Example 3: Low Confidence - Abort

```python
# Project: Enterprise level
# Multiple failures
signals = [
    SignalScore("has_header", 1.0, 0.2),
    SignalScore("valid_yaml", 0.5, 0.2),  # YAML errors
    SignalScore("all_refs_resolved", 0.3, 0.3),  # Many refs broken
    SignalScore("no_todos", 0.0, 0.15),  # Many TODOs
    SignalScore("has_examples", 0.0, 0.15),  # No examples
    SignalScore("syntax_valid", 0.6, 0.3),
    SignalScore("references_valid", 0.4, 0.3),
    SignalScore("semantic_valid", 0.5, 0.25),
    SignalScore("security_passed", 0.7, 0.15),
]

scorer = ConfidenceScorer("Enterprise")
confidence, level = scorer.calculate_confidence(signals)

# confidence: 0.42, level: LOW
# decision: abort
```

## Backwards Compatibility

- Default thresholds match MVP level for existing projects
- Confidence scoring is additive, existing validations continue working
- API provides fallback to simple boolean if confidence unavailable

## Security Implications

- Confidence calculations must be tamper-resistant
- Signal weights should be configurable but validated
- Audit logging required for all confidence-based decisions

## References

- "@ref:speclang/safety-nets
- @ref:speclang/autonomous-validation
- @ref:speclang/security
- SIP 23: Safety Nets
- SIP 16: Autonomous Validation
- SIP 78: Security Model

## Copyright

This document is in the public domain.
