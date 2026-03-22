/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/skills.spec.dir/skills/sip-106-safety-detection-speclang-v0.md
 * Generated: 2026-03-21
 * 
 * Edit the spec, not this file.
 */

import {
  Detection,
  DetectionContext,
  DetectionConfig,
  DetectionType,
  Severity,
} from './types';

/**
 * Abstract base class for all detectors
 */
export abstract class Detector {
  abstract readonly detector_id: string;
  abstract readonly detection_type: DetectionType;

  abstract detect(context: DetectionContext): Detection[];
  abstract is_enabled(config: DetectionConfig): boolean;

  protected createDetection(
    title: string,
    description: string,
    severity: Severity,
    evidence: Record<string, unknown> = {},
    recommendation: string = '',
    location?: string
  ): Detection {
    return {
      detector_id: this.detector_id,
      detection_type: this.detection_type,
      severity,
      title,
      description,
      location,
      evidence,
      recommendation: recommendation || this.getDefaultRecommendation(severity),
      confidence: this.getDefaultConfidence(severity),
    };
  }

  private getDefaultRecommendation(severity: Severity): string {
    switch (severity) {
      case Severity.CRITICAL:
        return 'Block this operation immediately and require human review';
      case Severity.HIGH:
        return 'Review and remediate before proceeding';
      case Severity.MEDIUM:
        return 'Add to technical debt backlog for review';
      case Severity.LOW:
        return 'Consider addressing in future iterations';
      case Severity.INFO:
        return 'No action required - informational only';
      default:
        return 'Review and determine appropriate action';
    }
  }

  private getDefaultConfidence(severity: Severity): number {
    switch (severity) {
      case Severity.CRITICAL:
        return 0.95;
      case Severity.HIGH:
        return 0.85;
      case Severity.MEDIUM:
        return 0.75;
      case Severity.LOW:
        return 0.65;
      case Severity.INFO:
        return 0.5;
      default:
        return 0.7;
    }
  }
}

// ============================================================================
// Pattern Detectors (Security-focused)
// ============================================================================

interface PatternRule {
  regex: RegExp;
  severity: Severity;
  description: string;
}

export class HardcodedSecretsDetector extends Detector {
  readonly detector_id = 'hardcoded_secrets';
  readonly detection_type = DetectionType.SECURITY_VIOLATION;

  private readonly patterns: PatternRule[] = [
    {
      regex: /(api_key|apikey|api-secret)[\s]*[=:][\s]*["'][a-zA-Z0-9]{20,}["']/i,
      severity: Severity.CRITICAL,
      description: 'Potential hardcoded API key',
    },
    {
      regex: /password[\s]*[=:][\s]*["'][^"'\s]{8,}["']/i,
      severity: Severity.CRITICAL,
      description: 'Potential hardcoded password',
    },
    {
      regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
      severity: Severity.CRITICAL,
      description: 'Private key in source',
    },
    {
      regex: /ghp_[a-zA-Z0-9]{36}/,
      severity: Severity.CRITICAL,
      description: 'GitHub personal access token',
    },
    {
      regex: /sk-[a-zA-Z0-9]{48}/,
      severity: Severity.CRITICAL,
      description: 'OpenAI API key',
    },
    {
      regex: /xox[baprs]-[a-zA-Z0-9]{10,}/,
      severity: Severity.CRITICAL,
      description: 'Slack token',
    },
    {
      regex: /AKIA[0-9A-Z]{16}/,
      severity: Severity.CRITICAL,
      description: 'AWS access key ID',
    },
  ];

  private readonly falsePositives = [
    'example_key_placeholder',
    'test_api_key',
    'mock_credentials',
    'demo_token',
    'placeholder',
    'your_key_here',
    'TODO',
    'FIXME',
  ];

  detect(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    const spec = context.spec;
    
    if (!spec?.blocks) return detections;

    for (const block of spec.blocks) {
      const content = block.content || '';
      const blockId = block.id || 'unknown';

      for (const pattern of this.patterns) {
        const matches = content.match(pattern.regex);
        if (matches) {
          for (const match of matches) {
            // Check for false positives
            if (this.isFalsePositive(match)) continue;

            detections.push(this.createDetection(
              'Hardcoded secret detected',
              `${pattern.description}: "${match.substring(0, 20)}..."`,
              pattern.severity,
              { 
                block_id: blockId, 
                matched_text: match.substring(0, 50),
                pattern: pattern.description,
              },
              'Remove hardcoded secrets. Use environment variables or secure vaults.',
              blockId
            ));
          }
        }
      }
    }

    return detections;
  }

  is_enabled(config: DetectionConfig): boolean {
    return config.detectors?.security !== false;
  }

  private isFalsePositive(match: string): boolean {
    const lowerMatch = match.toLowerCase();
    return this.falsePositives.some(fp => lowerMatch.includes(fp.toLowerCase()));
  }
}

export class InjectionPatternsDetector extends Detector {
  readonly detector_id = 'injection_patterns';
  readonly detection_type = DetectionType.SECURITY_VIOLATION;

