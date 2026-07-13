# speclang-header lines:10
id: "@specs/safety/detection"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [safety, detection, mislabeling]
short: Mislabeling detection for safety nets
target: src/safety/detection.ts
---

# Mislabeling Detection Spec

This module detects mislabeled specs (e.g., agent_autonomous without step-by-step details) and suggests appropriate agent support levels.

## @block:types @kind:interface

### AgentSupportLevel

```typescript
export type AgentSupportLevel = 'human_only' | 'agent_assisted' | 'agent_autonomous';
```

### MislabelingResult

```typescript
export interface MislabelingResult {
  detected: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  issues: MislabelingIssue[];
  suggestions: string[];
  suggestedSupport: AgentSupportLevel;
  confidence: number; // How confident we are in the detection
}
```

### MislabelingIssue

```typescript
export interface MislabelingIssue {
  type: string;
  description: string;
  location?: string;
  evidence: string;
}
```

### CompletenessScore

```typescript
export interface CompletenessScore {
  overall: number;
  stepByStepCoverage: number;
  referenceResolution: number;
  ambiguityScore: number;
  metadataCompleteness: number;
  dependencyCompleteness: number;
}
```

### ValidationRule

```typescript
export interface ValidationRule {
  name: string;
  description: string;
  check: (spec: Spec, completeness: CompletenessScore) => Promise<{
    violated: boolean;
    location?: string;
    evidence?: string;
    suggestions?: string[];
  }>;
}
```

## @block:class @kind:class

### CompletenessAnalyzer

```typescript
export class CompletenessAnalyzer {
  async analyze(spec: Spec): Promise<CompletenessScore> {
    // Placeholder implementation
    return {
      overall: 0.8,
      stepByStepCoverage: 0.7,
      referenceResolution: 0.9,
      ambiguityScore: 0.2,
      metadataCompleteness: 1.0,
      dependencyCompleteness: 0.6,
    };
  }
}
```

### MislabelingDetector

