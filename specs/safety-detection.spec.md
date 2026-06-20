# speclang-header lines:12
id: "@specs/safety-detection"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [safety, detection, security, validation]
short: Safety Detection Mechanisms for autonomous agents
depends_on:
  - "@specs/safety"
  - "@ref:specs/skills"
---

# Safety Detection Mechanisms

Implementation of SIP 106: Safety Detection Mechanisms.

## Overview

This module provides detection mechanisms for identifying safety violations, anomalies, and risk factors in SpecLang autonomous operations.

### Detection Categories

1. **Spec Anomalies**: Invalid patterns, missing elements
2. **Security Violations**: Threats, exposures
3. **Quality Issues**: Code smells, anti-patterns
4. **Behavioral Anomalies**: Unexpected patterns

### Quick Start

```typescript
import { runSafetyScan } from './safety-detection';

const report = runSafetyScan({
  spec: {
    header: { layer: 5 },
    blocks: [{ id: 'test', content: '...', kind: 'entity' }]
  },
  config: { detectors: { semantic: true, security: true } }
});

console.log(`Found ${report.total_detections} issues`);
console.log(`Risk score: ${(report.normalized_risk * 100).toFixed(1)}%`);
```

### @block::exports @kind:entity

Exports all detection types and functions.

### @block::detectors @kind:interface

Detector implementations:
- HardcodedSecretsDetector
- InjectionPatternsDetector
- SemanticDetector
- BehavioralAnomalyDetector
- QualityDetector

### @block::aggregator @kind:operation

DetectionAggregator class runs all enabled detectors and produces consolidated reports.
