# speclang-header lines:12
id: @specs/safety-confidence/confidence-scorer
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [safety, confidence, validation]
short: Confidence scoring system for safety validation decisions
target: src/safety-confidence/confidence-scorer.ts
---

# Confidence Scorer Spec

## Overview

This module implements the Safety Confidence Scoring system as defined in SIP-104.

## @block:types @kind:interface

### ConfidenceLevel

```typescript
export enum ConfidenceLevel {
  HIGH = "high",      // >= proceed threshold
  MEDIUM = "medium",  // >= fallback threshold
  LOW = "low",        // >= abort threshold
  NONE = "none"      // < abort threshold
}
```

### SignalScore

```typescript
export interface SignalScore {
  signal_name: string;
  value: number;      // 0.0 to 1.0
  weight: number;
}
```

### ConfidenceReport

```typescript
export interface ConfidenceReport {
  timestamp: string;
  project_id: string;
  project_level: string;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  decision: string;
  signals: Array<{
    name: string;
    value: number;
    weight: number;
    contributing_score: number;
  }>;
  reasoning: Array<{
    step: string;
    result: string;
  }>;
}
```

## @block:thresholds @kind:const

### PROJECT_LEVEL_THRESHOLDS

```typescript
export const PROJECT_LEVEL_THRESHOLDS: Record<string, { proceed: number; fallback: number; abort: number }> = {
  POC: { proceed: 0.9, fallback: 0.6, abort: 0.3 },
  MVP: { proceed: 0.85, fallback: 0.65, abort: 0.35 },
  Alpha: { proceed: 0.8, fallback: 0.7, abort: 0.4 },
  Beta: { proceed: 0.75, fallback: 0.75, abort: 0.45 },
  Production: { proceed: 0.7, fallback: 0.8, abort: 0.5 },
  Startup: { proceed: 0.85, fallback: 0.6, abort: 0.35 },
  SMB: { proceed: 0.8, fallback: 0.7, abort: 0.4 },
  MSB: { proceed: 0.75, fallback: 0.75, abort: 0.45 },
  Enterprise: { proceed: 0.7, fallback: 0.8, abort: 0.5 },
};
```

## @block:signal-weights @kind:const

### SIGNAL_SOURCE_WEIGHTS

```typescript
export const SIGNAL_SOURCE_WEIGHTS: Record<string, number> = {
  spec_completeness: 0.3,
  validation_results: 0.25,
  code_quality: 0.2,
  external_verification: 0.15,
  historical_data: 0.1,
};
```

## @block:class @kind:class

### ConfidenceScorer

```typescript
export class ConfidenceScorer {
  private projectLevel: string;
  private thresholds: { proceed: number; fallback: number; abort: number };
  
  constructor(projectLevel: string) {
    this.projectLevel = projectLevel;
    this.thresholds = this.loadThresholds(projectLevel);
  }
  
  /**
   * Calculate aggregate confidence from signals.
   */
  calculateConfidence(signals: SignalScore[]): { score: number; level: ConfidenceLevel } {
    const weightedSum = signals.reduce((sum, signal) => {
      const weight = SIGNAL_SOURCE_WEIGHTS[signal.signal_name] ?? 0.1;
      return sum + (signal.value * weight);
    }, 0);
    
    const totalWeight = signals.reduce((sum, signal) => {
      const weight = SIGNAL_SOURCE_WEIGHTS[signal.signal_name] ?? 0.1;
      return sum + weight;
    }, 0);
    
    const confidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const level = this.determineLevel(confidence);
    
    return { score: confidence, level };
  }
  
  /**
   * Determine action based on confidence and human approval.
   */
  decideAction(confidence: number, hasHumanApproval: boolean, isCriticalChange: boolean = false): string {
    const level = this.determineLevel(confidence);
    
    if (level === ConfidenceLevel.HIGH) {
      return "proceed_autonomous";
    }
    
    if (level === ConfidenceLevel.MEDIUM) {
      if (hasHumanApproval && !isCriticalChange) {
        return "proceed_with_approval";
      }
      return "require_human_review";
    }
    
    if (level === ConfidenceLevel.LOW) {
      if (hasHumanApproval) {
        return "require_human_review";
      }
      return "abort";
    }
    
    // NONE level
    return "abort";
  }
  
  /**
   * Generate a confidence report.
   */
  generateReport(
    projectId: string,
    signals: SignalScore[],
    decision: string
  ): ConfidenceReport {
    const { score, level } = this.calculateConfidence(signals);
    
    const signalDetails = signals.map(signal => ({
      name: signal.signal_name,
      value: signal.value,
      weight: signal.weight,
      contributing_score: signal.value * signal.weight * (SIGNAL_SOURCE_WEIGHTS[signal.signal_name] ?? 0.1),
    }));
    
    return {
      timestamp: new Date().toISOString(),
      project_id: projectId,
      project_level: this.projectLevel,
      confidence_score: score,
      confidence_level: level,
      decision,
      signals: signalDetails,
      reasoning: [
        { step: "signal_collection", result: `Collected ${signals.length} signals` },
        { step: "confidence_calculation", result: `Score: ${score.toFixed(2)}, Level: ${level}` },
        { step: "decision", result: decision },
      ],
    };
  }
  
  private determineLevel(confidence: number): ConfidenceLevel {
    if (confidence >= this.thresholds.proceed) {
      return ConfidenceLevel.HIGH;
    }
    if (confidence >= this.thresholds.fallback) {
      return ConfidenceLevel.MEDIUM;
    }
    if (confidence >= this.thresholds.abort) {
      return ConfidenceLevel.LOW;
    }
    return ConfidenceLevel.NONE;
  }
  
  private loadThresholds(projectLevel: string): { proceed: number; fallback: number; abort: number } {
    return PROJECT_LEVEL_THRESHOLDS[projectLevel] ?? PROJECT_LEVEL_THRESHOLDS.MVP;
  }
}
```