```typescript
export class MislabelingDetector {
  private completenessAnalyzer: CompletenessAnalyzer;
  private validationRules: ValidationRule[];
  
  constructor() {
    this.completenessAnalyzer = new CompletenessAnalyzer();
    this.validationRules = this.loadValidationRules();
  }

  async detect(spec: Spec): Promise<MislabelingResult> {
    const issues: MislabelingIssue[] = [];
    const suggestions: string[] = [];
    
    // Get completeness score
    const completeness = await this.completenessAnalyzer.analyze(spec);
    
    // Check each validation rule
    for (const rule of this.validationRules) {
      const result = await rule.check(spec, completeness);
      if (result.violated) {
        issues.push({
          type: rule.name,
          description: rule.description,
          location: result.location,
          evidence: result.evidence || '',
        });
        if (result.suggestions) suggestions.push(...result.suggestions);
      }
    }
    
    // Check maturity/autonomy consistency
    const consistencyIssue = this.checkMaturityAutonomyConsistency(spec);
    if (consistencyIssue) {
      issues.push(consistencyIssue);
      suggestions.push('Adjust project_level or agent_support to be consistent');
    }
    
    // Determine severity and suggested support
    const { severity, suggestedSupport, confidence } = this.calculateResults(
      issues,
      completeness
    );
    
    return {
      detected: issues.length > 0,
      severity,
      issues,
      suggestions: [...new Set(suggestions)], // Dedupe
      suggestedSupport,
      confidence,
    };
  }

  private checkMaturityAutonomyConsistency(spec: Spec): MislabelingIssue | null {
    const maturity = spec.metadata.project_level || 'POC';
    const support = spec.metadata.agent_support;
    
    // Define allowed combinations
    const allowedCombinations: Record<string, string[]> = {
      'POC': ['human_only'],
      'MVP': ['human_only', 'agent_assisted'],
      'Alpha': ['human_only', 'agent_assisted'],
      'Beta': ['human_only', 'agent_assisted', 'agent_autonomous'],
      'Production': ['agent_assisted', 'agent_autonomous'],
      'Startup': ['human_only', 'agent_assisted', 'agent_autonomous'],
      'SMB': ['agent_assisted', 'agent_autonomous'],
      'MSB': ['agent_autonomous'],
      'Enterprise': ['agent_autonomous'],
    };
    
    const allowed = allowedCombinations[maturity] || [];
    
    if (!allowed.includes(support)) {
      return {
        type: 'inconsistent_metadata',
        description: `project_level "${maturity}" with agent_support "${support}" is inconsistent`,
        evidence: `Allowed combinations for ${maturity}: ${allowed.join(', ')}`,
      };
    }
    
    return null;
  }

  private calculateResults(
    issues: MislabelingIssue[],
    completeness: CompletenessScore
  ): {
    severity: MislabelingResult['severity'];
    suggestedSupport: AgentSupportLevel;
    confidence: number;
  } {
    if (issues.length === 0) {
      return {
        severity: 'info',
        suggestedSupport: 'agent_autonomous',
        confidence: 1.0,
      };
    }
    
    // Count issue types
    const criticalCount = issues.filter(i => 
      ['no_step_by_step', 'unresolved_references', 'inconsistent_metadata'].includes(i.type)
    ).length;
    
    const errorCount = issues.filter(i =>
      ['high_ambiguity', 'missing_metadata', 'low_test_coverage'].includes(i.type)
    ).length;
    
    // Determine severity
    let severity: MislabelingResult['severity'] = 'info';
    if (criticalCount > 0) severity = 'critical';
    else if (errorCount > 0) severity = 'error';
    else if (issues.length >= 3) severity = 'warning';
    
    // Determine suggested support level
    let suggestedSupport: AgentSupportLevel = 'agent_autonomous';
    if (completeness.overall < 0.5 || criticalCount > 0) {
      suggestedSupport = 'human_only';
    } else if (completeness.overall < 0.75 || errorCount > 0) {
      suggestedSupport = 'agent_assisted';
    }
    
    // Confidence in detection
    const confidence = Math.max(0.5, 1 - (issues.length * 0.1));
    
    return { severity, suggestedSupport, confidence };
  }

  private loadValidationRules(): ValidationRule[] {
    return [
      {
        name: 'no_step_by_step',
        description: 'agent_autonomous spec lacks step-by-step descriptions',
        check: async (spec, completeness) => {
          if (spec.metadata.agent_support !== 'agent_autonomous') {
            return { violated: false };
          }
          
          const violated = completeness.stepByStepCoverage < 0.8;
          
          return {
            violated,
            location: 'operations',
            evidence: `Step-by-step coverage: ${(completeness.stepByStepCoverage * 100).toFixed(0)}%`,
            suggestions: violated ? [
              'Add step-by-step descriptions to all operations',
              'Include pseudocode for complex operations',
              'Provide reference implementations',
            ] : [],
          };
        },
      },
      {
        name: 'unresolved_references',
        description: 'Spec has unresolved @ref: references',
        check: async (spec, completeness) => {
          const violated = completeness.referenceResolution < 0.9;
          
          return {
            violated,
            location: 'references',
            evidence: `Reference resolution: ${(completeness.referenceResolution * 100).toFixed(0)}%`,
            suggestions: violated ? [
              'Verify all @ref: links point to existing specs or blocks',
              'Check for typos in reference IDs',
            ] : [],
          };
        },
      },
      {
        name: 'high_ambiguity',
        description: 'Spec contains ambiguous language',
        check: async (spec, completeness) => {
          const violated = completeness.ambiguityScore > 0.3;
          
          return {
            violated,
            location: 'content',
            evidence: `Ambiguity score: ${(completeness.ambiguityScore * 100).toFixed(0)}%`,
            suggestions: violated ? [
              'Replace vague words like "maybe", "possibly", "some" with specific terms',
              'Remove "etc." and "and so on"',
              'Replace "should" and "could" with "must" or "will"',
            ] : [],
          };
        },
      },
      {
        name: 'missing_metadata',
        description: 'Required metadata fields are missing',
        check: async (spec, completeness) => {
          const violated = completeness.metadataCompleteness < 1.0;
          
          return {
            violated,
            location: 'header',
            evidence: `Metadata completeness: ${(completeness.metadataCompleteness * 100).toFixed(0)}%`,
            suggestions: violated ? [
              'Add all required header fields: id, version, layer, project_level, agent_support, short',
            ] : [],
          };
        },
      },
      {
        name: 'low_test_coverage',
        description: 'Spec has low or no test coverage',
        check: async (spec, completeness) => {
          const violated = completeness.dependencyCompleteness < 0.5;
          
          return {
            violated,
            location: 'dependencies',
            evidence: `Dependency completeness: ${(completeness.dependencyCompleteness * 100).toFixed(0)}%`,
            suggestions: violated ? [
              'Add tests for all entities and operations',
              'Include edge cases in test coverage',
            ] : [],
          };
        },
      },
      {
        name: 'poc_with_autonomous',
        description: 'POC project should not use agent_autonomous',
        check: async (spec) => {
          const violated = 
            (spec.metadata.project_level || 'POC') === 'POC' && 
            spec.metadata.agent_support === 'agent_autonomous';
          
          return {
            violated,
            location: 'header',
            evidence: `project_level: ${spec.metadata.project_level || 'POC'}, agent_support: ${spec.metadata.agent_support}`,
            suggestions: violated ? [
              'Use agent_support: human_only for POC projects',
              'Upgrade to MVP or higher before using agent_autonomous',
            ] : [],
          };
        },
      },
    ];
  }
}
```