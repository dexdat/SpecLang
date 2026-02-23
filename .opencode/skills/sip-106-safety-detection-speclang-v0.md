---
name: sip-106-safety-detection-speclang-v0
title: "SIP 106: Safety Detection Mechanisms"
version: 0.1.0
description: Detection mechanisms for safety violations and anomalies
category: standard
---

# SIP 106: Safety Detection Mechanisms

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines detection mechanisms for safety violations, anomalies, and risk factors in SpecLang autonomous operations.

### Quick Start

Detection categories:
1. **Spec Anomalies**: Invalid patterns, missing elements
2. **Security Violations**: Threats, exposures
3. **Quality Issues**: Code smells, anti-patterns
4. **Behavioral Anomalies**: Unexpected patterns

### When to Read This

- **Building validators**: Creating safety detection
- **Configuring agents**: Setting detection rules
- **Incident response**: Detecting violations

### Related SIPs

- SIP 23: Safety Nets
- SIP 78: Security Model
- SIP 104: Confidence Scoring

## Abstract

This SIP defines the detection mechanisms for identifying safety violations, anomalies, and risk factors. It provides pattern-based detection, behavioral analysis, and risk scoring.

## Motivation

Autonomous agents need:
- **Proactive detection**: Find issues before execution
- **Multi-layer scanning**: Check spec, code, behavior
- **Risk categorization**: Prioritize findings
- **Actionable alerts**: Clear remediation guidance

## Rationale

**Defense in Depth:**

1. Static pattern detection
2. Behavioral anomaly detection
3. Semantic analysis
4. Historical pattern matching

## Specification

### Detection Categories

```yaml
DetectionCategories:
  spec_anomalies:
    description: "Issues in spec structure or content"
    detectors:
      - invalid_header
      - malformed_yaml
      - broken_references
      - circular_dependencies
      - missing_required_fields
      - inconsistent_layer_values
      - invalid_entity_definitions
      
  security_violations:
    description: "Security-relevant issues"
    detectors:
      - hardcoded_secrets
      - injection_patterns
      - insecure_patterns
      - over_privileged_definitions
      - data_exposure_risks
      - authentication_gaps
      
  quality_issues:
    description: "Code quality problems"
    detectors:
      - missing_tests
      - undocumented_apis
      - complexity_warnings
      - technical_debt_markers
      - anti_patterns
      
  behavioral_anomalies:
    description: "Unexpected behavior patterns"
    detectors:
      - unusual_file_access
      - unexpected_dependencies
      - suspicious_operations
      - cascade_triggers
      - resource_exhaustion
```

### Detector Interface

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from enum import Enum

class Severity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class DetectionType(Enum):
    SPEC_ANOMALY = "spec_anomaly"
    SECURITY_VIOLATION = "security_violation"
    QUALITY_ISSUE = "quality_issue"
    BEHAVIORAL_ANOMALY = "behavioral_anomaly"

@dataclass
class Detection:
    detector_id: str
    detection_type: DetectionType
    severity: Severity
    title: str
    description: str
    location: Optional[str]
    evidence: Dict[str, Any]
    recommendation: str
    confidence: float

class Detector(ABC):
    """Base detector interface."""
    
    @property
    @abstractmethod
    def detector_id(self) -> str:
        pass
    
    @property
    @abstractmethod
    def detection_type(self) -> DetectionType:
        pass
    
    @abstractmethod
    def detect(self, context: dict) -> List[Detection]:
        """Run detection on context."""
        pass
    
    @abstractmethod
    def is_enabled(self, config: dict) -> bool:
        """Check if detector is enabled."""
        pass
```

### Pattern Detectors

```yaml
PatternDetectors:
  hardcoded_secrets:
    patterns:
      - regex: '(api_key|apikey|api-secret)[\s]*[=:][\s]*["\'][a-zA-Z0-9]{20,}["\']'
        severity: critical
        description: "Potential hardcoded API key"
        
      - regex: 'password[\s]*[=:][\s]*["\'][^"\'\s]{8,}["\']'
        severity: critical
        description: "Potential hardcoded password"
        
      - regex: '-----BEGIN (RSA |EC )?PRIVATE KEY-----'
        severity: critical
        description: "Private key in source"
        
      - regex: 'ghp_[a-zA-Z0-9]{36}'
        severity: critical
        description: "GitHub personal access token"
        
      - regex: 'sk-[a-zA-Z0-9]{48}'
        severity: critical
        description: "OpenAI API key"
    
    false_positive_whitelist:
      - example_key_placeholder
      - test_api_key
      - mock_credentials
      - demo_token

  injection_patterns:
    patterns:
      - regex: 'execute\s*\(\s*[\w]+\s*\+'
        severity: high
        description: "Potential SQL injection"
        
      - regex: 'eval\s*\('
        severity: high
        description: "Use of eval()"
        
      - regex: 'innerHTML\s*='
        severity: medium
        description: "Potential XSS via innerHTML"
        
      - regex: 'os\.system\s*\(|subprocess\.\w*\s*\(\s*[\w]+\s*\+'
        severity: high
        description: "Potential command injection"
        
      - regex: '\.format\s*\(\s*[\w]+\s*\)'
        severity: medium
        description: "Potential format string injection"
    
    safe_patterns:
      - parameterized_queries
      - escaped_output
      - sanitized_input