  private readonly patterns: PatternRule[] = [
    {
      regex: /execute\s*\(\s*[\w]+\s*\+/,
      severity: Severity.HIGH,
      description: 'Potential SQL injection',
    },
    {
      regex: /eval\s*\(/,
      severity: Severity.HIGH,
      description: 'Use of eval()',
    },
    {
      regex: /innerHTML\s*=/,
      severity: Severity.MEDIUM,
      description: 'Potential XSS via innerHTML',
    },
    {
      regex: /os\.system\s*\(|subprocess\.\w*\s*\(\s*[\w]+\s*\+/,
      severity: Severity.HIGH,
      description: 'Potential command injection',
    },
    {
      regex: /\.format\s*\(\s*[\w]+\s*\)/,
      severity: Severity.MEDIUM,
      description: 'Potential format string injection',
    },
    {
      regex: /dangerouslySetInnerHTML/,
      severity: Severity.HIGH,
      description: 'React dangerous HTML setting',
    },
  ];

  detect(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    const spec = context.spec;
    
    if (!spec?.blocks) return detections;

    for (const block of spec.blocks) {
      const content = block.content || '';
      const blockId = block.id || 'unknown';

      for (const pattern of this.patterns) {
        const matches = content.match(pattern.regex);
        if (matches) {
          detections.push(this.createDetection(
            'Injection pattern detected',
            `${pattern.description} in block ${blockId}`,
            pattern.severity,
            { 
              block_id: blockId, 
              matched_pattern: pattern.description,
            },
            'Use parameterized queries, sanitize input, or use safer alternatives.',
            blockId
          ));
        }
      }
    }

    return detections;
  }

  is_enabled(config: DetectionConfig): boolean {
    return config.detectors?.security !== false;
  }
}

// ============================================================================
// Semantic Detectors (Spec validation)
// ============================================================================

export class SemanticDetector extends Detector {
  readonly detector_id = 'semantic_analyzer';
  readonly detection_type = DetectionType.SPEC_ANOMALY;

  detect(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    
    detections.push(...this.checkLayerConsistency(context));
    detections.push(...this.checkReferences(context));
    detections.push(...this.checkEntities(context));
    
    return detections;
  }

  is_enabled(config: DetectionConfig): boolean {
    return config.detectors?.semantic !== false;
  }

  private checkLayerConsistency(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    const spec = context.spec;
    
    if (!spec?.header || !spec?.blocks) return detections;

    const declaredLayer = spec.header.layer as number | undefined;

    for (const block of spec.blocks) {
      const blockLayer = block.layer;
      
      if (declaredLayer !== undefined && blockLayer !== undefined) {
        if (blockLayer < declaredLayer) {
          detections.push(this.createDetection(
            'Block layer below spec layer',
            `Block ${block.id} has layer ${blockLayer} below spec layer ${declaredLayer}`,
            Severity.MEDIUM,
            {
              block_layer: blockLayer,
              spec_layer: declaredLayer,
            },
            'Move block to separate spec or update layer',
            block.id
          ));
        }
      }
    }

    return detections;
  }

  private checkReferences(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    const spec = context.spec;
    const externalRefs = context.external_refs || [];
    
    if (!spec?.blocks) return detections;

    // Build reference map from blocks
    const validRefs = new Set<string>();
    for (const block of spec.blocks) {
      if (block.id) {
        validRefs.add(`#${block.id}`);
        validRefs.add(block.id);
      }
    }

    // Check all references in spec content
    const refPattern = /@ref:([a-zA-Z0-9_\-/]+(?:#[a-zA-Z0-9_\-]+)?)/g;
    
    for (const block of spec.blocks) {
      const content = block.content || '';
      let match;
      
      while ((match = refPattern.exec(content)) !== null) {
        const ref = match[1];
        if (!validRefs.has(ref) && !externalRefs.includes(ref)) {
          detections.push(this.createDetection(
            'Broken reference',
            `Reference '${ref}' in block '${block.id}' does not resolve`,
            Severity.HIGH,
            { broken_ref: ref },
            'Fix or remove the broken reference',
            block.id
          ));
        }
      }
    }

    return detections;
  }

  private checkEntities(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    const spec = context.spec;
    
    if (!spec?.blocks) return detections;

    const entities = spec.blocks.filter(b => b.kind === 'entity');

    for (const entity of entities) {
      const definition = entity.definition || {};
      const required = ['name', 'type'];
      
      for (const field of required) {
        if (!(field in definition)) {
          detections.push(this.createDetection(
            'Missing required entity field',
            `Entity '${entity.id}' missing '${field}'`,
            Severity.HIGH,
            { missing_field: field },
            `Add required field '${field}'`,
            entity.id
          ));
        }
      }
    }

    return detections;
  }
}

// ============================================================================
// Behavioral Anomaly Detectors
// ============================================================================

export class BehavioralAnomalyDetector extends Detector {
  readonly detector_id = 'behavioral_anomaly';
  readonly detection_type = DetectionType.BEHAVIORAL_ANOMALY;

  detect(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    
    detections.push(...this.checkFileAccess(context));
    detections.push(...this.checkDependencies(context));
    detections.push(...this.checkOperations(context));
    detections.push(...this.checkResources(context));
    
    return detections;
  }

  is_enabled(config: DetectionConfig): boolean {
    return config.detectors?.behavioral !== false;
  }

  private checkFileAccess(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    const fileOps = context.file_operations || [];

    for (const op of fileOps) {
      const path = op.path || '';
      
      // Check for path traversal
      if (path.startsWith('..') || path.includes('/..')) {
        detections.push(this.createDetection(
          'Path traversal attempt',
          `Operation attempts to access path outside project`,
          Severity.HIGH,
          { operation: op },
          'Block path traversal',
          path
        ));
      }

      // Check for hidden file access
      if (path.includes('/.') || path.startsWith('.')) {
        detections.push(this.createDetection(
          'Hidden file access',
          `Operation accesses hidden file`,
          Severity.MEDIUM,
          { operation: op },
          'Verify hidden file access is intentional',
          path
        ));
      }
    }

    return detections;
  }

  private checkDependencies(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    const deps = context.dependencies || [];
    const knownDeps = context.known_dependencies || [];

    for (const dep of deps) {
      if (!knownDeps.includes(dep)) {
        detections.push(this.createDetection(
          'Unexpected dependency',
          `New dependency '${dep}' not in baseline`,
          Severity.MEDIUM,
          { dependency: dep },
          'Verify dependency is expected'
        ));
      }
    }

    return detections;
  }

  private checkOperations(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    const operations = context.operations || [];

    const suspiciousOps = [
      'delete_all',
      'drop_database',
      'force_push',
      'override_settings',
      'disable_security',
    ];

    for (const op of operations) {
      if (suspiciousOps.includes(op.name)) {
        detections.push(this.createDetection(
          'Suspicious operation',
          `Operation '${op.name}' may be dangerous`,
          Severity.CRITICAL,
          { operation: op },
          'Require explicit approval for this operation',
          op.location
        ));
      }
    }

    return detections;
  }

  private checkResources(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    const fileOps = context.file_operations || [];
    const loopDepth = context.loop_depth || 0;

    // Check for large file operations (100MB threshold)
    for (const op of fileOps) {
      if ((op.size || 0) > 100_000_000) {
        detections.push(this.createDetection(
          'Large file operation',
          `Operation on large file (${op.size} bytes)`,
          Severity.HIGH,
          { size: op.size },
          'Verify large file handling is safe',
          op.path
        ));
      }
    }

    // Check for deep recursion risk
    if (loopDepth > 10) {
      detections.push(this.createDetection(
        'High loop depth',
        `Loop depth of ${loopDepth} may cause issues`,
        Severity.MEDIUM,
        { loop_depth: loopDepth },
        'Review for infinite loop or performance issues'
      ));
    }

    return detections;
  }
}

// ============================================================================
// Quality Detectors
// ============================================================================

export class QualityDetector extends Detector {
  readonly detector_id = 'quality_issues';
  readonly detection_type = DetectionType.QUALITY_ISSUE;

  detect(context: DetectionContext): Detection[] {
    const detections: Detection[] = [];
    const spec = context.spec;
    
    if (!spec?.blocks) return detections;

    // Check for undocumented blocks
    const blocksWithoutDocs = spec.blocks.filter(b => {
      const content = b.content || '';
      // If content is very short or just code without explanation
      return content.length < 50 || (!content.includes('\n') && content.length < 200);
    });

    for (const block of blocksWithoutDocs) {
      detections.push(this.createDetection(
        'Undocumented block',
        `Block ${block.id} lacks sufficient documentation`,
        Severity.LOW,
        { block_id: block.id, content_length: (block.content || '').length },
        'Add documentation or description to this block',
        block.id
      ));
    }

    // Check for complexity warnings
    for (const block of spec.blocks) {
      const content = block.content || '';
      if (content.length > 5000) {
        detections.push(this.createDetection(
          'Large block content',
          `Block ${block.id} has ${content.length} characters - consider splitting`,
          Severity.MEDIUM,
          { block_id: block.id, content_length: content.length },
          'Split into multiple smaller blocks for better maintainability',
          block.id
        ));
      }
    }

    return detections;
  }

  is_enabled(config: DetectionConfig): boolean {
    return config.detectors?.quality !== false;
  }
}