```

### Semantic Detectors

```python
class SemanticDetector(Detector):
    """Detector for semantic issues."""
    
    @property
    def detector_id(self) -> str:
        return "semantic_analyzer"
    
    @property
    def detection_type(self) -> DetectionType:
        return DetectionType.SPEC_ANOMALY
    
    def detect(self, context: dict) -> List[Detection]:
        detections = []
        
        # Check layer consistency
        detections.extend(self._check_layer_consistency(context))
        
        # Check reference validity
        detections.extend(self._check_references(context))
        
        # Check entity definitions
        detections.extend(self._check_entities(context))
        
        # Check operation definitions
        detections.extend(self._check_operations(context))
        
        return detections
    
    def _check_layer_consistency(self, context: dict) -> List[Detection]:
        """Check layer value consistency."""
        detections = []
        
        spec = context.get("spec", {})
        header = spec.get("header", {})
        blocks = spec.get("blocks", [])
        
        declared_layer = header.get("layer")
        
        for block in blocks:
            block_layer = block.get("layer")
            
            if declared_layer is not None and block_layer is not None:
                # Block layer should be >= header layer
                if block_layer < declared_layer:
                    detections.append(Detection(
                        detector_id=self.detector_id,
                        detection_type=DetectionType.SPEC_ANOMALY,
                        severity=Severity.MEDIUM,
                        title="Block layer below spec layer",
                        description=f"Block {block.get('id')} has layer "
                                   f"{block_layer} below spec layer {declared_layer}",
                        location=block.get("id"),
                        evidence={
                            "block_layer": block_layer,
                            "spec_layer": declared_layer
                        },
                        recommendation="Move block to separate spec or update layer",
                        confidence=0.95
                    ))
        
        return detections
    
    def _check_references(self, context: dict) -> List[Detection]:
        """Check reference validity."""
        detections = []
        
        spec = context.get("spec", {})
        blocks = spec.get("blocks", [])
        
        # Build reference map
        valid_refs = set()
        for block in blocks:
            block_id = block.get("id")
            if block_id:
                valid_refs.add(f"#{block_id}")
                valid_refs.add(block_id)
        
        # Check all references in spec
        for block in blocks:
            content = block.get("content", "")
            refs = self._extract_refs(content)
            
            for ref in refs:
                if ref not in valid_refs and not self._ref_exists(ref, context):
                    detections.append(Detection(
                        detector_id=self.detector_id,
                        detection_type=DetectionType.SPEC_ANOMALY,
                        severity=Severity.HIGH,
                        title="Broken reference",
                        description=f"Reference '{ref}' in block '{block.get('id')}' "
                                   f"does not resolve",
                        location=block.get("id"),
                        evidence={"broken_ref": ref},
                        recommendation="Fix or remove the broken reference",
                        confidence=0.9
                    ))
        
        return detections
    
    def _check_entities(self, context: dict) -> List[Detection]:
        """Check entity definition validity."""
        detections = []
        
        spec = context.get("spec", {})
        blocks = spec.get("blocks", [])
        
        entities = [b for b in blocks if b.get("kind") == "entity"]
        
        for entity in entities:
            definition = entity.get("definition", {})
            
            # Check for required fields
            required = ["name", "type"]
            for field in required:
                if field not in definition:
                    detections.append(Detection(
                        detector_id=self.detector_id,
                        detection_type=DetectionType.SPEC_ANOMALY,
                        severity=Severity.HIGH,
                        title="Missing required entity field",
                        description=f"Entity '{entity.get('id')}' missing '{field}'",
                        location=entity.get("id"),
                        evidence={"missing_field": field},
                        recommendation=f"Add required field '{field}'",
                        confidence=0.95
                    ))
        
        return detections
    
    def _check_operations(self, context: dict) -> List[Detection]:
        """Check operation definition validity."""
        detections = []
        
        spec = context.get("spec", {})
        blocks = spec.get("blocks", [])
        
        operations = [b for b in blocks if b.get("kind") == "operation"]
        
        for op in operations:
            definition = op.get("definition", {})
            
            # Check for undefined parameters
            params = definition.get("parameters", [])
            body = definition.get("body", "")
            
            for param in params:
                param_name = param.get("name")
                if param_name:
                    # Check if param is used in body
                    if f"{{{param_name}}}" not in body and f"${{{param_name}}}" not in body:
                        # Might be unused - warning only
                        pass  # Could be logging or other usage
        
        return detections
    
    def _extract_refs(self, content: str) -> List[str]:
        """Extract @ref: references from content."""
        import re
        pattern = r'@ref:([a-zA-Z0-9_\-/]+(?:#[a-zA-Z0-9_\-]+)?)'
        return re.findall(pattern, content)
    
    def _ref_exists(self, ref: str, context: dict) -> bool:
        """Check if reference exists in context."""
        # Check external specs
        external_refs = context.get("external_refs", [])
        return ref in external_refs
    
    def is_enabled(self, config: dict) -> bool:
        return config.get("detectors", {}).get("semantic", True)
```

### Anomaly Detection

```python
class BehavioralAnomalyDetector(Detector):
    """Detect behavioral anomalies."""
    
    @property
    def detector_id(self) -> str:
        return "behavioral_anomaly"
    
    @property
    def detection_type(self) -> DetectionType:
        return DetectionType.BEHAVIORAL_ANOMALY
    
    def __init__(self):
        self.baseline = None
        self.history = []
    
    def detect(self, context: dict) -> List[Detection]:
        detections = []
        
        # Check for unusual file access patterns
        detections.extend(self._check_file_access(context))
        
        # Check for unexpected dependencies
        detections.extend(self._check_dependencies(context))
        
        # Check for suspicious operations
        detections.extend(self._check_operations(context))
        
        # Check for resource exhaustion risks
        detections.extend(self._check_resources(context))
        
        return detections
    
    def _check_file_access(self, context: dict) -> List[Detection]:
        """Detect unusual file access patterns."""
        detections = []
        
        file_ops = context.get("file_operations", [])
        
        # Check for access outside project
        for op in file_ops:
            if op.get("path", "").startswith(".."):
                detections.append(Detection(
                    detector_id=self.detector_id,
                    detection_type=DetectionType.BEHAVIORAL_ANOMALY,
                    severity=Severity.HIGH,
                    title="Path traversal attempt",
                    description=f"Operation attempts to access path outside project",
                    location=op.get("path"),
                    evidence={"operation": op},
                    recommendation="Block path traversal",
                    confidence=0.85
                ))
        
        # Check for hidden file access
        for op in file_ops:
            if "/." in op.get("path", "") or op.get("path", "").startswith("."):
                detections.append(Detection(
                    detector_id=self.detector_id,
                    detection_type=DetectionType.BEHAVIORAL_ANOMALY,
                    severity=Severity.MEDIUM,
                    title="Hidden file access",
                    description=f"Operation accesses hidden file",
                    location=op.get("path"),
                    evidence={"operation": op},
                    recommendation="Verify hidden file access is intentional",
                    confidence=0.7
                ))
        
        return detections
    
    def _check_dependencies(self, context: dict) -> List[Detection]:
        """Detect unexpected dependencies."""
        detections = []
        
        deps = context.get("dependencies", [])
        known_deps = context.get("known_dependencies", set())
        
        for dep in deps:
            if dep not in known_deps:
                detections.append(Detection(
                    detector_id=self.detector_id,
                    detection_type=DetectionType.BEHAVIORAL_ANOMALY,
                    severity=Severity.MEDIUM,
                    title="Unexpected dependency",
                    description=f"New dependency '{dep}' not in baseline",
                    location=None,
                    evidence={"dependency": dep},
                    recommendation="Verify dependency is expected",
                    confidence=0.6
                ))
        
        return detections
    
    def _check_operations(self, context: dict) -> List[Detection]:
        """Detect suspicious operations."""
        detections = []
        
        operations = context.get("operations", [])
        
        suspicious_ops = [
            "delete_all",
            "drop_database",
            "force_push",
            "override_settings",
            "disable_security"
        ]
        
        for op in operations:
            if op.get("name") in suspicious_ops:
                detections.append(Detection(
                    detector_id=self.detector_id,
                    detection_type=DetectionType.BEHAVIORAL_ANOMALY,
                    severity=Severity.CRITICAL,
                    title="Suspicious operation",
                    description=f"Operation '{op.get('name')}' may be dangerous",
                    location=op.get("location"),
                    evidence={"operation": op},
                    recommendation="Require explicit approval for this operation",
                    confidence=0.95
                ))
        
        return detections
    
    def _check_resources(self, context: dict) -> List[Detection]:
        """Check for resource exhaustion risks."""
        detections = []
        
        # Check for large file operations
        file_ops = context.get("file_operations", [])
        for op in file_ops:
            if op.get("size", 0) > 100_000_000:  # 100MB
                detections.append(Detection(
                    detector_id=self.detector_id,
                    detection_type=DetectionType.BEHAVIORAL_ANOMALY,
                    severity=Severity.HIGH,
                    title="Large file operation",
                    description=f"Operation on large file ({op.get('size')} bytes)",
                    location=op.get("path"),
                    evidence={"size": op.get("size")},
                    recommendation="Verify large file handling is safe",
                    confidence=0.8
                ))
        
        # Check for deep recursion risk
        loop_depth = context.get("loop_depth", 0)
        if loop_depth > 10:
            detections.append(Detection(
                detector_id=self.detector_id,
                detection_type=DetectionType.BEHAVIORAL_ANOMALY,
                severity=Severity.MEDIUM,
                title="High loop depth",
                description=f"Loop depth of {loop_depth} may cause issues",
                location=None,
                evidence={"loop_depth": loop_depth},
                recommendation="Review for infinite loop or performance issues",
                confidence=0.75
            ))
        
        return detections
    
    def is_enabled(self, config: dict) -> bool:
        return config.get("detectors", {}).get("behavioral", True)
```

### Detection Aggregator

```python
class DetectionAggregator:
    """Aggregate and prioritize detections."""
    
    def __init__(self, config: dict):
        self.detectors = self._load_detectors(config)
        self.severity_weights = {
            Severity.CRITICAL: 1.0,
            Severity.HIGH: 0.75,
            Severity.MEDIUM: 0.5,
            Severity.LOW: 0.25,
            Severity.INFO: 0.1
        }
    
    def detect_all(self, context: dict) -> List[Detection]:
        """Run all enabled detectors."""
        all_detections = []
        
        for detector in self.detectors:
            if detector.is_enabled(context.get("config", {})):
                try:
                    detections = detector.detect(context)
                    all_detections.extend(detections)
                except Exception as e:
                    # Log detector error, continue
                    log.error(f"Detector {detector.detector_id} failed: {e}")
        
        return all_detections
    
    def aggregate(
        self,
        detections: List[Detection]
    ) -> dict:
        """Aggregate detections into report."""
        
        by_type = {}
        by_severity = {}
        total_risk = 0.0
        
        for d in detections:
            # Group by type
            type_key = d.detection_type.value
            by_type.setdefault(type_key, []).append(d)
            
            # Group by severity
            sev_key = d.severity.value
            by_severity.setdefault(sev_key, []).append(d)
            
            # Calculate risk
            total_risk += self.severity_weights[d.severity] * d.confidence
        
        # Normalize risk
        max_risk = len(detections) * 1.0
        normalized_risk = total_risk / max_risk if max_risk > 0 else 0.0
        
        return {
            "total_detections": len(detections),
            "by_type": {k: len(v) for k, v in by_type.items()},
            "by_severity": {k: len(v) for k, v in by_severity.items()},
            "total_risk_score": total_risk,
            "normalized_risk": normalized_risk,
            "critical_count": len(by_severity.get("critical", [])),
            "high_count": len(by_severity.get("high", [])),
            "detections": sorted(
                detections,
                key=lambda d: (
                    -self.severity_weights[d.severity],
                    -d.confidence
                )
            )
        }
```

## Examples

### Example 1: Running All Detectors

```python
# Initialize detector aggregator
config = {
    "detectors": {
        "semantic": True,
        "behavioral": True,
        "security": True,
        "quality": True
    }
}

aggregator = DetectionAggregator(config)

# Context to analyze
context = {
    "spec": spec_content,
    "blocks": parsed_blocks,
    "file_operations": operations,
    "dependencies": deps,
    "config": config
}

# Run detection
detections = aggregator.detect_all(context)

# Aggregate results
report = aggregator.aggregate(detections)

print(f"Total detections: {report['total_detections']}")
print(f"Risk score: {report['normalized_risk']:.2%}")

for detection in report["detections"][:10]:  # Top 10
    print(f"[{detection.severity.value.upper()}] "
          f"{detection.title}: {detection.description}")
```

## Backwards Compatibility

- Detectors can be selectively enabled/disabled
- Default configuration enables all safe detectors
- API provides backward-compatible scan interface

## Security Implications

- Detection patterns must be regularly updated
- False positives must be trackable and reducible
- Detection failures must not bypass safety

## References

- @ref:speclang/safety-nets
- @ref:speclang/security
- @ref:speclang/confidence-scoring
- SIP 23: Safety Nets
- SIP 78: Security Model
- SIP 104: Confidence Scoring

## Copyright

This document is in the public domain.
